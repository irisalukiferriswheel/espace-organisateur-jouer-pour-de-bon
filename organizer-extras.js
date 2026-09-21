/* Organizer sharing and invitations. Identity and access are enforced by Wix/API. */
window.OrganizerExtras = (() => {
  const TYPES = {
    search: 'JPDB_ORGANIZER_SEARCH_PLAYERS', players: 'JPDB_ORGANIZER_PLAYERS',
    send: 'JPDB_ORGANIZER_SEND_INVITATIONS', sent: 'JPDB_ORGANIZER_INVITATIONS_SENT',
    list: 'JPDB_ORGANIZER_REQUEST_INVITATIONS', invitations: 'JPDB_ORGANIZER_INVITATIONS'
  };
  const pending = new Map();
  let context, panel, currentEvent, currentShare, searchResults = [], invitations = [], nextCursor = null;
  let selected = new Map();
  let sending = false, loading = false, generation = 0, requestSequence = 0, lastQuery = '';
  const t = (fr, en) => context.language() === 'fr' ? fr : en;
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, className = 'secondary') {
    const node = el('button', text, className); node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function registrationUrl(event) {
    if (event?.visibility !== 'published' || !event?.competitionId || !event?.registrationUrl) return '';
    try {
      const url = new URL(event.registrationUrl);
      if (url.origin !== 'https://www.jouerpourdebon.ca' || url.pathname !== '/competitions'
        || url.username || url.password || url.searchParams.get('jpdbEvent') !== event.id) return '';
      // The share URL carries only the stable event ID, never a private invite or session token.
      if ([...url.searchParams.keys()].some(key => key !== 'jpdbEvent') || url.hash) return '';
      return url.href;
    } catch { return ''; }
  }
  function init(options) {
    context = options;
    panel = el('section', '', 'organizer-extra-panel'); panel.id = 'organizerExtras'; panel.hidden = true;
    context.anchor.insertAdjacentElement('afterend', panel);
  }
  function status(text) { const node = panel.querySelector('[role=status]'); if (node) node.textContent = text; }
  function request(type, payload, replyType) {
    const requestId = `organizer-extra-${Date.now()}-${++requestSequence}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(t('Le service ne répond pas. Réessayez.', 'The service is not responding. Try again.'))); }, 20000);
      pending.set(requestId, { resolve, reject, replyType, timer });
      if (!context.post(type, { requestId, payload })) {
        clearTimeout(timer); pending.delete(requestId); reject(new Error(t('Ouvrez votre espace depuis Wix.', 'Open your organizer space from Wix.')));
      }
    });
  }
  function receive(message) {
    const operation = pending.get(message.requestId);
    if (!operation || ![operation.replyType, 'JPDB_ORGANIZER_ERROR'].includes(message.type)) return false;
    clearTimeout(operation.timer); pending.delete(message.requestId);
    if (message.type === 'JPDB_ORGANIZER_ERROR' || message.success === false) operation.reject(new Error(message.message || t('Opération impossible. Réessayez.', 'Unable to complete the request. Try again.')));
    else operation.resolve(message.payload || {});
    return true;
  }
  function close() { if (sending) return; generation++; panel.hidden = true; currentEvent = null; currentShare = null; }
  function heading(title) {
    panel.replaceChildren(); panel.hidden = false;
    const row = el('div', '', 'form-heading'); const h = el('h3', title); h.tabIndex = -1;
    const closeButton = button(t('Fermer', 'Close'), close, 'text-button'); closeButton.disabled = sending;
    row.append(h, closeButton); panel.append(row);
    const message = el('p', '', 'form-message'); message.setAttribute('role', 'status'); panel.append(message);
    return h;
  }
  function showShare(event) {
    if (sending) return;
    generation++; currentEvent = null; currentShare = event;
    const h = heading(t('Partager votre événement', 'Share your event'));
    panel.append(el('p', event.title));
    const url = registrationUrl(event);
    if (!url) { status(t('Publication enregistrée. Le lien d’inscription n’est pas encore disponible.', 'Publication saved. The registration link is not yet available.')); return; }
    panel.append(el('p', t('Scannez ce code pour ouvrir l’événement et suivre les étapes d’inscription et de paiement. Les conditions d’accès de l’événement restent applicables.', 'Scan to open the event and follow the registration and payment steps. The event’s access requirements still apply.')));
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    const svg = qr.createSvgTag({ cellSize: 6, margin: 24 });
    const image = el('img', '', 'event-qr'); image.alt = t('Code QR du lien d’inscription', 'Registration link QR code');
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    panel.append(image);
    const field = el('input'); field.readOnly = true; field.value = url; field.setAttribute('aria-label', t('Lien d’inscription', 'Registration link')); panel.append(field);
    const actions = el('div', '', 'event-card__actions');
    actions.append(button(t('Copier le lien', 'Copy link'), async () => {
      try { await navigator.clipboard.writeText(url); status(t('Lien copié.', 'Link copied.')); }
      catch { field.focus(); field.select(); status(t('Sélectionnez et copiez le lien ci-dessus.', 'Select and copy the link above.')); }
    }));
    const download = el('a', t('Télécharger le QR', 'Download QR'), 'secondary'); download.href = image.src; download.download = `event-${event.id}.svg`; actions.append(download);
    const open = el('a', t('Ouvrir le lien', 'Open link'), 'secondary'); open.href = url; open.target = '_blank'; open.rel = 'noopener noreferrer'; actions.append(open);
    panel.append(actions); h.focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function inviteStatus(value) {
    const labels = { created: ['En attente', 'Pending'], sent: ['Envoyée', 'Sent'], accepted: ['Acceptée', 'Accepted'], declined: ['Refusée', 'Declined'], revoked: ['Annulée', 'Revoked'] };
    return labels[value] ? t(...labels[value]) : t('En attente', 'Pending');
  }
  function renderInvitations() {
    const list = panel.querySelector('#sentInvitations'); if (!list) return;
    list.replaceChildren();
    if (!invitations.length) { list.append(el('p', t('Aucune invitation envoyée.', 'No invitations sent.'))); return; }
    for (const invite of invitations) {
      const row = el('li'); row.append(el('span', invite.alias || invite.playerAlias || t('Joueur invité', 'Invited player')), el('span', inviteStatus(invite.status), 'event-badge')); list.append(row);
    }
  }
  function renderPlayers() {
    const list = panel.querySelector('#invitePlayerResults'); if (!list) return;
    list.replaceChildren();
    if (!searchResults.length && !loading) list.append(el('p', t('Aucun joueur trouvé.', 'No players found.')));
    for (const player of searchResults) {
      const label = el('label', '', 'invite-player');
      const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.value = player.id;
      const existing = invitations.find(invite => invite.playerId === player.id);
      checkbox.checked = selected.has(player.id); checkbox.disabled = sending || Boolean(existing);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selected.size >= 50) { checkbox.checked = false; status(t('Sélectionnez au maximum 50 joueurs par envoi.', 'Select up to 50 players per batch.')); return; }
        if (checkbox.checked) selected.set(player.id, player); else selected.delete(player.id);
        updateSelection();
      });
      const details = el('span'); details.append(el('strong', player.alias || t('Joueur', 'Player')), el('small', player.city || ''));
      label.append(checkbox, details); if (existing) label.append(el('span', inviteStatus(existing.status), 'event-badge')); list.append(label);
    }
    const more = panel.querySelector('#inviteMore'); more.hidden = !nextCursor; more.disabled = loading || sending;
    updateSelection();
  }
  function updateSelection() {
    const summary = panel.querySelector('#inviteSelection'); if (!summary) return;
    summary.replaceChildren();
    for (const [id, player] of selected) {
      const remove = button(`${player.alias} ×`, () => { selected.delete(id); renderPlayers(); }, 'text-button');
      remove.setAttribute('aria-label', t(`Retirer ${player.alias}`, `Remove ${player.alias}`)); remove.disabled = sending; summary.append(remove);
    }
    const send = panel.querySelector('#sendInvitations'); send.disabled = sending || loading || !selected.size;
    send.textContent = sending ? t('Envoi…', 'Sending…') : t(`Inviter ${selected.size} joueur(s)`, `Invite ${selected.size} player(s)`);
  }
  async function loadInvitations(version) {
    const data = await request(TYPES.list, { eventId: currentEvent.id }, TYPES.invitations);
    if (version !== generation) return;
    invitations = Array.isArray(data.invitations) ? data.invitations : [];
    for (const invite of invitations) selected.delete(invite.playerId);
    renderInvitations(); renderPlayers();
  }
  async function search(more = false) {
    if (loading || sending || !currentEvent) return;
    const query = panel.querySelector('#inviteQuery').value.trim();
    if (query.length < 2) { status(t('Entrez au moins deux caractères du nom public.', 'Enter at least two characters of the public name.')); return; }
    loading = true; const version = generation;
    const cursor = more && query === lastQuery ? nextCursor : null; lastQuery = query;
    status(t('Recherche…', 'Searching…')); updateSelection();
    try {
      const data = await request(TYPES.search, { eventId: currentEvent.id, query, cursor }, TYPES.players);
      if (version !== generation) return;
      const players = Array.isArray(data.players) ? data.players.filter(player => player?.id) : [];
      searchResults = cursor ? [...new Map([...searchResults, ...players].map(player => [player.id, player])).values()] : players;
      nextCursor = data.nextCursor || null; status('');
    } catch (error) { if (version === generation) status(error.message); }
    finally { if (version === generation) { loading = false; renderPlayers(); } }
  }
  async function send() {
    if (sending || loading || !selected.size || !currentEvent) return;
    sending = true; const version = generation;
    panel.querySelectorAll('button, input').forEach(node => { node.disabled = true; }); updateSelection();
    try {
      const data = await request(TYPES.send, { eventId: currentEvent.id, playerIds: [...selected.keys()] }, TYPES.sent);
      if (version !== generation) return;
      if (!Array.isArray(data.invitations) && !Number.isInteger(data.sentCount)) throw new Error(t('L’envoi n’a pas été confirmé. Vérifiez les invitations avant de réessayer.', 'Sending was not confirmed. Check the invitations before retrying.'));
      selected.clear();
      if (Array.isArray(data.invitations)) { invitations = data.invitations; renderInvitations(); }
      status(t('Invitations envoyées. Les joueurs pourront accepter ou refuser dans leur profil privé.', 'Invitations sent. Players can accept or decline in their private profile.'));
      try { await loadInvitations(version); }
      catch { if (version === generation) status(t('Envoi confirmé. Impossible d’actualiser les statuts; fermez puis rouvrez les invitations.', 'Sending confirmed. Unable to refresh statuses; close and reopen invitations.')); }
    } catch (error) { if (version === generation) status(error.message); }
    finally { if (version === generation) { sending = false; panel.querySelectorAll('button, input').forEach(node => { node.disabled = false; }); renderPlayers(); } }
  }
  async function showInvitations(event) {
    if (sending || !context.authorized() || event.visibility !== 'published' || !event.competitionId) return;
    generation++; const version = generation; currentEvent = event; currentShare = null;
    selected = new Map(); searchResults = []; invitations = []; nextCursor = null; loading = true;
    const h = heading(t('Inviter des joueurs', 'Invite players'));
    panel.append(el('p', event.title), el('p', t('Sélectionnez des joueurs de l’annuaire. Ils accepteront ou refuseront dans leur profil privé. Une acceptation leur permettra ensuite de s’inscrire et de payer.', 'Select players from the directory. They accept or decline in their private profile. Acceptance then lets them register and pay.')));
    const form = el('form', '', 'invite-search');
    const label = el('label', t('Nom public du joueur', 'Player public name')); const input = el('input'); input.id = 'inviteQuery'; input.type = 'search'; input.maxLength = 100; label.append(input);
    const submit = button(t('Rechercher', 'Search'), () => search()); form.append(label, submit); form.addEventListener('submit', event => { event.preventDefault(); search(); }); panel.append(form);
    const results = el('div'); results.id = 'invitePlayerResults'; panel.append(results);
    const more = button(t('Afficher plus', 'Show more'), () => search(true)); more.id = 'inviteMore'; more.hidden = true; panel.append(more);
    const selection = el('div', '', 'invite-selection'); selection.id = 'inviteSelection'; panel.append(selection);
    const sendButton = button('', send, 'primary'); sendButton.id = 'sendInvitations'; panel.append(sendButton);
    panel.append(el('h4', t('Invitations envoyées', 'Sent invitations'))); const sent = el('ul', '', 'sent-invitations'); sent.id = 'sentInvitations'; panel.append(sent);
    updateSelection(); status(t('Chargement des invitations…', 'Loading invitations…')); h.focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { await loadInvitations(version); if (version === generation) status(''); }
    catch (error) { if (version === generation) status(error.message); }
    finally { if (version === generation) { loading = false; updateSelection(); } }
  }
  function appendActions(card, event) {
    if (event.visibility !== 'published' || !event.competitionId) return;
    const row = el('div', '', 'event-card__actions');
    if (registrationUrl(event)) row.append(button(t('Lien et QR', 'Link and QR'), () => showShare(event)));
    const invite = button(t('Inviter des joueurs', 'Invite players'), () => showInvitations(event)); invite.disabled = !context.authorized(); row.append(invite); card.append(row);
  }
  function published(event) { showShare(event); }
  return { init, receive, appendActions, published, close, registrationUrl };
})();
