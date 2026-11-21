// Éditeur visuel (ha-form). Visual editor (ha-form).
import { t } from "./i18n.js";
import { DEFAULTS, FUELS } from "./utils.js";

const schema = (hass) => [
  { name: "entity", required: true, selector: { entity: { domain: ["device_tracker", "person"] } } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "fuel", selector: { select: { mode: "dropdown", options: FUELS.map((f) => ({ value: f, label: f })) } } },
      { name: "distance", selector: { number: { min: 1, max: 50, step: 1, mode: "box", unit_of_measurement: "km" } } },
      { name: "max_stations", selector: { number: { min: 1, max: 10, step: 1, mode: "box" } } },
      {
        name: "sort",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "price", label: t(hass, "editor.sort_price") },
              { value: "distance", label: t(hass, "editor.sort_distance") },
            ],
          },
        },
      },
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "show_map", selector: { boolean: {} } },
      { name: "show_list", selector: { boolean: {} } },
    ],
  },
  { name: "map_height", selector: { number: { min: 150, max: 1000, step: 10, mode: "box", unit_of_measurement: "px" } } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "refresh_interval", selector: { number: { min: 5, max: 1440, step: 5, mode: "box", unit_of_measurement: "min" } } },
      { name: "min_delay", selector: { number: { min: 1, max: 60, step: 1, mode: "box", unit_of_measurement: "min" } } },
      { name: "min_move", selector: { number: { min: 50, max: 50000, step: 50, mode: "box", unit_of_measurement: "m" } } },
    ],
  },
  { name: "title", selector: { text: {} } },
];

class FuelMapCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, `editor.${s.name}`);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const value = { ...ev.detail.value };
        for (const k of Object.keys(value)) {
          if (value[k] === "" || value[k] == null) delete value[k];
        }
        this._config = value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: value }, bubbles: true, composed: true }));
      });
      this.replaceChildren(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = schema(this._hass);
    this._form.data = { ...DEFAULTS, ...this._config };
  }
}

if (!customElements.get("fuel-map-card-editor")) {
  customElements.define("fuel-map-card-editor", FuelMapCardEditor);
}
