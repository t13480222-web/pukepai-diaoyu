(function(global){
  'use strict';
  var C=global.COIN_PUSHER_CONFIG,V=C.visual;
  var channelTop=V.boardY+C.board.channelY+12;
  var symbolSprites={},coinSprites={};
  function path(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function box(c,x,y,w,h,fill,r,stroke){path(c,x,y,w,h,r||0);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  function line(c,points,color,width){c.beginPath();points.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.strokeStyle=color;c.lineWidth=width||1;c.stroke();}
  function poly(c,points,fill,stroke){c.beginPath();points.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
  function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  function text(c,t,x,y,size,color,align,weight){c.fillStyle=color||'#ede0b5';c.font=(weight||'500')+' '+size+'px "PingFang SC","Microsoft YaHei",Arial,sans-serif';c.textAlign=align||'center';c.textBaseline='middle';c.fillText(String(t),x,y);}
  function gradient(c,x,y,w,h,colors){var g=c.createLinearGradient(x,y,x+w,y+h);colors.forEach(function(v,i){g.addColorStop(i/(colors.length-1),v);});return g;}
  function star(c,x,y,r,fill){var pts=[];for(var i=0;i<10;i++){var a=i*Math.PI/5-Math.PI/2,s=i%2?r*.42:r;pts.push([x+Math.cos(a)*s,y+Math.sin(a)*s]);}poly(c,pts,fill);}
  function paintSymbol(c,key,x,y,size){
    c.save();c.translate(x,y);c.scale(size/66,size/66);c.lineWidth=1.5;
    c.shadowColor='#15062577';c.shadowBlur=3;c.shadowOffsetY=2;
    var shine=gradient(c,-25,-24,48,50,['#ffffdf','#efcc6a','#9a5c20']);
    if(key==='hat'||key==='magician'){
      if(key==='magician'){ellipse(c,0,14,16,17,'#efbd8d','#7d4329');ellipse(c,-6,11,2,2,'#3a241b');ellipse(c,6,11,2,2,'#3a241b');line(c,[[-5,21],[0,23],[5,21]],'#904633',2);}
      ellipse(c,0,6,27,8,gradient(c,0,0,0,18,['#954faf','#361a5e']),'#dbaafb');
      poly(c,[[-19,-24],[19,-24],[15,5],[-15,5]],gradient(c,-19,-24,38,29,['#74429d','#a95ccd','#3a1c58']),'#e1b2f3');
      box(c,-16,-4,32,7,gradient(c,0,-4,0,7,['#fff6ad','#b37d1e','#f2ca5f']),1);
      line(c,[[-16,-23],[-13,-5]],'#e6b7ff',1.8);line(c,[[12,-22],[11,-6]],'#391442',2);
      star(c,0,-13,5,'#f9db68');
      if(key==='hat'){poly(c,[[-12,-23],[-19,-40],[-9,-39],[0,-23]],'#68daf3');poly(c,[[0,-23],[0,-44],[10,-43],[7,-23]],'#e6f086');star(c,15,-29,8,'#fc9cc9');}
    }else if(key==='fan'){
      for(var k=0;k<7;k++){var a=-Math.PI+.25+k*.4,b=a+.43;poly(c,[[19,22],[19+Math.cos(a)*51,22+Math.sin(a)*51],[19+Math.cos(b)*51,22+Math.sin(b)*51]],['#ff6f68','#f2b765','#ece771','#80c88c','#63c6c8','#74abe3','#a680d4'][k],'#586863');}
      ellipse(c,19,22,4,4,shine);
    }else if(key==='gem'){
      poly(c,[[-18,-25],[12,-27],[26,-6],[16,22],[-12,27],[-27,7]],'#d952f0','#ffc2ff');
      poly(c,[[-10,-14],[7,-17],[15,-3],[8,13],[-8,17],[-17,4]],'#922fa9','#f9b6fa');
      line(c,[[-18,-25],[-10,-14],[-27,7],[-17,4],[-12,27],[-8,17],[16,22],[8,13],[26,-6],[15,-3],[12,-27],[7,-17]],'#ef8fff',1.5);
      star(c,-21,-22,6,'#fff');
    }else if(key==='box'){
      poly(c,[[-23,-14],[5,-24],[27,-12],[0,-1]],'#fae070','#fff1b0');
      poly(c,[[-23,-14],[0,-1],[0,26],[-23,12]],'#62c7be','#217b79');
      poly(c,[[0,-1],[27,-12],[26,14],[0,26]],gradient(c,0,0,27,22,['#6fe1ed','#1b628f']),'#25687c');
      line(c,[[-20,-10],[-20,11],[-2,22]],'#c2fff0',1);line(c,[[3,0],[24,-8]],'#c7fdf2',1);
      poly(c,[[-8,-19],[-2,-22],[20,-10],[13,-7]],'#ffdc61');star(c,-12,3,7,'#f8d461');star(c,13,10,7,'#f8d461');
    }else if(key==='orb'){
      ellipse(c,0,22,23,7,shine,'#7d532c');box(c,-14,14,28,10,shine,3);
      var g=c.createRadialGradient(-9,-13,1,0,-3,27);g.addColorStop(0,'#ecffb9');g.addColorStop(.25,'#b8f261');g.addColorStop(.8,'#4e9f50');g.addColorStop(1,'#244929');ellipse(c,0,-3,25,25,g,'#bfeab1');ellipse(c,-8,-13,8,4,'#ffffffb0');star(c,9,-9,4,'#f4ffd8');ellipse(c,8,8,9,4,'#b5e58926');
    }else if(key==='umbrella'){
      c.save();c.rotate(-.4);c.beginPath();c.arc(0,6,27,Math.PI,Math.PI*2);c.lineTo(27,6);c.closePath();c.fillStyle='#e262c1';c.fill();
      for(var u=-20;u<25;u+=10)line(c,[[u,-16],[u+6,5]],'#7acde9',4);
      line(c,[[0,6],[0,28],[-6,31],[-10,28]],shine,4);c.restore();
    }else if(key==='ring'){
      c.lineWidth=9;c.strokeStyle='#83c8cc';c.beginPath();c.ellipse(0,9,19,21,-.45,0,Math.PI*2);c.stroke();c.lineWidth=3;c.strokeStyle='#d6ffff';c.stroke();
      poly(c,[[-13,-20],[0,-28],[15,-20],[8,-7],[-6,-7]],'#89e9ff','#f4ffff');line(c,[[0,-28],[-6,-7],[15,-20],[-13,-20],[8,-7]],'#30a5d5',1);
    }else if(key==='cups'){
      [[-18,2,'#56bceb'],[0,-6,'#f1ce4d'],[18,4,'#8ecb51']].forEach(function(p){poly(c,[[p[0]-10,p[1]-18],[p[0]+8,p[1]-18],[p[0]+13,p[1]+19],[p[0]-14,p[1]+19]],p[2],'#476956');ellipse(c,p[0]-1,p[1]-18,9,3,'#eaf6db');});ellipse(c,0,28,7,7,'#dc5151');
    }
    c.restore();
  }
  function symbol(c,key,x,y,size){
    if(!symbolSprites[key]){
      var sprite=global.document.createElement('canvas');sprite.width=192;sprite.height=192;
      var sc=sprite.getContext('2d');paintSymbol(sc,key,96,102,128);
      symbolSprites[key]=sprite;
    }
    c.drawImage(symbolSprites[key],x-size*.75,y-size*.8,size*1.5,size*1.5);
  }
  function paintCoin(c,x,y,r,flat,rotation,alpha,variant){
    c.save();c.globalAlpha=alpha===undefined?1:alpha;
    var thick=V.coin.thickness*r/C.token.tableRadius;
    ellipse(c,x+2,y+thick+2,r+2,r*flat+1,'#02030780');
    var silver=variant%5===0;
    var edge=gradient(c,x-r,y,r*2,thick,[silver?'#455864':'#74501b',silver?'#b6c8d5':'#f8cd67',silver?'#627282':'#9f6621']);
    ellipse(c,x,y+thick,r,r*flat,edge,'#49351a');
    for(var i=0;i<V.coin.rimTeeth;i++){
      var a=i*Math.PI*2/V.coin.rimTeeth;
      if(Math.sin(a)>0)line(c,[[x+Math.cos(a)*r,y+Math.sin(a)*r*flat],[x+Math.cos(a)*r,y+Math.sin(a)*r*flat+thick]],silver?'#e5eef899':'#ffe493b0',.6);
    }
    var face=c.createLinearGradient(x-r,y-r,x+r,y+r);
    [silver?'#f4fbff':'#fff1b6',silver?'#9cb0c0':'#d29b38',silver?'#e0ecf1':'#f9d67c',silver?'#758997':'#9b5e20'].forEach(function(col,i){face.addColorStop(i/3,col);});
    ellipse(c,x,y,r,r*flat,face,silver?'#edf5ff':'#ffeda1');
    ellipse(c,x,y,r*.82,r*.82*flat,'#8e62261b',silver?'#697f90':'#9c722f');
    ellipse(c,x,y,r*.72,r*.72*flat,'#ffe49722',silver?'#f4faff':'#fff1b8');
    c.translate(x,y);c.scale(1,flat);c.rotate(rotation||0);
    var legend=V.coin.embossText;
    for(var k=0;k<legend.length;k++){
      c.save();c.rotate(-Math.PI*.83+k*Math.PI*1.66/legend.length);c.translate(0,-r*.60);
      text(c,legend[k],0,0,r*.13,silver?'#4d6378':'#845720','center','900');c.restore();
    }
    text(c,'1',.4,1,r*.78,silver?'#eefaff':'#fff1ab','center','900');text(c,'1',0,0,r*.78,silver?'#607c91':'#a36a27','center','900');
    star(c,-r*.43,r*.15,r*.09,'#ffeea4');star(c,r*.43,r*.15,r*.09,'#ffeea4');
    c.strokeStyle='#ffffff45';c.lineWidth=.5;c.beginPath();c.arc(0,0,r*.88,-Math.PI*.9,-Math.PI*.2);c.stroke();c.restore();
  }
  function coin(c,x,y,r,flat,rotation,alpha,variant){
    // Stamp engraved faces once, so fine ridges/lettering do not redraw per coin per frame.
    var f=flat>.9?1:flat<.56?.52:flat>.63?.66:.59;
    var turn=Math.round((((rotation||0)%(Math.PI*2))+Math.PI*2)/(Math.PI*2)*12)%12;
    var silver=variant%5===0,key=[f,turn,silver].join(':');
    if(!coinSprites[key]){
      var stamp=global.document.createElement('canvas');stamp.width=128;stamp.height=128;
      paintCoin(stamp.getContext('2d'),64,64,32,f,turn*Math.PI/6,1,silver?0:1);coinSprites[key]=stamp;
    }
    c.save();c.globalAlpha=alpha===undefined?1:alpha;c.drawImage(coinSprites[key],x-r*2,y-r*2,r*4,r*4);c.restore();
  }
  function project(x,y){var v=V.table,t=y/C.table.depth,w=v.backWidth+(v.frontWidth-v.backWidth)*t;return{x:v.centerX+(x/C.table.width-.5)*w,y:v.topY+(v.bottomY-v.topY)*t,scale:w/C.table.width};}
  function Renderer(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.exits=[];this.time=0;
    this.cache=global.document.createElement('canvas');this.cache.width=C.world.width;this.cache.height=C.world.height;
    this.staticScene(this.cache.getContext('2d'));
    var ratio=Math.min(V.pixelRatioMax,global.devicePixelRatio||1);canvas.width=C.world.width*ratio;canvas.height=C.world.height*ratio;this.ratio=ratio;
  }
  Renderer.prototype.staticScene=function(c){
    var W=C.world.width,H=C.world.height;
    box(c,0,0,W,H,gradient(c,0,0,W,H,['#369663','#213961','#7c3f75','#1e644e']),22);
    box(c,17,8,W-34,H-22,'#131529',13,'#a7905d');
    // Brushed metal corner posts; thin reflected light, fasteners and glass depth.
    [21,W-43].forEach(function(x){box(c,x,10,22,H-29,gradient(c,x,0,22,0,['#26332d','#d7e1d7','#6a8475','#d5dfd1','#263b30']),5);for(var y=30;y<H;y+=180){ellipse(c,x+11,y,3.6,3.6,'#25372d','#d0d9c8');line(c,[[x+9,y],[x+13,y]],'#91a591');}});
    box(c,53,10,894,54,'#201712',8,'#685434');
    ['JP1','JP2','JP3','ALL'].forEach(function(name,i){var x=68+i*215;box(c,x,17,203,40,gradient(c,x,17,0,40,['#8e7135','#f3d786','#886124']),5);box(c,x+3,20,197,34,'#091411',3);text(c,name,x+30,37,13,['#78d0c9','#a5d579','#f2919b','#ffdb88'][i],'center','800');text(c,String(C.rewards[name.toLowerCase()]).padStart(4,'0'),x+132,38,22,'#ffdf93','center','700');});
    // Permanent main screen, distinct from the mechanical board below.
    box(c,130,68,740,174,gradient(c,130,68,0,174,['#6b2026','#231112']),10,'#ac8746');
    for(var k=0;k<8;k++){var xx=142+k*13;box(c,xx,78,10,150,gradient(c,xx,78,10,0,['#641a27','#b63c43','#501321']),2);box(c,1000-xx-10,78,10,150,gradient(c,xx,78,10,0,['#641a27','#b63c43','#501321']),2);}
    box(c,258,68,389,170,gradient(c,258,68,0,170,['#e7c97b','#805a27','#ddc17b']),5);
    box(c,650,75,96,157,'#123333',5,'#b99855');
    symbol(c,'magician',192,165,72);symbol(c,'hat',804,166,74);
    text(c,'THE MAGIC SHOW',500,245,9,'#eed193');
    for(var lamp=0;lamp<26;lamp++){var lx=140+lamp*28;ellipse(c,lx,70,2,2,lamp%2?'#ffd95e':'#ee88cd');ellipse(c,lx,239,2,2,lamp%2?'#ffd95e':'#ee88cd');}
    // Emerald pin board with engraved rays and decorative lamps.
    box(c,110,252,780,C.board.height,gradient(c,110,252,780,C.board.height,['#276c6a','#202d51','#454175']),9,'#8f8458');
    c.save();c.beginPath();c.rect(141,253,718,C.board.height-3);c.clip();
    for(var a=0;a<Math.PI*2;a+=Math.PI/18)line(c,[[500,320],[500+Math.cos(a)*900,320+Math.sin(a)*900]],'#9ce8ed0e',10);
    for(var i=0;i<720;i+=6)line(c,[[140+i,252],[140+i,V.boardY+C.board.height]],'#f0fce403',1);c.restore();
    [119,881].forEach(function(x){for(var y=270;y<V.boardY+C.board.height-4;y+=30){ellipse(c,x,y,4,4,y%60?'#ba82e7':'#55d2ce','#e2fbe0');}});
    var rails=[project(0,0),project(C.table.width,0),project(C.table.width,C.table.depth),project(0,C.table.depth)];
    poly(c,[[116,746],[884,746],[949,980],[51,980]],gradient(c,0,746,0,234,['#444e47','#1f2826','#737d73']), '#b3b9a0');
    poly(c,rails.map(function(p){return[p.x,p.y];}),gradient(c,0,750,0,210,['#647368','#a4afa0','#748477']), '#dbdfbc');
    c.save();c.beginPath();rails.forEach(function(p,i){i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();c.clip();
    for(var scan=753;scan<960;scan+=3)line(c,[[60,scan],[940,scan]],scan%2?'#edf3cf0c':'#05110d0c',1);c.restore();
    // Under-lip return paths correspond to the side-slot sensors.
    [[0,C.table.sideSlotWidth],[C.table.width-C.table.sideSlotWidth,C.table.width]].forEach(function(range){
      var corners=[project(range[0],C.table.sideSlotStartY),project(range[1],C.table.sideSlotStartY),project(range[1],C.table.depth),project(range[0],C.table.depth)];
      poly(c,corners.map(function(p){return[p.x,p.y];}),'#070813','#58596e');
      line(c,[[corners[0].x,corners[0].y],[corners[1].x,corners[1].y]],'#b7a877',4);
    });
    poly(c,[[project(0,0).x-13,747],[project(0,0).x,752],[97,958],[70,970]],gradient(c,80,0,65,0,['#718376','#d2dbcb','#4a6051']));
    poly(c,[[project(600,0).x+13,747],[project(600,0).x,752],[903,958],[930,970]],gradient(c,855,0,65,0,['#4a6051','#d2dbcb','#718376']));
    box(c,112,972,776,69,'#101c16',8,'#787451');box(c,190,991,620,26,gradient(c,0,991,0,26,['#020503','#202920','#080e09']),4,'#454a34');
    text(c,'收 币 槽',500,1027,10,'#aca98a');text(c,'金属推盘  /  前沿掉币计入余额',500,1062,11,'#90a894');
  };
  Renderer.prototype.exit=function(token,kind){var p=project(token.body.position.x,token.body.position.y);this.exits.push({x:p.x,y:p.y,kind:kind,age:0});if(this.exits.length>V.maxExitAnimations)this.exits.shift();};
  Renderer.prototype.draw=function(physical,state,notice,dt){
    var c=this.ctx;this.time+=dt;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,C.world.width,C.world.height);c.drawImage(this.cache,0,0);
    global.CoinPusherReelPanel.draw(c,state,{box:box,symbol:symbol});
    if(state.inputLocked&&!state.paused){
      box(c,270,80,367,145,'#211127ee',6,'#ffe49c');
      text(c,state.payout.name||'中奖',453,103,17,'#ffe7a3','center','800');
      text(c,state.phase==='win'?'恭喜中奖':'奖励出币中',453,131,14,'#f4b9f2');
      text(c,state.payout.done+' / '+state.payout.total+' 枚',453,165,26,'#fff1bd','center','800');
      text(c,'剩余 '+state.payout.remaining+' · 暂停投币及 SPIN',453,202,12,'#8fdbef');
    }else if(state.spinning){text(c,'SPIN · 可继续投币',806,90,10,'#b8f4ff');}
    ['CREDIT','WIN','PAID','OUT'].forEach(function(name,i){text(c,name,698,91+i*34,8,'#87bcb2');text(c,[state.credits,state.win,state.paid,state.payout.remaining][i],698,107+i*34,16,'#e9eac2','center','700');});
    text(c,'SPIN  '+state.spinQueue+' / '+C.spin.maxQueue,804,211,12,'#fae384');
    for(var si=0;si<C.spin.maxQueue;si++)ellipse(c,774+si*19,226,5,5,si<state.spinQueue?'#74f1e2':'#3d3b5d',si<state.spinQueue?'#c1ffeb':'#806484');
    var bx=V.boardX,by=V.boardY;
    // Draw actual physics peg positions, never decorative fake pins.
    physical.pegs.forEach(function(peg){var x=bx+peg.position.x,y=by+peg.position.y;ellipse(c,x+2,y+3,6,4,'#04160d7a');ellipse(c,x,y,5,5,gradient(c,x-5,y-5,10,10,['#f9f3ce','#9caa87','#3c5f50']),'#d1dac3');ellipse(c,x-1.3,y-1.5,1.4,1.4,'#fff');});
    // Two plain chrome rods (11): the visible inner channel stays completely open.
    var w=C.wiper;
    c.save();c.translate(bx+w.pivotX,by+w.pivotY);c.rotate(-physical.angle);
    [-1,1].forEach(function(sign){
      var rx=sign*(w.gap+w.railThickness)/2-w.railThickness/2;
      box(c,rx+2,3,w.railThickness+2,w.length,'#07091b8c',4);
      box(c,rx,0,w.railThickness,w.length,gradient(c,rx,0,w.railThickness,0,['#728dbb','#f6fcff','#adb5d2','#526083']),w.railThickness/2,'#f9e7b0');
      line(c,[[rx+2,10],[rx+2,w.length-9]],'#ffffffb0',1);
      ellipse(c,rx+w.railThickness/2,9,2,2,'#495577','#b1c6d8');
    });
    c.restore();
    ellipse(c,bx+w.pivotX-26,by+w.pivotY,6,6,'#b99b5c','#f2dba2');
    ellipse(c,bx+w.pivotX+26,by+w.pivotY,6,6,'#b99b5c','#f2dba2');
    text(c,(physical.angle*180/Math.PI).toFixed(0)+'° · '+(physical.swinging?'摆动':'锁定'),610,by+37,12,'#e4d7fc');
    text(c,'投币口',610,by+17,9,'#94c6db');
    var tx=bx+physical.target.position.x,ty=by+C.target.y;
    line(c,[[bx+C.target.minX,ty+11],[bx+C.target.maxX,ty+11]],'#7e865c',3);
    poly(c,[[tx-C.target.width/2,ty-10],[tx+C.target.width/2,ty-10],[tx+C.target.width/2-10,ty+14],[tx-C.target.width/2+10,ty+14]],gradient(c,0,ty-10,0,24,['#eaca70','#6c512a']), '#ffe3a3');
    box(c,tx-C.target.width/2+5,ty-8,C.target.width-10,7,'#0a120a',2);text(c,physical.targetEnabled?'SPIN':'CLOSED',tx,ty+5,10,physical.targetEnabled?'#fff4c5':'#aa8596','center','800');
    // Bottom channel labels and base scores are exactly aligned with physics bins.
    C.symbols.forEach(function(s,i){var cw=C.board.width/C.symbols.length,x=bx+i*cw,lit=state.lastChannel===s.key;
      box(c,x+2,channelTop,cw-4,47,gradient(c,x,channelTop,0,47,lit?['#fff0a6','#c69835']:['#375641','#132b22']),5,lit?'#fff2af':'#87754a');
      symbol(c,s.key,x+cw/2,channelTop+18,30);text(c,'底分 '+state.bases[s.key],x+cw/2,channelTop+40,10,lit?'#362a12':'#dfcc96');
      line(c,[[x,channelTop-20],[x,channelTop-8]],'#d6c38c',2);
    });
    // Perspective shelf with a real moving pusher face, not a floating red bar.
    var front=physical.pusher.position.y+C.pusher.height/2;
    var a=project((C.table.width-C.pusher.width)/2,0),b=project((C.table.width+C.pusher.width)/2,0),d=project((C.table.width-C.pusher.width)/2,front),e=project((C.table.width+C.pusher.width)/2,front);
    poly(c,[[a.x,a.y-5],[b.x,b.y-5],[e.x,e.y-5],[d.x,d.y-5]],gradient(c,0,750,0,45,['#e1e4ca','#657c6c']), '#eef0d6');
    poly(c,[[d.x,d.y-5],[e.x,e.y-5],[e.x,e.y+7],[d.x,d.y+7]],gradient(c,0,d.y,0,12,['#dbb764','#756044']), '#3b4535');
    text(c,physical.forward?'推板前进 ↓':'推板回程 ↑',500,V.table.topY+13,10,'#20372a');
    physical.tokens.filter(function(t){return t.stage==='table';}).sort(function(a,b){return a.z-b.z||a.body.position.y-b.body.position.y;}).forEach(function(t){
      var p=project(t.body.position.x,t.body.position.y),height=t.z*p.scale;
      // Height casts a separate support shadow; upper discs visibly overlap lower coins.
      if(t.z>0)ellipse(c,p.x+height*.1,p.y+4,C.token.tableRadius*p.scale,C.token.tableRadius*p.scale*.58,'#1006254d');
      coin(c,p.x,p.y-height,C.token.tableRadius*p.scale,.59+(t.supportId?Math.sin(t.id)*C.layers.tilt:0),t.body.angle,1,t.id);
    });
    physical.tokens.filter(function(t){return t.stage==='board';}).forEach(function(t){coin(c,bx+t.body.position.x,by+t.body.position.y,C.token.radius,1,t.body.angle,1,t.id);});
    this.exits=this.exits.filter(function(e){e.age+=dt;return e.age<V.exitAnimationMs;});
    this.exits.forEach(function(e){var t=e.age/V.exitAnimationMs;coin(c,e.x,e.y+t*50,15*(1-t*.3),.58,0,1-t);});
    // Glass reflections confined to the mechanical window.
    c.save();c.globalAlpha=.055;poly(c,[[116,254],[270,254],[638,956],[580,956]],'#f3ffe9');poly(c,[[856,254],[879,254],[899,957],[881,957]],'#fff');c.restore();
    if(state.stack){box(c,165,935,670,40,'#171225ec',6,'#a688bd');text(c,'叠叠乐  '+state.stack.shots+'/'+C.stack.chances+' 次 · 剩余 '+Math.ceil(state.stack.remainingMs/1000)+' 秒 · 调雨刷后按 START',500,955,13,'#f5d4ff');}
    if(state.paused){box(c,270,443,460,74,'#071811ed',9,'#a39664');text(c,'已暂停 · 按 P 继续',500,480,24,'#f0e3b6');}
    if(notice){box(c,194,1041,612,28,'#0b1f18eb',5);text(c,notice,500,1055,12,'#e3d2a0');}
  };
  global.CoinPusherRenderer=Renderer;
}(window));
