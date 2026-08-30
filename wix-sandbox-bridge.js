// Wix HTML components can be hosted inside a Wix sandbox whose immediate
// window.parent origin is not the public site domain. Keep authorization in Wix
// and the backend, but make the iframe transport work across that sandbox.
(function installWixSandboxBridge() {
  if (window.parent === window) return;

  // Visible build marker: this lets us verify which organizer embed Wix is
  // actually serving, instead of guessing about cached/deployed branches.
  const buildMarker = document.createElement('div');
  buildMarker.id = 'jpdbOrganizerBuildMarker';
  buildMarker.textContent = 'Organizer UI v13';
  buildMarker.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;font:11px/1.2 sans-serif;padding:4px 6px;border-radius:4px;background:#111;color:#fff;opacity:.72;pointer-events:none';
  document.body.appendChild(buildMarker);

  // Creating/filling the form is harmless UI. Keep that available even when the
  // Wix role handshake is delayed or fails. Saving/publishing remains protected
  // by Wix page code + authenticated backend web methods.
  setOrganizerControlsEnabled = function setOrganizerControlsEnabledWithoutBlockingCreate(enabled) {
    if (createEventBtn) createEventBtn.disabled = false;
    if (saveDraftBtn) saveDraftBtn.disabled = !enabled;
    if (publishBtn) publishBtn.disabled = !enabled;
  };

  openCreatePanel = function openCreatePanelWithoutAuthGate() {
    if (!createPanel) return;
    createPanel.hidden = false;
    if (emptyState) emptyState.hidden = true;
    if (eventsList) eventsList.hidden = true;
    createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Guard against any older auth callback or cached handler toggling Create back
  // to disabled. Only mutating controls are authorization-gated.
  const keepCreateAvailable = () => {
    if (createEventBtn?.disabled) createEventBtn.disabled = false;
  };
  keepCreateAvailable();
  const createGuard = new MutationObserver(keepCreateAvailable);
  if (createEventBtn) createGuard.observe(createEventBtn, { attributes: true, attributeFilter: ['disabled'] });

  // The original app.js registered its click handler before this script loaded.
  // Add a second handler so opening the form does not depend on Wix auth state.
  createEventBtn?.addEventListener('click', openCreatePanelWithoutAuthGate);

  // Apply the UI rule immediately; later auth replies can only affect Save/Publish.
  setOrganizerControlsEnabled(wixAuth.isOrganisateur === true);

  // Override the transport only. All privileged operations are still handled by
  // Wix page code + authenticated backend web methods.
  postToWix = function postToWixAcrossSandbox(type, extra = {}) {
    window.parent.postMessage({
      source: 'jpdb-organizer',
      type,
      ...extra
    }, '*');
    return true;
  };

  function applyAuthMessage(message) {
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

    // Never block opening/filling the form because of auth state. Only actions
    // that mutate organizer data are gated.
    setOrganizerControlsEnabled(wixAuth.isOrganisateur);

    if (!wixAuth.loggedIn) {
      if (formMessage) formMessage.textContent = language === 'fr'
        ? 'Connectez-vous à Wix pour enregistrer ou publier cet événement.'
        : 'Log in to Wix to save or publish this event.';
      return;
    }

    if (!wixAuth.isOrganisateur) {
      const detected = roles.length
        ? roles.join(', ')
        : (language === 'fr' ? 'aucun rôle détecté' : 'no role detected');
      if (formMessage) formMessage.textContent = language === 'fr'
        ? `Vous pouvez préparer l’événement, mais l’enregistrement exige le rôle organisateur. Rôles Wix détectés : ${detected}`
        : `You can prepare the event, but saving requires the organizer role. Wix roles detected: ${detected}`;
      return;
    }

    if (formMessage) formMessage.textContent = language === 'fr'
      ? `Accès organisateur confirmé (${roles.join(', ')}).`
      : `Organizer access confirmed (${roles.join(', ')}).`;

    // Tell Wix the authorized embed is ready; Wix remains responsible for
    // loading/saving organizer data through authenticated web methods.
    postToWix(MESSAGE_TYPES.ready);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.source !== 'jpdb-wix') return;

    // Trust only messages from the actual Wix parent window. Add its sandbox
    // origin so the app's existing receiver can process auth, list, save, and
    // error replies instead of silently dropping non-auth responses.
    if (event.origin) ALLOWED_WIX_ORIGINS.add(event.origin);
    receiveWixMessage(event);
  });

  // The first request in app.js may have been blocked by a sandbox-origin
  // mismatch. Repeat it using the transport appropriate for Wix HTML embeds.
  postToWix(MESSAGE_TYPES.authRequest);
})();
