// Schéma de l'éditeur visuel. Visual editor schema.
import { t } from "./i18n.js";
import { FUELS, LAYOUTS } from "./utils.js";
import { MAP_STYLE_IDS } from "./tiles.js";

const bool = (name) => ({ name, selector: { boolean: {} } });
const num = (name, min, max, step, unit) => ({
  name,
  selector: { number: { min, max, step, mode: "box", ...(unit ? { unit_of_measurement: unit } : {}) } },
});

const section = (hass, key, icon, schema, expanded = false) => ({
  type: "expandable",
  name: "",
  flatten: true,
  title: t(hass, `editor.section_${key}`),
  icon,
  expanded,
  schema,
});

const select = (hass, name, values, prefix) => ({
  name,
  selector: {
    select: { mode: "dropdown", options: values.map((v) => ({ value: v, label: t(hass, `editor.${prefix}_${v}`) })) },
  },
});

export const editorSchema = (hass, data = {}) => [
  { name: "entity", required: true, selector: { entity: { domain: ["device_tracker", "person"] } } },
  section(
    hass,
    "search",
    "mdi:magnify",
    [
      {
        name: "fuels",
        selector: { select: { multiple: true, mode: "list", options: FUELS.map((f) => ({ value: f, label: f })) } },
      },
      {
        type: "grid",
        name: "",
        schema: [
          num("distance", 1, 50, 1, "km"),
          num("max_stations", 1, 10, 1),
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
    ],
    true,
  ),
  section(hass, "general", "mdi:card-outline", [
    { name: "title", selector: { text: {} } },
    select(hass, "layout", LAYOUTS, "layout"),
    { type: "grid", name: "", schema: [bool("show_header"), bool("show_refresh_button")] },
  ]),
  section(hass, "map", "mdi:map", [
    { type: "grid", name: "", schema: [bool("show_map"), num("map_height", 150, 1000, 10, "px")] },
    select(hass, "map_style", MAP_STYLE_IDS, "style"),
    ...(data.map_style === "custom" ? [{ name: "tile_url", selector: { text: { type: "url" } } }] : []),
    bool("dark_filter"),
    {
      type: "grid",
      name: "",
      schema: [bool("show_car"), bool("show_zoom_controls"), bool("show_recenter_button"), bool("show_directions")],
    },
  ]),
  section(hass, "list", "mdi:format-list-bulleted", [
    {
      type: "grid",
      name: "",
      schema: [bool("show_list"), bool("show_logo"), bool("show_distance"), bool("show_updated"), bool("show_price_colors")],
    },
  ]),
  section(hass, "refresh", "mdi:refresh", [
    {
      type: "grid",
      name: "",
      schema: [num("refresh_interval", 5, 1440, 5, "min"), num("min_delay", 1, 60, 1, "min"), num("min_move", 50, 50000, 50, "m")],
    },
  ]),
];
