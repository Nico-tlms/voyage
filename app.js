const offers = [
  {
    id: 1,
    title: "Vol Paris ➜ Tokyo",
    destination: "Tokyo",
    type: "vol",
    price: 549,
    partner: "Skyscanner",
    duration: "Aller/Retour",
    highlight: "-18% cette semaine",
    link: "https://partners.skyscanner.net",
  },
  {
    id: 2,
    title: "Hôtel 4★ au cœur de Lisbonne",
    destination: "Lisbonne",
    type: "hotel",
    price: 129,
    partner: "Booking",
    duration: "3 nuits",
    highlight: "Petit-déjeuner inclus",
    link: "https://www.booking.com/index.fr.html",
  },
  {
    id: 3,
    title: "Road-trip en Islande",
    destination: "Islande",
    type: "sejour",
    price: 799,
    partner: "Evaneos",
    duration: "7 jours",
    highlight: "Guide local francophone",
    link: "https://www.evaneos.fr/",
  },
  {
    id: 4,
    title: "Week-end bien-être à Marrakech",
    destination: "Marrakech",
    type: "sejour",
    price: 269,
    partner: "Voyage Privé",
    duration: "3 jours",
    highlight: "Spa & hammam offerts",
    link: "https://www.voyage-prive.com/",
  },
  {
    id: 5,
    title: "Vol Lyon ➜ Montréal",
    destination: "Montréal",
    type: "vol",
    price: 389,
    partner: "Kayak",
    duration: "Aller/Retour",
    highlight: "Bagage cabine inclus",
    link: "https://www.kayak.fr/",
  },
  {
    id: 6,
    title: "Eco-lodge à Bali",
    destination: "Bali",
    type: "hotel",
    price: 159,
    partner: "Expedia",
    duration: "par nuit",
    highlight: "Annulation gratuite",
    link: "https://www.expedia.fr/",
  },
  {
    id: 7,
    title: "Séjour ski aux Arcs",
    destination: "Alpes",
    type: "sejour",
    price: 499,
    partner: "Sunweb",
    duration: "5 jours",
    highlight: "Forfaits inclus",
    link: "https://www.sunweb.fr/",
  },
  {
    id: 8,
    title: "Hôtel boutique à Rome",
    destination: "Rome",
    type: "hotel",
    price: 139,
    partner: "Hotels.com",
    duration: "par nuit",
    highlight: "Terrasse panoramique",
    link: "https://fr.hotels.com/",
  },
];

const featuredList = document.getElementById("featured-list");
const offersGrid = document.getElementById("offers-grid");
const searchForm = document.getElementById("search-form");
const currentYear = document.getElementById("current-year");

const formatCurrency = (value) => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
}).format(value);

const renderFeatured = () => {
  const featuredItems = offers.slice(0, 3);
  featuredList.innerHTML = featuredItems
    .map(
      (offer) => `
        <li>
          <h3>${offer.title}</h3>
          <p>${offer.partner} · ${formatCurrency(offer.price)}</p>
          <a class="partner-link" href="${offer.link}" target="_blank" rel="noopener">Voir l'offre</a>
        </li>
      `
    )
    .join("");
};

const renderOffers = (filteredOffers = offers) => {
  if (!filteredOffers.length) {
    offersGrid.innerHTML = `
      <div class="offer-card">
        <h3>Aucune offre ne correspond à vos critères.</h3>
        <p>Essayez d'élargir votre recherche ou de modifier votre budget.</p>
      </div>
    `;
    return;
  }

  offersGrid.innerHTML = filteredOffers
    .map(
      (offer) => `
        <article class="offer-card">
          <span class="badge">${offer.highlight}</span>
          <h3>${offer.title}</h3>
          <p>${offer.destination} · ${offer.duration}</p>
          <div class="offer-meta">
            <span>${offer.partner}</span>
            <span>${formatCurrency(offer.price)}</span>
            <span>${offer.type === "vol" ? "Vol" : offer.type === "hotel" ? "Hôtel" : "Séjour"}</span>
          </div>
          <a class="partner-link" href="${offer.link}" target="_blank" rel="noopener">
            Réserver chez ${offer.partner}
          </a>
        </article>
      `
    )
    .join("");
};

const handleSearch = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const destinationQuery = formData.get("destination").trim().toLowerCase();
  const typeFilter = formData.get("type");
  const budget = Number(formData.get("budget"));

  const results = offers.filter((offer) => {
    const matchDestination = destinationQuery
      ? offer.destination.toLowerCase().includes(destinationQuery) ||
        offer.title.toLowerCase().includes(destinationQuery)
      : true;

    const matchType = typeFilter ? offer.type === typeFilter : true;
    const matchBudget = budget > 0 ? offer.price <= budget : true;

    return matchDestination && matchType && matchBudget;
  });

  renderOffers(results);
};

const init = () => {
  renderFeatured();
  renderOffers();
  searchForm.addEventListener("submit", handleSearch);
  currentYear.textContent = new Date().getFullYear();
};

init();
