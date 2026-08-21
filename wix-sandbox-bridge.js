// Wix HTML components can be hosted inside a Wix sandbox whose immediate
// window.parent origin is not the public site domain. Keep authorization in Wix
// and the backend, but make the iframe transport work across that sandbox.
(function installWixSandboxBridge() {
  if (window.parent === window) return;

  // Creating/filling the form is harmless UI. Keep that available even when the
  // Wix role handshake is delayed or fails. Saving/publishing remains protected
  // by Wix page code + authenticated backend web methods.
  if (createEventBtn) createEventBtn.disabled = false;
  createEventBtn?.addEventListener('click', () => {
    if (!createPanel) return;
    createPanel.hidden = false;
    if (emptyState) emptyState.hidden = true;
    if (eventsList) eventsList.hidden = true;
    createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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
    if (createEventBtn) createEventBtn.disabled = false;
    if (saveDraftBtn) saveDraftBtn.disabled = !wixAuth.isOrganisateur;
    if (publishBtn) publishBtn.disabled = !wixAuth.isOrganisateur;

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
    if (message.type !== MESSAGE_TYPES.auth) return;
    applyAuthMessage(message);
  });

  // The first request in app.js may have been blocked by a sandbox-origin
  // mismatch. Repeat it using the transport appropriate for Wix HTML embeds.
  postToWix(MESSAGE_TYPES.authRequest);
})();
