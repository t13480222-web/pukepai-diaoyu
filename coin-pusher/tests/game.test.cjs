const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function boot(seed=1) {
  const s={console};s.window=s;vm.createContext(s);
  for(const file of ['libs/matter.min.js','src/config.js','src/physics.js','src/rewards.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s,{filename:file});
  let n=seed;const random=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);
  return {s,C:s.COIN_PUSHER_CONFIG,random};
}
function gridRandom(C, grid) {
  let index=0;
  return ()=>{const key=grid[(index++)%grid.length];const i=C.symbols.findIndex(x=>x.key===key);return (i<0?C.symbols.length+.2:i+.2)/(C.symbols.length+C.reels.magicianWeight);};
}
function advance(r,C,ms,emit=()=>true) {for(let t=0;t<ms;t+=C.engine.fixedStepMs)r.update(C.engine.fixedStepMs,emit);}
const smallWin=['fan','fan','fan','hat','box','orb','gem','ring','cups'];
test('spinning allows input; waiting SPIN cap is 4, current spin excluded',()=>{
 const {s,C}=boot();const r=s.CoinPusherRewards.create({},gridRandom(C,smallWin));let inserted=0;const p={insert:()=>{inserted++;return{};}};
 for(let i=0;i<4;i++)assert.equal(r.onTarget(),true);
 assert.equal(r.onTarget(),false);assert.equal(r.snapshot().spinQueue,4);
 r.update(C.engine.fixedStepMs,()=>true);assert.equal(r.snapshot().spinQueue,3);assert.equal(r.snapshot().spinning,true);
 assert.equal(r.insert(p),true);assert.equal(inserted,1);
 assert.equal(r.onTarget(),true);assert.equal(r.onTarget(),false);assert.equal(r.snapshot().spinQueue,4);
});
test('win and payout lock model input / target; pending spins preserved; resume after final coin',()=>{
 const {s,C}=boot();const r=s.CoinPusherRewards.create({},gridRandom(C,smallWin));const p={insert:()=>({})};
 r.onTarget();r.update(C.engine.fixedStepMs,()=>true);r.onTarget();r.onTarget();
 advance(r,C,1850,()=>false);let st=r.snapshot();assert.equal(st.phase,'win');assert.equal(st.win,3);assert.equal(st.payout.total,3);
 assert.equal(r.insert(p),false);assert.equal(r.onTarget(),false);assert.equal(st.spinQueue,2);
 advance(r,C,2000,()=>false);st=r.snapshot();assert.equal(st.phase,'payout');assert.equal(st.payout.done,0);assert.equal(st.payout.remaining,3);assert.equal(st.spinQueue,2);
 r.setPaused(true);advance(r,C,500,()=>{throw Error('paused dispense');});assert.equal(r.snapshot().payout.remaining,3);
 r.setPaused(false);let emitted=0;advance(r,C,450,()=>{emitted++;return true;});
 assert.equal(emitted,3);assert.equal(r.snapshot().payout.done,3);assert.equal(r.snapshot().inputLocked,false);assert.equal(r.insert(p),true);assert.equal(r.onTarget(),true);
 r.update(C.engine.fixedStepMs,()=>true);assert.equal(r.snapshot().spinning,true);
});
test('100 awarded means 100 spawned, not 50; no credits until a front return',()=>{
 const {s,C}=boot();C.rewards.lineMultiplier=100;
 const r=s.CoinPusherRewards.create({},gridRandom(C,smallWin));r.onTarget();let emitted=0;
 advance(r,C,22000,()=>{emitted++;return true;});const st=r.snapshot();assert.equal(st.win,100);assert.equal(st.payout.total,100);assert.equal(st.payout.done,100);assert.equal(emitted,100);assert.equal(st.credits,C.input.initialCredits);
 r.onRecovered();assert.equal(r.snapshot().credits,C.input.initialCredits+1);
});
test('JP rows require magician; normal rows use bases; ALL settles once',()=>{
 const {s,C}=boot();const bases=Object.fromEntries(C.symbols.map(x=>[x.key,8]));
 assert.equal(s.CoinPusherRewards.evaluate(smallWin,bases)[0].points,24);
 for(const [row,name] of [[0,'JP2'],[1,'JP1'],[2,'JP3']]){
 const grid=['fan','hat','box','orb','gem','umbrella','ring','cups','fan'];grid.splice(row*3,3,'magician','magician','magician');const es=s.CoinPusherRewards.evaluate(grid,bases);assert.equal(es[0].name,name);assert.equal(es[0].points,C.rewards[name.toLowerCase()]);}
 const all=s.CoinPusherRewards.evaluate(Array(9).fill('fan'),bases);assert.equal(all.length,1);assert.equal(all[0].points,C.rewards.all);
});
test('wiper gap and clearance, angle lock, tokens leave through middle',()=>{
 const {s,C,random}=boot();assert.ok(C.board.pegStartY-C.board.pegRadius-(C.wiper.pivotY+C.wiper.length)>80);
 const p=s.CoinPusherPhysics.create({},random);const t=p.insert();assert.ok(t);assert.ok(Math.abs(t.body.position.x-C.wiper.pivotX)<C.wiper.gap/2-C.token.radius);
 const a=p.snapshot().wiperAngle;p.toggleWiper();for(let i=0;i<30;i++)p.step(C.engine.fixedStepMs);assert.notEqual(p.snapshot().wiperAngle,a);
 p.toggleWiper();const locked=p.snapshot().wiperAngle;for(let i=0;i<120;i++)p.step(C.engine.fixedStepMs);assert.equal(p.snapshot().wiperAngle,locked);
 p.destroy();
});
test('reward coins start on upper board and never generate SPIN; locked target ignores player hits',()=>{
 const {s,C,random}=boot();let hits=0,top=0,channels=0;
 const p=s.CoinPusherPhysics.create({onTargetHit:()=>{hits++;return true;},onDispensed:t=>{assert.equal(t.stage,'board');assert.equal(t.source,'reward');top++;},onChannel:()=>channels++},random);
 p.setTargetEnabled(false);
 for(let i=0;i<600;i++){if(i%60===0)p.insert();if(i%60===30)p.dispense();p.step(C.engine.fixedStepMs);}
 assert.equal(hits,0);assert.ok(top>0);assert.ok(channels>0);
 p.destroy();
 const p2=s.CoinPusherPhysics.create({onTargetHit:t=>{assert.equal(t.source,'player');hits++;return true;}},random);
 for(let i=0;i<1200;i++){if(i%45===0)p2.dispense();p2.step(C.engine.fixedStepMs);}assert.equal(hits,0);
 for(let i=0;i<1500;i++){if(i%45===0)p2.insert();p2.step(C.engine.fixedStepMs);}assert.ok(hits>0);assert.ok(p2.snapshot().pegContacts>0);p2.destroy();
});
test('stacked coin falls when supporting coin leaves; 2.5D coordinates stay finite',()=>{
 const {s,C,random}=boot();const p=s.CoinPusherPhysics.create({},random);
 const upper=p.renderData().tokens.find(t=>t.supportId!==null);assert.ok(upper&&upper.z===C.layers.thickness);
 const lower=p.renderData().tokens.find(t=>t.id===upper.supportId);s.Matter.Body.translate(lower.body,{x:1000,y:1000});
 for(let i=0;i<60;i++)p.step(C.engine.fixedStepMs);
 assert.equal(upper.supportId,null);assert.equal(upper.z,0);
 assert.ok(p.renderData().tokens.every(t=>Number.isFinite(t.body.position.x)&&Number.isFinite(t.z)));p.destroy();
});
test('distribution is central with variation, not forced per-coin routing',()=>{
 const {s,C,random}=boot(42);const bins=Array(8).fill(0),ages=[];const p=s.CoinPusherPhysics.create({onChannel:t=>{bins[t.channel]++;ages.push(t.age);}},random);
 for(let i=0;i<3200;i++){if(i%45===0&&i<2300)p.insert();p.step(C.engine.fixedStepMs);}
 assert.ok(bins.filter(x=>x>0).length>=4);assert.ok(bins[3]+bins[4]>bins[0]+bins[7]);assert.ok(ages.reduce((a,b)=>a+b,0)/ages.length<5000);p.destroy();
});
test('100-coin batch: full issue, side losses, below 50 front returns on reproducible seeds',()=>{
 for(const seed of [1,3,5]){
 const {s,C,random}=boot(seed);const p=s.CoinPusherPhysics.create({},random);
 for(let i=0;i<600;i++)p.step(C.engine.fixedStepMs);const start=p.snapshot();let issued=0;
 for(let i=0;i<7500;i++){if(i%9===0&&issued<100&&p.dispense())issued++;p.step(C.engine.fixedStepMs);assert.ok(p.snapshot().tokenCount<=C.token.maxCount);}
 const end=p.snapshot();assert.equal(issued,100);assert.ok(end.lost-start.lost>0);assert.ok(end.recovered-start.recovered<=50);assert.ok(end.stacked>0);
 assert.equal(end.tokenCount+end.lost+end.recovered,C.table.seedColumns*C.table.seedRows+Math.ceil(C.table.seedColumns*C.table.seedRows/C.layers.seedEvery)+100);
 p.destroy();
 }
});
