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

      if( avg > maxAvg ){//check max
        maxAvg = avg;
        slowestFlow = cSnapshot.key;
      }
      else if( avg < minAvg ){//check min
        minAvg = avg;
        fastestFlow = cSnapshot.key;
      }

    }); //end of cSnapshot


    //make FlexList for flow data
    var flowFlexList = '<div class="flex-list" id="purposeList">Fastest Flows (Average)</div>';
    var count = 0;
    var array = [];

    for(key in durs){
      array.push([key,durs[key]["Average Duration"]]);
    }
    array.sort(function(a,b){return a[1]-b[1]}); //sort by smallest flow time

    for(var i = 0; i < array.length; i++){
      flowFlexList += '<div class="flex-list" id="' + array[i][0] + '">' + (++count) + '. ' + array[i][0] + ': ' + Math.round(array[i][1]*10)/10 + ' seconds</div>';
      if(count >= 20){
        break;
      }
    }
    while(count < 20){
      count++;
      flowFlexList += '<div class="flex-list" id="empty"></div>';
    }
    flowFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';

    document.getElementById("flowSpeeds").innerHTML = "<br/>Fastest Flow:<br/>" + fastestFlow + "<br/>" + Math.round(minAvg/100)/10 + " s<br/><br/>Slowest Flow:<br/>" + slowestFlow + "<br/>" + Math.round(maxAvg/100)/10 + " s";
    document.getElementById("flowSpeeds").onclick = function(){document.getElementById("display").innerHTML = flowFlexList};
  });


  //make button reference
  var buttRef = umRef.child("buttonPress");
  //init storage
  var buttPushers = {};//store user data for number of times pressing each button
  var data = {};//store button data for max/avg times a user presses the button
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
        gcSnapshot.forEach(function(ggcSnapshot){// ggcSnap -> instances of pressing
          count++;
        });
        max = (count > max ? count : max);
        tot += count;
        buttPushers[user][butt] = count;
      });
      data[butt]["Max"] = max;
      data[butt]["Avg"] = (num = 0 ? 0 : tot/num);
    });

    var buttFlexList = '<div class="flex-list" id="purposeList">Most Pressed Buttons (Average)</div>';
    var count = 0;
    var array = [];
    for(key in data){
      array.push([key,data[key]["Avg"],data[key]["Max"]]);
    }
    array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent

    for(var i = 0; i < array.length; i++){
      buttFlexList += '<div class="flex-list" id="' + array[i][0] + '">' + (++count) + '. ' + array[i][0] + ': ' + Math.round(array[i][1]*100)/100 + ' presses &nbsp&nbsp&nbsp Max: ' + array[i][2] + '</div>';
      if(count >= 20){
        break;
      }
    }
    while(count < 20){
      count++;
      buttFlexList += '<div class="flex-list" id="empty"></div>';
    }
    buttFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';

    document.getElementById("buttStats").innerHTML = "<br/>User Button Presses<br/><br/>newPayment<br/>Max: " + data["newPayment"]["Max"] + "   Avg: " + Math.round(data["newPayment"]["Avg"]*100)/100 + "<br/><br/>trendingPayments<br/>Max: " + data["trendingPayments"]["Max"] + "   Avg: " + Math.round(data["trendingPayments"]["Avg"]*100)/100;
    document.getElementById("buttStats").onclick = function(){document.getElementById("display").innerHTML = buttFlexList};
  });
});
