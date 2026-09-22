const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://jouer-pour-de-bon-api.onrender.com/v1/causes**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({data:[{id:'cause-1',name:'Test cause'}]})}));
 await page.route('https://organizer.test/**', route => {
    const file = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    return route.fulfill({ body: fs.readFileSync(path.join(__dirname, '..', file)), contentType: file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' });
  });
  await page.route('https://www.jouerpourdebon.ca/test', route => route.fulfill({ contentType: 'text/html', body: `<iframe style="width:100%;height:2400px;border:0" src="https://organizer.test/"></iframe><script>
    window.eventRow = { id:'event-1', title:'Go Sherbrooke', visibility:'published', competitionId:'competition-1', registrationUrl:'https://www.jouerpourdebon.ca/competitions?jpdbEvent=event-1', startAt:'2027-09-23T17:00:00Z', endAt:'2027-09-23T20:00:00Z', timezone:'America/Toronto', games:['Go'], causeId:'cause-1',causeName:'Test cause', format:'physical', city:'Sherbrooke', feeAmount:20, feeCurrency:'CAD', participationMode:'registration' };
    window.invites=[{playerId:'p2',alias:'Existing player',status:'accepted'},{playerId:'p3',alias:'Declined player',status:'declined'}]; window.calls=[]; window.failSearch=false; window.failSend=false; window.badPublish=false;
    addEventListener('message', e => {
      const m=e.data; if(m.source!=='jpdb-organizer')return; window.calls.push(m);
      const send=(type,payload)=>e.source.postMessage({source:'jpdb-wix',type,requestId:m.requestId,payload},'*');
      if(m.type==='JPDB_ORGANIZER_EMBED_READY')e.source.postMessage({source:'jpdb-wix',type:'JPDB_WIX_MEMBER_AUTH',loggedIn:true,isOrganisateur:true,memberId:'organizer',roles:['Organisateur']},'*');
      if(m.type==='JPDB_ORGANIZER_REQUEST_EVENTS')send('JPDB_ORGANIZER_EVENTS',{events:[window.eventRow]});
      if(m.type==='JPDB_ORGANIZER_REQUEST_INVITATIONS')send('JPDB_ORGANIZER_INVITATIONS',{invitations:window.invites});
      if(m.type==='JPDB_ORGANIZER_SEARCH_PLAYERS'){
        if(window.failSearch){e.source.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_ERROR',requestId:m.requestId,message:'Search unavailable'},'*');return;}
        send('JPDB_ORGANIZER_PLAYERS',{players:[{id:'p1',alias:'Go friend',city:'Sherbrooke'},{id:'p2',alias:'Existing player',city:'Montreal'},{id:'p3',alias:'Declined player',city:'Quebec'}],nextCursor:null});
      }
      if(m.type==='JPDB_ORGANIZER_SEND_INVITATIONS'){
        if(window.failSend){e.source.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_ERROR',requestId:m.requestId,message:'Send unavailable'},'*');return;}
        window.invites.push({playerId:'p1',alias:'Go friend',status:'sent'});send('JPDB_ORGANIZER_INVITATIONS_SENT',{sentCount:1,invitations:window.invites});
      }
      if(m.type==='JPDB_ORGANIZER_PUBLISH_EVENT'){window.eventRow.visibility=window.badPublish?'draft':'published';send('JPDB_ORGANIZER_DRAFT_SAVED',{event:window.eventRow});}
    });
  </script>` }));
  await page.goto('https://www.jouerpourdebon.ca/test');
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Lien et QR', exact: true }).click();
  const expected = 'https://www.jouerpourdebon.ca/competitions?jpdbEvent=event-1';
  assert.equal(await frame.getByLabel('Lien d’inscription').inputValue(), expected);
  assert.equal(await frame.getByRole('link', { name: 'Ouvrir le lien' }).getAttribute('href'), expected);
  assert.match(await frame.getByRole('link', { name: 'Télécharger le QR' }).getAttribute('download'), /event-1\.svg$/);
  const qrImage = frame.locator('.event-qr'); await qrImage.waitFor({state:'visible'});
  if (process.env.SCREENSHOT_DIR) await frame.locator('#organizerExtras').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'organizer-share.png')});
  if (process.env.QR_DECODER_MODULE && process.env.SHARP_MODULE) {
    const sharp = require(process.env.SHARP_MODULE); const decode = require(process.env.QR_DECODER_MODULE);
    const { data, info } = await sharp(await qrImage.screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(decode(new Uint8ClampedArray(data),info.width,info.height).data, expected);
  }
  await frame.getByRole('button', { name: 'Inviter des joueurs', exact: true }).click();
  await frame.locator('#sentInvitations').getByText('Acceptée', {exact:true}).waitFor();
  assert.equal(await frame.locator('#sentInvitations').getByText('Refusée', {exact:true}).count(),1);
  assert.equal((await page.evaluate(()=>window.calls)).filter(m=>m.type==='JPDB_ORGANIZER_SEND_INVITATIONS').length,0);
  await frame.locator('#inviteQuery').fill('Go'); await page.evaluate(()=>window.failSearch=true);
  await frame.getByRole('button',{name:'Rechercher',exact:true}).click(); await frame.getByRole('status').filter({hasText:'Search unavailable'}).waitFor();
  await page.evaluate(()=>window.failSearch=false); await frame.getByRole('button',{name:'Rechercher',exact:true}).click();
  await frame.getByRole('checkbox',{name:/Go friend/}).check();
  assert.equal(await frame.getByRole('checkbox',{name:/Existing player/}).isDisabled(),true);
  assert.equal(await frame.getByRole('checkbox',{name:/Declined player/}).isDisabled(),true);
  await page.evaluate(()=>window.failSend=true); await frame.locator('#sendInvitations').click();
  await frame.getByRole('status').filter({hasText:'Send unavailable'}).waitFor();
  assert.equal(await frame.getByRole('checkbox',{name:/Go friend/}).isChecked(),true);
  await page.evaluate(()=>window.failSend=false); await frame.locator('#sendInvitations').click();
  await frame.getByRole('status').filter({hasText:'Invitations envoyées.'}).waitFor();
  assert.equal(await frame.getByRole('checkbox',{name:/Go friend/}).isDisabled(),true);
  const sent=(await page.evaluate(()=>window.calls)).filter(m=>m.type==='JPDB_ORGANIZER_SEND_INVITATIONS').at(-1);
  assert.deepEqual(sent.payload,{eventId:'event-1',playerIds:['p1']});
  assert.equal(Object.hasOwn(sent.payload,'wixMemberId'),false);
  // An authenticated but stale/mismatched response cannot mutate invitation state.
  await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_INVITATIONS',requestId:'wrong',payload:{invitations:[]}},'*'));
  assert.equal(await frame.locator('#sentInvitations li').count(),3);
  await frame.getByRole('button',{name:'Fermer',exact:true}).filter({visible:true}).click();
  // A failed publish acknowledgment preserves the editor and never claims success.
  await page.evaluate(()=>{window.eventRow.visibility='draft'; window.badPublish=true;document.querySelector('iframe').contentWindow.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_EVENTS',payload:{events:[window.eventRow]}},'*')});
  assert.equal(await frame.getByRole('button',{name:'Lien et QR',exact:true}).count(),0);
  await frame.getByRole('button',{name:'Ouvrir le brouillon'}).click(); await frame.locator('#organizerCause option[value="cause-1"]').waitFor({state:'attached'});await frame.locator('#publishBtn').click();
  await frame.locator('#formMessage').filter({hasText:'n’a pas été confirmé'}).waitFor();
  assert.equal(await frame.locator('#createPanel').isVisible(),true);
  assert.equal(await frame.locator('[name=title]').inputValue(),'Go Sherbrooke');
  await page.evaluate(()=>window.badPublish=false); await frame.locator('#publishBtn').click();
  await frame.locator('#formMessage').filter({hasText:'Événement publié.'}).waitFor();
  assert.equal(await frame.locator('#createPanel').isVisible(),false);
  assert.equal(await frame.locator('.event-qr').isVisible(),true);
  await page.evaluate(()=>{
    const frame=document.querySelector('iframe').contentWindow;
    frame.postMessage({source:'jpdb-wix',type:'JPDB_ORGANIZER_EVENTS',requestId:'old-load',payload:{events:[]}},'*');
    frame.postMessage({source:'jpdb-wix',type:'JPDB_WIX_MEMBER_AUTH',loggedIn:true,isOrganisateur:true,roles:['Organisateur']},'*');
  });
  assert.equal(await frame.locator('.event-card').count(),1);
  assert.equal(await frame.locator('#formMessage').textContent(),'Événement publié.');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  if (process.env.SCREENSHOT_DIR) await frame.locator('#organizerExtras').screenshot({path:path.join(process.env.SCREENSHOT_DIR,'organizer-share-mobile.png')});
  assert.deepEqual(errors,[]);
  await browser.close(); console.log('PASS invitations: explicit send, selected IDs, private-state labels, failed search/send retry, duplicate prevention, response correlation; QR link/decode; unconfirmed publish preserved; mobile layout.');
})().catch(error=>{console.error(error);process.exit(1)});
