# Fuel Map Card 2026.11.1

## 🇫🇷 Première version

Carte Lovelace qui affiche les stations-service autour d'un véhicule, à partir de l'intégration Prix Carburant.

- Recherche automatique dans un rayon réglable autour d'un `device_tracker` ou d'une `person` (action `prix_carburant.find_nearest_stations`).
- Carte avec une pastille de prix par station (moins chère en vert, plus chère en rouge) ; le véhicule reste au premier plan.
- Liste triée par prix ou distance : logo, nom, ville, distance, prix, date de mise à jour (J+n).
- Clic sur une station : la carte se centre dessus et ouvre sa fiche avec un lien d'itinéraire.
- Nouvelle recherche après un déplacement, avec un délai minimum entre deux appels à l'API.
- Éditeur visuel, thème clair/sombre, français et anglais.

**Limites connues** : 10 stations au maximum (limite de l'action Prix Carburant) ; la date de mise à jour et le logo ne sont affichés que pour les stations qui ont déjà un capteur Prix Carburant.

## 🇬🇧 First release

Lovelace card showing fuel stations around a vehicle, using the Prix Carburant integration.

- Automatic search within an adjustable radius around a `device_tracker` or `person` (`prix_carburant.find_nearest_stations` action).
- Map with a price pin per station (cheapest in green, priciest in red); the vehicle stays on top.
- List sorted by price or distance: logo, name, city, distance, price, last update (D+n).
- Click a station: the map centers on it and opens its details with a directions link.
- New search after moving, with a minimum delay between API calls.
- Visual editor, light/dark theme, French and English.

**Known limits**: 10 stations at most (Prix Carburant action limit); the update date and logo are only shown for stations that already have a Prix Carburant sensor.
