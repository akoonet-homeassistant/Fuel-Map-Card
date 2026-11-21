// Fonctions pures, sans DOM : testées par tests/utils.test.js
// Pure helpers, no DOM: covered by tests/utils.test.js

export const FUELS = ["E10", "SP95", "SP98", "Gazole", "E85", "GPLc"];

export const DEFAULTS = Object.freeze({
  fuel: "E10",
  distance: 10,
  max_stations: 10,
  sort: "price",
  show_list: true,
  show_map: true,
  map_height: 300,
  refresh_interval: 30,
  min_move: 500,
  min_delay: 2,
  show_header: true,
  show_refresh_button: true,
  show_recenter_button: true,
  show_zoom_controls: true,
  show_car: true,
  show_logo: true,
  show_distance: true,
  show_updated: true,
  show_price_colors: true,
  show_directions: true,
});

export const TOGGLES = [
  "show_map", "show_list", "show_header", "show_refresh_button", "show_recenter_button",
  "show_zoom_controls", "show_car", "show_logo", "show_distance", "show_updated",
  "show_price_colors", "show_directions",
];

const EARTH_RADIUS_KM = 6371.0088;
// Prix Carburant arrondit les coordonnées à 1e-3 ° (≈ 110 m)
// Prix Carburant rounds coordinates to 1e-3 deg (~110 m)
const MATCH_TOLERANCE_DEG = 0.0011;

