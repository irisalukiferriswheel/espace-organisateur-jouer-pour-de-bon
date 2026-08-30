const createEventBtn = document.querySelector('#createEventBtn');
const closeCreateBtn = document.querySelector('#closeCreateBtn');
const createPanel = document.querySelector('#createPanel');
const emptyState = document.querySelector('#emptyState');
const eventForm = document.querySelector('#eventForm');
const saveDraftBtn = document.querySelector('#saveDraftBtn');
const publishBtn = document.querySelector('#publishBtn');
const formMessage = document.querySelector('#formMessage');
const errorSummary = document.querySelector('#errorSummary');
const previewTitle = document.querySelector('#previewTitle');
const previewSummary = document.querySelector('#previewSummary');
const langFrBtn = document.querySelector('#langFrBtn');
const langEnBtn = document.querySelector('#langEnBtn');

const ALLOWED_WIX_ORIGINS = new Set([
  'https://www.jouerpourdebon.ca',
  'https://jouerpourdebon.ca'
]);

const MESSAGE_TYPES = Object.freeze({
  ready: 'JPDB_ORGANIZER_READY',
  authRequest: 'JPDB_ORGANIZER_EMBED_READY',
  auth: 'JPDB_WIX_MEMBER_AUTH',
  requestEvents: 'JPDB_ORGANIZER_REQUEST_EVENTS',
  events: 'JPDB_ORGANIZER_EVENTS',
  saveDraft: 'JPDB_ORGANIZER_SAVE_DRAFT',
  draftSaved: 'JPDB_ORGANIZER_DRAFT_SAVED',
  error: 'JPDB_ORGANIZER_ERROR'
});

