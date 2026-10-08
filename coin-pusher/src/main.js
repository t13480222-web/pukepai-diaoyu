(function(global){
  'use strict';
  var C=global.COIN_PUSHER_CONFIG,$=function(id){return document.getElementById(id);};
  var canvas=$('gameCanvas'),renderer=new global.CoinPusherRenderer(canvas),paused=false,hidden=false;
  var notice='调整雨刷角度，再按 START。',noticeLife=C.visual.noticeMs;
  var rewards=global.CoinPusherRewards.create({onNotice:function(message){notice=message;noticeLife=C.visual.noticeMs;}});
  var audio=null,sound=false,lastSound=0;
  function tone(freq){if(!sound||!audio||audio.state!=='running'||audio.currentTime-lastSound<.035)return;
    lastSound=audio.currentTime;var o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13);o.onended=function(){o.disconnect();g.disconnect();};}
  var physics=global.CoinPusherPhysics.create({
    onChannel:function(t){rewards.onChannel(t);tone(520);},
    onTargetHit:function(){var accepted=rewards.onTarget();if(accepted)tone(960);return accepted;},
    onRecovered:function(t){rewards.onRecovered(t);renderer.exit(t,'front');tone(740);},
    onLost:function(t){renderer.exit(t,'side');},
    onDispensed:function(){tone(620);},
    onPeg:function(){tone(1300);}
  });
  function syncPause(){var stop=paused||hidden;physics.setPaused(stop);rewards.setPaused(stop);$('pauseButton').innerHTML=paused?'继续 <kbd>P</kbd>':'暂停 <kbd>P</kbd>';}
  function insert(){if(paused||hidden)return;if(rewards.insert(physics))tone(400);updateHud();}
  function toggleWiper(){if(paused||hidden)return;physics.toggleWiper();updateHud();}
  function togglePause(){paused=!paused;syncPause();updateHud();}
  function set(id,value){var e=$(id),text=String(value);if(e.textContent!==text)e.textContent=text;}
  var historyKey='';
  function updateHud(){var s=rewards.snapshot(),p=physics.snapshot(),out=s.payout;
    set('credits',s.credits);set('paid',s.paid);set('lost',p.lost);set('remaining',out.remaining);set('payoutTotal',out.total);set('payoutDone',out.done);set('win',s.win+' 枚');
    set('tableState',p.tokenCount+' / '+C.token.maxCount+' 枚在台 · '+p.stacked+' 枚叠放');set('version',C.version);
    set('spinCount',s.spinQueue+' / '+s.spinCapacity);
    set('spinHint',s.inputLocked?'出奖期间感应关闭':s.spinning?'当前正在开奖 · 可继续投币':s.spinQueue===s.spinCapacity?'缓存已满 · 等待开奖':'命中币斗储存一次机会');
    Array.from($('spinSlots').children).forEach(function(e,i){e.classList.toggle('filled',i<s.spinQueue);});
    $('payoutProgress').max=Math.max(1,out.total);$('payoutProgress').value=out.done;
    $('hopperLamp').classList.toggle('active',out.remaining>0&&!paused);
    set('payoutHint',s.phase==='win'?'已中奖，投币与 SPIN 感应已锁定。':out.remaining?(p.tokenCount>=C.token.maxCount?'台面已满，余币保留，等待空位。':paused?'已暂停出币。':'奖励币从上方投币口落下，侧口落币不返还。'):'中奖数量全额发出，从顶部投币口经过钉板。');
    var button=$('wiperButton');button.setAttribute('aria-pressed',String(p.wiperSwinging));button.querySelector('b').textContent=p.wiperSwinging?'锁定雨刷':'雨刷摆动';
    set('wiperState',(p.wiperAngle*180/Math.PI).toFixed(0)+'° · '+(p.wiperSwinging?'再次点击锁定':'当前位置已锁定'));
    $('coinButton').disabled=paused||hidden||p.tokenCount>=C.token.maxCount||s.inputLocked||(!s.stack&&s.credits<=0)||!!(s.stack&&s.stack.shots>=C.stack.chances);
    $('wiperButton').disabled=paused;set('status',paused?'已暂停':s.inputLocked?'中奖出币中，发完后恢复投币和 SPIN。':s.spinning?'转盘运行中，可继续投币积累机会。':s.stack?'叠叠乐：剩余 '+(C.stack.chances-s.stack.shots)+' 次免费投币。':noticeLife>0?notice:'先锁定雨刷，再按 START 投币。');
    var key=s.history.map(function(h){return h.id+':'+h.coins;}).join('|');if(key!==historyKey){historyKey=key;var list=$('winHistory');list.textContent='';s.history.slice(0,4).forEach(function(h){var li=document.createElement('li'),label=document.createElement('span'),n=document.createElement('b');label.textContent=h.name;n.textContent='+'+h.coins;li.append(label,n);list.appendChild(li);});}
  }
  $('coinButton').addEventListener('click',insert);$('wiperButton').addEventListener('click',toggleWiper);$('pauseButton').addEventListener('click',togglePause);
  $('resetButton').addEventListener('click',function(){global.location.reload();});
  $('helpButton').addEventListener('click',function(){paused=true;syncPause();$('rulesDialog').showModal();});
  $('closeRules').addEventListener('click',function(){$('rulesDialog').close();});
  $('soundButton').addEventListener('click',function(){sound=!sound;if(sound){var AC=global.AudioContext||global.webkitAudioContext;if(AC){audio=audio||new AC();audio.resume().catch(function(){});}else sound=false;}this.textContent=sound?'音效开':'音效关';this.setAttribute('aria-pressed',String(sound));});
  document.addEventListener('keydown',function(e){
    if($('rulesDialog').open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)insert();}
    if(e.code==='KeyW'){e.preventDefault();if(!e.repeat)toggleWiper();}
    if(e.code==='KeyP'){e.preventDefault();if(!e.repeat)togglePause();}
  });
  var last=null,accumulator=0;
  document.addEventListener('visibilitychange',function(){hidden=document.hidden;last=null;accumulator=0;syncPause();});
  function frame(now){var elapsed=last===null?0:Math.min(C.engine.maxFrameMs,Math.max(0,now-last));last=now;
    if(!paused&&!hidden){accumulator+=elapsed;var steps=0;while(accumulator>=C.engine.fixedStepMs&&steps<C.engine.maxSubSteps){physics.setTargetEnabled(rewards.canHit());physics.step(C.engine.fixedStepMs);rewards.update(C.engine.fixedStepMs,physics.dispense);noticeLife=Math.max(0,noticeLife-C.engine.fixedStepMs);accumulator-=C.engine.fixedStepMs;steps++;}}else accumulator=0;
    physics.setTargetEnabled(rewards.canHit());renderer.draw(physics.renderData(),rewards.snapshot(),noticeLife>0?notice:'',paused||hidden?0:elapsed);updateHud();global.requestAnimationFrame(frame);
  }
  updateHud();global.requestAnimationFrame(frame);
}(window));
