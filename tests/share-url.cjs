const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const scope = { window: {}, URL };
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../organizer-extras.js'),'utf8'), scope);
const url = 'https://www.jouerpourdebon.ca/competitions?jpdbEvent=abc';
const event = { id:'abc', competitionId:'competition', visibility:'published', registrationUrl:url };
test('sharing requires a published linked event and the canonical matching URL',()=>{
  const read = scope.window.OrganizerExtras.registrationUrl;
  assert.equal(read(event),url);
  for(const invalid of [
    {...event,visibility:'draft'}, {...event,competitionId:null}, {...event,registrationUrl:null},
    {...event,registrationUrl:url+'&token=private'}, {...event,registrationUrl:url+'#secret'},
    {...event,registrationUrl:url.replace('=abc','=other')},
    {...event,registrationUrl:url.replace('https:','http:')},
    {...event,registrationUrl:url.replace('www.jouerpourdebon.ca','evil.test')},
    {...event,registrationUrl:'javascript:alert(1)'},
    {...event,registrationUrl:'https://user:secret@www.jouerpourdebon.ca/competitions?jpdbEvent=abc'}
  ])assert.equal(read(invalid),'');
});
