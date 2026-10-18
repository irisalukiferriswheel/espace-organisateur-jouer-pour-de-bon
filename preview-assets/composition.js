/* Preview-only composition. Reuses the original organizer app without changing it. */
(()=>{
 const frame=document.getElementById('workflowFrame'),form=document.getElementById('eventForm');
 const origin=location.origin;
 // Move the existing nodes, retaining their IDs, listeners and form ownership.
 const bottom=document.createElement('section');bottom.id='organizerFinalActions';bottom.className='panel organizer-final-actions';
 const preview=form.querySelector('.preview-card'),actions=form.querySelector('.form-actions');
 for(const button of actions.querySelectorAll('button'))button.setAttribute('form',form.id);
 bottom.append(preview,actions,document.getElementById('formMessage'));
 document.querySelector('.preview-additions').after(bottom);
 const editor=document.getElementById('createPanel');
 const syncVisibility=()=>{bottom.hidden=editor.hidden;};
 new MutationObserver(syncVisibility).observe(editor,{attributes:true,attributeFilter:['hidden']});
 function sync(){
  const en=document.documentElement.lang==='en';
  document.getElementById('additionTitle').textContent=en?'Participants, tournament and sharing':'Participants, tournoi et partage';
  document.getElementById('additionNotice').textContent=en?'Additional tools: reads the public directory. Selection and bracket stay local; no invitations or registrations are sent.':'Outils supplémentaires : lecture du répertoire public. La sélection et le tableau restent locaux ; aucune invitation ni inscription n’est envoyée.';
  frame.title=en?'Participants, tournament and sharing':'Participants, tournoi et partage';
  frame.contentWindow?.postMessage({source:'jpdb-preview-context',language:en?'en':'fr',title:form.elements.title.value,capacity:form.elements.capacity.value,city:form.elements.city.value,game:form.elements.activityType.value},origin);
 }
 addEventListener('message',event=>{
  if(event.origin!==origin||event.source!==frame.contentWindow)return;
  if(event.data?.source==='jpdb-preview-ready')sync();
  if(event.data?.source==='jpdb-preview-size'&&Number.isFinite(event.data.height))frame.style.height=Math.min(100000,Math.max(300,event.data.height))+'px';
 });
 frame.addEventListener('load',sync);form.addEventListener('input',sync);form.addEventListener('change',sync);form.addEventListener('reset',()=>queueMicrotask(sync));
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 // Show the unchanged original form immediately in this review page only.
 document.getElementById('createPanel').hidden=false;document.getElementById('emptyState').hidden=true;
 syncVisibility();
 sync();
})();
