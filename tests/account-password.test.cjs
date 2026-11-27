const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
function setup() {
 const records = new Map([['ie104.website.session.v2.student','demo'],['ie104.website.session.v2.lecturer','demo']]);
 let blocked = false;
 const context = {crypto:webcrypto,TextEncoder,Uint8Array,localStorage:{getItem:k=>records.get(k)??null,setItem:(k,v)=>{if(blocked)throw new Error('quota');records.set(k,v);}},console};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('assets/js/services/account-password.js','utf8'),context);
 return {service:context.IE104.services.accountPassword,records,block:()=>blocked=true};
}
test('demo password change verifies old password, stores only hash and survives service reload', async()=>{
 const {service,records}=setup();
 assert.equal(await service.verifyDemo('student','Demo1234'),true);
 await service.change('student',{current:'Demo1234',next:'NewDemo987',confirm:'NewDemo987'});
 assert.equal(await service.verifyDemo('student','Demo1234'),false);
 assert.equal(await service.verifyDemo('student','NewDemo987'),true);
 assert.equal(await service.verifyDemo('lecturer','Demo1234'),true);
 const saved=records.get('ie104.demo.password.v1.student');
 assert.ok(!saved.includes('NewDemo987')&&!saved.includes('Demo1234'));
 const record=JSON.parse(saved); assert.equal(record.hash.length,64); assert.equal(record.salt.length,32);
});
test('wrong current password, invalid confirmation and short new password never persist',async()=>{
 const {service,records}=setup();
 await assert.rejects(()=>service.change('student',{current:'wrong',next:'NewDemo987',confirm:'NewDemo987'}),/không đúng/);
 await assert.rejects(()=>service.change('student',{current:'Demo1234',next:'NewDemo987',confirm:'different'}),/chưa khớp/);
 await assert.rejects(()=>service.change('student',{current:'Demo1234',next:'short',confirm:'short'}),/8 đến 128/);
 assert.equal(records.has('ie104.demo.password.v1.student'),false);
});
test('failed storage and damaged saved credentials never report success or replace data',async()=>{
 const a=setup(); a.block();
 await assert.rejects(()=>a.service.change('student',{current:'Demo1234',next:'NewDemo987',confirm:'NewDemo987'}),/Chưa lưu/);
 assert.equal(await a.service.verifyDemo('student','Demo1234'),true);
 const b=setup(); b.records.set('ie104.demo.password.v1.student','broken');
 await assert.rejects(()=>b.service.verifyDemo('student','Demo1234'),/Không đọc/);
 assert.equal(b.records.get('ie104.demo.password.v1.student'),'broken');
});
test('signed out sessions cannot change passwords',async()=>{
 const {service,records}=setup(); records.delete('ie104.website.session.v2.student');
 await assert.rejects(()=>service.change('student',{current:'Demo1234',next:'NewDemo987',confirm:'NewDemo987'}),/đăng nhập lại/);
});
