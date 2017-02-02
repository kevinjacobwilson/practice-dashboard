$(document).ready(function(){
  //make references
  var buttRef = firebase.database().ref().child("userMetrics/buttonPress");
  //init storage
  var buttPushers = {};
  var data = {};
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
    document.getElementById("h6").innerHTML = JSONtolist(data);
  });
});
