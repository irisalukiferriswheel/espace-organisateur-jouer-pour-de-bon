window.OrganizerCauses = (() => {
  const endpoint = 'https://jouer-pour-de-bon-api.onrender.com/v1/causes';
  let form, language, select, message, retry, legacy, causes = [], busy = false, loaded = false;
  let selectedId = '', legacyName = '', requestVersion = 0;
  const t = (fr, en) => language() === 'fr' ? fr : en;
  function init(eventForm, getLanguage) {
    form = eventForm; language = getLanguage; legacy = form.elements.cause;
    legacy.type = 'hidden'; legacy.required = false;
    select = document.createElement('select'); select.name = 'causeId'; select.id = 'organizerCause';
    legacy.insertAdjacentElement('afterend', select);
    message = document.createElement('small'); message.id = 'causeStatus'; message.setAttribute('role', 'status');
    select.setAttribute('aria-describedby', message.id); select.insertAdjacentElement('afterend', message);
    retry = document.createElement('button'); retry.type = 'button'; retry.className = 'text-button'; retry.hidden = true;
    retry.addEventListener('click', () => load()); message.insertAdjacentElement('afterend', retry);
    select.addEventListener('change', () => {
      selectedId = select.value;
      const cause = causes.find(cause => cause.id === selectedId);
      legacy.value = cause?.name || legacyName;
      describe();
    });
    render();
  }
  function describe() {
    const selected = causes.find(cause => cause.id === selectedId);
    if (busy) message.textContent = t('Chargement des causes approuvées…', 'Loading approved causes…');
    else if (selected) message.textContent = t('Cause approuvée sélectionnée.', 'Approved cause selected.');
    else if (legacyName) message.textContent = t(`Cause du brouillon : ${legacyName}. Choisissez une cause approuvée avant de publier.`, `Draft cause: ${legacyName}. Choose an approved cause before publishing.`);
    else message.textContent = t('Choisissez une cause approuvée avant de publier. Vous pouvez enregistrer un brouillon sans la choisir.', 'Choose an approved cause before publishing. You can save a draft before choosing one.');
  }
  function render() {
    select.replaceChildren();
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('Choisir une cause approuvée', 'Choose an approved cause'); select.append(empty);
    for (const cause of causes) { const option = document.createElement('option'); option.value = cause.id; option.textContent = cause.name; select.append(option); }
    select.value = causes.some(cause => cause.id === selectedId) ? selectedId : '';
    select.disabled = busy;
    retry.textContent = t('Réessayer le chargement', 'Retry loading');
    describe();
  }
  async function load() {
    if (busy) return;
    busy = true; const version = ++requestVersion; retry.hidden = true; render();
    const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(`${endpoint}?lang=${encodeURIComponent(language())}`, { headers: { Accept: 'application/json' }, signal: abort.signal });
      if (!response.ok) throw new Error('Cause service unavailable');
      const body = await response.json();
      if (!Array.isArray(body.data)) throw new Error('Invalid cause response');
      if (version !== requestVersion) return;
      // The public endpoint already returns approved causes only.
      causes = body.data.filter(cause => typeof cause?.id === 'string' && typeof cause?.name === 'string'); loaded = true;
      busy = false; render();
      if (!causes.length) message.textContent = t('Aucune cause approuvée disponible. Vous pouvez enregistrer votre brouillon.', 'No approved causes available. You can save your draft.');
    } catch {
      if (version !== requestVersion) return;
      busy = false; loaded = false; render(); retry.hidden = false;
      message.textContent = t('Impossible de charger les causes. Réessayez ou enregistrez le brouillon.', 'Unable to load causes. Retry or save the draft.');
    } finally { clearTimeout(timeout); }
  }
  function open(event = null) {
    selectedId = event?.causeId || ''; legacyName = event?.causeName || ''; legacy.value = legacyName;
    render(); if (!loaded) load();
  }
  function value() { return loaded && causes.some(cause => cause.id === select.value) ? select.value : ''; }
  function validatePublish() {
    if (busy || !value()) {
      message.textContent = t('Sélectionnez une cause approuvée pour publier cet événement.', 'Select an approved cause to publish this event.');
      select.focus(); return false;
    }
    return true;
  }
  return { init, open, value, validatePublish };
})();