const clampInt = (value, min, max, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Valide et normalise la configuration. Validates and normalizes the config. */
export function normalizeConfig(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Invalid configuration");
  if (typeof raw.entity !== "string" || !/^[a-z_]+\.[a-z0-9_]+$/.test(raw.entity)) {
    throw new Error("entity is required (e.g. device_tracker.my_car)");
  }
  const fuel = FUELS.find((f) => f.toLowerCase() === String(raw.fuel ?? DEFAULTS.fuel).toLowerCase());
  if (!fuel) throw new Error(`fuel must be one of: ${FUELS.join(", ")}`);
  return {
    ...raw,
    entity: raw.entity,
    fuel,
    distance: clampInt(raw.distance, 1, 50, DEFAULTS.distance),
    max_stations: clampInt(raw.max_stations, 1, 10, DEFAULTS.max_stations),
    sort: raw.sort === "distance" ? "distance" : "price",
    ...Object.fromEntries(TOGGLES.map((k) => [k, raw[k] !== false])),
    map_height: clampInt(raw.map_height, 150, 1000, DEFAULTS.map_height),
    refresh_interval: clampInt(raw.refresh_interval, 5, 1440, DEFAULTS.refresh_interval),
    min_move: clampInt(raw.min_move, 50, 50000, DEFAULTS.min_move),
    min_delay: clampInt(raw.min_delay, 1, 60, DEFAULTS.min_delay),
    title: typeof raw.title === "string" ? raw.title : undefined,
  };
}

const toRad = (deg) => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau en km. Great-circle distance in km. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

const isCoord = (v, limit) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit;

/** Position {lat, lon} d'un état HA, ou null. Position of an HA state, or null. */
export function positionOf(stateObj) {
  const attrs = stateObj?.attributes;
  if (!attrs) return null;
  const lat = Number(attrs.latitude);
  const lon = Number(attrs.longitude);
  if (!isCoord(lat, 90) || !isCoord(lon, 180)) return null;
  return { lat, lon };
}

/**
 * Nettoie la réponse de l'action find_nearest_stations.
 * Ne garde que les champs attendus, typés ; ignore les entrées invalides.
 * Sanitizes the find_nearest_stations response: keeps typed expected fields only.
 */
export function parseStations(response) {
  const list = Array.isArray(response?.stations) ? response.stations : [];
  const out = [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const lat = Number(s.latitude);
    const lon = Number(s.longitude);
    const price = Number(s.price);
    if (!isCoord(lat, 90) || !isCoord(lon, 180)) continue;
    if (s.price == null || !Number.isFinite(price) || price <= 0) continue;
    const address = typeof s.address === "string" ? s.address.trim().slice(0, 200) : "";
    let name = typeof s.name === "string" ? s.name.trim().slice(0, 120) : "";
    if (!name || name.toLowerCase() === "undefined") name = "";
    out.push({ id: stationKey(lat, lon), name, address, lat, lon, price });
  }
  return out;
}

export const stationKey = (lat, lon) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

/** Ville extraite de l'adresse « rue, CP Ville ». City from "street, ZIP City". */
export function cityOf(address) {
  const m = /,\s*\d{5}\s+(.+)$/.exec(address || "");
  return m ? m[1].trim() : "";
}

/**
 * Index des capteurs Prix Carburant (attributs latitude, longitude, fuel_type).
 * Index of Prix Carburant sensors.
 */
export function buildSensorIndex(states) {
  const index = [];
  for (const [entityId, st] of Object.entries(states || {})) {
    if (!entityId.startsWith("sensor.")) continue;
    const a = st?.attributes;
    if (!a || a.station_id == null || a.fuel_type == null) continue;
    const pos = positionOf(st);
    if (!pos) continue;
    index.push({
      entityId,
      lat: pos.lat,
      lon: pos.lon,
      fuel: String(a.fuel_type),
      updated: typeof a.updated_date === "string" ? a.updated_date : null,
      picture: typeof a.entity_picture === "string" ? a.entity_picture : null,
      brand: typeof a.brand === "string" ? a.brand : null,
      name: typeof a.name === "string" ? a.name : null,
    });
  }
  return index;
}

/**
 * Associe une station à un capteur : même carburant pour la date,
 * n'importe quel carburant pour le logo et la marque.
 * Matches a station to sensors: same fuel for the date, any fuel for logo/brand.
 */
export function matchSensor(station, index, fuel) {
  let sameFuel = null;
  let any = null;
  for (const s of index) {
    if (
      Math.abs(s.lat - station.lat) <= MATCH_TOLERANCE_DEG &&
      Math.abs(s.lon - station.lon) <= MATCH_TOLERANCE_DEG
    ) {
      if (!any) any = s;
      if (s.fuel.toLowerCase() === fuel.toLowerCase()) {
        sameFuel = s;
        break;
      }
    }
  }
  const ref = sameFuel || any;
  return {
    updated: sameFuel?.updated ?? null,
    picture: ref?.picture ?? null,
    brand: ref?.brand ?? null,
    sensorName: ref?.name ?? null,
    entityId: sameFuel?.entityId ?? any?.entityId ?? null,
  };
}

// Logos fournis par l'intégration Prix Carburant (mêmes fichiers que ses capteurs).
// Logos shipped by the Prix Carburant integration (same files as its sensors).
export const BRAND_LOGO_BASE_URL =
  "https://raw.githubusercontent.com/Aohzan/hass-prixcarburant/refs/heads/master/brand_logos/";

// [motif sur le nom normalisé, marque, fichier]. [pattern on normalized name, brand, file]
const BRAND_RULES = [
  [/\b(8 a huit|huit a 8)\b/, "8 à Huit", "8_A_Huit.svg"],
  [/\bintermarche\b/, "Intermarché", "Intermarche.svg"],
  [/\bcarrefour\b/, "Carrefour", "Carrefour.svg"],
  [/\b(super u|hyper u|station u|systeme u|u express|marche u)\b/, "Système U", "Hyper-U.svg"],
  [/\b(totalenergies|total access|total)\b/, "TotalEnergies", "TotalEnergies.svg"],
  [/^relais\b/, "TotalEnergies", "TotalEnergies.svg"],
  [/\b(e ?leclerc|leclerc)\b/, "E.Leclerc", "Leclerc.svg"],
  [/\b(auchan|simply market)\b/, "Auchan", "Auchan.svg"],
  [/\besso\b/, "Esso", "Esso.svg"],
  [/\bavia\b/, "Avia", "AVIA.svg"],
  [/\bshell\b/, "Shell", "Shell.svg"],
  [/\bbp\b/, "BP", "BP.svg"],
  [/\beni\b/, "Eni", "Eni.svg"],
  [/\bagip\b/, "Agip", "Agip.svg"],
  [/\belf\b/, "Elf", "ELF.svg"],
  [/\belan\b/, "Elan", "ELAN-FR.svg"],
  [/\bdyneff\b/, "Dyneff", "Dyneff.svg"],
  [/\bfulli\b/, "Fulli", "Fulli.svg"],
  [/\bcasino\b/, "Casino", "Casino.svg"],
  [/\bcostco\b/, "Costco", "Costco.svg"],
  [/\blidl\b/, "Lidl", "Lidl.svg"],
  [/\baldi\b/, "Aldi", "Aldi_Nord.svg"],
  [/\bnetto\b/, "Netto", "Netto-FR.svg"],
  [/\bleader ?price\b/, "Leader Price", "Leader_Price.svg"],
  [/\bbricomarche\b/, "Bricomarché", "Bricomarche.svg"],
  [/\bmaximarche\b/, "Maximarché", "Maximarche.png"],
  [/\bmonoprix\b/, "Monoprix", "Monoprix.svg"],
  [/\bmatch\b/, "Match", "Match.svg"],
  [/\bspar\b/, "Spar", "Spar.svg"],
  [/\bg20\b/, "G20", "G20.svg"],
  [/\batac\b/, "Atac", "Atac.svg"],
  [/\bprox[iy]\b/, "Proxi", "Proxi.svg"],
  [/\bgulf\b/, "Gulf", "Gulf.svg"],
  [/\brenault\b/, "Renault", "Renault.svg"],
  [/\brompetrol\b/, "Rompetrol", "Rompetrol.svg"],
  [/\broady\b/, "Roady", "Roady-white.svg"],
  [/\bmigro[sl]\b/, "Migrol", "Migrol.svg"],
  [/\bvito\b/, "Vito", "Vito.svg"],
  [/\bweldom\b/, "Weldom", "Weldom.svg"],
];

const normalize = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Devine l'enseigne d'après le nom de la station (ou une marque connue).
 * Guesses the brand from the station name (or a known brand).
 */
export function brandFromName(...texts) {
  for (const text of texts) {
    const n = normalize(text);
    if (!n) continue;
    for (const [re, brand, file] of BRAND_RULES) {
      if (re.test(n)) return { brand, logo: BRAND_LOGO_BASE_URL + file };
    }
  }
  return null;
}

/** Jours calendaires écoulés (J+n). Calendar days elapsed (D+n). */
export function daysSince(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.max(0, Math.round((startOf(now) - startOf(d)) / 86400000));
}

/** Tri et limite. Sorting and limit. */
export function sortStations(stations, sort, max) {
  const copy = [...stations];
  copy.sort((a, b) =>
    sort === "distance"
      ? (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.price - b.price
      : a.price - b.price || (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );
  return copy.slice(0, max);
}

/** Classe de prix : moins cher / plus cher. Price class: cheapest / priciest. */
export function priceRank(stations) {
  if (stations.length < 2) return new Map();
  const prices = stations.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const rank = new Map();
  if (min === max) return rank;
  for (const s of stations) {
    if (s.price === min) rank.set(s.id, "low");
    else if (s.price === max) rank.set(s.id, "high");
  }
  return rank;
}

/**
 * Faut-il relancer une recherche ? Should a new search run?
 * - jamais pendant une recherche ni avant min_delay ; never in flight or before min_delay
 * - si aucune donnée, si l'entité a bougé de plus de min_move, ou après refresh_interval
 */
export function shouldRefresh({ now, lastFetch, lastPos, pos, inFlight, force, config }) {
  if (inFlight || !pos) return false;
  if (force) return true;
  if (lastFetch == null || !lastPos) return true;
  const elapsed = now - lastFetch;
  if (elapsed < config.min_delay * 60000) return false;
  if (elapsed >= config.refresh_interval * 60000) return true;
  return haversineKm(lastPos.lat, lastPos.lon, pos.lat, pos.lon) * 1000 >= config.min_move;
}

/** URL d'itinéraire (coordonnées numériques uniquement). Directions URL (numbers only). */
export function directionsUrl(lat, lon) {
  const a = Number(lat);
  const b = Number(lon);
  if (typeof lat !== "number" || typeof lon !== "number" || !isCoord(a, 90) || !isCoord(b, 180)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${a.toFixed(5)},${b.toFixed(5)}`;
}

/**
 * N'accepte que les images servies par HA ou en https.
 * Only accepts images served by HA (relative) or https.
 */
export function safeImageUrl(url) {
  if (typeof url !== "string" || url.length > 2048) return null;
  if (/^\/(?!\/)/.test(url)) return url;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
