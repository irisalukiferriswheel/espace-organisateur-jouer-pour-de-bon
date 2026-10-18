const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 await page.route('https://preview.test/**',r=>{const file=new URL(r.request().url()).pathname.slice(1)||'preview.html';return r.fulfill({body:fs.readFileSync(path.join(__dirname,'..',file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8'});});
 await page.route('https://jouer-pour-de-bon-api.onrender.com/**',r=>r.fulfill({json:{success:true,data:[]}}));
 await page.goto('https://preview.test/');const child=page.frameLocator('#workflowFrame');await child.locator('#directoryStatus').filter({hasText:'Aucun profil'}).waitFor();
 for(const size of [{width:1200,height:1000},{width:390,height:844}]){
  await page.setViewportSize(size);const bottom=await page.locator('#organizerFinalActions').boundingBox(),added=await page.locator('.preview-additions').boundingBox();assert.ok(bottom.y>=added.y+added.height);
  assert.equal(await page.locator('#saveDraftBtn').count(),1);assert.equal(await page.locator('#publishBtn').count(),1);assert.equal(await page.locator('#previewTitle').count(),1);
  assert.equal(await page.locator('#publishBtn').evaluate(b=>b.form.id),'eventForm');assert.equal(await page.locator('#saveDraftBtn').evaluate(b=>b.form.id),'eventForm');
  assert.equal(await page.locator('body').evaluate(n=>n.scrollWidth<=innerWidth),true);
 }
 await page.locator('[name=title]').fill('Fictional keyboard test');assert.equal(await page.locator('#previewTitle').innerText(),'Fictional keyboard test');
 // Test native association/validation with a local-only submit observer; never call the live action handler.
 await page.evaluate(()=>{window.testSubmits=0;document.getElementById('eventForm').addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();window.testSubmits++;},true);document.getElementById('publishBtn').disabled=false;document.getElementById('saveDraftBtn').disabled=false;});
 await page.locator('#publishBtn').click();assert.equal(await page.evaluate(()=>window.testSubmits),0);
 for(const [name,value]of Object.entries({activityType:'Chess',date:'2027-05-15',startTime:'12:00',endTime:'14:00',city:'Example',fee:'0'}))await page.locator(`[name=${name}]`).fill(value);
 await page.locator('#publishBtn').click();assert.equal(await page.evaluate(()=>window.testSubmits),1);
 await page.locator('[name=title]').press('Enter');assert.equal(await page.evaluate(()=>window.testSubmits),2);
 await page.locator('#saveDraftBtn').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#publishBtn').evaluate(n=>n===document.activeElement),true);
 await page.locator('#langEnBtn').click();assert.equal(await page.locator('#publishBtn').innerText(),'Publish event');assert.equal(await page.locator('#previewTitle').innerText(),'Fictional keyboard test');
 if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'organizer-bottom-actions-mobile.png'),fullPage:true});
 await page.locator('#closeCreateBtn').click();assert.equal(await page.locator('#organizerFinalActions').isVisible(),false);await page.locator('#createEventBtn').click();assert.equal(await page.locator('#organizerFinalActions').isVisible(),true);
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log('PASS bottom action order desktop/mobile, unique original IDs, form association/validation, Enter submission, tab order, FR/EN, close/reopen and zero writes.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
