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
  let sending = false, loading = false, generation = 0, requestSequence = 0, lastQuery = '', participantTimer;
  const bindings=new Set();
  const boxed=read=>({read,toString:read,[Symbol.toPrimitive]:read});
  const t=(fr,en)=>boxed(()=>context.language()==='fr'?fr:en);
  const tx=(key,params={})=>boxed(()=>window.OrganizerCatalog.text(context.language(),key,params));
  function setText(node,value){const text=document.createTextNode(String(value));node.replaceChildren(text);if(value?.read)bindings.add({node:text,read:value.read});}
  function setAttr(node,name,value){node.setAttribute(name,String(value));if(value?.read)bindings.add({node,attribute:name,read:value.read});}
  function textNode(value){const node=document.createTextNode(String(value));if(value?.read)bindings.add({node,read:value.read});return node;}
  function translate(){for(const binding of bindings){if(!binding.node.isConnected){bindings.delete(binding);continue;}if(binding.attribute)binding.node.setAttribute(binding.attribute,binding.read());else binding.node.textContent=binding.read();}updateSelection();refreshShareLanguage();}
  function refreshShareLanguage(){if(!currentShare)return;const url=registrationUrl(currentShare);const field=panel.querySelector('input[readonly]'),image=panel.querySelector('.event-qr');if(!url||!field||!image)return;field.value=url;const qr=qrcode(0,'M');qr.addData(url);qr.make();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr.createSvgTag({cellSize:6,margin:24}));for(const a of panel.querySelectorAll('a')){if(a.download)a.href=image.src;else if(a.href.startsWith('https://www.jouerpourdebon.ca/competitions'))a.href=url;else if(a.href.startsWith('https://www.facebook.com/'))a.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url);else if(a.href.startsWith('https://wa.me/'))a.href='https://wa.me/?text='+encodeURIComponent(currentShare.title+'\n'+url);}currentShareUrl=url;}
  let currentShareUrl='';
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) setText(node,text);
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
      if ([...url.searchParams.keys()].length !== 1 || [...url.searchParams.keys()].some(key => key !== 'jpdbEvent') || url.hash) return '';
      url.searchParams.set('lang',context?.language?.()==='en'?'en':'fr');return url.href;
    } catch { return ''; }
  }
  function init(options) {
    context = options;
    panel = el('section', '', 'organizer-extra-panel'); panel.id = 'organizerExtras'; panel.hidden = true;
    context.anchor.insertAdjacentElement('afterend', panel);
  }
  function status(text) { const node = panel.querySelector('[role=status]'); if (node) setText(node,text); }
  function request(type, payload, replyType) {
    const requestId = `organizer-extra-${Date.now()}-${++requestSequence}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(tx("label_965b5a773284",{}))); }, 20000);
      pending.set(requestId, { resolve, reject, replyType, timer });
      if (!context.post(type, { requestId, payload })) {
        clearTimeout(timer); pending.delete(requestId); reject(new Error(tx("label_170b713de2e2",{})));
      }
    });
  }
  function receive(message) {
    const operation = pending.get(message.requestId);
    if (!operation || ![operation.replyType, 'JPDB_ORGANIZER_ERROR'].includes(message.type)) return false;
    clearTimeout(operation.timer); pending.delete(message.requestId);
    if (message.type === 'JPDB_ORGANIZER_ERROR' || message.success === false) operation.reject(new Error(message.message || tx("label_4c8a322090a3",{})));
    else operation.resolve(message.payload || {});
    return true;
  }
  function close() { if (sending) return; clearTimeout(participantTimer); generation++; panel.hidden = true; currentEvent = null; currentShare = null; }
  function heading(title) {
    clearTimeout(participantTimer);
    panel.replaceChildren(); panel.hidden = false;
    const row = el('div', '', 'form-heading'); const h = el('h3', title); h.tabIndex = -1;
    const closeButton = button(tx("label_711e5f2e198d",{}), close, 'text-button'); closeButton.disabled = sending;
    row.append(h, closeButton); panel.append(row);
    const message = el('p', '', 'form-message'); message.setAttribute('role', 'status'); panel.append(message);
    return h;
  }
  function showShare(event) {
    if (sending || !context.authorized() || event?.visibility !== 'published' || !event?.competitionId) return;
    generation++; currentEvent = null; currentShare = event;
    const h = heading(tx("label_71f673c1b428",{}));
    panel.append(el('p', event.title));
    const url = registrationUrl(event); currentShareUrl=url;
    if (!url) { status(tx("label_5bbe71782a59",{})); return; }
    const shareSection=el('section','','event-sharing');
    shareSection.append(el('h4',t('Partager — lien et QR','Share — link and QR')),el('p', tx("label_ddc9a700ed00",{})));
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    const svg = qr.createSvgTag({ cellSize: 6, margin: 24 });
    const image = el('img', '', 'event-qr'); setAttr(image,'alt',tx("label_52d432303296",{}));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    shareSection.append(image);
    const field = el('input'); field.readOnly = true; field.value = url; setAttr(field,'aria-label',tx("label_2c71847149c4",{})); shareSection.append(field);
    const actions = el('div', '', 'event-card__actions');
    actions.append(button(tx("label_b17133f7ab04",{}), async () => {
      try { await navigator.clipboard.writeText(currentShareUrl); status(tx("label_f83520bd98f6",{})); }
      catch { field.focus(); field.select(); status(tx("label_6781994c41f3",{})); }
    }));
    const download = el('a', tx("label_e63708d57182",{}), 'secondary'); download.href = image.src; download.download = `event-${event.id}.svg`; actions.append(download);
    const open = el('a', tx("label_b9be9b40262a",{}), 'secondary'); open.href = url; open.target = '_blank'; open.rel = 'noopener noreferrer'; actions.append(open);
    if(navigator.share) actions.append(button(tx("label_fdd8bf47ddbe",{}),async()=>{
      try{await navigator.share({title:event.title,text:String(tx("label_e470bcf16028",{})),url:currentShareUrl});}
      catch(error){if(error.name!=='AbortError')status(tx("label_c29b6531c0bb",{}));}
    }));
    for(const [name,href] of [['Facebook',`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],['WhatsApp',`https://wa.me/?text=${encodeURIComponent(`${event.title}\n${url}`)}`]]) {
      const social=el('a',name,'secondary');social.href=href;social.target='_blank';social.rel='noopener noreferrer';actions.append(social);
    }
    shareSection.append(actions);
    panel.append(button(tx("label_22b99acbce36",{}), () => showInvitations(event)));
    panel.append(el('h4', tx("label_a41e32747f07",{})));
    mountParticipants(event);
    mountTournament(event);
    panel.append(shareSection);
    h.focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function inviteStatus(value) {
    const labels = { created: ['En attente', 'Pending'], sent: ['Envoyée', 'Sent'], accepted: ['Acceptée', 'Accepted'], declined: ['Refusée', 'Declined'], revoked: ['Annulée', 'Revoked'], expired: ['Expirée', 'Expired'] };
    return labels[value] ? t(...labels[value]) : tx("label_2f6c8477e92b",{});
  }
  function renderInvitations() {
    const list = panel.querySelector('#sentInvitations'); if (!list) return;
    list.replaceChildren();
    if (!invitations.length) { list.append(el('p', tx("label_88f8a035ec5c",{}))); return; }
    for (const invite of invitations) {
      const row = el('li'); row.append(el('span', invite.alias || invite.playerAlias || searchResults.find(player => player.id === invite.playerId)?.alias || tx("label_0c0c8a28b7e9",{})), el('span', inviteStatus(invite.status), 'event-badge')); list.append(row);
    }
  }
  function renderPlayers() {
    const list = panel.querySelector('#invitePlayerResults'); if (!list) return;
    list.replaceChildren();
    if (!searchResults.length && !loading) list.append(el('p', tx("label_e440317ef1a6",{})));
    for (const player of searchResults) {
      const label = el('label', '', 'invite-player');
      const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.value = player.id;
      const existing = invitations.find(invite => invite.playerId === player.id);
      checkbox.checked = selected.has(player.id); checkbox.disabled = sending || Boolean(existing);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selected.size >= 50) { checkbox.checked = false; status(tx("label_7c0623957564",{})); return; }
        if (checkbox.checked) selected.set(player.id, player); else selected.delete(player.id);
        updateSelection();
      });
      const details = el('span'); details.append(el('strong', player.alias || tx("label_b80431a4642a",{})));
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
      setAttr(remove,'aria-label',tx("label_c706a1d7bbe3",{p0:(player.alias)})); remove.disabled = sending; summary.append(remove);
    }
    const send = panel.querySelector('#sendInvitations'); send.disabled = sending || loading || !selected.size;
    setText(send,sending ? tx("label_1ccef8a10ca7",{}) : tx("label_741148b133fc",{p0:(selected.size)}));
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
    if (query.length < 2) { status(tx("label_dba94100d064",{})); return; }
    loading = true; const version = generation;
    const cursor = more && query === lastQuery ? nextCursor : null; lastQuery = query;
    status(tx("label_d074331c5d34",{})); updateSelection();
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
      if (!Array.isArray(data.invitations) && !Number.isInteger(data.sentCount)) throw new Error(tx("label_a95872104254",{}));
      selected.clear();
      if (Array.isArray(data.invitations)) { invitations = data.invitations; renderInvitations(); }
      status(tx("label_67ffee32cb1b",{}));
      try { await loadInvitations(version); }
      catch { if (version === generation) status(tx("label_9f0b444809dc",{})); }
    } catch (error) { if (version === generation) status(error.message); }
    finally { if (version === generation) { sending = false; panel.querySelectorAll('button, input').forEach(node => { node.disabled = false; }); renderPlayers(); } }
  }
  async function showInvitations(event) {
    if (sending || !context.authorized() || event.visibility !== 'published' || !event.competitionId) return;
    generation++; const version = generation; currentEvent = event; currentShare = null;
    selected = new Map(); searchResults = []; invitations = []; nextCursor = null; loading = true;
    const h = heading(tx("label_22b99acbce36",{}));
    panel.append(button(tx("label_75ba8a962223",{}), () => showShare(event)));
    panel.append(el('p', event.title), el('p', tx("label_64863a210fae",{})));
    const form = el('form', '', 'invite-search');
    const label = el('label', tx("label_99a0bad8dfb3",{})); const input = el('input'); input.id = 'inviteQuery'; input.type = 'search'; input.maxLength = 100; label.append(input);
    const submit = button(tx("label_733d1c742675",{}), () => search()); form.append(label, submit); form.addEventListener('submit', event => { event.preventDefault(); search(); }); panel.append(form);
    const results = el('div'); results.id = 'invitePlayerResults'; panel.append(results);
    const more = button(tx("label_e65e777e28e9",{}), () => search(true)); more.id = 'inviteMore'; more.hidden = true; panel.append(more);
    const selection = el('div', '', 'invite-selection'); selection.id = 'inviteSelection'; panel.append(selection);
    const sendButton = button('', send, 'primary'); sendButton.id = 'sendInvitations'; panel.append(sendButton);
    panel.append(el('h4', tx("label_b334d4641438",{}))); const sent = el('ul', '', 'sent-invitations'); sent.id = 'sentInvitations'; panel.append(sent);
    updateSelection(); status(tx("label_d6e80fd7d3f7",{})); h.focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    try { await loadInvitations(version); if (version === generation) status(''); }
    catch (error) { if (version === generation) status(error.message); }
    finally { if (version === generation) { loading = false; updateSelection(); } }
  }
  function appendActions(card, event) {
    if (event.visibility !== 'published' || !event.competitionId) return;
    const row = el('div', '', 'event-card__actions');
    if (registrationUrl(event)) row.append(button(tx("label_6c3dbf45f8e2",{}), () => showShare(event)));
    row.append(button(tx("label_a41e32747f07",{}),()=>showParticipants(event)));
    const tournament=button(t('Tournoi et tableau','Tournament and bracket'),()=>showParticipants(event));tournament.disabled=!context.authorized();row.append(tournament);
    const invite = button(tx("label_22b99acbce36",{}), () => showInvitations(event)); invite.disabled = !context.authorized(); row.append(invite); card.append(row);
  }
  function published(event) { showShare(event); }
  async function showParticipants(event) {
    if(sending||!context.authorized()||event?.visibility!=='published'||!event?.competitionId)return;
    ++generation;currentEvent=null;currentShare=null;
    const h=heading(tx("label_a41e32747f07",{}));panel.append(el('p',event.title));
    panel.append(button(tx("label_75ba8a962223",{}), () => showShare(event)));
    h.focus();mountTournament(event);await mountParticipants(event);
  }
  function mountTournament(event) {
    const version=generation;
    const area=el('section','','event-tournament');panel.append(area);
    let busy=false;
    async function run(type,replyType,payload={}) {
      if(busy)return;busy=true;
      area.querySelectorAll('button,select,input').forEach(node=>{node.disabled=true;});
      try {
        const data=await request(type,{eventId:event.id,...payload},replyType);
        if(version===generation)render(data);
      }catch(error){
        if(version===generation){
          const message=area.querySelector('[role=status]');
          if(message)setText(message,tx("label_b3b90fa4cb17",{}));
          area.querySelectorAll('button,select,input').forEach(node=>{node.disabled=false;});
          const finalize=area.querySelector('#finalizeTournament');
          if(finalize)finalize.disabled=!area.querySelector('#confirmRosterLock').checked||area.querySelector('#tournamentFormat').value!=='single_elimination';
        }
      }finally{busy=false;}
    }
    function render(data) {
      area.replaceChildren(el('h4',tx("label_d9292f44d558",{})));
      const message=el('p');message.setAttribute('role','status');area.append(message);
      const refresh=button(tx("label_dad197cd74a8",{}),()=>run('JPDB_ORGANIZER_REQUEST_TOURNAMENT','JPDB_ORGANIZER_TOURNAMENT'));area.append(refresh);
      if(!data){setText(message,tx("label_0315a23646c0",{}));return;}
      if(!data.finalizedAt){
        const label=el('label',tx("label_1ee3dca1a052",{}));const select=el('select');select.id='tournamentFormat';
        for(const [value,fr,en]of [['none','Sans tournoi','No tournament'],['single_elimination','Élimination simple','Single elimination']]){
          const option=el('option',t(fr,en));option.value=value;select.append(option);
        }
        select.value=data.format;label.append(select);area.append(label);
        area.append(button(tx("label_1c7aa7466ddc",{}),()=>run('JPDB_ORGANIZER_SAVE_TOURNAMENT','JPDB_ORGANIZER_TOURNAMENT_SAVED',{format:select.value})));
        area.append(el('p',tx("label_305a8c8d416e",{})));
        if(data.format==='single_elimination'){
          const consent=el('label');const checkbox=el('input');checkbox.type='checkbox';checkbox.id='confirmRosterLock';
          consent.append(checkbox,textNode(tx("label_183a6471a36f",{})));area.append(consent);
          const finalize=button(tx("label_59e2808ba850",{}),()=>{
            if(checkbox.checked&&select.value===data.format)run('JPDB_ORGANIZER_FINALIZE_TOURNAMENT','JPDB_ORGANIZER_TOURNAMENT_FINALIZED');
          },'primary');finalize.id='finalizeTournament';finalize.disabled=true;
          const validate=()=>{finalize.disabled=!checkbox.checked||select.value!==data.format;};
          checkbox.addEventListener('change',validate);select.addEventListener('change',validate);area.append(finalize);
        }
      }else{
        area.append(el('p',tx("label_5af93e303c16",{})));
        const names=new Map((data.entrants||[]).map(p=>[p.seed,boxed(()=>`${p.seed}. ${p.alias||tx("label_2a1e06aea2a8",{})}${p.status==='confirmed'?'':tx("label_335397860f52",{})}`)]));
        for(const [roundIndex,round]of (data.rounds||[]).entries()){
          area.append(el('h5',tx("label_a6ee655b777c",{p0:(roundIndex+1)})));
          const list=el('ol');
          for(const match of round){
            const side=(seed,from)=>names.get(seed)||(roundIndex===0?tx("label_c0f23066ddfc",{}):tx("label_b399bc19f989",{p0:(from)}));
            list.append(el('li',boxed(()=>`${side(match.leftSeed,match.leftFromMatch)} — ${side(match.rightSeed,match.rightFromMatch)}${match.bye?tx("label_df16b11c8524",{}):''}`)));
          }
          area.append(list);
        }
      }
    }
    render(null);run('JPDB_ORGANIZER_REQUEST_TOURNAMENT','JPDB_ORGANIZER_TOURNAMENT');
  }
  async function mountParticipants(event) {
    const version=generation;
    const summary=el('p',tx("label_a4a27a29296f",{}));
    summary.id='participantSummary';summary.setAttribute('aria-live','polite');
    const list=el('ul');list.id='participantList';panel.append(summary,list);let fetching=false;
    const refresh=button(tx("label_d7d646faaecb",{}),load);panel.append(refresh);
    async function load(){
      if(fetching||version!==generation)return;fetching=true;refresh.disabled=true;clearTimeout(participantTimer);
      try{
        const data=await request('JPDB_ORGANIZER_REQUEST_PARTICIPANTS',{eventId:event.id},'JPDB_ORGANIZER_PARTICIPANTS');
        if(version!==generation)return;
        setText(summary,t(`${data.reservedCount} places occupées · ${data.spotsLeft===null?'sans limite':data.spotsLeft+' places restantes'}`,`${data.reservedCount} spots taken · ${data.spotsLeft===null?'no limit':data.spotsLeft+' spots remaining'}`));
        list.replaceChildren();for(const player of data.participants){list.append(el('li',boxed(()=>`${player.alias||tx("label_b80431a4642a",{})} — ${player.status==='confirmed'?tx("label_1278c77084fd",{}):tx("label_2ff6fddceb5b",{})}`)));}
        if(!data.participants.length)list.append(el('li',tx("label_1a603427ca41",{})));
      }catch(error){if(version===generation)summary.textContent=error.message;}
      finally{fetching=false;if(version===generation){refresh.disabled=false;participantTimer=setTimeout(()=>{if(!document.hidden)load();else participantTimer=setTimeout(load,15000);},15000);}}
    }
    await load();
  }
  return { init, receive, request, appendActions, published, close, registrationUrl, translate };
})();
