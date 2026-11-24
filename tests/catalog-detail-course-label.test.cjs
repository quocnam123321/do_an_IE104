const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function catalog(){
 const context=vm.createContext({URL,location:{protocol:'http:'}});context.window=context;
 for(const file of ['uit-lecturer-catalog.js','shared/student-course-label.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js',file),'utf8'),context);
 return context;
}
test('thesis and graduation course codes appear only in details for both roles',()=>{
 const context=catalog(), data=context.UITLecturerCatalog;
 for(const [types,label,code] of [[['thesis','khoa-luan'],'Khóa luận tốt nghiệp','IE505'],[['graduation','do-an-tot-nghiep'],'Đồ án tốt nghiệp','IE501']]){
  for(const type of types){
   const topic={type,typeLabel:label,courseLabel:label};
   assert.equal(data.subjectLabel(topic),label);
   assert.equal(data.subjectLabel(topic,true),code+' - '+label);
   assert.equal(context.IE104.ui.studentCourseLabel(topic),label);
   assert.equal(context.IE104.ui.studentCourseLabel(topic,true),code+' - '+label);
  }
 }
 for(const record of data.records){
  const text=data.subjectLabel(record,true);
  if(record.topicType==='thesis')assert.equal(text,'IE505 - Khóa luận tốt nghiệp');
  if(record.topicType==='graduation')assert.equal(text,'IE501 - Đồ án tốt nghiệp');
 }
 assert.equal(data.subjectLabel({topicType:'course',course:'web'},true),'IE104 - Internet và công nghệ web');
 assert.equal(data.subjectLabel({topicType:'course',course:'web'}),'Internet và công nghệ web');
});
