// Traductions FR / EN. French / English translations.

export const STRINGS = {
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
      min_move: "Déplacement déclenchant une recherche",
      min_delay: "Délai minimum entre deux recherches",
      title: "Titre (facultatif)",
      section_search: "Recherche",
      section_general: "En-tête",
      section_map: "Carte",
      section_list: "Liste",
      section_refresh: "Actualisation",
      show_header: "Afficher le titre",
      show_refresh_button: "Bouton Actualiser",
      show_car: "Afficher le véhicule",
      show_zoom_controls: "Boutons de zoom",
      show_recenter_button: "Bouton Recentrer",
      show_directions: "Lien Itinéraire",
      show_logo: "Logo de l'enseigne",
      show_distance: "Colonne Distance",
      show_updated: "Colonne MAJ",
      show_price_colors: "Couleurs moins cher / plus cher",
    },
    editor_help: {
      refresh_interval: "Nouvelle recherche au moins toutes les X minutes.",
      min_delay: "Jamais deux recherches à moins de X minutes d'intervalle.",
      min_move: "Nouvelle recherche quand l'entité s'est déplacée de X mètres.",
      max_stations: "L'action Prix Carburant renvoie au plus 10 stations.",
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
      min_move: "Movement triggering a search",
      min_delay: "Minimum delay between searches",
      title: "Title (optional)",
      section_search: "Search",
      section_general: "Header",
      section_map: "Map",
      section_list: "List",
      section_refresh: "Refresh",
      show_header: "Show title",
      show_refresh_button: "Refresh button",
      show_car: "Show vehicle",
      show_zoom_controls: "Zoom buttons",
      show_recenter_button: "Recenter button",
      show_directions: "Directions link",
      show_logo: "Brand logo",
      show_distance: "Distance column",
      show_updated: "Update column",
      show_price_colors: "Cheapest / priciest colors",
    },
    editor_help: {
      refresh_interval: "New search at least every X minutes.",
      min_delay: "Never two searches less than X minutes apart.",
      min_move: "New search once the entity has moved X meters.",
      max_stations: "The Prix Carburant action returns 10 stations at most.",
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
