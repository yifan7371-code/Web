const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/ROG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname,'..');
const phase = process.argv[2];
const folder = {task1:'任务1_事件委托',bug:'任务2_缺陷调试/修复前',fixed:'任务2_缺陷调试/修复后',task3:'任务3_编辑功能'}[phase];
const folderPath = path.join(root,folder);
const evidence = path.join(root,'docs','week08','运行截图');
const records = [];
const logs = [];
const errors = [];
const comparisonChecks = [];
const seed = [
 {id:101,text:'整理 DOM 与事件流笔记',completed:false},
 {id:102,text:'检查列表的点击边界',completed:false},
 {id:103,text:'复查第七周的数据保存',completed:true}
];
fs.mkdirSync(evidence,{recursive:true});
const server = http.createServer((req,res)=>{
 const file = decodeURIComponent(req.url.split('?')[0]).slice(1)||'index.html';
 if(!['index.html','app.js','style.css'].includes(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');
 res.end(fs.readFileSync(path.join(folderPath,file)));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1120,height:720},deviceScaleFactor:1});
 page.on('console',msg=>{if(msg.type()==='log'||msg.type()==='error')logs.push(msg.text());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   window.__listenerRecords=[];
   const original=EventTarget.prototype.addEventListener;
   EventTarget.prototype.addEventListener=function(type,fn,options){
     if(this instanceof Element)window.__listenerRecords.push({tag:this.tagName,id:this.id,type});
     return original.call(this,type,fn,options);
   };
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 async function data(){return page.evaluate(()=>JSON.parse(JSON.stringify(todos)));}
 async function reset(){
   await page.evaluate(tasks=>{todos=structuredClone(tasks);currentFilter='all';localStorage.setItem('todos',JSON.stringify(todos));message.textContent='';render();},seed);
   logs.length=0;errors.length=0;
 }
 async function blank(){const p=await page.locator('#todo-list').evaluate(e=>({x:Math.floor(e.clientWidth/2),y:e.clientHeight-6}));await page.locator('#todo-list').click({position:p});}
 async function test(name,fn){await reset();await fn();assert.equal(errors.length,0);records.push({scene:name,result:'通过',logs:[...logs],data:await data()});console.log('PASS '+name);}
 async function screenshot(name,title,action,result){
   await page.evaluate(({title,action,result,logs})=>{
     const s=document.createElement('style');
     s.textContent=`body{padding:22px 500px 22px 22px!important}.todo-card{padding:25px!important;width:100%!important}.todo-card h1{font-size:30px;margin-bottom:22px}.todo-controls{gap:8px}.todo-controls input{padding:12px}.todo-item{gap:8px}.delete-btn{padding:8px}#record{position:fixed;top:22px;right:22px;width:455px;bottom:22px;background:#182433;border-radius:12px;padding:25px;color:#e8edf4;font:17px/1.65 "Microsoft YaHei",sans-serif}#record h2{font-size:25px;margin:10px 0 16px;line-height:1.4}#record .label{font-size:14px;color:#aebdd0}#record pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#0d1723;padding:16px;border-radius:8px;font:19px/1.7 Consolas,"Microsoft YaHei",monospace;min-height:145px}#record .result{border-left:3px solid #91c5b2;padding-left:15px;color:#d2eade}`;
     s.id='capture-style';document.head.appendChild(s);
     const box=document.createElement('aside');box.id='record';
     for(const [tag,cls,text] of [['div','label','第8周实验 · 浏览器实测'],['h2','',title],['p','',action],['p','label','Chrome 控制台输出采集'],['pre','',logs.join('\n')||'无新增操作日志'],['p','result',result]]){
       const e=document.createElement(tag);e.className=cls;e.textContent=text;box.appendChild(e);
     }
     document.body.appendChild(box);
   },{title,action,result,logs:[...logs]});
   await page.screenshot({path:path.join(evidence,name)});
   await page.evaluate(()=>{document.getElementById('record').remove();document.getElementById('capture-style').remove();});
 }
 await reset();
 if(phase==='bug'){
   await page.locator('[data-id="101"] [data-action="delete"] span').click();
   assert.deepEqual(logs,['[delete] 101','[toggle] 101']);
   assert.equal((await data()).length,2);
   records.push({scene:'模板缺陷复现',result:'已复现',logs:[...logs],data:await data()});
   await screenshot('任务2_修复前.png','任务删掉了 仍多调用一次','点击任务101的删除按钮内文字。列表由3项变为2项。','删除之后又进入 toggleTodo；页面外观没有暴露多余调用。');
 }else{
   await test('点击任务文字，只切换',async()=>{await page.locator('[data-id="101"] .todo-text').click();assert.equal((await data())[0].completed,true);assert.equal((await data()).length,3);assert.deepEqual(logs,['[toggle] 101']);});
   await test('点击删除按钮，只删除',async()=>{await page.locator('[data-id="101"] [data-action="delete"]').click({position:{x:3,y:3}});assert.equal((await data()).some(t=>t.id===101),false);assert.deepEqual(logs,['[delete] 101']);});
   await test('点击删除按钮内部文字，正确删除',async()=>{await page.locator('[data-id="102"] [data-action="delete"] span').click();assert.equal((await data()).some(t=>t.id===102),false);assert.deepEqual(logs,['[delete] 102']);});
   await test('点击列表空白，无异常且数据不变',async()=>{await blank();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);});
   await test('动态新增任务，无需绑定即可交互',async()=>{await page.locator('#todo-input').fill('动态新增的测试任务');await page.locator('#add-btn').click();assert.equal((await data()).at(-1).id,104);if(phase==='task3'){page.once('dialog',d=>d.accept('动态任务也能编辑'));await page.locator('[data-id="104"] [data-action="edit"] span').click();assert.equal((await data()).at(-1).text,'动态任务也能编辑');}await page.locator('[data-id="104"] .todo-text').click();assert.equal((await data()).at(-1).completed,true);await page.locator('[data-id="104"] [data-action="delete"] span').click();assert.deepEqual(logs,phase==='task3'?['[edit] 104 动态任务也能编辑','[toggle] 104','[delete] 104']:['[toggle] 104','[delete] 104']);assert.equal((await data()).length,3);});
   await test('父容器只绑定一次，子节点不绑定',async()=>{const r=await page.evaluate(()=>window.__listenerRecords);assert.equal(r.filter(x=>x.id==='todo-list'&&x.type==='click').length,1);assert.equal(r.filter(x=>x.tag==='LI'||x.tag==='INPUT'&&/^todo-\d+$/.test(x.id)).length,0);});
   if(phase==='task1'){
     await reset();await page.locator('[data-id="101"] .todo-text').click();
     await screenshot('任务1_事件委托.png','文字点击由父容器处理','点击任务文字后，任务101由进行中变为已完成。','稳定的 ul 上只有1个 click 监听器；动态节点没有单独绑定监听器。');
   }
   if(phase==='fixed'){
     await reset();await page.locator('[data-id="101"] [data-action="delete"] span').click();
     const before=await data();await blank();assert.deepEqual(await data(),before);assert.deepEqual(logs,['[delete] 101']);assert.equal(errors.length,0);
     await screenshot('任务2_修复后.png','删除与切换已经互斥','先删除任务101，再点列表底部空白。','只打印 [delete] 101；空白点击没有新增日志，剩余2条任务保持不变，异常数为0。');
   }
   if(phase==='task3'){
     // 独立的反例对照，不注入提交的应用，也不当作偶发故障。
     comparisonChecks.push(await page.evaluate(()=>{try{new Function("return t.text")();return {case:'父回调直接读取未定义的 t.text',unexpected:'未报错'};}catch(e){return {case:'父回调直接读取未定义的 t.text',error:e.name,message:e.message};}}));
     comparisonChecks.push(await page.evaluate(()=>{try{const text=null;text.trim();return {case:'取消后直接 trim',unexpected:'未报错'};}catch(e){return {case:'取消后直接 trim',error:e.name,message:e.message};}}));
     assert.equal(comparisonChecks[0].error,'ReferenceError');
     assert.equal(comparisonChecks[1].error,'TypeError');
     await test('正常编辑去除首尾空格，并保留完成状态',async()=>{page.once('dialog',d=>d.accept('  整理事件委托验证记录  '));await page.locator('[data-id="103"] [data-action="edit"] span').click();assert.deepEqual((await data())[2],{id:103,text:'整理事件委托验证记录',completed:true});assert.deepEqual(logs,['[edit] 103 整理事件委托验证记录']);assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('todos'))),await data());});
     await screenshot('任务3_编辑结果.png','编辑文字 完成状态保留','修改已完成的任务103，输入首尾含空格的新内容并确认。','新文字经过 trim 后保存，任务仍是已完成；点击编辑没有触发 toggle。');
     await test('取消编辑，不改变数据和存储',async()=>{page.once('dialog',d=>d.dismiss());await page.locator('[data-id="101"] [data-action="edit"]').click();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('todos'))),seed);});
     for(const value of ['', '   '])await test(value===''?'空字符串不修改':'纯空格不修改',async()=>{page.once('dialog',d=>d.accept(value));await page.locator('[data-id="101"] [data-action="edit"]').click();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('todos'))),seed);assert.match(await page.locator('#todo-message').textContent(),/不能为空/);});
     await screenshot('任务3_空输入.png','空输入停在更新之前','点击任务101的编辑，输入三个空格并确认。','提示内容不能为空；原文字、完成状态与存储内容均不变，没有 [edit] 或 [toggle] 日志。');
     await test('筛选中编辑后刷新，仍保留完整数据',async()=>{await page.locator('[data-filter="completed"]').click();page.once('dialog',d=>d.accept('筛选中修改的任务'));await page.locator('[data-id="103"] [data-action="edit"]').click();await page.reload();assert.equal((await data()).length,3);assert.equal((await data())[2].text,'筛选中修改的任务');assert.equal((await data())[2].completed,true);});
     await test('复选框鼠标点击只切换一次',async()=>{await page.locator('#todo-101').click();assert.equal((await data())[0].completed,true);assert.deepEqual(logs,['[toggle] 101']);});
     await test('复选框 Space 只切换一次',async()=>{await page.locator('#todo-101').focus();await page.keyboard.press('Space');assert.equal((await data())[0].completed,true);assert.deepEqual(logs,['[toggle] 101']);});
     await test('缺少 id 时不修改',async()=>{await page.locator('[data-id="101"]').evaluate(e=>e.removeAttribute('data-id'));await page.locator('.todo-text').first().click();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);});
     await test('内容未变化时不写入存储、不重画',async()=>{await page.evaluate(()=>{window.__beforeItem=list.firstElementChild;window.__saveCalls=0;window.__originalSave=save;save=()=>{window.__saveCalls++;return window.__originalSave();};});page.once('dialog',d=>d.accept('  整理 DOM 与事件流笔记  '));await page.locator('[data-id="101"] [data-action="edit"]').click();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);assert.deepEqual(await page.evaluate(()=>({sameItem:list.firstElementChild===window.__beforeItem,saveCalls:window.__saveCalls})),{sameItem:true,saveCalls:0});assert.match(await page.locator('#todo-message').textContent(),/没有变化/);await page.evaluate(()=>{save=window.__originalSave;});});
     await test('不存在的任务 id 不产生更新',async()=>{await page.evaluate(()=>updateTodo(999,'不应写入'));assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('todos'))),seed);});
     await test('未知操作按钮不触发状态切换',async()=>{await page.locator('[data-id="101"]').evaluate(li=>{const b=document.createElement('button');b.dataset.action='unknown';b.textContent='未知操作';li.appendChild(b);});await page.locator('[data-action="unknown"]').click();assert.deepEqual(await data(),seed);assert.deepEqual(logs,[]);});
     await test('更新产生新数组且保留原对象，非目标任务引用不变',async()=>{await page.evaluate(()=>{window.__oldTodos=todos;window.__oldEdited=todos[0];window.__oldOther=todos[1];});page.once('dialog',d=>d.accept('只修改第一条的文字'));await page.locator('[data-id="101"] [data-action="edit"]').click();assert.deepEqual(await page.evaluate(()=>({newArray:todos!==window.__oldTodos,newObject:todos[0]!==window.__oldEdited,oldText:window.__oldEdited.text,sameOther:todos[1]===window.__oldOther})),{newArray:true,newObject:true,oldText:seed[0].text,sameOther:true});});
     await test('保存失败时提示刷新风险，原存储不被伪报成功',async()=>{await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('测试：模拟存储写入失败');};});try{page.once('dialog',d=>d.accept('保存失败测试文本'));await page.locator('[data-id="101"] [data-action="edit"]').click();assert.equal((await data())[0].text,'保存失败测试文本');assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('todos'))),seed);assert.match(await page.locator('#todo-message').textContent(),/未能保存/);assert.equal(logs.filter(x=>x.startsWith('[edit]')).length,1);assert.equal(logs.some(x=>x.includes('Todo 保存失败')),true);}finally{await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});}});
   }
 }
 const result={task:folder,browser:browser.version(),captured:new Date().toISOString(),records,comparisonChecks,unhandledErrors:errors};
 fs.writeFileSync(path.join(evidence,`${phase}_验证.json`),JSON.stringify(result,null,2));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
