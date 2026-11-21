# Fuel Map Card 2026.11.3

## 🇫🇷 Correction

- **La carte restait vide en arrivant sur la vue** : Home Assistant prépare les cartes avant d'afficher la vue, et la recherche n'était alors lancée qu'à l'actualisation suivante (ou avec le bouton Actualiser). Elle démarre désormais dès que la carte s'affiche.
- Le cadrage de la carte est recalculé quand elle devient visible, au lieu de rester sur un zoom calculé pendant qu'elle était masquée.

## 🇬🇧 Fix

- **The card stayed empty when opening the view**: Home Assistant prepares cards before showing the view, and the search only ran at the next refresh (or with the Refresh button). It now starts as soon as the card is displayed.
- The map framing is recomputed when the map becomes visible, instead of keeping a zoom computed while it was hidden.
