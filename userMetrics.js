$(document).ready(function(){
  //make references
  var umRef = firebase.database().ref().child("userMetrics");
  var timingRef = umRef.child("timing");
  //init storage
  var durs = {};
  //Calculate duration stats for each flow in userMetrics/timing
  timingRef.once("value",function(snapshot){ //snapshot.key == timing
    var fastestFlow; //global stats
    var slowestFlow;
    var maxAvg = 0;
    var minAvg = 1000000;
    snapshot.forEach(function(cSnapshot){      //cSnapshot.key == flow
      var flowDurs = [];//get stats for each flow
      var flowName = cSnapshot.key;
      var maxDur = 0;
      var minDur = 1000000;
      cSnapshot.forEach(function(gcSnapshot){    //gcSnapshot.key == user
        gcSnapshot.forEach(function(ggcSnapshot){  //ggcSnapshot.key ==  instance
          //update values per instance per child
          var dur = ggcSnapshot.val().duration;
          flowDurs.push(dur);
          maxDur = (dur > maxDur ? dur : maxDur);
          minDur = (dur < minDur ? dur : minDur);
        });
      });

      //organize data for flows
      var data = {};
      data["Minimum Duration"] = minDur;
      data["Maximum Duration"] = maxDur;
      var avg = flowDurs.reduce(function(sum, num) {return sum+num} )/flowDurs.length;
      data["Average Duration"] = avg;
      durs[flowName] = data;

      if( avg > maxAvg ){
        maxAvg = avg;
        slowestFlow = cSnapshot.key;
      }
      else if( avg < minAvg ){
        minAvg = avg;
        fastestFlow = cSnapshot.key;
      }

    });
    document.getElementById("flowSpeeds").innerHTML = "<br/>Fastest Flow:<br/>" + fastestFlow + "<br/>" + Math.round(minAvg/100)/10 + " s<br/><br/>Slowest Flow:<br/>" + slowestFlow + "<br/>" + Math.round(maxAvg/100)/10 + " s";
    document.getElementById("flowSpeeds").onclick = function(){document.getElementById("display").innerHTML = JSONtolist(durs)};
  });

  var buttRef = umRef.child("buttonPress");
  //init storage
  var buttPushers = {};
  var data = {};
  var text =
  buttRef.once("value", function(snapshot){ //snapshot -> buttonPress
    snapshot.forEach(function(cSnapshot){ // cSnap -> buttons
      var butt = cSnapshot.key
      var tot = 0;
      var max = 0;
      var num = 0;
      if(!data.hasOwnProperty(butt)){
        data[butt] = {};
      }

      cSnapshot.forEach(function(gcSnapshot){// gcSnap -> users that press
        var user = gcSnapshot.key;
        num++;

        if(!buttPushers.hasOwnProperty(user)){
          buttPushers[user] = {};
        }
        var count = 0;
        gcSnapshot.forEach(function(ggcSnapshot){// gcSnap -> instances of pressing
          count++;
        });
        max = (count > max ? count : max);
        tot += count;
        buttPushers[user][butt] = count;
      });
      data[butt]["Max"] = max;
      data[butt]["Avg"] = (num = 0 ? 0 : tot/num);
    });
    document.getElementById("buttStats").innerHTML = "<br/>User Button Presses<br/><br/>newPayment<br/>Max: " + data["newPayment"]["Max"] + "   Avg: " + Math.round(data["newPayment"]["Avg"]*100)/100 + "<br/><br/>trendingPayments<br/>Max: " + data["trendingPayments"]["Max"] + "   Avg: " + Math.round(data["trendingPayments"]["Avg"]*100)/100;
    document.getElementById("buttStats").onclick = function(){document.getElementById("display").innerHTML = JSONtolist(data)}
  });
});
