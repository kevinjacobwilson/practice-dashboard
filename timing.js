$(document).ready(function(){
  //make references
  var umRef = firebase.database().ref().child("userMetrics");
  var timingRef = umRef.child("timing");
  //init storage
  var durs = {};
  //Calculate duration stats for each flow in userMetrics/timing
  timingRef.once("value",function(snapshot){ //snapshot.key == timing
    snapshot.forEach(function(cSnapshot){      //cSnapshot.key == flow
      var flowDurs = [];
      var flowName = cSnapshot.key;
      var maxDur = 0;
      var minDur = 1000000;
      cSnapshot.forEach(function(gcSnapshot){    //gcSnapshot.key == user

        gcSnapshot.forEach(function(ggcSnapshot){  //ggcSnapshot.key ==  instance
          //update values per instance
          var dur = ggcSnapshot.val().duration;
          flowDurs.push(dur);
          if(dur > maxDur){maxDur = dur;}
          if(dur < minDur){minDur = dur;}
        });
      });

      //organize data for flows
      var data = {};
      data["Minimum Duration"] = minDur;
      data["Maximum Duration"] = maxDur;
      data["Average Duration"] = flowDurs.reduce(function(sum, num) {return sum+num;} )/flowDurs.length;
      durs[flowName] = data;

    });
    document.getElementById("h5").innerHTML = JSONtolist(durs);
  });
});
