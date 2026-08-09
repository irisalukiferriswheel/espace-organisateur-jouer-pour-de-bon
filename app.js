const createEventBtn = document.querySelector('#createEventBtn');
const closeCreateBtn = document.querySelector('#closeCreateBtn');
const createPanel = document.querySelector('#createPanel');
const emptyState = document.querySelector('#emptyState');
const eventForm = document.querySelector('#eventForm');
const saveDraftBtn = document.querySelector('#saveDraftBtn');
const formMessage = document.querySelector('#formMessage');
const previewTitle = document.querySelector('#previewTitle');
const previewSummary = document.querySelector('#previewSummary');
const langFrBtn = document.querySelector('#langFrBtn');
const langEnBtn = document.querySelector('#langEnBtn');

const copy = {
  fr: {
    brand: 'Jouer Pour de Bon', heroTitle: 'Espace organisateur', heroIntro: 'Créez et gérez vos événements. Cette version reste un prototype : les boutons de sauvegarde et publication ne modifient encore aucune donnée réelle.', createEvent: '+ Créer un événement', dashboard: 'Tableau de bord', myEvents: 'Mes événements', securePrototype: 'Prototype sécurisé', noEvents: 'Aucun événement pour le moment', noEventsBody: 'Quand l’API sera connectée, seuls les événements appartenant à l’organisateur connecté apparaîtront ici.', newEvent: 'Nouvel événement', createEventTitle: 'Créer un événement', close: 'Fermer', generalLegend: '1. Informations générales', eventName: 'Nom de l’événement', activity: 'Jeu / activité', format: 'Format', inPerson: 'Présentiel', online: 'En ligne', hybrid: 'Hybride', description: 'Description', imageUrl: 'Image de l’événement — URL (optionnel)', datePlaceLegend: '2. Date et lieu', date: 'Date', timezone: 'Fuseau horaire', startTime: 'Heure de début', endTime: 'Heure de fin', city: 'Ville', region: 'Province / région', venue: 'Lieu / adresse', participationLegend: '3. Participation', fee: 'Prix d’inscription', currency: 'Devise', capacity: 'Nombre maximum de joueurs', deadline: 'Date limite d’inscription', minimumAge: 'Âge minimum', skillLevel: 'Niveau recommandé', allLevels: 'Tous niveaux', beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', causeLegend: '4. Cause soutenue', cause: 'Cause', pfgRule: 'Règle Jouer Pour de Bon', pfgRuleBody: 'La logique de répartition des fonds sera appliquée et vérifiée côté backend. L’organisateur ne pourra pas modifier les règles financières de la plateforme.', contactLegend: '5. Organisation et contact', contactLink: 'Lien de contact ou réseau social', organizer: 'Organisateur', organizerBody: 'L’identité de l’organisateur sera remplie automatiquement à partir du compte connecté. Elle ne sera pas sélectionnable manuellement.', publicationLegend: '6. Publication', visibility: 'Visibilité', public: 'Public', unlisted: 'Non répertorié', initialStatus: 'Statut initial', draft: 'Brouillon', openRegistration: 'Ouvert aux inscriptions', preview: 'Aperçu', eventPreview: 'Votre événement', saveDraft: 'Enregistrer comme brouillon', publish: 'Publier l’événement', previewEmpty: 'Remplissez le nom, la ville et la date pour voir un résumé ici.', draftMessage: 'Brouillon simulé. Aucune donnée réelle n’a été enregistrée.', publishMessage: 'Publication simulée. L’API sécurisée sera connectée à l’étape suivante.'
  },
  en: {
    brand: 'Playing For Good', heroTitle: 'Organizer space', heroIntro: 'Create and manage your events. This version is still a prototype: saving and publishing do not modify any real data yet.', createEvent: '+ Create an event', dashboard: 'Dashboard', myEvents: 'My events', securePrototype: 'Secure prototype', noEvents: 'No events yet', noEventsBody: 'Once the API is connected, only events owned by the logged-in organizer will appear here.', newEvent: 'New event', createEventTitle: 'Create an event', close: 'Close', generalLegend: '1. General information', eventName: 'Event name', activity: 'Game / activity', format: 'Format', inPerson: 'In person', online: 'Online', hybrid: 'Hybrid', description: 'Description', imageUrl: 'Event image — URL (optional)', datePlaceLegend: '2. Date and location', date: 'Date', timezone: 'Time zone', startTime: 'Start time', endTime: 'End time', city: 'City', region: 'Province / region', venue: 'Venue / address', participationLegend: '3. Participation', fee: 'Registration fee', currency: 'Currency', capacity: 'Maximum players', deadline: 'Registration deadline', minimumAge: 'Minimum age', skillLevel: 'Recommended level', allLevels: 'All levels', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', causeLegend: '4. Supported cause', cause: 'Cause', pfgRule: 'Playing For Good rule', pfgRuleBody: 'Fund distribution rules will be applied and verified by the backend. Organizers will not be able to change the platform’s financial rules.', contactLegend: '5. Organization and contact', contactLink: 'Contact or social link', organizer: 'Organizer', organizerBody: 'The organizer identity will be filled automatically from the logged-in account. It cannot be selected manually.', publicationLegend: '6. Publication', visibility: 'Visibility', public: 'Public', unlisted: 'Unlisted', initialStatus: 'Initial status', draft: 'Draft', openRegistration: 'Open for registration', preview: 'Preview', eventPreview: 'Your event', saveDraft: 'Save as draft', publish: 'Publish event', previewEmpty: 'Fill in the name, city, and date to see a summary here.', draftMessage: 'Draft simulated. No real data has been saved.', publishMessage: 'Publication simulated. The secure API will be connected in the next step.'
  }
};

