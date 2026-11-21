/**
 * Fuel Map Card — stations-service autour d'un véhicule, via Prix Carburant.
 * Fuel stations around a vehicle, using the Prix Carburant integration.
 *
 * Sécurité : aucune donnée externe n'est injectée en HTML ; tout passe par
 * textContent / attributs contrôlés. Security: no external data is ever
 * injected as HTML; everything goes through textContent / checked attributes.
 */
import * as L from "leaflet/dist/leaflet-src.esm.js";
import leafletCss from "leaflet/dist/leaflet.css";
import { cardStyles } from "./styles.js";
import { t, localeOf } from "./i18n.js";
import "./editor.js";
import {
  DEFAULTS,
  normalizeConfig,
  positionOf,
  parseStations,
  buildSensorIndex,
  matchSensor,
  haversineKm,
  daysSince,
  sortStations,
  priceRank,
  shouldRefresh,
  directionsUrl,
  safeImageUrl,
  cityOf,
} from "./utils.js";

const VERSION = "2026.11.1";
const DOMAIN = "prix_carburant";
const SERVICE = "find_nearest_stations";
const DEFAULT_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const SENSOR_INDEX_TTL = 5 * 60000;
const TICK_MS = 60000;
const STALE_DAYS = 3;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

const icon = (name, fallback) => {
  // ha-icon existe dans HA ; hors HA on affiche un glyphe. ha-icon exists in HA.
  if (customElements.get("ha-icon")) {
    const i = document.createElement("ha-icon");
    i.setAttribute("icon", name);
    return i;
  }
  return el("span", "glyph", fallback);
};

class FuelMapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._stations = [];
    this._visible = [];
    this._selected = null;
    this._lastFetch = null;
    this._lastPos = null;
    this._inFlight = false;
    this._requestId = 0;
    this._msgKind = null;
    this._centered = false;
    this._sensorIndex = [];
    this._sensorIndexAt = 0;
    this._map = null;
    this._markers = new Map();
    this._carMarker = null;
    this._carPictureKey = null;
    this._fitted = false;
    this._built = false;
  }

  static getConfigElement() {
    return document.createElement("fuel-map-card-editor");
  }

  static getStubConfig(hass) {
    const states = hass?.states || {};
    const pick =
      Object.keys(states).find((id) => id.startsWith("device_tracker.") && positionOf(states[id])) ||
      Object.keys(states).find((id) => id.startsWith("person.") && positionOf(states[id])) ||
      "device_tracker.my_car";
    return { entity: pick, fuel: DEFAULTS.fuel, distance: DEFAULTS.distance };
  }

  setConfig(config) {
    const next = normalizeConfig(config);
    const prev = this._config;
    this._config = next;
    const searchChanged =
      !prev || prev.entity !== next.entity || prev.fuel !== next.fuel || prev.distance !== next.distance;
    if (searchChanged) {
      this._stations = [];
      this._lastFetch = null;
      this._lastPos = null;
      this._selected = null;
      this._fitted = false;
      this._centered = false;
      this._lastSig = undefined;
      this._requestId++;
      this._inFlight = false;
    }
    if (this._built) {
      this._applyLayout();
      this._renderAll();
      if (this._hass) this._update(true);
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
    this._update(false);
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    const c = this._config || DEFAULTS;
    return (c.show_map !== false ? Math.ceil(c.map_height / 50) : 0) + (c.show_list !== false ? 6 : 0) + 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback() {
    if (this._config && !this._built && this._hass) this._build();
    this._timer = setInterval(() => this._update(false, true), TICK_MS);
    if (this._map) requestAnimationFrame(() => this._map && this._map.invalidateSize());
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._timer = null;
  }

  // ---------- Construction du DOM. DOM building. ----------

  _build() {
    const root = this.shadowRoot;
    const style = document.createElement("style");
    style.textContent = leafletCss + cardStyles;

    const card = document.createElement(customElements.get("ha-card") ? "ha-card" : "div");
    card.className = "card";

    const header = el("div", "header");
    const text = el("div", "text");
    this._titleEl = el("div", "title");
    this._subEl = el("div", "sub");
    text.append(this._titleEl, this._subEl);
    this._refreshBtn = el("button", "icon-btn refresh");
    this._refreshBtn.type = "button";
    this._refreshBtn.append(icon("mdi:refresh", "⟳"));
    this._refreshBtn.addEventListener("click", () => this._update(true));
    header.append(text, this._refreshBtn);

    this._mapWrap = el("div", "map-wrap");
    this._mapEl = el("div", "map");
    this._recenterBtn = el("button", "icon-btn recenter");
    this._recenterBtn.type = "button";
    this._recenterBtn.append(icon("mdi:crosshairs-gps", "◎"));
    this._recenterBtn.addEventListener("click", () => this._fitAll(true));
    this._mapWrap.append(this._mapEl, this._recenterBtn);

    this._msgEl = el("div", "msg");
    this._msgEl.setAttribute("role", "status");
    this._listEl = el("div", "list");
    this._listEl.setAttribute("role", "list");

    card.append(header, this._mapWrap, this._msgEl, this._listEl);
    root.replaceChildren(style, card);
    this._card = card;
    this._built = true;

    this._resizeObs = new ResizeObserver(() => this._map && this._map.invalidateSize());
    this._resizeObs.observe(this._mapEl);
    this._applyLayout();
  }

  _applyLayout() {
    const c = this._config;
    this._mapWrap.hidden = !c.show_map;
    this._mapWrap.style.display = c.show_map ? "" : "none";
    this._mapEl.style.height = `${c.map_height}px`;
    this._listEl.hidden = !c.show_list;
    this._refreshBtn.title = t(this._hass, "refresh");
    this._refreshBtn.setAttribute("aria-label", t(this._hass, "refresh"));
    this._recenterBtn.title = t(this._hass, "recenter");
    this._recenterBtn.setAttribute("aria-label", t(this._hass, "recenter"));
    if (c.show_map && !this._map) this._initMap();
    if (this._map) {
      const url = this._tileUrl();
      if (this._tileLayer && this._tileLayer._url !== url) {
        this._tileLayer.setUrl(url);
      }
      requestAnimationFrame(() => this._map && this._map.invalidateSize());
    }
  }

  _tileUrl() {
    const u = this._config.tile_url;
    return typeof u === "string" && /^https:\/\/[^\s"'<>]+$/.test(u) && u.includes("{z}") ? u : DEFAULT_TILES;
  }

  _initMap() {
    this._map = L.map(this._mapEl, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      tap: false,
    }).setView([46.6, 2.4], 5);
    this._map.attributionControl.setPrefix(false);
    this._tileLayer = L.tileLayer(this._tileUrl(), {
      maxZoom: 19,
      attribution: this._config.tile_url ? "" : OSM_ATTRIBUTION,
      crossOrigin: true,
    }).addTo(this._map);
    // Activer la molette seulement après un clic sur la carte. Wheel zoom only after a click.
    this._map.on("click", () => this._map.scrollWheelZoom.enable());
    this._map.on("mouseout", () => this._map.scrollWheelZoom.disable());
    // Fermer la bulle de la station sélectionnée la désélectionne.
    // Closing the selected station's popup clears the selection.
    this._map.on("popupclose", (ev) => {
      const src = ev.popup?._source;
      if (src && this._selected && this._markers.get(this._selected) === src) this._select(null);
    });
  }

  // ---------- Logique. Logic. ----------

  _update(force, tick = false) {
    const hass = this._hass;
    const c = this._config;
    if (!hass || !c || !this._built) return;
    // HA appelle « set hass » à chaque changement d'état : on ne travaille que si
    // l'entité suivie, le thème ou les services ont changé (ou au tic d'horloge).
    // HA sets hass on every state change: only work when something relevant changed.
    const sig = hass.states?.[c.entity];
    if (!force && !tick && sig === this._lastSig && hass.services === this._lastServices && hass.themes === this._lastThemes) return;
    this._lastSig = sig;
    this._lastServices = hass.services;
    this._lastThemes = hass.themes;

    this._card.classList.toggle("dark", Boolean(hass.themes?.darkMode));
    this._titleEl.textContent = c.title || t(hass, "title");

    if (!hass.services?.[DOMAIN]?.[SERVICE]) {
      this._setMessage(t(hass, "err_integration"), "state");
      return;
    }
    const stateObj = hass.states?.[c.entity];
    if (!stateObj) {
      this._setMessage(t(hass, "err_entity", { entity: c.entity }), "state");
      return;
    }
    const pos = positionOf(stateObj);
    const name = stateObj.attributes?.friendly_name || c.entity;
    this._subEl.textContent = t(hass, "within", { fuel: c.fuel, km: c.distance, name });
    if (!pos) {
      this._setMessage(t(hass, "err_position", { entity: name }), "state");
      return;
    }
    if (this._msgKind === "state") this._setMessage(null);

    this._updateCar(pos, stateObj);
    this._refreshSensorIndex(false);

    const now = Date.now();
    if (
      this.isConnected &&
      shouldRefresh({
        now,
        lastFetch: this._lastFetch,
        lastPos: this._lastPos,
        pos,
        inFlight: this._inFlight,
        force,
        config: c,
      })
    ) {
      this._fetch(pos);
    } else if (this._stations.length) {
      this._recomputeDistances(pos);
    }
  }

  async _fetch(pos) {
    const hass = this._hass;
    const c = this._config;
    const id = ++this._requestId;
    this._inFlight = true;
    this._lastFetch = Date.now();
    this._lastPos = pos;
    this._refreshBtn.classList.add("spin");
    if (!this._stations.length) this._setMessage(t(hass, "loading"), "info");
    try {
      const res = await hass.callWS({
        type: "call_service",
        domain: DOMAIN,
        service: SERVICE,
        service_data: { entity_id: c.entity, fuel: c.fuel, distance: c.distance },
        return_response: true,
      });
      if (id !== this._requestId) return;
      this._stations = parseStations(res?.response);
      this._refreshSensorIndex(true);
      this._recomputeDistances(pos, true);
      if (!this._stations.length) this._setMessage(t(hass, "no_station", { km: c.distance }), "info");
      else this._setMessage(null);
      this._fitAll(false);
    } catch (err) {
      if (id !== this._requestId) return;
      const msg = String(err?.message || err?.code || err || "?").slice(0, 200);
      this._setMessage(t(hass, "err_fetch", { error: msg }), "fetch");
    } finally {
      if (id === this._requestId) {
        this._inFlight = false;
        this._refreshBtn.classList.remove("spin");
      }
    }
  }

  _refreshSensorIndex(force) {
    const now = Date.now();
    if (!force && now - this._sensorIndexAt < SENSOR_INDEX_TTL) return;
    this._sensorIndex = buildSensorIndex(this._hass?.states);
    this._sensorIndexAt = now;
    if (!force && this._stations.length) this._recomputeDistances(this._lastPos, true);
  }

  _recomputeDistances(pos, forceRender = false) {
    if (!pos) return;
    const c = this._config;
    let changed = forceRender;
    for (const s of this._stations) {
      const d = haversineKm(pos.lat, pos.lon, s.lat, s.lon);
      if (s.distance == null || Math.abs(d - s.distance) > 0.1) changed = true;
      s.distance = d;
      const m = matchSensor(s, this._sensorIndex, c.fuel);
      if (m.updated !== s.updated || m.picture !== s.picture) changed = true;
      Object.assign(s, m);
    }
    if (!changed) return;
    this._visible = sortStations(this._stations, c.sort, c.max_stations);
    this._renderAll();
  }

  /** kind : "info" | "state" (config/entité) | "fetch" (recherche) | null */
  _setMessage(text, kind = null) {
    if (!this._msgEl) return;
    this._msgKind = text ? kind : null;
    this._msgEl.hidden = !text;
    this._msgEl.textContent = text || "";
    this._msgEl.classList.toggle("error", kind === "state" || kind === "fetch");
  }

  // ---------- Rendu. Rendering. ----------

  _renderAll() {
    if (!this._built) return;
    this._renderMarkers();
    this._renderList();
    this._applySelection();
  }

  _fmtPrice(price, withUnit) {
    const s = new Intl.NumberFormat(localeOf(this._hass), {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(price);
    return withUnit ? `${s} €` : s;
  }

  _fmtDistance(km) {
    if (km == null) return "";
    const loc = localeOf(this._hass);
    if (km < 1) return `${Math.round(km * 100) * 10} m`;
    return `${new Intl.NumberFormat(loc, { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km)} km`;
  }

  _fmtDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(localeOf(this._hass), { dateStyle: "short", timeStyle: "short" }).format(d);
  }

  _displayName(s) {
    return s.name || s.sensorName || s.brand || cityOf(s.address) || t(this._hass, "unknown_station");
  }

  _logo(s) {
    const wrap = el("div", "logo");
    const url = safeImageUrl(s.picture);
    if (url) {
      const img = document.createElement("img");
      img.alt = s.brand || "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = url;
      img.addEventListener("error", () => img.replaceWith(icon("mdi:gas-station", "⛽")));
      wrap.append(img);
    } else {
      wrap.append(icon("mdi:gas-station", "⛽"));
    }
    return wrap;
  }

  _renderList() {
    const list = this._listEl;
    if (!this._config.show_list) {
      list.replaceChildren();
      return;
    }
    if (!this._visible.length) {
      list.replaceChildren();
      return;
    }
    const hass = this._hass;
    const rank = priceRank(this._visible);
    const head = el("div", "head");
    head.setAttribute("aria-hidden", "true");
    head.append(el("span"), el("span", "", t(hass, "station")), el("span", "", t(hass, "distance")), el("span", "", t(hass, "price")), el("span", "", t(hass, "updated")));
    const rows = [head];
    for (const s of this._visible) {
      const row = el("div", `row ${rank.get(s.id) || ""}`.trim());
      row.dataset.id = s.id;
      row.tabIndex = 0;
      row.setAttribute("role", "listitem");
      const who = el("div", "who");
      who.append(el("div", "name", this._displayName(s)), el("div", "city", cityOf(s.address) || s.address));
      const days = daysSince(s.updated);
      const upd = el("div", "upd", days == null ? t(hass, "no_date") : t(hass, "days", { n: days }));
      if (days != null && days >= STALE_DAYS) upd.classList.add("stale");
      if (s.updated) upd.title = this._fmtDate(s.updated);
      row.append(this._logo(s), who, el("div", "dist", this._fmtDistance(s.distance)), el("div", "price", this._fmtPrice(s.price, true)), upd);
      row.addEventListener("click", () => this._select(s.id, { fly: true }));
      row.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          this._select(s.id, { fly: true });
        }
      });
      rows.push(row);
    }
    list.replaceChildren(...rows);
  }

  _renderMarkers() {
    if (!this._map) return;
    const rank = priceRank(this._visible);
    const keep = new Set(this._visible.map((s) => s.id));
    for (const [id, m] of this._markers) {
      if (!keep.has(id)) {
        m.remove();
        this._markers.delete(id);
      }
    }
    for (const s of this._visible) {
      const pin = el("div", `pin ${rank.get(s.id) || ""}`.trim(), this._fmtPrice(s.price, false));
      pin.dataset.id = s.id;
      const iconObj = L.divIcon({ className: "fmc-icon", html: pin, iconSize: [0, 0] });
      let m = this._markers.get(s.id);
      if (m) {
        m.setIcon(iconObj);
        m.setLatLng([s.lat, s.lon]);
      } else {
        m = L.marker([s.lat, s.lon], { icon: iconObj, keyboard: true, title: this._displayName(s) });
        m.on("click", () => this._select(s.id, { fromMap: true }));
        m.addTo(this._map);
        this._markers.set(s.id, m);
      }
      if (!m.getPopup()) m.bindPopup(() => this._popup(this._visible.find((x) => x.id === s.id) || s), { offset: [0, -28], autoPan: true, closeButton: true });
    }
  }

  _popup(s) {
    const hass = this._hass;
    const box = el("div", "popup");
    box.append(el("div", "name", this._displayName(s)), el("div", "addr", s.address));
    const days = daysSince(s.updated);
    const parts = [this._fmtPrice(s.price, true), this._fmtDistance(s.distance)];
    if (days != null) parts.push(`${t(hass, "updated")} ${t(hass, "days", { n: days })}`);
    box.append(el("div", "line", parts.filter(Boolean).join(" · ")));
    const url = directionsUrl(s.lat, s.lon);
    if (url) {
      const a = el("a", "", t(hass, "directions"));
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      box.append(a);
    }
    return box;
  }

  _updateCar(pos, stateObj) {
    if (!this._map) return;
    const picture = safeImageUrl(stateObj.attributes?.entity_picture);
    const key = `${picture || ""}|${stateObj.attributes?.icon || ""}`;
    if (!this._carMarker || this._carPictureKey !== key) {
      const car = el("div", "car");
      if (picture) {
        const img = document.createElement("img");
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        img.src = picture;
        car.append(img);
      } else {
        car.append(icon(String(stateObj.attributes?.icon || "mdi:car"), "🚗"));
      }
      const iconObj = L.divIcon({ className: "fmc-icon", html: car, iconSize: [0, 0] });
      if (this._carMarker) this._carMarker.setIcon(iconObj);
      else {
        this._carMarker = L.marker([pos.lat, pos.lon], { icon: iconObj, zIndexOffset: 100000, keyboard: false, interactive: false }).addTo(this._map);
      }
      this._carPictureKey = key;
    }
    const cur = this._carMarker.getLatLng();
    if (cur.lat !== pos.lat || cur.lng !== pos.lon) this._carMarker.setLatLng([pos.lat, pos.lon]);
    if (!this._centered && !this._fitted) {
      this._map.setView([pos.lat, pos.lon], 12);
      this._centered = true;
    }
  }

  _fitAll(animate) {
    if (!this._map) return;
    const pts = this._visible.map((s) => [s.lat, s.lon]);
    if (this._carMarker) pts.push(this._carMarker.getLatLng());
    if (!pts.length) return;
    if (!animate && this._fitted) return;
    this._map.closePopup();
    if (pts.length === 1) this._map.setView(pts[0], 13, { animate });
    else this._map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 14, animate });
    this._fitted = true;
  }

  _select(id, { fly = false, fromMap = false } = {}) {
    if (fromMap && id == null && this._selected == null) return;
    this._selected = id;
    this._applySelection();
    if (!id || !this._map) return;
    const s = this._visible.find((x) => x.id === id);
    const m = this._markers.get(id);
    if (!s || !m) return;
    if (fly) {
      this._map.flyTo([s.lat, s.lon], Math.max(this._map.getZoom(), 15), { duration: 0.6 });
      this._map.once("moveend", () => this._selected === id && m.openPopup());
      if (this._config.show_map) {
        const r = this._mapWrap.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) this._mapWrap.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  _applySelection() {
    const id = this._selected;
    for (const row of this._listEl.querySelectorAll(".row")) {
      const on = row.dataset.id === id;
      row.classList.toggle("selected", on);
      row.setAttribute("aria-current", on ? "true" : "false");
    }
    for (const [sid, m] of this._markers) {
      const on = sid === id;
      m.setZIndexOffset(on ? 50000 : 0);
      const pin = m.getElement()?.querySelector(".pin");
      if (pin) pin.classList.toggle("selected", on);
    }
  }
}

if (!customElements.get("fuel-map-card")) {
  customElements.define("fuel-map-card", FuelMapCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "fuel-map-card",
    name: "Fuel Map Card",
    description: "Stations-service autour d'un véhicule (Prix Carburant) / Fuel stations around a vehicle",
    preview: false,
    documentationURL: "https://github.com/akoonet-homeassistant/fuel-map-card",
  });
  console.info(`%c FUEL-MAP-CARD %c ${VERSION} `, "background:#2e7d32;color:#fff;font-weight:600", "background:#eee;color:#2e7d32");
}

export { FuelMapCard, VERSION };
