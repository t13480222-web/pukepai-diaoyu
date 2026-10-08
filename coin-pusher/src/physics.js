(function (global) {
  'use strict';
  var M = global.Matter, C = global.COIN_PUSHER_CONFIG;
  function create(hooks, random) {
    hooks = hooks || {}; random = random || Math.random;
    function engine(gravity) {
      var e = M.Engine.create({ enableSleeping: C.engine.enableSleeping, positionIterations: C.engine.positionIterations, velocityIterations: C.engine.velocityIterations });
      e.gravity.y = gravity; e.gravity.scale = C.engine.gravityScale; return e;
    }
    var board = engine(C.engine.gravityY), table = engine(0);
    var tokens = [], nextId = 1, time = 0, lastSpawn = -Infinity, lastHit = -Infinity;
    var paused = false, angle = C.wiper.initialAngle, swinging = C.wiper.swinging, swingDir = 1;
    var pusherY = C.pusher.backY, pushDir = 1, hold = 0, targetX = C.board.width / 2, targetDir = 1;
    var recovered = 0, lost = 0, inserted = 0, dispensed = 0, pegContacts = 0, targetEnabled = true;
    function emit(name, data) { if (hooks[name]) hooks[name](data); }
    function add(e, b) { M.Composite.add(e.world, b); return b; }
    function rectangle(e, x, y, w, h, label, extra) {
      return add(e, M.Bodies.rectangle(x, y, w, h, Object.assign({ isStatic: true, label: label, friction: C.token.friction, restitution: C.token.restitution }, extra || {})));
    }
    rectangle(board, -C.board.wall/2, C.board.height/2, C.board.wall, C.board.height*2, 'board-wall');
    rectangle(board, C.board.width+C.board.wall/2, C.board.height/2, C.board.wall, C.board.height*2, 'board-wall');
    var rails = [-1, 1].map(function () { return rectangle(board, 0, 0, C.wiper.railThickness, C.wiper.length, 'wiper-rail'); });
    function moveRails() {
      var dx = Math.sin(angle), dy = Math.cos(angle), half = C.wiper.length/2;
      rails.forEach(function (rail, i) {
        var offset = (i ? 1 : -1) * (C.wiper.gap+C.wiper.railThickness)/2;
        M.Body.setPosition(rail, { x:C.wiper.pivotX+dx*half+dy*offset, y:C.wiper.pivotY+dy*half-dx*offset }, true);
        M.Body.setAngle(rail, -angle, true);
      });
    }
    moveRails();
    var pegs = [];
    for (var row=0; row<C.board.pegRows; row++) {
      for (var x=C.board.pegStartX+(row%2)*C.board.pegGapX/2; x<C.board.width-C.board.pegRadius; x+=C.board.pegGapX) {
        pegs.push(add(board, M.Bodies.circle(x, C.board.pegStartY+row*C.board.pegGapY, C.board.pegRadius, {isStatic:true,label:'peg',restitution:C.board.pegRestitution,friction:C.token.friction})));
      }
    }
    var target = rectangle(board, targetX, C.target.y, C.target.width, C.target.height, 'target', {isSensor:true});
    rectangle(table, -C.table.wall/2, C.table.sideOpenAt/2, C.table.wall, C.table.sideOpenAt, 'left-rear-rail');
    rectangle(table, C.table.width+C.table.wall/2, C.table.sideOpenAt/2, C.table.wall, C.table.sideOpenAt, 'right-rear-rail');
    rectangle(table, C.table.width/2, -C.table.wall*2, C.table.width, C.table.wall, 'table-back');
    var pusher = rectangle(table,C.table.width/2,pusherY,C.pusher.width,C.pusher.height,'pusher',{restitution:0});
    function bodyAt(e, x, y, r, token) {
      var b=M.Bodies.circle(x,y,r,{label:'coin',density:C.token.density,friction:C.token.friction,frictionAir:e===table?C.token.tableDrag:C.token.airFriction,restitution:e===table?0:C.token.restitution,sleepThreshold:C.token.sleepThreshold});
      b.plugin.coin=token; if(e===table){b.collisionFilter.category=2;b.collisionFilter.mask=3;} add(e,b); return b;
    }
    function newToken(stage, x,y,source) {
      if(tokens.length>=C.token.maxCount)return null;
      var token={id:nextId++,stage:stage,source:source,hit:false,channel:null,age:0,removed:false,z:0,vz:0,supportId:null,previous:null};
      token.body=bodyAt(stage==='board'?board:table,x,y,stage==='board'?C.token.radius:C.token.tableRadius,token);
      tokens.push(token); return token;
    }
    var seeded = [];
    for(var ry=0;ry<C.table.seedRows;ry++)for(var cx=0;cx<C.table.seedColumns;cx++) {
      seeded.push(newToken('table',C.table.seedStartX+cx*C.table.seedGapX+(random()-.5)*C.table.seedJitter,C.table.seedStartY+ry*C.table.seedGapY+(random()-.5)*C.table.seedJitter,'seed'));
    }
    seeded.forEach(function(bottom,i){
      if(i % C.layers.seedEvery || !bottom)return;
      var upper=newToken('table',bottom.body.position.x+C.layers.seedOffsetX,bottom.body.position.y+C.layers.seedOffsetY,'seed');
      if(upper){upper.z=C.layers.thickness;upper.supportId=bottom.id;upper.body.collisionFilter.category=4;upper.body.collisionFilter.mask=5;}
    });
    function portPosition() {
      return {x:C.wiper.pivotX+Math.sin(angle)*C.wiper.spawnDistance,y:C.wiper.pivotY+Math.cos(angle)*C.wiper.spawnDistance};
    }
    function spawnFromPort(source) {
      var p=portPosition();
      var occupied=tokens.some(function(t){return t.stage==='board'&&Math.hypot(t.body.position.x-p.x,t.body.position.y-p.y)<C.token.radius*2+C.wiper.spawnJitter;});
      if(occupied)return null;
      var coin=newToken('board',p.x+(random()-.5)*C.wiper.spawnJitter,p.y,source);
      if(coin)M.Body.setVelocity(coin.body,{x:Math.sin(angle)*C.wiper.launchSpeed,y:Math.cos(angle)*C.wiper.launchSpeed});
      return coin;
    }
    function insert(source) {
      if(paused||time-lastSpawn<C.input.cooldownMs||tokens.length>=C.token.maxCount)return null;
      var coin=spawnFromPort(source||'player');
      if(coin){lastSpawn=time;inserted++;}
      return coin;
    }
    function dispense() {
      if(paused||tokens.length>=C.token.maxCount)return false;
      var coin=spawnFromPort('reward');
      if(!coin)return false;
      dispensed++;emit('onDispensed',coin);return true;
    }
    function remove(token,kind) {
      if(token.removed)return;
      token.removed=true;
      M.Composite.remove(token.stage==='board'?board.world:table.world,token.body);
      tokens.splice(tokens.indexOf(token),1);
      if(kind==='front'){recovered++;emit('onRecovered',token);}else{lost++;emit('onLost',token);}
    }
    M.Events.on(board,'collisionStart',function(e){e.pairs.forEach(function(pair){
      var coin=pair.bodyA.plugin.coin||pair.bodyB.plugin.coin;
      if(!coin||coin.removed)return;
      if(pair.bodyA.label==='peg'||pair.bodyB.label==='peg'){pegContacts++;emit('onPeg',coin);}
      if((pair.bodyA===target||pair.bodyB===target)&&!coin.hit&&coin.source==='player'&&targetEnabled&&time-lastHit>=C.target.cooldownMs){
        if(hooks.onTargetHit&&hooks.onTargetHit(coin)!==false){coin.hit=true;lastHit=time;}
      }
    });});
    function toTable(coin) {
      var bx=Math.max(0,Math.min(C.board.width-0.001,coin.body.position.x));
      coin.channel=Math.floor(bx/C.board.width*C.symbols.length);
      emit('onChannel',coin);
      var tx=C.token.tableRadius+bx/C.board.width*(C.table.width-C.token.tableRadius*2);
      var vx=coin.body.velocity.x;
      M.Composite.remove(board.world,coin.body);coin.stage='table';coin.age=0;coin.z=C.layers.landingHeight;coin.vz=0;coin.supportId=null;
      coin.body=bodyAt(table,tx,Math.max(C.table.spawnY,pusherY+C.pusher.height/2+C.token.tableRadius+1),C.token.tableRadius,coin);
      M.Body.setVelocity(coin.body,{x:vx*.15,y:C.table.landingVelocity});
    }
    function prepareLayers() {
      tokens.forEach(function(t){if(t.stage!=='table')return;
        t.previous={x:t.body.position.x,y:t.body.position.y};
        var level=Math.min(C.layers.maxLevels,Math.max(0,Math.floor((t.z+C.layers.settlingEpsilon)/C.layers.thickness)));
        var bit=1 << (level+1);t.body.collisionFilter.category=bit;t.body.collisionFilter.mask=bit|1;
      });
    }
    function settleLayers(dt) {
      var dtSec=dt/1000, list=tokens.filter(function(t){return t.stage==='table';}).sort(function(a,b){return a.z-b.z||a.id-b.id;});
      list.forEach(function(t){
        var best=null,height=0;
        list.forEach(function(b){
          if(b===t||b.z>C.layers.thickness*(C.layers.maxLevels-1)||b.vz!==0||b.z+C.layers.thickness>t.z+C.layers.settlingEpsilon)return;
          if(Math.hypot(b.body.position.x-t.body.position.x,b.body.position.y-t.body.position.y)>C.token.tableRadius*C.layers.supportRadius)return;
          if(b.z+C.layers.thickness>height){height=b.z+C.layers.thickness;best=b;}
        });
        t.vz-=C.layers.gravity*dtSec;
        var next=t.z+t.vz*dtSec;
        if(next<=height){t.z=height;t.vz=0;
          if(best&&best.previous){
            var dx=(best.body.position.x-best.previous.x)*C.layers.carry,dy=(best.body.position.y-best.previous.y)*C.layers.carry;
            if(Math.abs(dx)+Math.abs(dy)>0.001){M.Sleeping.set(t.body,false);M.Body.translate(t.body,{x:dx,y:dy});}
          }
          t.supportId=best?best.id:null;
        }else{t.z=next;t.supportId=null;M.Sleeping.set(t.body,false);}
      });
    }
    function step(dt) {
      if(paused)return;
      time+=dt;
      if(swinging){angle+=swingDir*C.wiper.angleSpeed*dt/1000;if(angle>C.wiper.maxAngle){angle=C.wiper.maxAngle;swingDir=-1;}if(angle<C.wiper.minAngle){angle=C.wiper.minAngle;swingDir=1;}}
      moveRails(); // Also clears velocity when locked; no residual motion impulse.
      targetX+=targetDir*C.target.speed*dt/1000;
      if(targetX>=C.target.maxX){targetX=C.target.maxX;targetDir=-1;}if(targetX<=C.target.minX){targetX=C.target.minX;targetDir=1;}
      M.Body.setPosition(target,{x:targetX,y:C.target.y},true);
      var oldY=pusherY;
      if(hold>0)hold=Math.max(0,hold-dt);else{
        pusherY+=pushDir*C.pusher.speed*dt/1000;
        if(pusherY>=C.pusher.frontY){pusherY=C.pusher.frontY;pushDir=-1;hold=C.pusher.pauseMs;}
        if(pusherY<=C.pusher.backY){pusherY=C.pusher.backY;pushDir=1;hold=C.pusher.pauseMs;}
      }
      M.Body.setPosition(pusher,{x:C.table.width/2,y:pusherY},true);
      if(pusherY!==oldY)tokens.forEach(function(t){
        if(t.stage==='table'&&t.body.position.y-t.body.circleRadius<pusherY+C.pusher.height/2+C.pusher.wakeDistance)M.Sleeping.set(t.body,false);
      });
      prepareLayers();
      M.Engine.update(board,dt);M.Engine.update(table,dt);
      settleLayers(dt);
      tokens.slice().forEach(function(t){
        if(t.removed)return;t.age+=dt;
        if(t.stage==='board'){if(t.body.position.y>=C.board.channelY)toTable(t);return;}
        var q=t.body.position;
        // No random disappearance or teleport-to-outlet: crossing a real edge decides the result.
        if((q.y>C.table.sideOpenAt&&(q.x<-C.table.exitMargin||q.x>C.table.width+C.table.exitMargin))||(q.y>C.table.sideSlotStartY&&(q.x<C.table.sideSlotWidth||q.x>C.table.width-C.table.sideSlotWidth)))remove(t,'side');
        else if(q.y>C.table.depth+C.table.exitMargin)remove(t,q.x>=C.table.frontSafeMargin&&q.x<=C.table.width-C.table.frontSafeMargin?'front':'side');
      });
    }
    return {
      insert:insert,dispense:dispense,step:step,setTargetEnabled:function(v){targetEnabled=!!v;},setPaused:function(v){paused=!!v;},
      toggleWiper:function(){if(!paused)swinging=!swinging;return swinging;},
      snapshot:function(){return{time:time,tokenCount:tokens.length,recovered:recovered,lost:lost,inserted:inserted,dispensed:dispensed,pegContacts:pegContacts,wiperAngle:angle,wiperSwinging:swinging,pusherY:pusherY,targetX:targetX,paused:paused,stacked:tokens.filter(function(t){return t.stage==='table'&&t.supportId!==null;}).length};},
      renderData:function(){return{tokens:tokens,pegs:pegs,rails:rails,target:target,pusher:pusher,angle:angle,swinging:swinging,targetEnabled:targetEnabled,forward:pushDir>0};},
      destroy:function(){M.Events.off(board);M.Events.off(table);M.Composite.clear(board.world,false);M.Composite.clear(table.world,false);M.Engine.clear(board);M.Engine.clear(table);tokens=[];}
    };
  }
  global.CoinPusherPhysics={create:create};
}(window));
