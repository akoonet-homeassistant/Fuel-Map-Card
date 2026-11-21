// Fonds de carte disponibles. Available map styles.
// invertDark : en thème sombre, on inverse les couleurs (fond clair seulement).
// invertDark: in dark theme, colors are inverted (light basemaps only).

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const CARTO = `${OSM} &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>`;

export const MAP_STYLES = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM,
    maxZoom: 19,
    invertDark: true,
  },
  osm_fr: {
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: `${OSM} &copy; <a href="https://www.openstreetmap.fr" target="_blank" rel="noopener noreferrer">OSM France</a>`,
    maxZoom: 20,
    invertDark: true,
  },
  carto_light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: CARTO,
    maxZoom: 20,
    invertDark: true,
  },
  carto_dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: CARTO,
    maxZoom: 20,
    invertDark: false,
  },
  carto_voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: CARTO,
    maxZoom: 20,
    invertDark: true,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: `${OSM}, SRTM | &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (CC-BY-SA)`,
    maxZoom: 17,
    invertDark: false,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics, GIS User Community",
    maxZoom: 19,
    invertDark: false,
  },
};

// « auto » : CARTO clair ou sombre selon le thème. "auto": CARTO light or dark by theme.
export const MAP_STYLE_IDS = ["osm", "osm_fr", "auto", "carto_light", "carto_dark", "carto_voyager", "topo", "satellite", "custom"];

const CUSTOM_URL = /^https:\/\/[^\s"'<>\\]+$/;

export function isValidTileUrl(url) {
  return typeof url === "string" && url.length <= 512 && CUSTOM_URL.test(url) && url.includes("{z}") && url.includes("{x}") && url.includes("{y}");
}

/** Fond de carte effectif. Effective tile provider. */
export function resolveTiles(style, darkMode, tileUrl) {
  if (style === "custom") {
    if (isValidTileUrl(tileUrl)) return { id: "custom", url: tileUrl, attribution: "", maxZoom: 19, invertDark: false };
    return { id: "osm", ...MAP_STYLES.osm };
  }
  if (style === "auto") {
    const id = darkMode ? "carto_dark" : "carto_light";
    return { id, ...MAP_STYLES[id], invertDark: false };
  }
  const id = MAP_STYLES[style] ? style : "osm";
  return { id, ...MAP_STYLES[id] };
}
