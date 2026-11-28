const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
function setup(path='/pages/sinh-vien/example.html') {
 let node;
 class Dialog {
  constructor(){this.open=false;this.handlers={};this.attrs={};this.parts={h2:{textContent:''},p:{textContent:''},button:{addEventListener:(e,fn)=>this.click=fn}};}
  setAttribute(k,v){this.attrs[k]=v;}
  set innerHTML(v){}
  querySelector(k){return this.parts[k];}
  addEventListener(e,f){this.handlers[e]=f;}
  showModal(){this.open=true;}
  close(){this.open=false;this.handlers.close?.();}
 }
 const context={location:{pathname:path},document:{createElement:()=>node=new Dialog(),body:{append:()=>{}}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/shared/student-operation-feedback.js','utf8'),context);
 return {app:context.IE104,dialog:node};
}
test('student feedback stays closed until an operation explicitly reports success',()=>{
 const {app,dialog}=setup();assert.equal(dialog.open,false);
 app.ui.studentSuccess('Done','Saved');assert.equal(dialog.open,true);assert.equal(dialog.parts.h2.textContent,'Done');assert.equal(dialog.parts.p.textContent,'Saved');
});
test('queued successes keep their own close callback and return focus',()=>{
 const {app,dialog}=setup();let focused=0,closed=0;
 const target={isConnected:true,disabled:false,focus:()=>focused++};
 app.ui.studentSuccess('First','Saved',{returnTo:target,onClose:()=>closed++});app.ui.studentSuccess('Second','Saved again');
 assert.equal(dialog.parts.h2.textContent,'First');dialog.click();assert.equal(closed,1);assert.equal(focused,1);assert.equal(dialog.parts.h2.textContent,'Second');assert.equal(dialog.open,true);dialog.close();assert.equal(dialog.open,false);assert.equal(closed,1);
});
test('student helper does not initialize or change lecturer pages',()=>{
 const {app,dialog}=setup('/pages/giang-vien/example.html');assert.equal(app,undefined);assert.equal(dialog,undefined);
});
