// Traductions FR / EN. French / English translations.

const STRINGS = {
  fr: {
    title: "Stations à proximité",
    station: "Station",
    distance: "Distance",
    price: "Prix",
    updated: "MAJ",
    unknown_station: "Station sans nom",
    refresh: "Actualiser",
    recenter: "Recentrer",
    directions: "Itinéraire",
    loading: "Recherche des stations…",
    no_station: "Aucune station trouvée dans un rayon de {km} km.",
    err_integration:
      "L'action prix_carburant.find_nearest_stations est introuvable. Installez ou mettez à jour l'intégration Prix Carburant.",
    err_entity: "Entité introuvable : {entity}",
    err_position: "{entity} n'a pas de position GPS.",
    err_fetch: "Recherche impossible : {error}",
    updated_ago: "Mis à jour {time}",
    within: "{fuel} · {km} km autour de {name}",
    days: "J+{n}",
    no_date: "—",
    editor: {
      entity: "Entité à suivre (véhicule, personne)",
      fuel: "Carburant",
      distance: "Rayon de recherche",
      max_stations: "Nombre de stations (max 10)",
      sort: "Tri",
      sort_price: "Prix",
      sort_distance: "Distance",
      show_map: "Afficher la carte",
      show_list: "Afficher la liste",
      map_height: "Hauteur de la carte",
      refresh_interval: "Actualisation automatique",
      min_move: "Nouvelle recherche après un déplacement de",
      min_delay: "Délai minimum entre deux recherches",
      title: "Titre (facultatif)",
    },
  },
  en: {
    title: "Nearby stations",
    station: "Station",
    distance: "Distance",
    price: "Price",
    updated: "Upd.",
    unknown_station: "Unnamed station",
    refresh: "Refresh",
    recenter: "Recenter",
    directions: "Directions",
    loading: "Searching for stations…",
    no_station: "No station found within {km} km.",
    err_integration:
      "The prix_carburant.find_nearest_stations action is missing. Install or update the Prix Carburant integration.",
    err_entity: "Entity not found: {entity}",
    err_position: "{entity} has no GPS position.",
    err_fetch: "Search failed: {error}",
    updated_ago: "Updated {time}",
    within: "{fuel} · {km} km around {name}",
    days: "D+{n}",
    no_date: "—",
    editor: {
      entity: "Entity to follow (vehicle, person)",
      fuel: "Fuel",
      distance: "Search radius",
      max_stations: "Number of stations (max 10)",
      sort: "Sort by",
      sort_price: "Price",
      sort_distance: "Distance",
      show_map: "Show map",
      show_list: "Show list",
      map_height: "Map height",
      refresh_interval: "Automatic refresh",
      min_move: "New search after moving",
      min_delay: "Minimum delay between searches",
      title: "Title (optional)",
    },
  },
};

export function langOf(hass) {
  const lang = String(hass?.locale?.language || hass?.language || "en").toLowerCase();
  return lang.startsWith("fr") ? "fr" : "en";
}

export function localeOf(hass) {
  return hass?.locale?.language || hass?.language || "en";
}

/** t(hass, "editor.fuel", {km: 10}) */
export function t(hass, key, vars = {}) {
  const lang = langOf(hass);
  const pick = (table) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), table);
  let str = pick(STRINGS[lang]) ?? pick(STRINGS.en) ?? key;
  for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
  return str;
}
