# VoyageHub

VoyageHub est une landing page d'affiliation qui centralise des offres d'hôtels Booking.com en temps réel tout en
proposant une sélection inspirationnelle pour vos prochains séjours.

## Aperçu

- Formulaire de recherche avec destination, dates, nombre de voyageurs et budget maximum.
- Intégration de l'API Booking.com (via RapidAPI) côté serveur pour récupérer les hôtels en direct.
- Affichage dynamique des résultats avec visuels, notes synthétiques et liens profonds vers Booking.com.
- Sections éditoriales : bénéfices, destinations tendance, témoignages et inscription newsletter.
- Design responsive basé sur Poppins, ombres douces et cartes en grille.

## Prérequis

- [Node.js 18+](https://nodejs.org/) (utilisé pour servir les fichiers statiques et proxyfier l'API Booking.com).
- Un compte [RapidAPI](https://rapidapi.com/) avec accès à l'API Booking.com.

## Configuration

1. Récupérez votre clé RapidAPI ainsi que l'hôte associés à l'API Booking.com (ex. `booking-com.p.rapidapi.com`).
2. Exportez les variables d'environnement avant de démarrer le serveur :

   ```bash
   export BOOKING_RAPIDAPI_KEY="votre_cle_rapidapi"
   export BOOKING_RAPIDAPI_HOST="booking-com.p.rapidapi.com" # valeur par défaut
   ```

   Vous pouvez également définir ces variables directement dans votre outil de gestion de processus (systemd, pm2, etc.).

## Lancer le serveur

```bash
node server.js
```

Le serveur embarqué :

- diffuse la version statique du site sur `http://localhost:3000`
- interroge l'API Booking.com via `/api/hotels?destination=Paris&adults=2&checkIn=2024-07-01&checkOut=2024-07-04`
- applique un fallback côté client (`fallback-offers.json`) si l'API n'est pas configurée ou renvoie une erreur

Une fois le serveur démarré, ouvrez `http://localhost:3000` dans votre navigateur pour tester la recherche.

## Téléchargement

1. Cliquez sur le bouton **Code** de ce dépôt puis sur **Download ZIP** pour récupérer les fichiers, ou exécutez la commande suivante
   si vous utilisez Git :

   ```bash
   git clone https://github.com/votre-compte/voyagehub.git
   ```

2. Extrayez l'archive (si vous avez téléchargé le ZIP) puis ouvrez le dossier sur votre ordinateur.
3. Configurez vos variables d'environnement et lancez `node server.js` pour accéder à la version connectée.

## Développement

- Les styles principaux se trouvent dans `styles.css`.
- La logique front-end est gérée dans `app.js` (fetch de l'API, rendu dynamique et fallback).
- Le proxy et la diffusion statique sont assurés par `server.js`.
- `fallback-offers.json` contient une petite sélection d'hôtels affichés en cas d'erreur API.

## Limitations & TODO

- Les tarifs et disponibilités dépendent du plan RapidAPI choisi et peuvent être soumis à des quotas.
- Pensez à ajouter une gestion de cache côté serveur pour réduire les appels répétitifs à Booking.com.
- Pour une mise en production, sécurisez les variables d'environnement et ajoutez une gestion d'erreurs plus complète (monitoring,
  logs structurés, etc.).
