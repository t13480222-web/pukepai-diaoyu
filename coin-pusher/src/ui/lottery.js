(function(global){
  'use strict';
  // The reel panel always renders the exact grid used by rewards.evaluate.
  global.CoinPusherReelPanel={
    draw:function(ctx,state,art){
      var C=global.COIN_PUSHER_CONFIG,b=C.visual.screen,w=b.width/3,h=b.height/3;
      for(var i=0;i<9;i++){
        var x=b.x+(i%3)*w,y=b.y+Math.floor(i/3)*h,lit=state.winning.indexOf(i)>=0;
        var shade=ctx.createLinearGradient(x,y,x,y+h);shade.addColorStop(0,lit?'#fff8bb':'#f7f1df');shade.addColorStop(.5,lit?'#edbe59':'#cddfea');shade.addColorStop(1,lit?'#fff1a0':'#f2ece0');art.box(ctx,x+2,y+2,w-4,h-4,shade,4,lit?'#fff6ce':'#bc9b65');
        ctx.save();ctx.beginPath();ctx.rect(x+2,y+2,w-4,h-4);ctx.clip();
        art.symbol(ctx,state.grid[i],x+w/2,y+h/2,Math.min(w,h)*.79);ctx.restore();
        if(lit){ctx.strokeStyle='#dc604b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+4,y+h/2);ctx.lineTo(x+w-4,y+h/2);ctx.stroke();}
      }
    }
  };
}(window));
