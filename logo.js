function setup(){ //opens dashboard with payper logo animation

  var canvas = document.getElementById("myCanvas");
  var scale = 0;

  function draw() {

    var context = canvas.getContext('2d');
    canvas.width = canvas.width;

    var width = canvas.width;
    var height = canvas.height;
    var edge = height/3;

    context.fillStyle = "#FFFBFC";
    context.fillRect(0,0,width,height);

    if ( scale < 5 ){
      scale += .005 + Math.cos(Math.PI/2*(scale%1))/50;
    }

    function drawQuadrant(color,len,timer) {
      if(timer <= 0){return}
      context.beginPath();
      context.fillStyle = color;
      context.moveTo(2,2);
      context.scale(timer,1);
      context.arc(2,2,len-4,0,Math.PI*0.5,false);
      context.scale(1/timer,1);
      context.closePath();
      context.fill();
    }

    //draw logo

    context.translate(width/2, height/2 - edge*1.5);
    context.rotate(Math.PI/2);
    drawQuadrant("#0ECE95",edge,(scale > 1 ? 1 : scale));
    context.translate(edge,0);
    context.rotate(Math.PI/2);
    context.scale(-1,1);
    drawQuadrant("#24D297",edge,(scale > 2 ? 1 : scale-1));
    context.rotate(-Math.PI/2);
    drawQuadrant("#39D7A7",edge,(scale > 3 ? 1 : scale-2));
    context.save();
    context.rotate(-Math.PI/2);
    context.scale(1,-1);
    context.translate(0,-edge);
    drawQuadrant("#47D9B5",edge,(scale > 4 ? 1 : scale-3));
    context.restore();
    context.translate(edge,-edge);
    drawQuadrant("#50DCC2",edge,(scale > 5 ? 1 : scale-4));


    window.requestAnimationFrame(draw);
  };
  window.requestAnimationFrame(draw);
  };
window.onload = setup;