const copy = {
  fr: {
    brand: 'Jouer Pour de Bon', heroTitle: 'Espace organisateur', heroIntro: 'Créez et gérez vos événements. Les brouillons sont privés jusqu’à leur publication.', createEvent: '+ Créer un événement', dashboard: 'Tableau de bord', myEvents: 'Mes événements', securePrototype: 'Accès organisateur', noEvents: 'Aucun événement pour le moment', noEventsBody: 'Vos brouillons et événements publiés apparaîtront ici.', newEvent: 'Nouvel événement', createEventTitle: 'Créer un événement', close: 'Fermer', generalLegend: '1. Informations générales', eventName: 'Nom de l’événement', activity: 'Jeu / activité', format: 'Format', inPerson: 'Présentiel', online: 'En ligne', hybrid: 'Hybride', description: 'Description', imageUrl: 'Image de l’événement — URL (optionnel)', datePlaceLegend: '2. Date et lieu', date: 'Date', timezone: 'Fuseau horaire', startTime: 'Heure de début', endTime: 'Heure de fin', city: 'Ville', region: 'Province / région', venue: 'Lieu / adresse', participationLegend: '3. Participation', fee: 'Prix d’inscription', currency: 'Devise', capacity: 'Nombre maximum de joueurs', deadline: 'Date limite d’inscription', minimumAge: 'Âge minimum', skillLevel: 'Niveau recommandé', allLevels: 'Tous niveaux', beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', causeLegend: '4. Cause soutenue', causeName: 'Nom de la cause', causeDescription: 'Description de la cause', causeGoalAmount: 'Objectif de financement', causeGoalCurrency: 'Devise de l’objectif', pfgRule: 'Règle Jouer Pour de Bon', pfgRuleBody: 'La moitié (50 %) de chaque frais d’inscription confirmé va à cette cause. L’autre moitié (50 %) va aux joueurs gagnants. Les contributions sont calculées automatiquement; l’organisateur ne peut pas modifier cette répartition.', contactLegend: '5. Organisation et contact', contactLink: 'Lien de contact ou réseau social', organizer: 'Organisateur', organizerBody: 'L’identité de l’organisateur est déterminée automatiquement à partir du compte Wix connecté.', publicationLegend: '6. Publication', visibility: 'Visibilité', public: 'Public', unlisted: 'Non répertorié', initialStatus: 'Statut initial', draft: 'Brouillon', openRegistration: 'Ouvert aux inscriptions', preview: 'Aperçu', eventPreview: 'Votre événement', saveDraft: 'Enregistrer comme brouillon', publish: 'Publier l’événement', previewEmpty: 'Remplissez le nom, la ville et la date pour voir un résumé ici.', saving: 'Enregistrement du brouillon…', saved: 'Brouillon enregistré.', loadError: 'Impossible de charger vos événements.', saveError: 'Impossible d’enregistrer le brouillon.', wixOnly: 'Ouvrez cette page depuis votre espace organisateur sur Jouer Pour de Bon pour enregistrer un brouillon.', draftBadge: 'Brouillon', publishedBadge: 'Publié', participationMode: 'Mode de participation', participationNone: 'Information seulement', participationRsvp: 'RSVP simple', participationRegistration: 'Inscription', participationCompetition: 'Compétition', noCompetition: 'Aucune compétition liée', competitionLinked: 'Compétition liée'
  },
  en: {
    brand: 'Playing For Good', heroTitle: 'Organizer space', heroIntro: 'Create and manage your events. Drafts stay private until they are published.', createEvent: '+ Create an event', dashboard: 'Dashboard', myEvents: 'My events', securePrototype: 'Organizer access', noEvents: 'No events yet', noEventsBody: 'Your drafts and published events will appear here.', newEvent: 'New event', createEventTitle: 'Create an event', close: 'Close', generalLegend: '1. General information', eventName: 'Event name', activity: 'Game / activity', format: 'Format', inPerson: 'In person', online: 'Online', hybrid: 'Hybrid', description: 'Description', imageUrl: 'Event image — URL (optional)', datePlaceLegend: '2. Date and location', date: 'Date', timezone: 'Time zone', startTime: 'Start time', endTime: 'End time', city: 'City', region: 'Province / region', venue: 'Venue / address', participationLegend: '3. Participation', fee: 'Registration fee', currency: 'Currency', capacity: 'Maximum players', deadline: 'Registration deadline', minimumAge: 'Minimum age', skillLevel: 'Recommended level', allLevels: 'All levels', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', causeLegend: '4. Supported cause', causeName: 'Cause name', causeDescription: 'Cause description', causeGoalAmount: 'Fundraising goal', causeGoalCurrency: 'Goal currency', pfgRule: 'Playing For Good rule', pfgRuleBody: 'Half (50%) of every confirmed registration fee goes to this cause. The other half (50%) goes to the winning players. Cause contributions are calculated automatically; organizers cannot change this split.', contactLegend: '5. Organization and contact', contactLink: 'Contact or social link', organizer: 'Organizer', organizerBody: 'The organizer identity is determined automatically from the logged-in Wix account.', publicationLegend: '6. Publication', visibility: 'Visibility', public: 'Public', unlisted: 'Unlisted', initialStatus: 'Initial status', draft: 'Draft', openRegistration: 'Open for registration', preview: 'Preview', eventPreview: 'Your event', saveDraft: 'Save as draft', publish: 'Publish event', previewEmpty: 'Fill in the name, city, and date to see a summary here.', saving: 'Saving draft…', saved: 'Draft saved.', loadError: 'Unable to load your events.', saveError: 'Unable to save the draft.', wixOnly: 'Open this page from your Playing For Good organizer space to save a draft.', draftBadge: 'Draft', publishedBadge: 'Published', participationMode: 'Participation mode', participationNone: 'Information only', participationRsvp: 'Simple RSVP', participationRegistration: 'Registration', participationCompetition: 'Competition', noCompetition: 'No competition linked', competitionLinked: 'Competition linked'
  }
};

