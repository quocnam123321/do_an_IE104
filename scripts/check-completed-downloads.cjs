const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
global.window=global;global.location={protocol:'http:',pathname:'/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html',search:''};const memory=new Map();global.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};global.dispatchEvent=()=>{};
for(const n of ['data/mock-data','data/student-projects','data/student-progress','data/student-evaluations','data/teaching-data','uit-lecturer-catalog','data/lecturer-topics','data/lecturer-merge-catalog','data/student-uit-catalog','shared/topic-identity','services/storage','services/lecturer-topic-repository','services/lecturer-topic-service','services/project-team-service','services/project-progress-service','services/evaluation-service','services/teaching-service','services/student-submissions-service','services/published-topic-service','services/topic-service','services/student-topic-codes'])vm.runInThisContext(fs.readFileSync('web/assets/js/'+n+'.js','utf8'));
const app=IE104, sv=app.data.myTopics, gv=app.services.lecturerTopics.list('supervised').filter(app.services.lecturerTopics.isListedInSupervisedTab);
assert.equal(sv.length,23);assert.equal(gv.length,23);assert.equal(sv.filter(x=>x.status==='hoan-thanh').length,5);
for(const p of sv){const t=gv.find(x=>x.id===p.topicId);assert.ok(t);for(const key of ['title','semester','academicYear','groupName','status','role'])assert.equal(t[key],p[key],p.id+':'+key);assert.equal(t.workspaceId,p.id);const state=app.services.projectProgress.getState(p.id);const subs=app.services.studentSubmissions.forStudent(p.id);const teaching=app.services.teaching.getState(p.id);const evaluation=app.services.evaluations.getResult(p.id);if(p.status==='hoan-thanh'){assert.equal(p.academicYear,'2024-2025');assert.equal(app.services.projectTeams.getPermission(state.team).allowed,false);assert.equal(app.services.projectProgress.getPermissions(state).update,false);assert.equal(app.services.projectProgress.summarize(state).percent,100);assert.equal(subs.canUpload,false);assert.equal(subs.submissionsLocked,true);assert.equal(teaching.canManageRequirements,false);assert.equal(evaluation.status,'published');assert.equal(teaching.publication.score,evaluation.score);assert.ok(subs.requirements.every(x=>x.submitted&&x.locked));for(const submission of subs.submissions)assert.ok(Date.parse(submission.submittedAt)<Date.parse(evaluation.evaluatedAt));}else {assert.equal(evaluation.status,'unpublished');for(const s of ['chua-thuc-hien','dang-thuc-hien','da-hoan-thanh'])assert.ok(state.tasks.filter(x=>x.status===s).length>=10);}}
app.storage.writeTeachingRecords(app.data.teachingSeeds.filter(x=>sv.some(p=>p.id===x.projectId)));assert.equal(app.storage.readTeachingRecords().length,23);
assert.equal(app.services.topics.listMyTopics({statuses:['hoan-thanh']},{pageSize:100}).total,5);assert.equal(app.services.topics.listMyTopics({statuses:['dang-thuc-hien']},{pageSize:100}).total,18);
for(const term of ['1','2'])assert.ok(app.services.topics.listMyTopics({semesters:['2024-2025-'+term]},{pageSize:100}).total>0);
console.log(JSON.stringify({students:sv.length,lecturers:gv.length,completed:sv.filter(x=>x.status==='hoan-thanh').map(x=>({code:x.displayId,period:x.semester+' · '+x.academicYear,score:app.services.evaluations.getResult(x.id).score})),passed:true},null,2));


vm.runInThisContext(fs.readFileSync('web/assets/js/data/student-web-submissions.js','utf8'));
let count=0;
for(const project of sv){
 const state=app.services.studentSubmissions.forStudent(project.id);
 for(const submission of state.submissions){
  const file=app.data.studentWebSubmissions.attachment(project.id,submission);
  assert.ok(file,project.id+':'+submission.id);
  assert.ok(fs.existsSync('web/assets/files/'+file.path));
  assert.equal(app.data.studentWebSubmissions.attachment(project.id,{...submission,fileName:'changed.pdf'}),null);
  assert.equal(app.data.studentWebSubmissions.attachment(project.id,{...submission,files:[{name:'real.pdf'}]}),null);
  count++;
 }
 if(project.status==='hoan-thanh')assert.equal(state.canUpload,false);
}
console.log('PASS: '+count+' seeded downloads available; uploaded files preserved; completed uploads locked.');

process.exit(0);
