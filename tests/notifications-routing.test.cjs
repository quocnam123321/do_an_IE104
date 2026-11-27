const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function setup() {
  const ctx = vm.createContext({URL}); ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/notifications-data.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/data/notification-details.js'),'utf8'),ctx);
  return ctx;
}
test('one list route preserves category and page across reload, links and history', () => {
  const ctx=setup(), routes=ctx.IE104_NOTIFICATION_ROUTES;
  for (const category of routes.categories) for (const page of [1,2,3]) {
    const url=routes.url('https://example.test/pages/chung/thong-bao.html',category,page);
    assert.equal(url.pathname,'/pages/chung/thong-bao.html');
    const parsed=routes.read(url.href);
    assert.equal(parsed.category.value,category.value); assert.equal(parsed.number,page);
  }
  for (const page of ['-1','0','abc','9007199254740993']) assert.equal(routes.read(`https://example.test/thong-bao.html?loai=invalid&trang=${page}`).number,1);
  assert.equal(routes.read('https://example.test/thong-bao.html?loai=invalid').category.value,'');
});
test('all article back links point at the shared list and retain the correct category', () => {
  const ctx=setup(), routes=ctx.IE104_NOTIFICATION_ROUTES;
  for(const item of ctx.IE104_NOTIFICATIONS) {
    const detail=ctx.IE104_NOTIFICATION_DETAILS[item.id]; assert.ok(detail,item.id);
    for(const key of ['back','filteredBack']) {
      const url=new URL(detail[key],'https://example.test/pages/chung/');
      assert.equal(url.pathname,'/pages/chung/thong-bao.html');
      assert.equal(url.hash,`#thong-bao-${item.id}`);
      if(key==='filteredBack') assert.equal(routes.read(url.href).category.value,item.category);
    }
  }
});
test('five removed duplicate pages have redirects; UIT source and detail stay separate', () => {
  const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
  const names=['ke-hoach-hoc-vu','bao-cao-nop-bai','lich-bao-ve','tong-ket-vinh-danh','trang-2'];
  for(const name of names) {
    const file=`thong-bao-${name}.html`;
    assert.equal(fs.existsSync(path.join(root,'pages/chung',file)),false);
    const redirect=config.hosting.redirects.find(item=>item.source===`/pages/chung/${file}`);
    assert.equal(redirect.type,301);
    assert.equal(redirect.destination,`/pages/chung/thong-bao.html?${name==='trang-2'?'trang=2':`loai=${name}`}`);
  }
  for(const file of ['thong-bao.html','thong-bao-uit.html','chi-tiet-thong-bao.html']) assert.ok(fs.existsSync(path.join(root,'pages/chung',file)));
});
