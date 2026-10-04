const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'); const assert=require('node:assert/strict'); const path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
 const page=await browser.newPage({viewport:{width:1100,height:850}});
 await page.route('https://organizer.test/**', async route=>{
  const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
  await route.fulfill({body:fs.readFileSync(path.join(__dirname,'..',file)),contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});
 });
 await page.route('https://www.jouerpourdebon.ca/test',route=>route.fulfill({contentType:'text/html',body:`<iframe style="width:100%;height:1600px;border:0" src="https://organizer.test/index.html"></iframe><script>
 window.draft={id:'draft-1',title:'Tournois de Go',games:['Go'],visibility:'draft',startAt:'2026-09-23T17:00:00Z',endAt:'2026-09-23T20:00:00Z',timezone:'America/Toronto',city:'Sherbrooke',venue:'Avril',format:'physical',feeAmount:20,feeCurrency:'CAD',causeName:'Test cause',participationMode:'registration',skillLevel:'all',maxAge:60};
 window.calls=[];window.fail=false;
 addEventListener('message',e=>{
 const m=e.data;if(m.source!=='jpdb-organizer')return;
 const send=data=>e.source.postMessage({source:'jpdb-wix',...data},'*');
 if(m.type==='JPDB_ORGANIZER_EMBED_READY')send({type:'JPDB_WIX_MEMBER_AUTH',loggedIn:true,isOrganisateur:true,memberId:'organizer-1',roles:['Organisateur']});
 if(m.type==='JPDB_ORGANIZER_REQUEST_EVENTS')send({type:'JPDB_ORGANIZER_EVENTS',payload:{events:[window.draft]}});
 if(['JPDB_ORGANIZER_UPDATE_DRAFT','JPDB_ORGANIZER_PUBLISH_EVENT','JPDB_ORGANIZER_SAVE_DRAFT'].includes(m.type)){
 window.calls.push(m);
 if(window.fail){send({type:'JPDB_ORGANIZER_ERROR',requestId:m.requestId,message:'Test save failed'});return;}
 window.draft={...window.draft,title:m.payload.title,visibility:m.type==='JPDB_ORGANIZER_PUBLISH_EVENT'?'published':'draft'};
 send({type:'JPDB_ORGANIZER_DRAFT_SAVED',requestId:m.requestId,payload:{event:window.draft}});
 }
 });</script>`}));
 await page.goto('https://www.jouerpourdebon.ca/test');
 const frame=page.frameLocator('iframe');
 await frame.getByRole('button',{name:'Ouvrir le brouillon'}).waitFor();
 assert.equal(await frame.locator('#emptyState').isVisible(),false);
 await frame.getByRole('button',{name:'Ouvrir le brouillon'}).click();
 assert.equal(await frame.locator('[name=title]').inputValue(),'Tournois de Go');
 assert.equal(await frame.locator('[name=startTime]').inputValue(),'13:00');
 assert.equal(await frame.locator('[name=format]').inputValue(),'in_person');
 await frame.locator('[name=title]').fill('Tournois de Go modifié');
 await page.evaluate(()=>window.fail=true);
 await frame.locator('#saveDraftBtn').click();
 await frame.locator('#formMessage').filter({hasText:'Test save failed'}).waitFor();
 assert.equal(await frame.locator('[name=title]').inputValue(),'Tournois de Go modifié');
 await page.evaluate(()=>window.fail=false);
 await frame.locator('#saveDraftBtn').click();
 await frame.getByRole('button',{name:'Ouvrir le brouillon'}).waitFor();
 let calls=await page.evaluate(()=>window.calls);
 assert.equal(calls.at(-1).type,'JPDB_ORGANIZER_UPDATE_DRAFT');assert.equal(calls.at(-1).payload.eventId,'draft-1');assert.equal(calls.at(-1).payload.maximumAge,60);
 await frame.getByRole('button',{name:'Ouvrir le brouillon'}).click();
 assert.equal(await frame.locator('[name=title]').inputValue(),'Tournois de Go modifié');
 await frame.locator('#publishBtn').click();
 await frame.locator('.event-badge').filter({hasText:'Publié'}).waitFor();
 calls=await page.evaluate(()=>window.calls);assert.equal(calls.at(-1).type,'JPDB_ORGANIZER_PUBLISH_EVENT');assert.equal(calls.at(-1).payload.eventId,'draft-1');
 assert.equal(await frame.locator('.event-card').count(),1);assert.equal(await frame.locator('#emptyState').isVisible(),false);
 await frame.locator('#createEventBtn').click();assert.equal(await frame.locator('[name=title]').inputValue(),'');
 await frame.locator('#closeCreateBtn').click();
 
 await page.setViewportSize({width:390,height:844});
 assert.equal(await frame.locator('#emptyState').isVisible(),false);
 
 await browser.close();console.log('PASS: reopen, prefill/timezone, failed save preservation, update same ID, publish, new form reset, hidden empty state, mobile.');
})().catch(e=>{console.error(e);process.exit(1)});
