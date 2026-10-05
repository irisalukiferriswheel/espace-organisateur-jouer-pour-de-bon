const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const eventId='11111111-1111-4111-8111-111111111111',playerId='22222222-2222-4222-8222-222222222222';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://jouer-pour-de-bon-api.onrender.com/v1/causes**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({data:[{id:playerId,name:'Cause'}]})}));
  await page.route('https://organizer.test/**',r=>{const file=new URL(r.request().url()).pathname.slice(1)||'index.html';return r.fulfill({body:fs.readFileSync(path.join(__dirname,'..',file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});});
  await page.route('https://www.jouerpourdebon.ca/test',r=>r.fulfill({contentType:'text/html',body:`<iframe style="width:100%;height:2200px;border:0" src="https://organizer.test/"></iframe><script>
    window.calls=[];window.plan={players:[],publicRegistration:false};window.events=[];window.failPlan=false;
    window.roster={participants:[],reservedCount:0,participantsCount:0,maxParticipants:2,spotsLeft:2};
    addEventListener('message',e=>{const m=e.data;if(m.source!=='jpdb-organizer')return;window.calls.push(m);
      const send=(type,payload)=>e.source.postMessage({source:'jpdb-wix',type,requestId:m.requestId,payload},'*');
      if(m.type==='JPDB_ORGANIZER_EMBED_READY')e.source.postMessage({source:'jpdb-wix',type:'JPDB_WIX_MEMBER_AUTH',loggedIn:true,isOrganisateur:true,roles:['Organisateur']},'*');
      if(m.type==='JPDB_ORGANIZER_REQUEST_EVENTS')send('JPDB_ORGANIZER_EVENTS',{events:window.events});
      if(m.type==='JPDB_ORGANIZER_SEARCH_PLAYERS')send('JPDB_ORGANIZER_PLAYERS',{players:[{id:'${playerId}',alias:'Alice',city:'Montreal'}],nextCursor:null});
      if(m.type==='JPDB_ORGANIZER_REQUEST_INVITATION_PLAN'){
        if(window.failPlan)e.source.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_ERROR',requestId:m.requestId,message:'Plan unavailable'},'*');
        else send('JPDB_ORGANIZER_INVITATION_PLAN',window.plan);
      }
      if(m.type==='JPDB_ORGANIZER_REQUEST_PARTICIPANTS')send('JPDB_ORGANIZER_PARTICIPANTS',window.roster);
      if(['JPDB_ORGANIZER_SAVE_DRAFT','JPDB_ORGANIZER_UPDATE_DRAFT','JPDB_ORGANIZER_PUBLISH_EVENT'].includes(m.type)){
        window.plan={players:m.payload.invitedPlayerIds.map(id=>({id,alias:'Alice'})),publicRegistration:m.payload.publicRegistration};
        const published=m.type==='JPDB_ORGANIZER_PUBLISH_EVENT';
        const row={id:'${eventId}',title:m.payload.title,visibility:published?'published':'draft',competitionId:published?'competition-1':null,registrationUrl:published?'https://www.jouerpourdebon.ca/competitions?jpdbEvent=${eventId}':null,startAt:'2099-01-01T18:00:00Z',endAt:'2099-01-01T20:00:00Z',timezone:'America/Toronto',city:'Montreal',games:['Chess'],format:'physical',feeAmount:0,feeCurrency:'CAD',maxParticipants:2,causeId:'${playerId}',participationMode:'registration'};
        window.events=[row];send('JPDB_ORGANIZER_DRAFT_SAVED',{event:row});
      }
    });</script>`}));
  await page.goto('https://www.jouerpourdebon.ca/test');const frame=page.frameLocator('iframe');
  await frame.locator('#createEventBtn').click();
  await frame.locator('[name=title]').fill('Chess night');await frame.locator('[name=activityType]').fill('Chess');
  await frame.locator('[name=date]').fill('2099-01-01');await frame.locator('[name=startTime]').fill('13:00');await frame.locator('[name=endTime]').fill('15:00');await frame.locator('[name=city]').fill('Montreal');
  await frame.locator('[name=fee]').fill('0');await frame.locator('[name=capacity]').fill('2');
  await frame.locator('#organizerCause').selectOption(playerId);
  await frame.locator('#draftInviteQuery').fill('Al');await frame.getByRole('button',{name:'Rechercher des joueurs',exact:true}).click();await frame.getByRole('checkbox',{name:'Alice · Montreal'}).check();
  assert.equal(await frame.locator('#openRemainingSpots').isChecked(),false);
  await frame.locator('#langEnBtn').click();
  await frame.getByRole('button',{name:'Find players',exact:true}).waitFor();
  assert.equal(await frame.getByRole('checkbox',{name:'Alice · Montreal'}).isChecked(),true);
  await frame.locator('#langFrBtn').click();
  assert.equal((await page.evaluate(()=>calls)).some(c=>c.type==='JPDB_ORGANIZER_SEND_INVITATIONS'),false);
  await frame.locator('#saveDraftBtn').click();await frame.getByRole('button',{name:'Ouvrir le brouillon'}).waitFor();
  const save=(await page.evaluate(()=>calls)).find(c=>c.type==='JPDB_ORGANIZER_SAVE_DRAFT');assert.deepEqual(save.payload.invitedPlayerIds,[playerId]);assert.equal(save.payload.publicRegistration,false);
  await page.evaluate(()=>window.failPlan=true);await frame.getByRole('button',{name:'Ouvrir le brouillon'}).click();await frame.locator('#retryInvitePlan').waitFor({state:'visible'});
  const before=(await page.evaluate(()=>calls)).filter(c=>c.type==='JPDB_ORGANIZER_UPDATE_DRAFT').length;await frame.locator('#saveDraftBtn').click();assert.equal((await page.evaluate(()=>calls)).filter(c=>c.type==='JPDB_ORGANIZER_UPDATE_DRAFT').length,before);
  await page.evaluate(()=>window.failPlan=false);await frame.locator('#retryInvitePlan').click();await frame.locator('#draftInviteSelected').getByRole('button',{name:'Alice ×'}).waitFor();
  if(process.env.SCREENSHOT_DIR)await frame.locator('#draftInvitationPlan').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'invite-selection.png')});
  await frame.locator('#publishBtn').click();await frame.locator('.event-qr').waitFor({state:'visible'});
  const qrUrl='https://www.jouerpourdebon.ca/competitions?jpdbEvent='+eventId;
  assert.equal(await frame.getByLabel('Lien d’inscription').inputValue(),qrUrl);
  assert.equal(new URL(await frame.getByRole('link',{name:'Facebook',exact:true}).getAttribute('href')).searchParams.get('u'),qrUrl);
  assert.ok(new URL(await frame.getByRole('link',{name:'WhatsApp',exact:true}).getAttribute('href')).searchParams.get('text').endsWith(qrUrl));
  if(process.env.QR_DECODER_MODULE&&process.env.SHARP_MODULE){const sharp=require(process.env.SHARP_MODULE),decode=require(process.env.QR_DECODER_MODULE);const {data,info}=await sharp(await frame.locator('.event-qr').screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(decode(new Uint8ClampedArray(data),info.width,info.height).data,qrUrl);}
  await page.setViewportSize({width:390,height:844});assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  if(process.env.SCREENSHOT_DIR)await frame.locator('#organizerExtras').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'qr-sharing-mobile.png')});
  await frame.getByRole('button',{name:'Participants et places',exact:true}).click();await frame.getByText('0 places occupées · 2 places restantes',{exact:true}).waitFor();
  await page.evaluate((id)=>window.roster={participants:[{playerId:id,alias:'Alice',status:'pending_payment'}],reservedCount:1,participantsCount:0,maxParticipants:2,spotsLeft:1},playerId);
  await frame.getByRole('button',{name:'Actualiser',exact:true}).click();await frame.getByText('1 places occupées · 1 places restantes',{exact:true}).waitFor();
  await frame.getByText('Alice — Accepté · paiement en attente',{exact:true}).waitFor();
  if(process.env.SCREENSHOT_DIR)await frame.locator('#organizerExtras').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'participants-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS creation invite selection, persisted draft reload, failure protection, publish QR/social URLs, decoded QR, mobile, participant capacity refresh.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
