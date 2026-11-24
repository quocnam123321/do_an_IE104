const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const values=new Map();let fail=false;
 const context=vm.createContext({URL,URLSearchParams,console,Event,location:{protocol:'http:',pathname:'/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html',search:''},
 document:{dispatchEvent(){}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('full');values.set(k,v);}}});
 context.window=context;context.dispatchEvent=()=>{};
 for(const file of ['data/mock-data','data/student-projects','data/student-progress','data/student-evaluations','data/teaching-data','uit-lecturer-catalog','data/lecturer-topics','data/lecturer-merge-catalog','data/student-uit-catalog','shared/topic-identity','services/storage','services/lecturer-topic-repository','services/lecturer-topic-service','services/project-team-service','services/project-progress-service','services/evaluation-service','services/teaching-service','services/student-submissions-service','services/approved-project-service'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file+'.js'),'utf8'),context);
 const app=context.IE104;
 const recipient={id:'giang-vien-42',name:'Giảng viên thử',email:'test@uit.edu.vn',department:'Hệ thống thông tin'};
 let actor=recipient;
 context.IE104SupervisionEntry={getTeachers:async()=>[recipient,{id:'giang-vien-43',name:'GV khác'}]};
 app.services.invitationIdentity={resolve:async()=>actor};
 const project=app.data.myTopics.find(item=>item.status==='dang-thuc-hien');
 return {app,service:app.services.projectTeams,project,recipient,values,fail:()=>{fail=true;},setActor:value=>{actor=value;}};
}
async function invite(f){const state=f.service.getState(f.project.id);return f.service.inviteSupervisor(f.project.id,f.recipient.id,'Mời tham gia hướng dẫn',state.revision);}
test('SV sends; only recipient decides; approval persists membership and lecturer listing',async()=>{
 const f=setup();const state=await invite(f),inv=state.invitations[0];
 assert.equal(f.service.listInvitations(f.recipient.id).length,1);
 assert.equal(f.service.listInvitations('giang-vien-43').length,0);
 f.setActor({id:'giang-vien-43'});
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',state.revision),/không gửi/);
 f.setActor(f.recipient);f.app.data.currentLecturer=f.recipient;
 const accepted=await f.service.respondInvitation(f.project.id,inv.id,'accepted','',state.revision);
 assert.ok(accepted.supervisorIds.includes(f.recipient.id));
 assert.equal(f.service.listInvitations(f.recipient.id).length,0);
 assert.equal(f.service.getState(f.project.id).invitations[0].status,'accepted');
 assert.ok(f.app.services.teaching.listSupervisedProjects().some(item=>item.project.id===f.project.id));
 assert.equal(f.app.services.lecturerTopics.list('supervised')[0].role,'secondary');
 assert.equal(f.app.services.lecturerTopics.workspaceState(f.project.id).project.role,'secondary');
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',accepted.revision),/đã được xử lý/);
});
test('rejection requires reason, persists result, adds no supervisor',async()=>{
 const f=setup(),state=await invite(f),inv=state.invitations[0];
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'rejected','  ngắn  ',state.revision),/10 đến 2000/);
 const result=await f.service.respondInvitation(f.project.id,inv.id,'rejected','Không phù hợp lĩnh vực hướng dẫn',state.revision);
 assert.equal(result.invitations[0].decisionNote,'Không phù hợp lĩnh vực hướng dẫn');
 assert.ok(!result.supervisorIds.includes(f.recipient.id));
});
test('cancelled/stale/completed requests and failed storage cannot report success',async()=>{
 let f=setup(),state=await invite(f),inv=state.invitations[0];
 const cancelled=f.service.cancelInvitation(f.project.id,inv.id,state.revision);
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',state.revision),/đã thay đổi/);
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',cancelled.revision),/đã được xử lý/);
 f=setup();state=await invite(f);inv=state.invitations[0];f.project.status='hoan-thanh';
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',state.revision),/đã kết thúc/);
 f=setup();state=await invite(f);inv=state.invitations[0];f.fail();
 await assert.rejects(f.service.respondInvitation(f.project.id,inv.id,'accepted','',state.revision),/Chưa lưu/);
 assert.equal(f.service.getState(f.project.id).invitations[0].status,'pending');
});

test('shared demo lecturer receives and handles invitations to any recipient without changing invited lecturer',async()=>{
 const f=setup(),first=await invite(f),inv=first.invitations[0];
 const second=f.app.data.myTopics.find(item=>item.status==='dang-thuc-hien' && item.id!==f.project.id);
 await f.service.inviteSupervisor(second.id,'giang-vien-43','Lời mời cho giảng viên khác',0);
 const demo={id:'GV001',demo:true};f.setActor(demo);
 assert.equal(f.service.listInvitations(demo).length,2);
 assert.equal((await f.service.invitationDetail(f.project.id,inv.id)).invitation.id,inv.id);
 const saved=await f.service.respondInvitation(f.project.id,inv.id,'accepted','',first.revision);
 assert.equal(saved.invitations[0].decidedBy,'GV001');
 assert.equal(saved.invitations[0].demoDecision,true);
 assert.equal(saved.invitations[0].lecturerId,f.recipient.id);
 assert.ok(saved.supervisorIds.includes(f.recipient.id));
 assert.equal(f.service.listInvitations(demo).length,1);
 f.setActor({id:'giang-vien-99'});
 await assert.rejects(f.service.invitationDetail(second.id,f.service.getState(second.id).invitations[0].id),/không gửi/);
});
