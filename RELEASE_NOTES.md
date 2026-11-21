# Fuel Map Card 2026.11.1

## 🇫🇷 Première version

Carte Lovelace qui affiche les stations-service autour d'un véhicule, à partir de l'intégration Prix Carburant.

- Recherche automatique dans un rayon réglable autour d'un `device_tracker` ou d'une `person` (action `prix_carburant.find_nearest_stations`).
- Carte avec une pastille de prix par station (moins chère en vert, plus chère en rouge) ; le véhicule reste au premier plan.
- Liste triée par prix ou distance : logo de l'enseigne, nom, ville, distance, prix, date de mise à jour (J+n).
- Logos des enseignes : logo du capteur Prix Carburant s'il existe, sinon enseigne reconnue dans le nom de la station.
- Clic sur une station : la carte se centre dessus et ouvre sa fiche avec un lien d'itinéraire.
- Nouvelle recherche après un déplacement, avec un délai minimum entre deux appels à l'API.
- Éditeur visuel en sections (Recherche, En-tête, Carte, Liste, Actualisation) : chaque élément s'active ou se désactive (titre, boutons, véhicule, zoom, itinéraire, logo, colonnes Distance et MAJ, couleurs de prix).
- Thème clair/sombre, français et anglais.

**Limites connues** : 10 stations au maximum (limite de l'action Prix Carburant) ; la date de mise à jour n'est affichée que pour les stations qui ont déjà un capteur Prix Carburant ; une station sans capteur et dont le nom ne contient pas l'enseigne garde l'icône générique.

## 🇬🇧 First release

Lovelace card showing fuel stations around a vehicle, using the Prix Carburant integration.

- Automatic search within an adjustable radius around a `device_tracker` or `person` (`prix_carburant.find_nearest_stations` action).
- Map with a price pin per station (cheapest in green, priciest in red); the vehicle stays on top.
- List sorted by price or distance: brand logo, name, city, distance, price, last update (D+n).
- Brand logos: the Prix Carburant sensor's logo when available, otherwise the brand recognized in the station name.
- Click a station: the map centers on it and opens its details with a directions link.
- New search after moving, with a minimum delay between API calls.
- Visual editor in sections (Search, Header, Map, List, Refresh): every element can be turned on or off (title, buttons, vehicle, zoom, directions, logo, Distance and Update columns, price colors).
- Light/dark theme, French and English.

**Known limits**: 10 stations at most (Prix Carburant action limit); the update date is only shown for stations that already have a Prix Carburant sensor; a station without a sensor whose name has no brand keeps the generic icon.
