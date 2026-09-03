// Keep the organizer form usable even if Wix role/auth transport is delayed.
// Security remains enforced by Wix/backend web methods when loading or saving data.
(function keepOrganizerDraftFormUsable() {
  const createButton = document.querySelector('#createEventBtn');
  const panel = document.querySelector('#createPanel');
  const emptyState = document.querySelector('#emptyState');
  const eventsList = document.querySelector('#eventsList');
  const message = document.querySelector('#formMessage');

  if (!createButton || !panel) return;

  createButton.disabled = false;

  createButton.addEventListener('click', () => {
    panel.hidden = false;
    if (emptyState) emptyState.hidden = true;
    if (eventsList) eventsList.hidden = true;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (message && typeof wixAuth !== 'undefined' && !wixAuth?.isOrganisateur) {
      message.textContent = language === 'fr'
        ? 'Vous pouvez préparer l’événement. Wix doit encore confirmer votre accès organisateur avant l’enregistrement.'
        : 'You can prepare the event. Wix still needs to confirm organizer access before saving.';
    }
  }, true);
})();
