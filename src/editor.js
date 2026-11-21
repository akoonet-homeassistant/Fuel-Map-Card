// Éditeur visuel (ha-form), en sections repliables.
// Visual editor (ha-form), in collapsible sections.
import { t } from "./i18n.js";
import { DEFAULTS } from "./utils.js";
import { editorSchema } from "./editor-schema.js";

// ha-form n'est chargé par HA qu'à la demande : on force son chargement via
// l'éditeur d'une carte native avant de créer le formulaire. Sinon les propriétés
// posées avant l'enregistrement de l'élément masquent ses accesseurs et le
// formulaire reste vide.
// HA lazy-loads ha-form: load it through a built-in card editor before creating
// the form, otherwise properties set before upgrade shadow its accessors.
let formReady;
export function ensureHaForm() {
  if (customElements.get("ha-form") && customElements.get("ha-selector")) return Promise.resolve();
  formReady ??= (async () => {
    try {
      const helpers = await window.loadCardHelpers?.();
      const card = await helpers?.createCardElement({ type: "entities", entities: [] });
      await card?.constructor?.getConfigElement?.();
    } catch {
      /* on attend simplement ha-form ci-dessous. Just wait for ha-form below. */
    }
    await Promise.race([customElements.whenDefined("ha-form"), new Promise((r) => setTimeout(r, 10000))]);
  })();
  return formReady;
}

class FuelMapCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    ensureHaForm().then(() => this._render());
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!customElements.get("ha-form")) {
      ensureHaForm().then(() => this._render());
      return;
    }
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => (s.name ? t(this._hass, `editor.${s.name}`) : undefined);
      this._form.computeHelper = (s) => {
        const h = t(this._hass, `editor_help.${s.name}`);
        return h === `editor_help.${s.name}` ? undefined : h;
      };
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const value = { ...ev.detail.value };
        for (const k of Object.keys(value)) {
          // On n'écrit que ce qui diffère des valeurs par défaut. Only keep non-default values.
          if (value[k] === "" || value[k] == null || (k in DEFAULTS && value[k] === DEFAULTS[k])) delete value[k];
        }
        const { type = "custom:fuel-map-card", entity, ...rest } = value;
        const config = { type, entity, ...rest };
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.replaceChildren(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = editorSchema(this._hass);
    this._form.data = { ...DEFAULTS, ...this._config };
  }
}

if (typeof customElements !== "undefined" && !customElements.get("fuel-map-card-editor")) {
  customElements.define("fuel-map-card-editor", FuelMapCardEditor);
}