Object.assign(copy.fr, {
  feeHint: 'Le prix doit pouvoir être partagé exactement en deux au cent près.',
  causeDescriptionFr: 'Description de la cause — français',
  causeDescriptionEn: 'Description de la cause — anglais',
  approvalTitle: 'Approbation de la cause requise',
  approvalBody: 'Cette proposition sera mise en attente. Un administrateur vérifiera la cause et la reliera à une cause existante en cas de doublon avant son affichage public.',
  validationTitle: 'Veuillez corriger les champs indiqués.',
  causeNameError: 'Le nom de la cause doit contenir au moins 3 caractères.',
  causeDescriptionError: 'Ajoutez une description française ou anglaise d’au moins 20 caractères.',
  amountError: 'Saisissez un montant positif avec au plus deux décimales.',
  feeError: 'Le prix doit être positif et divisible également entre la cause et les gagnants, au cent près.',
  currencyError: 'Choisissez une devise prise en charge.',
  currencyMismatchError: 'La devise de l’événement doit correspondre à celle de la cause tant que le backend ne gère pas les taux de change.',
  endTimeError: 'L’heure de fin doit suivre l’heure de début.',
  deadlineError: 'La date limite d’inscription doit précéder le début de l’événement.',
  causePendingSaved: 'Événement enregistré. La cause est en attente d’approbation administrative et ne sera pas publique avant son approbation.',
  causeNotConfirmed: 'Le backend a répondu sans confirmer l’enregistrement de la proposition de cause. Le formulaire a été conservé; aucune réussite complète n’est déclarée.'
});

Object.assign(copy.en, {
  feeHint: 'The fee must split exactly in half to the nearest cent.',
  causeDescriptionFr: 'Cause description — French',
  causeDescriptionEn: 'Cause description — English',
  approvalTitle: 'Cause approval required',
  approvalBody: 'This proposal will be placed in review. An administrator will verify it and link duplicates to an existing cause before it appears publicly.',
  validationTitle: 'Please correct the indicated fields.',
  causeNameError: 'The cause name must contain at least 3 characters.',
  causeDescriptionError: 'Add a French or English description of at least 20 characters.',
  amountError: 'Enter a positive amount with no more than two decimal places.',
  feeError: 'The fee must be positive and split equally between the cause and winners to the nearest cent.',
  currencyError: 'Choose a supported currency.',
  currencyMismatchError: 'The event currency must match the cause currency until the backend supports exchange rates.',
  endTimeError: 'The end time must be after the start time.',
  deadlineError: 'The registration deadline must be before the event starts.',
  causePendingSaved: 'Event saved. The cause is pending administrator approval and will not be public until approved.',
  causeNotConfirmed: 'The backend responded without confirming that the cause proposal was saved. The form was preserved; full success is not being reported.'
});

const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
let language = requestedLanguage === 'en' || requestedLanguage === 'fr'
  ? requestedLanguage
  : (readStoredLanguage() === 'en' ? 'en' : 'fr');
let organizerEvents = [];
let pendingSave = null;
let eventsList = null;
let wixAuth = {
  received: false,
  loggedIn: false,
  isOrganisateur: false,
  memberId: '',
  roles: []
};

installParticipationModeField();
installEventsList();
initBridge();
setLanguage(language);
setOrganizerControlsEnabled(false);

function installParticipationModeField() {
  if (!eventForm || eventForm.elements.participationMode) return;
  const participationFieldset = [...eventForm.querySelectorAll('fieldset')][2];
  const grid = participationFieldset?.querySelector('.form-grid');
  if (!grid) return;

  const label = document.createElement('label');
  label.innerHTML = `
    <span data-i18n="participationMode">Mode de participation</span>
    <select name="participationMode">
      <option value="none" data-i18n="participationNone">Information seulement</option>
      <option value="rsvp" data-i18n="participationRsvp">RSVP simple</option>
      <option value="registration" data-i18n="participationRegistration" selected>Inscription</option>
      <option value="competition" data-i18n="participationCompetition">Compétition</option>
    </select>`;
  grid.prepend(label);
}

function installEventsList() {
  eventsList = document.createElement('div');
  eventsList.id = 'eventsList';
  eventsList.className = 'events-list';
  eventsList.hidden = true;
  emptyState?.insertAdjacentElement('afterend', eventsList);
}

function setOrganizerControlsEnabled(enabled) {
  if (createEventBtn) createEventBtn.disabled = !enabled;
  if (saveDraftBtn) saveDraftBtn.disabled = !enabled;
  if (publishBtn) publishBtn.disabled = !enabled;
}

function readStoredLanguage() {
  try { return localStorage.getItem('jpdb-language'); } catch { return null; }
}

