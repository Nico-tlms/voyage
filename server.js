const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const RAPID_API_HOST = process.env.BOOKING_RAPIDAPI_HOST || 'booking-com.p.rapidapi.com';
const RAPID_API_KEY = process.env.BOOKING_RAPIDAPI_KEY;

const FALLBACK_OFFERS = require('./fallback-offers.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const serveFile = (filePath, res) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end('Erreur lors du chargement de la ressource.');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
};

const requestRapidApi = (pathname, searchParams) => {
  if (!RAPID_API_KEY) {
    return Promise.reject(new Error('La clé BOOKING_RAPIDAPI_KEY est manquante.'));
  }

  const url = new URL(`https://${RAPID_API_HOST}${pathname}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY,
      'X-RapidAPI-Host': RAPID_API_HOST,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Requête RapidAPI échouée avec le statut ${res.statusCode}`));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Réponse RapidAPI invalide.'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const selectDestination = async (destination) => {
  const locations = await requestRapidApi('/v1/hotels/locations', {
    name: destination,
    locale: 'fr',
  });

  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error('Aucune destination trouvée.');
  }

  const cityLocation = locations.find((item) => item.dest_type === 'city') || locations[0];

  return {
    destId: cityLocation.dest_id,
    destType: cityLocation.dest_type,
  };
};

const computeDates = (checkIn, checkOut) => {
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(defaultCheckIn.getDate() + 30);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);

  const toIso = (date) => date.toISOString().slice(0, 10);

  return {
    checkIn: checkIn || toIso(defaultCheckIn),
    checkOut: checkOut || toIso(defaultCheckOut),
  };
};

const mapHotelToOffer = (hotel) => {
  const price = hotel.priceBreakdown?.grossPrice?.value;
  const currency = hotel.priceBreakdown?.grossPrice?.currency || 'EUR';
  const reviewScore = hotel.reviewScore ? Number(hotel.reviewScore).toFixed(1) : null;
  const reviewWord = hotel.reviewScoreWord;
  const highlightParts = [];

  if (reviewWord) {
    highlightParts.push(reviewWord);
  }

  if (reviewScore) {
    highlightParts.push(`${reviewScore}/10`);
  }

  if (hotel.distanceToCc && hotel.distanceToCcText) {
    highlightParts.push(hotel.distanceToCcText);
  }

  const highlight = highlightParts.join(' · ') || 'Voir les détails';

  return {
    id: hotel.id || hotel.hotel_id || hotel.property_id,
    title: hotel.name || hotel.hotel_name,
    destination: hotel.cityTrans || hotel.city || hotel.region,
    type: 'hotel',
    price,
    currency,
    partner: 'Booking.com',
    duration: 'par nuit',
    highlight,
    link: hotel.url || hotel.propertyUrl,
    image: hotel.propertyPhoto?.mainUrl || hotel.mainPhotoUrl,
    address: hotel.address || hotel.address_trans,
  };
};

const filterByBudget = (offers, budget) => {
  if (!budget) {
    return offers;
  }

  const numericBudget = Number(budget);
  if (Number.isNaN(numericBudget) || numericBudget <= 0) {
    return offers;
  }

  return offers.filter((offer) => typeof offer.price === 'number' && offer.price <= numericBudget);
};

const handleHotelsRequest = async (req, res, searchParams) => {
  const destination = searchParams.get('destination');
  const budget = searchParams.get('budget');
  const adults = searchParams.get('adults') || '2';
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');

  if (!destination) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Le paramètre destination est requis.' }));
    return;
  }

  try {
    const { destId, destType } = await selectDestination(destination);
    const { checkIn, checkOut } = computeDates(checkInParam, checkOutParam);

    const results = await requestRapidApi('/v1/hotels/search', {
      dest_type: destType,
      dest_id: destId,
      locale: 'fr',
      adults_number: adults,
      room_number: '1',
      units: 'metric',
      order_by: 'popularity',
      filter_by_currency: 'EUR',
      checkin_date: checkIn,
      checkout_date: checkOut,
      categories_filter: 'price::1-5',
    });

    const hotels = Array.isArray(results?.result) ? results.result : [];
    const offers = hotels.map(mapHotelToOffer).filter((offer) => offer.title && offer.link);
    const filtered = filterByBudget(offers, budget);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        destination,
        checkIn,
        checkOut,
        total: filtered.length,
        offers: filtered,
      })
    );
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: error.message,
        offers: filterByBudget(FALLBACK_OFFERS, budget),
      })
    );
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (parsedUrl.pathname === '/api/hotels' && req.method === 'GET') {
    handleHotelsRequest(req, res, parsedUrl.searchParams);
    return;
  }

  const requestedPath = parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname;
  const normalizedPath = path.normalize(path.join(__dirname, requestedPath));

  if (!normalizedPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Accès refusé.');
    return;
  }

  serveFile(normalizedPath, res);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Serveur VoyageHub prêt sur http://localhost:${PORT}`);
  });
}

module.exports = server;
