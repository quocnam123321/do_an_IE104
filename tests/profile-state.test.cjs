const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(context,files){vm.createContext(context); for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),context);return context.IE104;}
test('student legacy blank contact fields are filled; edited data and intentional clearing survive reload',()=>{
 let record={code:'24520001',name:'Tên đã sửa',email:'',phone:'',revision:2,updatedAt:'2026-11-28T00:00:00Z'};
 const ctx={IE104:{storage:{readProfile:()=>record,writeProfile:x=>record=x}}};
 const app=load(ctx,['assets/js/data/student-profile.js','assets/js/services/profile-service.js']);
 let state=app.services.profile.getState(); assert.equal(state.name,'Tên đã sửa');assert.ok(state.email);assert.ok(state.phone);assert.ok(state.major);
 app.services.profile.update({name:state.name,email:'',phone:''},state.revision);
 state=app.services.profile.getState();assert.equal(state.email,'');assert.equal(state.phone,'');
 assert.throws(()=>app.services.profile.update({name:'Other',email:'',phone:''},2),/tab khác/);
});
test('lecturer profile fills academic fields, preserves edits and rejects stale saves',async()=>{
 let raw=null;
 const ctx={location:{protocol:'http:'},localStorage:{getItem:()=>raw,setItem:(k,v)=>raw=v}};
 const app=load(ctx,['assets/js/data/proposal-actors.js','assets/js/services/lecturer-profile-service.js']);
 const service=app.services.lecturerProfile;let state=service.getState();
 for(const field of ['name','id','email','phone','faculty','department','degree','expertise'])assert.ok(state[field],field);
 await service.update({name:'Tên đã sửa',email:'saved@example.com',phone:'',expertise:'Web'},0,'GV001');
 state=service.getState();assert.equal(state.name,'Tên đã sửa');assert.equal(state.email,'saved@example.com');assert.equal(state.phone,'');
 await assert.rejects(()=>service.update({name:'Other',email:'other@example.com'},0,'GV001'),/tab khác/);
 const saved=JSON.parse(raw);delete saved.record.defaultsVersion;saved.record.email='';raw=JSON.stringify(saved);assert.ok(service.getState().email);
});
