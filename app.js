const featuredList = document.getElementById('featured-list');
const offersGrid = document.getElementById('offers-grid');
const searchForm = document.getElementById('search-form');
const currentYear = document.getElementById('current-year');
const searchStatus = document.getElementById('search-status');

let offers = [];
let fallbackOffers = [];

const ensureFallbackOffers = async () => {
  if (fallbackOffers.length) {
    return fallbackOffers;
  }

  try {
    const response = await fetch('/fallback-offers.json');
    if (!response.ok) {
      throw new Error('Impossible de charger les offres inspirantes.');
    }
    const data = await response.json();
    fallbackOffers = Array.isArray(data) ? data : [];
  } catch (error) {
    fallbackOffers = [];
    console.error(error.message);
  }

  return fallbackOffers;
};

const formatCurrency = (value, currency = 'EUR') => {
  if (typeof value !== 'number') {
    return 'Tarif dynamique';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const renderFeatured = (sourceOffers = offers) => {
  if (!featuredList) {
    return;
  }

  const featuredItems = sourceOffers.slice(0, 3);
  featuredList.innerHTML = featuredItems
    .map(
      (offer) => `
        <li>
          <h3>${offer.title}</h3>
          <p>${offer.destination}${offer.price ? ` · ${formatCurrency(offer.price, offer.currency)}` : ''}</p>
          <a class="partner-link" href="${offer.link}" target="_blank" rel="noopener">Voir sur ${offer.partner}</a>
        </li>
      `
    )
    .join('');
};

const renderOffers = (sourceOffers = offers) => {
  if (!offersGrid) {
    return;
  }

  if (!sourceOffers.length) {
    offersGrid.innerHTML = `
      <div class="offer-card empty">
        <h3>Aucun hôtel trouvé</h3>
        <p>Essayez une autre destination ou ajustez votre budget.</p>
      </div>
    `;
    return;
  }

  offersGrid.innerHTML = sourceOffers
    .map(
      (offer) => `
        <article class="offer-card">
          ${offer.image ? `<img src="${offer.image}" alt="${offer.title}" loading="lazy" />` : ''}
          <div class="offer-card-content">
            <span class="badge">${offer.highlight || 'Voir les détails'}</span>
            <h3>${offer.title}</h3>
            <p class="offer-destination">${offer.destination}${offer.address ? ` · ${offer.address}` : ''}</p>
            <div class="offer-meta">
              <span>${offer.partner}</span>
              <span>${formatCurrency(offer.price, offer.currency)}</span>
              <span>Hôtel</span>
            </div>
            <a class="partner-link" href="${offer.link}" target="_blank" rel="noopener">
              Réserver sur ${offer.partner}
            </a>
          </div>
        </article>
      `
    )
    .join('');
};

const updateStatus = (message, tone = 'info') => {
  if (!searchStatus) {
    return;
  }

  searchStatus.textContent = message;
  searchStatus.setAttribute('data-tone', tone);
};

const buildSearchQuery = (formData) => {
  const params = new URLSearchParams();
  const destination = formData.get('destination').trim();
  const budget = formData.get('budget').trim();
  const checkIn = formData.get('check-in');
  const checkOut = formData.get('check-out');
  const adults = formData.get('adults');

  if (destination) {
    params.set('destination', destination);
  }

  if (budget) {
    params.set('budget', budget);
  }

  if (checkIn) {
    params.set('checkIn', checkIn);
  }

  if (checkOut) {
    params.set('checkOut', checkOut);
  }

  if (adults) {
    params.set('adults', adults);
  }

  return params.toString();
};

const applyFallback = async (tone, message) => {
  const fallback = await ensureFallbackOffers();
  offers = [...fallback];
  updateStatus(message, tone);
  renderOffers();
  renderFeatured();
};

const fetchHotels = async (queryString, destinationFallback) => {
  if (!queryString) {
    await applyFallback('warning', 'Veuillez saisir une destination.');
    return;
  }

  updateStatus('Recherche des meilleurs hôtels…', 'loading');

  try {
    const response = await fetch(`/api/hotels?${queryString}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Erreur côté serveur');
    }

    if (Array.isArray(payload.offers) && payload.offers.length > 0) {
      offers = payload.offers;
      updateStatus(
        `${payload.total} hôtel(s) trouvés à ${payload.destination} · ${payload.checkIn} → ${payload.checkOut}`,
        'success'
      );
      renderOffers();
      renderFeatured();
    } else {
      await applyFallback(
        'warning',
        `Aucun résultat trouvé pour ${destinationFallback}. Affichage des inspirations populaires.`
      );
    }
  } catch (error) {
    await applyFallback(
      'error',
      `Impossible de récupérer les offres en direct (${error.message}). Nous affichons une sélection inspirante.`
    );
  }
};

const handleSearch = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const destination = formData.get('destination').trim() || 'votre destination';
  const queryString = buildSearchQuery(formData);
  fetchHotels(queryString, destination);
};

const init = async () => {
  const fallback = await ensureFallbackOffers();
  offers = [...fallback];
  renderFeatured();
  renderOffers();

  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  const defaultDestination = searchForm?.dataset.defaultDestination || 'Paris';
  const defaultAdults = searchForm?.dataset.defaultAdults || '2';

  const params = new URLSearchParams({
    destination: defaultDestination,
    adults: defaultAdults,
  });

  fetchHotels(params.toString(), defaultDestination);
};

init();
