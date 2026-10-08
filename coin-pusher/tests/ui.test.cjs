const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
function loadUI(){
 class Node{constructor(id){this.id=id;this.textContent='';this.innerHTML='';this.disabled=false;this.open=false;this.children=[];this.handlers={};this.attributes={};this.classList={toggle:()=>{}};}addEventListener(type,fn){this.handlers[type]=fn;}setAttribute(k,v){this.attributes[k]=v;}querySelector(){return this.label||(this.label=new Node());}appendChild(x){this.children.push(x);}append(...xs){this.children.push(...xs);}showModal(){this.open=true;}close(){this.open=false;}}
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),nodes={};for(const m of html.matchAll(/id="([^"]+)"/g))nodes[m[1]]=new Node(m[1]);nodes.spinSlots.children=Array.from({length:4},()=>new Node());
 const doc={hidden:false,handlers:{},getElementById:id=>nodes[id],createElement:()=>new Node(),addEventListener(type,fn){this.handlers[type]=fn;}};
 let nextFrame;const s={console,document:doc,location:{reload:()=>{}},requestAnimationFrame:fn=>{nextFrame=fn;}};s.window=s;vm.createContext(s);
 for(const file of ['libs/matter.min.js','src/config.js','src/physics.js','src/rewards.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
 // Deterministic small win through the real public spin transition, not a debug award API.
 vm.runInContext('Math.random = function(){ return 0; }',s);s.COIN_PUSHER_CONFIG.rewards.all=3;
 let rewards,physics;const make=s.CoinPusherRewards.create;s.CoinPusherRewards.create=function(...args){return rewards=make(...args);};const create=s.CoinPusherPhysics.create;s.CoinPusherPhysics.create=function(...args){return physics=create(...args);};
 s.CoinPusherRenderer=function(){this.draw=()=>{};this.exit=()=>{};};
 vm.runInContext(fs.readFileSync(path.join(root,'src/main.js'),'utf8'),s);
 let time=0;return{s,nodes,doc,get rewards(){return rewards;},get physics(){return physics;},tick(ms){for(let elapsed=0;elapsed<ms;elapsed+=1000/60){time+=1000/60;nextFrame(time);}},space(){doc.handlers.keydown({target:{tagName:'BODY'},code:'Space',repeat:false,preventDefault(){}});}};
}
test('button and space key follow winning lock, not spinning lock; right panel has four slots',()=>{
 const u=loadUI();u.rewards.onTarget();u.tick(100);assert.equal(u.nodes.coinButton.disabled,false);const before=u.rewards.snapshot().credits;u.space();assert.equal(u.rewards.snapshot().credits,before-1);
 for(let i=0;i<8;i++)u.rewards.onTarget();u.tick(100);assert.equal(u.nodes.spinCount.textContent,'4 / 4');assert.equal(u.nodes.spinSlots.children.length,4);
 u.tick(1850);assert.equal(u.rewards.snapshot().inputLocked,true);assert.equal(u.nodes.coinButton.disabled,true);const locked=u.rewards.snapshot().credits;u.space();assert.equal(u.rewards.snapshot().credits,locked);assert.equal(u.rewards.canHit(),false);
 u.tick(1800);assert.equal(u.rewards.snapshot().inputLocked,false);assert.equal(u.nodes.coinButton.disabled,false);assert.equal(u.nodes.payoutDone.textContent,'3');u.physics.destroy();
});
test('offline entry has local assets and no canvas-click coin handler',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="([^\"]+)"/g)){const src=m[1].split('?')[0];assert.ok(!/^(https?:|\/)/.test(src));assert.ok(fs.existsSync(path.join(root,src)),src);}
 const main=fs.readFileSync(path.join(root,'src/main.js'),'utf8');assert.doesNotMatch(main,/canvas\.addEventListener\(['"](?:pointerdown|click)/);assert.doesNotMatch(main,/\bfetch\s*\(|\bimport\s+|\bexport\s+/);
});