let language = localStorage.getItem('pfg-organizer-language') || 'fr';

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem('pfg-organizer-language', language);
  document.documentElement.lang = language;
  document.title = language === 'fr' ? 'Espace organisateur — Jouer Pour de Bon' : 'Organizer space — Playing For Good';

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (copy[language][key]) node.textContent = copy[language][key];
  });

  document.querySelectorAll('[data-placeholder-fr]').forEach((node) => {
    node.placeholder = language === 'fr' ? node.dataset.placeholderFr : node.dataset.placeholderEn;
  });

  langFrBtn?.classList.toggle('is-active', language === 'fr');
  langEnBtn?.classList.toggle('is-active', language === 'en');
  langFrBtn?.setAttribute('aria-pressed', String(language === 'fr'));
  langEnBtn?.setAttribute('aria-pressed', String(language === 'en'));
  document.querySelector('.language-switcher')?.setAttribute('aria-label', language === 'fr' ? 'Choix de langue' : 'Language selection');

  updatePreview();
}

function openCreatePanel() {
  createPanel.hidden = false;
  emptyState.hidden = true;
  createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreatePanel() {
  createPanel.hidden = true;
  emptyState.hidden = false;
}

function getFormData() {
  return Object.fromEntries(new FormData(eventForm).entries());
}

function updatePreview() {
  const data = getFormData();
  previewTitle.textContent = data.title || copy[language].eventPreview;
  const parts = [data.activityType, data.city, data.date, data.startTime, data.fee ? `${data.fee} ${data.currency || 'CAD'}` : ''].filter(Boolean);
  previewSummary.textContent = parts.length ? parts.join(' · ') : copy[language].previewEmpty;
}

function showPrototypeMessage(message) {
  formMessage.textContent = message;
}

function handleDraft() {
  const data = getFormData();
  console.log('Prototype draft payload:', data);
  showPrototypeMessage(copy[language].draftMessage);
}

function handleSubmit(event) {
  event.preventDefault();
  if (!eventForm.reportValidity()) return;
  const data = getFormData();
  console.log('Prototype publish payload:', data);
  showPrototypeMessage(copy[language].publishMessage);
}

createEventBtn?.addEventListener('click', openCreatePanel);
closeCreateBtn?.addEventListener('click', closeCreatePanel);
saveDraftBtn?.addEventListener('click', handleDraft);
eventForm?.addEventListener('submit', handleSubmit);
eventForm?.addEventListener('input', updatePreview);
eventForm?.addEventListener('change', updatePreview);
langFrBtn?.addEventListener('click', () => setLanguage('fr'));
langEnBtn?.addEventListener('click', () => setLanguage('en'));

setLanguage(language);
