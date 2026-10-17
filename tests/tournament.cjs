const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://organizer.test/**',route=>{const file=new URL(route.request().url()).pathname.slice(1)||'index.html';return route.fulfill({body:fs.readFileSync(path.join(__dirname,'..',file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});});
  await page.route('https://jouer-pour-de-bon-api.onrender.com/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://www.jouerpourdebon.ca/test',route=>route.fulfill({contentType:'text/html',body:`<iframe style="width:100%;height:2400px" src="https://organizer.test/"></iframe><script>
   window.calls=[];window.failFinalize=false;window.tournament={format:'none',finalizedAt:null,entrants:[],rounds:[]};
   const event={id:'11111111-1111-4111-8111-111111111111',title:'Chess',visibility:'published',competitionId:'22222222-2222-4222-8222-222222222222',registrationUrl:'https://www.jouerpourdebon.ca/competitions?jpdbEvent=11111111-1111-4111-8111-111111111111',startAt:'2099-01-01T17:00:00Z',timezone:'America/Toronto',games:['Chess'],city:'Montreal'};
   addEventListener('message',e=>{const m=e.data;if(m.source!=='jpdb-organizer')return;calls.push(m);
    const send=(type,payload)=>e.source.postMessage({source:'jpdb-wix',type,requestId:m.requestId,payload},'*');
    if(m.type==='JPDB_ORGANIZER_EMBED_READY')e.source.postMessage({source:'jpdb-wix',type:'JPDB_WIX_MEMBER_AUTH',loggedIn:true,isOrganisateur:true,roles:['Organisateur']},'*');
    if(m.type==='JPDB_ORGANIZER_REQUEST_EVENTS')send('JPDB_ORGANIZER_EVENTS',{events:[event]});
    if(m.type==='JPDB_ORGANIZER_REQUEST_PARTICIPANTS')send('JPDB_ORGANIZER_PARTICIPANTS',{participants:[{alias:'Alice',status:'confirmed'},{alias:'Bob',status:'confirmed'},{alias:'Carol',status:'confirmed'}],participantsCount:3,reservedCount:3,maxParticipants:8,spotsLeft:5});
    if(m.type==='JPDB_ORGANIZER_REQUEST_TOURNAMENT')send('JPDB_ORGANIZER_TOURNAMENT',tournament);
    if(m.type==='JPDB_ORGANIZER_SAVE_TOURNAMENT'){tournament.format=m.payload.format;send('JPDB_ORGANIZER_TOURNAMENT_SAVED',tournament);}
    if(m.type==='JPDB_ORGANIZER_FINALIZE_TOURNAMENT'){
     if(failFinalize){e.source.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_ERROR',requestId:m.requestId,success:false},'*');return;}
     tournament={format:'single_elimination',finalizedAt:'2098-01-01',entrants:[{seed:1,alias:'Alice',status:'confirmed'},{seed:2,alias:'Bob',status:'confirmed'},{seed:3,alias:'',status:'confirmed'}],rounds:[[{match:1,leftSeed:1,rightSeed:null,winnerSeed:1,bye:true},{match:2,leftSeed:2,rightSeed:3,bye:false}],[{match:1,leftSeed:1,rightSeed:null,leftFromMatch:1,rightFromMatch:2,bye:false}]]};send('JPDB_ORGANIZER_TOURNAMENT_FINALIZED',tournament);
    }
   });</script>`}));
  await page.goto('https://www.jouerpourdebon.ca/test');const frame=page.frameLocator('iframe');
  await frame.getByRole('button',{name:'Lien et QR',exact:true}).click();
  const png=require('pngjs').PNG.sync.read(await frame.locator('.event-qr').screenshot());
  const decoded=require('jsqr')(new Uint8ClampedArray(png.data),png.width,png.height);
  assert.equal(decoded.data,'https://www.jouerpourdebon.ca/competitions?jpdbEvent=11111111-1111-4111-8111-111111111111');
  assert.equal(await frame.getByRole('link',{name:'Télécharger le QR',exact:true}).getAttribute('download'),'event-11111111-1111-4111-8111-111111111111.svg');
  await frame.locator('#tournamentFormat').selectOption('single_elimination');
  await frame.getByRole('button',{name:'Enregistrer le format',exact:true}).click();
  await frame.locator('#confirmRosterLock').waitFor();assert.equal(await frame.locator('#finalizeTournament').isDisabled(),true);
  await frame.locator('#confirmRosterLock').check();assert.equal(await frame.locator('#finalizeTournament').isEnabled(),true);
  await frame.locator('#tournamentFormat').selectOption('none');assert.equal(await frame.locator('#finalizeTournament').isDisabled(),true);
  await frame.locator('#tournamentFormat').selectOption('single_elimination');assert.equal(await frame.locator('#finalizeTournament').isEnabled(),true);
  await page.evaluate(()=>{window.failFinalize=true});await frame.locator('#finalizeTournament').click();
  await frame.locator('.event-tournament [role=status]').filter({hasText:'Modification non confirmée'}).waitFor();assert.equal(await frame.locator('#tournamentFormat').count(),1);
  await page.evaluate(()=>{window.failFinalize=false});await frame.locator('#finalizeTournament').click();
  await frame.locator('.event-tournament').getByText('Liste verrouillée',{exact:false}).waitFor();
  assert.equal(await frame.locator('#finalizeTournament').count(),0);assert.equal(await frame.locator('.event-tournament li').count(),3);
  assert.ok((await frame.locator('.event-tournament').innerText()).includes('Participant privé'));
  await frame.locator('#langEnBtn').click();
  await frame.getByRole('button',{name:'Link and QR',exact:true}).click();
  await frame.locator('.event-tournament').getByText('Roster locked',{exact:false}).waitFor();
  assert.ok((await frame.locator('.event-tournament').innerText()).includes('Private participant'));
  await page.setViewportSize({width:390,height:844});
  assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+1),true);
  if(process.env.SCREENSHOT_DIR)await frame.locator('.event-tournament').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'tournament-mobile.png')});
  const calls=await page.evaluate(()=>window.calls.filter(m=>m.type==='JPDB_ORGANIZER_FINALIZE_TOURNAMENT'));
  assert.equal(calls.length,2);assert.deepEqual(Object.keys(calls[0].payload),['eventId']);assert.deepEqual(errors,[]);
  console.log('Tournament browser regression passed: settings, explicit consent, failed finalize, byes, private alias, reopen, FR/EN and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
