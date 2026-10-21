/* Draft selections are persisted by Wix/API; this module never sends invitations. */
window.OrganizerInvitePlan = (() => {
  let context, box, selected=new Map(), results=[], nextCursor=null, generation=0, ready=true, busy=false, eventId=null;
  const t=(fr,en)=>context.language()==='fr'?fr:en;
  const translations=[];
  const localized=(tag,fr,en)=>{const element=node(tag,t(fr,en));translations.push({element,fr,en});return element;};
  const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const message=text=>{box.querySelector('[role=status]').textContent=text;};
  function render() {
    const list=box.querySelector('#draftInviteResults');list.replaceChildren();
    for(const player of results) {
      const label=node('label');label.className='invite-player';const input=node('input');input.type='checkbox';input.checked=selected.has(player.id);input.disabled=busy;
      input.addEventListener('change',()=>{
        if(input.checked&&selected.size>=50){input.checked=false;message(t('Maximum de 50 invitations.','Choose up to 50 invitees.'));return;}
        if(input.checked)selected.set(player.id,player);else selected.delete(player.id);render();
      });
      label.append(input,node('span',`${player.alias||t('Joueur','Player')}${player.city?' · '+player.city:''}`));list.append(label);
    }
    const chips=box.querySelector('#draftInviteSelected');chips.replaceChildren();
    for(const player of selected.values()) {
      const remove=node('button',`${player.alias||t('Joueur sélectionné','Selected player')} ×`);remove.className='secondary';remove.type='button';remove.disabled=busy;
      remove.addEventListener('click',()=>{selected.delete(player.id);render();});chips.append(remove);
    }
    box.querySelector('#draftInviteCount').textContent=t(`${selected.size} joueur(s) sélectionné(s). Les invitations seront envoyées à la publication.`,`${selected.size} player(s) selected. Invitations will be sent when you publish.`);
    box.querySelector('#draftInviteMore').hidden=!nextCursor;
  }
  async function search(more=false) {
    if(busy||!ready)return;
    const query=box.querySelector('#draftInviteQuery').value.trim();
    if(query.length<2){message(t('Entrez au moins deux caractères.','Enter at least two characters.'));return;}
    const version=generation;busy=true;render();message(t('Recherche…','Searching…'));
    try {
      const data=await OrganizerExtras.request('JPDB_ORGANIZER_SEARCH_PLAYERS',{query,cursor:more?nextCursor:null},'JPDB_ORGANIZER_PLAYERS');
      if(version!==generation)return;
      results=more?[...new Map([...results,...data.players].map(p=>[p.id,p])).values()]:data.players;
      nextCursor=data.nextCursor||null;message(results.length?'':t('Aucun joueur trouvé.','No players found.'));
    }catch(error){if(version===generation)message(error.message);}
    finally{if(version===generation){busy=false;render();}}
  }
  function init(options) {
    context=options;box=node('fieldset');box.id='draftInvitationPlan';
    box.append(localized('legend','Inviter des joueurs','Invite players'));
    const label=node('label');label.append(localized('span','Rechercher un joueur par son nom public','Find a player by public name'));
    const input=node('input');input.id='draftInviteQuery';input.type='search';input.maxLength=80;
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();search();}});label.append(input);box.append(label);
    const find=localized('button','Rechercher des joueurs','Find players');find.className='secondary';find.type='button';find.addEventListener('click',()=>search());box.append(find);
    for(const id of ['draftInviteResults','draftInviteSelected']){const div=node('div');div.id=id;if(id==='draftInviteSelected')div.className='invite-selection';box.append(div);}
    const more=localized('button','Afficher plus','Show more');more.className='secondary';more.id='draftInviteMore';more.type='button';more.hidden=true;more.addEventListener('click',()=>search(true));box.append(more);
    input.addEventListener('input',()=>{nextCursor=null;more.hidden=true;});
    const count=node('p');count.id='draftInviteCount';box.append(count);
    const access=node('label');access.className='invite-player';const check=node('input');check.id='openRemainingSpots';check.type='checkbox';
    access.append(check,localized('span','Ouvrir les places restantes aux joueurs non invités','Open remaining spots to players who were not invited'));box.append(access);
    const info=localized('p','Sinon, seuls les joueurs ayant accepté leur invitation peuvent s’inscrire, même avec le QR.','Otherwise, only players who accepted an invitation can register, even with the QR.');box.append(info);
    const status=node('p');status.setAttribute('role','status');box.append(status);
    const retry=localized('button','Recharger la sélection enregistrée','Reload saved selection');retry.className='secondary';retry.type='button';retry.id='retryInvitePlan';retry.hidden=true;retry.addEventListener('click',()=>open(eventId));box.append(retry);
    context.form.querySelector('.preview-card').before(box);render();
  }
  async function open(id=null) {
    generation++;const version=generation;eventId=id;selected=new Map();results=[];nextCursor=null;busy=false;ready=!id;
    box.disabled=false;
    box.querySelector('#draftInviteQuery').value='';box.querySelector('#openRemainingSpots').checked=false;
    box.querySelector('#retryInvitePlan').hidden=true;render();message('');
    if(!id)return;
    box.disabled=true;message(t('Chargement des invitations enregistrées…','Loading saved invitees…'));
    try {
      const data=await OrganizerExtras.request('JPDB_ORGANIZER_REQUEST_INVITATION_PLAN',{eventId:id},'JPDB_ORGANIZER_INVITATION_PLAN');
      if(version!==generation)return;
      selected=new Map(data.players.map(p=>[p.id,p]));box.querySelector('#openRemainingSpots').checked=data.publicRegistration===true;ready=true;message('');
    }catch(error){if(version===generation){message(error.message);box.querySelector('#retryInvitePlan').hidden=false;}}
    finally{if(version===generation){box.disabled=false;render();}}
  }
  function value(){if(!ready||busy){message(t('Attendez le chargement ou rechargez les invitations avant d’enregistrer.','Wait for loading or reload invitees before saving.'));return null;}return {invitedPlayerIds:[...selected.keys()],publicRegistration:box.querySelector('#openRemainingSpots').checked};}
  return {init,open,value,translate(){translations.forEach(({element,fr,en})=>element.textContent=t(fr,en));render();},setBusy(value){box.disabled=value;}};
})();