function setLanguage(nextLanguage, options = {}) {
  language = copy[nextLanguage] ? nextLanguage : 'fr';
  try { localStorage.setItem('jpdb-language', language); } catch {}
  const languageUrl = new URL(window.location.href);
  languageUrl.searchParams.set('lang', language);
  window.history.replaceState({}, '', languageUrl);
  document.documentElement.lang = language;

  if (options.notifyHost !== false && window.parent !== window) {
    window.parent.postMessage({ type: 'JPDB_LANGUAGE_CHANGED', language }, wixParentOrigin() || '*');
  }
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
  renderEvents();
}

function openCreatePanel() {
  if (!wixAuth.isOrganisateur) return;
  createPanel.hidden = false;
  if (emptyState) emptyState.hidden = true;
  if (eventsList) eventsList.hidden = true;
  createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreatePanel() {
  createPanel.hidden = true;
  renderEvents();
}

function getFormData() {
  return Object.fromEntries(new FormData(eventForm).entries());
}

function clearValidationErrors() {
  eventForm?.querySelectorAll('.field-invalid').forEach((field) => {
    field.classList.remove('field-invalid');
    field.removeAttribute('aria-invalid');
  });
  if (errorSummary) {
    errorSummary.hidden = true;
    errorSummary.textContent = '';
  }
}

function translatedValidationMessage(code) {
  if (code === 'causeName') return copy[language].causeNameError;
  if (code === 'causeDescription' || code === 'causeDescriptionShort') return copy[language].causeDescriptionError;
  if (code === 'feePositive' || code === 'feeEvenSplit') return copy[language].feeError;
  if (code === 'goalPositive') return copy[language].amountError;
  if (code === 'currency') return copy[language].currencyError;
  if (code === 'currencyMismatch') return copy[language].currencyMismatchError;
  if (code === 'endAfterStart') return copy[language].endTimeError;
  if (code === 'deadlineBeforeStart') return copy[language].deadlineError;
  return copy[language].validationTitle;
}

function validateForm(data) {
  clearValidationErrors();
  const nativeValid = eventForm.checkValidity();
  const result = window.JPDBCauseForm.validate(data);
  if (nativeValid && result.valid) return true;

  Object.entries(result.errors).forEach(([name]) => {
    const field = eventForm.elements.namedItem(name);
    field?.classList.add('field-invalid');
    field?.setAttribute('aria-invalid', 'true');
  });

  const firstNativeInvalid = eventForm.querySelector(':invalid');
  firstNativeInvalid?.classList.add('field-invalid');
  firstNativeInvalid?.setAttribute('aria-invalid', 'true');
  const messages = [...new Set(Object.values(result.errors).map(translatedValidationMessage))];
  if (!nativeValid && messages.length === 0) messages.push(copy[language].validationTitle);
  if (errorSummary) {
    errorSummary.hidden = false;
    errorSummary.innerHTML = `<strong>${escapeHtml(copy[language].validationTitle)}</strong>${messages.map(escapeHtml).join('<br>')}`;
    errorSummary.focus();
  }
  return false;
}

function updatePreview() {
  if (!eventForm) return;
  const data = getFormData();
  previewTitle.textContent = data.title || copy[language].eventPreview;
  const parts = [data.activityType, data.city, data.date, data.startTime, data.fee ? `${data.fee} ${data.currency || 'CAD'}` : '', data.causeName].filter(Boolean);
  previewSummary.textContent = parts.length ? parts.join(' · ') : copy[language].previewEmpty;
}

function wixParentOrigin() {
  if (window.parent === window) return '';
  try {
    const origin = new URL(document.referrer).origin;
    if (ALLOWED_WIX_ORIGINS.has(origin)) return origin;
  } catch {}
  return 'https://www.jouerpourdebon.ca';
}

function postToWix(type, extra = {}) {
  const parentOrigin = wixParentOrigin();
  if (!parentOrigin) return false;
  window.parent.postMessage({
    source: 'jpdb-organizer',
    type,
    ...extra
  }, parentOrigin);
  return true;
}

function initBridge() {
  window.addEventListener('message', receiveWixMessage);
  if (!wixParentOrigin()) return;

  postToWix(MESSAGE_TYPES.authRequest);

  setTimeout(() => {
    if (wixAuth.received) return;
    if (formMessage) {
      formMessage.textContent = language === 'fr'
        ? 'Impossible de confirmer votre accès organisateur avec Wix.'
        : 'Unable to confirm your organizer access with Wix.';
    }
  }, 7000);
}

function requestOrganizerEvents() {
  if (!wixAuth.isOrganisateur) return;
  postToWix(MESSAGE_TYPES.requestEvents);
}

function receiveWixMessage(event) {
  if (event.source !== window.parent || !ALLOWED_WIX_ORIGINS.has(event.origin)) return;
  const message = event.data;

  if (message?.type === 'JPDB_LANGUAGE' && (message.language === 'fr' || message.language === 'en')) {
    setLanguage(message.language, { notifyHost: false });
    return;
  }

  if (!message || message.source !== 'jpdb-wix') return;

  if (message.type === MESSAGE_TYPES.auth) {
    const roles = Array.isArray(message.roles)
      ? message.roles.map((role) => String(role || '').trim()).filter(Boolean)
      : [];
    const normalized = roles.map((role) => role.toLocaleLowerCase('fr-CA'));
    const roleSaysOrganizer = normalized.includes('organisateur') || normalized.includes('admin');

    wixAuth = {
      received: true,
      loggedIn: message.loggedIn === true,
      isOrganisateur: message.isOrganisateur === true && roleSaysOrganizer,
      memberId: String(message.memberId || ''),
      roles
    };

    setOrganizerControlsEnabled(wixAuth.isOrganisateur);

    if (!wixAuth.loggedIn) {
      if (formMessage) formMessage.textContent = language === 'fr'
        ? 'Connectez-vous à Wix pour accéder à l’espace organisateur.'
        : 'Log in to Wix to access the organizer space.';
      return;
    }

    if (!wixAuth.isOrganisateur) {
      const detected = roles.length ? roles.join(', ') : (language === 'fr' ? 'aucun rôle détecté' : 'no role detected');
      if (formMessage) formMessage.textContent = language === 'fr'
        ? `Accès organisateur requis. Rôles Wix détectés : ${detected}`
        : `Organizer access required. Wix roles detected: ${detected}`;
      return;
    }

    if (formMessage) formMessage.textContent = language === 'fr'
      ? `Accès organisateur confirmé (${roles.join(', ')}).`
      : `Organizer access confirmed (${roles.join(', ')}).`;

    postToWix(MESSAGE_TYPES.ready);
    requestOrganizerEvents();
    return;
  }

  if (message.type === MESSAGE_TYPES.events) {
    organizerEvents = Array.isArray(message.payload?.events) ? message.payload.events : [];
    renderEvents();
    return;
  }

  if (message.type === MESSAGE_TYPES.draftSaved) {
    if (pendingSave && message.requestId !== pendingSave.id) return;
    if (!window.JPDBCauseForm.hasConfirmedCauseSubmission(message.payload)) {
      clearPendingSave();
      if (formMessage) formMessage.textContent = copy[language].causeNotConfirmed;
      return;
    }
    const saveMode = pendingSave?.mode || 'draft';
    clearPendingSave();
    if (message.payload?.event) {
      organizerEvents = [message.payload.event, ...organizerEvents.filter((eventItem) => eventItem.id !== message.payload.event.id)];
    }
    if (formMessage) formMessage.textContent = message.payload.causeSubmission.status === 'pending'
      ? copy[language].causePendingSaved
      : (saveMode === 'published'
        ? (language === 'fr' ? 'Événement publié.' : 'Event published.')
        : copy[language].saved);
    eventForm?.reset();
    updatePreview();
    createPanel.hidden = true;
    renderEvents();
    return;
  }

  if (message.type === MESSAGE_TYPES.error) {
    if (pendingSave && message.requestId && message.requestId !== pendingSave.id) return;
    clearPendingSave();
    if (formMessage) formMessage.textContent = message.message || copy[language].saveError;
  }
}

function renderEvents() {
  if (!eventsList || !emptyState || !createPanel?.hidden) return;
  const hasEvents = organizerEvents.length > 0;
  emptyState.hidden = hasEvents;
  eventsList.hidden = !hasEvents;
  if (!hasEvents) return;

  eventsList.innerHTML = '';
  organizerEvents.forEach((eventItem) => {
    const card = document.createElement('article');
    card.className = 'event-card';

    const start = formatEventDate(eventItem.startAt);
    const game = Array.isArray(eventItem.games) ? eventItem.games[0] : '';
    const badge = eventItem.visibility === 'published' ? copy[language].publishedBadge : copy[language].draftBadge;
    const competitionLabel = eventItem.competitionId ? copy[language].competitionLinked : copy[language].noCompetition;

    card.innerHTML = `
      <div class="event-card__top">
        <div>
          <p class="eyebrow">${escapeHtml(game || copy[language].brand)}</p>
          <h3>${escapeHtml(eventItem.title || '')}</h3>
        </div>
        <span class="event-badge">${escapeHtml(badge)}</span>
      </div>
      <p class="event-card__meta">${escapeHtml([start, eventItem.city, eventItem.venue].filter(Boolean).join(' · '))}</p>
      <div class="event-card__footer">
        <span>${escapeHtml(participationLabel(eventItem.participationMode))}</span>
        <span>${escapeHtml(competitionLabel)}</span>
      </div>`;
    eventsList.appendChild(card);
  });
}

function participationLabel(mode) {
  const key = {
    none: 'participationNone',
    rsvp: 'participationRsvp',
    registration: 'participationRegistration',
    competition: 'participationCompetition'
  }[mode] || 'participationRegistration';
  return copy[language][key];
}

function formatEventDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function handleSave(mode = 'draft') {
  if (!wixAuth.isOrganisateur) {
    if (formMessage) formMessage.textContent = language === 'fr'
      ? 'Accès organisateur requis.'
      : 'Organizer access required.';
    return;
  }
  const rawPayload = getFormData();
  if (!validateForm(rawPayload)) return;
  if (!wixParentOrigin()) {
    if (formMessage) formMessage.textContent = copy[language].wixOnly;
    return;
  }
  if (pendingSave) return;

  const requestId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const causeSubmission = window.JPDBCauseForm.buildCauseSubmission(rawPayload, language);
  const payload = {
    ...rawPayload,
    ...causeSubmission,
    causeSubmission,
    submissionLocale: language
  };
  if (mode === 'published') {
    payload.visibility = 'published';
    payload.status = payload.status === 'open_for_registration' ? 'open_for_registration' : 'scheduled';
  } else {
    payload.status = 'draft';
    payload.visibility = 'draft';
  }

  if (saveDraftBtn) saveDraftBtn.disabled = true;
  if (publishBtn) publishBtn.disabled = true;
  if (formMessage) formMessage.textContent = mode === 'published'
    ? (language === 'fr' ? 'Publication de l’événement…' : 'Publishing event…')
    : copy[language].saving;

  const timer = setTimeout(() => {
    if (!pendingSave || pendingSave.id !== requestId) return;
    clearPendingSave();
    if (formMessage) formMessage.textContent = mode === 'published'
      ? (language === 'fr' ? 'Impossible de publier l’événement.' : 'Unable to publish the event.')
      : copy[language].saveError;
  }, 25000);

  pendingSave = { id: requestId, timer, mode };
  postToWix(MESSAGE_TYPES.saveDraft, { requestId, payload });
}

function handleDraft() {
  handleSave('draft');
}

function clearPendingSave() {
  if (pendingSave?.timer) clearTimeout(pendingSave.timer);
  pendingSave = null;
  if (saveDraftBtn) saveDraftBtn.disabled = !wixAuth.isOrganisateur;
  if (publishBtn) publishBtn.disabled = !wixAuth.isOrganisateur;
}

function handleSubmit(event) {
  event.preventDefault();
  handleSave('published');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

createEventBtn?.addEventListener('click', openCreatePanel);
closeCreateBtn?.addEventListener('click', closeCreatePanel);
saveDraftBtn?.addEventListener('click', handleDraft);
eventForm?.addEventListener('submit', handleSubmit);
eventForm?.addEventListener('input', updatePreview);
eventForm?.addEventListener('change', updatePreview);
langFrBtn?.addEventListener('click', () => setLanguage('fr'));
langEnBtn?.addEventListener('click', () => setLanguage('en'));
