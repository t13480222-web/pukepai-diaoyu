(function (global) {
  'use strict';
  var C=global.COIN_PUSHER_CONFIG;
  // Pure evaluator: only the displayed grid can award a line or jackpot.
  function evaluate(grid,bases) {
    var events=[], same=function(indices,key){return indices.every(function(i){return grid[i]===key;});};
    if(grid.length!==9)return events;
    if(grid.every(function(k){return k===grid[0];}))return[{name:'ALL · 全盘奖',points:C.rewards.all,indices:[0,1,2,3,4,5,6,7,8]}];
    for(var row=0;row<3;row++){
      var ids=[row*3,row*3+1,row*3+2],key=grid[ids[0]];
      if(!same(ids,key))continue;
      if(key==='magician'){
        var jp=C.reels.jpRows[row];events.push({name:jp.toUpperCase(),points:C.rewards[jp],indices:ids});
      }else if(bases[key]!==undefined)events.push({name:'横线 · '+label(key),points:bases[key]*C.rewards.lineMultiplier,indices:ids});
    }
    [[0,4,8],[2,4,6]].forEach(function(ids,i){var key=grid[ids[0]];if(!same(ids,key))return;
      if(key==='magician')events.push({name:i?'叠叠乐':'小玛丽',bonus:i?'stack':'mary',points:0,indices:ids});
      else if(bases[key]!==undefined)events.push({name:'斜线 · '+label(key),points:bases[key]*C.rewards.diagonalMultiplier,indices:ids});
    });
    return events;
  }
  function label(key){var s=C.symbols.find(function(x){return x.key===key;});return s?s.label:'魔术师';}
  function create(hooks, random) {
    hooks = hooks || {}; random = random || Math.random;
    var bases = {}, credits = C.input.initialCredits, earned = 0, paid = 0, win = 0;
    var time = 0, paused = false, history = [], historyId = 0;
    C.symbols.forEach(function (s) { bases[s.key] = s.base; });
    var payout = { total: 0, done: 0, remaining: 0, clock: 0, name: '' };
    var spinQueue = 0, spin = null, winHold = 0, lastChannel = null, channelFlash = 0;
    var grid = ['fan', 'hat', 'box', 'orb', 'gem', 'umbrella', 'ring', 'cups', 'magician'];
    var winning = [], stack = null;
    function notify(message) { if (hooks.onNotice) hooks.onNotice(message); }
    function inputLocked() { return paused || winHold > 0 || payout.remaining > 0; }
    function phase() {
      if (winHold > 0) return 'win';
      if (payout.remaining > 0) return 'payout';
      if (spin && !spin.settled) return 'spinning';
      if (stack) return 'stack';
      return 'ready';
    }
    function award(points, name) {
      var n = Math.floor(points / C.payout.pointsPerCoin);
      if (n <= 0) return;
      if (!payout.remaining) { payout.total = 0; payout.done = 0; payout.clock = 0; payout.name = ''; }
      payout.name += (payout.name ? ' / ' : '') + name;
      payout.total += n; payout.remaining += n; earned += n; win += n;
      winHold = C.reels.resultHoldMs;
      history.unshift({ id: ++historyId, name: name, coins: n }); history = history.slice(0, 8);
      notify(name + ' · ' + n + ' 枚');
    }
    function choose() {
      var total = C.symbols.length * C.reels.normalWeight + C.reels.magicianWeight, roll = random() * total;
      return roll >= C.symbols.length * C.reels.normalWeight ? 'magician' : C.symbols[Math.floor(roll / C.reels.normalWeight)].key;
    }
    function startSpin() {
      spin = { elapsed: 0, final: Array.from({ length: 9 }, choose), lastTick: -1, settled: false };
      winning = [];
    }
    function beginStack() {
      if (!stack) stack = { shots: 0, pending: 0, counts: {}, elapsed: 0 };
      notify('叠叠乐：6 次免费 START');
    }
    function finishStack() {
      if (!stack) return;
      var points = 0, max = 0;
      C.symbols.forEach(function (s) { var n = stack.counts[s.key] || 0; points += n * bases[s.key]; max = Math.max(max, n); });
      if (max >= C.stack.matchCount) points *= C.stack.allSameMultiplier;
      win = 0; award(points, '叠叠乐结算');
      if (!points) notify('叠叠乐结束：没有命中通道');
      stack = null;
    }
    function onChannel(coin) {
      var item = C.symbols[coin.channel]; if (!item) return;
      var key = item.key; bases[key]++; lastChannel = key; channelFlash = C.visual.noticeMs;
      if (!inputLocked()) notify(label(key) + ' 底分 +1 → ' + bases[key]);
      if (stack && coin.source === 'stack') {
        stack.pending = Math.max(0, stack.pending - 1);
        stack.counts[key] = (stack.counts[key] || 0) + 1;
        if (stack.counts[key] >= C.stack.matchCount || (stack.shots >= C.stack.chances && stack.pending === 0)) finishStack();
      }
    }
    function settle() {
      spin.settled = true; grid = spin.final.slice();
      var events = evaluate(grid, bases); winning = events.flatMap(function (e) { return e.indices; }); win = 0;
      events.forEach(function (e) {
        if (e.bonus === 'stack') beginStack();
        else if (e.bonus === 'mary') { var key = choose(); if (key === 'magician') key = C.symbols[0].key; award(bases[key] * C.rewards.smallMaryMultiplier, '小玛丽 · ' + label(key)); }
        else award(e.points, e.name);
      });
      if (!events.length) notify('未连线，可继续投币');
    }
    function onTarget() {
      // Same gate for both the collision hook and the UI; pending capacity excludes the running spin.
      if (inputLocked() || spinQueue >= C.spin.maxQueue) return false;
      spinQueue++; notify('SPIN +1 · 待开奖 ' + spinQueue + '/' + C.spin.maxQueue); return true;
    }
    function update(dt, dispense) {
      if (paused) return;
      time += dt; channelFlash = Math.max(0, channelFlash - dt);
      winHold = Math.max(0, winHold - dt);
      if (!spin && spinQueue > 0 && !stack && !inputLocked()) { spinQueue--; startSpin(); }
      if (spin) {
        spin.elapsed += dt;
        if (!spin.settled) {
          var tick = Math.floor(spin.elapsed / C.reels.flickerMs);
          if (tick !== spin.lastTick) {
            spin.lastTick = tick;
            for (var i = 0; i < 9; i++) grid[i] = spin.elapsed >= C.reels.spinMs + (i % 3) * C.reels.stopGapMs ? spin.final[i] : choose();
          }
          if (spin.elapsed >= C.reels.spinMs + 2 * C.reels.stopGapMs) settle();
        }
        if (spin.settled && spin.elapsed >= C.reels.spinMs + 2 * C.reels.stopGapMs + C.reels.resultHoldMs) spin = null;
      }
      if (stack && !inputLocked() && !spin) { stack.elapsed += dt; if (stack.elapsed >= C.stack.timeoutMs) finishStack(); }
      if (payout.remaining > 0 && winHold === 0) {
        payout.clock += dt;
        while (payout.clock >= C.payout.intervalMs) {
          if (!dispense()) { payout.clock = C.payout.intervalMs; break; }
          payout.clock -= C.payout.intervalMs; payout.done++; payout.remaining--;
          if (!payout.remaining) { notify('已发完 ' + payout.total + ' 枚 · 投币及 SPIN 恢复'); break; }
        }
      }
    }
    function insert(physics) {
      if (inputLocked()) return false;
      if (stack && stack.shots >= C.stack.chances) return false;
      if (!stack && credits <= 0) { notify('游戏币用完，可重新开局'); return false; }
      var coin = physics.insert(stack ? 'stack' : 'player');
      if (!coin) return false;
      if (stack) { stack.shots++; stack.pending++; } else credits--;
      return true;
    }
    return {
      update: update, insert: insert, onChannel: onChannel, onTarget: onTarget,
      canHit: function () { return !inputLocked() && spinQueue < C.spin.maxQueue; },
      onRecovered: function () { credits++; paid++; },
      setPaused: function (v) { paused = !!v; },
      snapshot: function () {
        return { credits: credits, earned: earned, paid: paid, win: win, bases: Object.assign({}, bases), grid: grid.slice(), winning: winning.slice(),
          phase: phase(), inputLocked: inputLocked(), canHit: !inputLocked() && spinQueue < C.spin.maxQueue,
          spinning: !!spin && !spin.settled, spinQueue: spinQueue, spinCapacity: C.spin.maxQueue,
          payout: Object.assign({}, payout), lastChannel: channelFlash > 0 ? lastChannel : null,
          stack: stack ? { shots: stack.shots, pending: stack.pending, counts: Object.assign({}, stack.counts), remainingMs: Math.max(0, C.stack.timeoutMs - stack.elapsed) } : null,
          history: history.slice(), paused: paused };
      }
    };
  }
  global.CoinPusherRewards = { create: create, evaluate: evaluate };
}(window));
