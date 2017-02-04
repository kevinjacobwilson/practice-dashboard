$(document).ready(function(){
  //make references
  var iuRef = firebase.database().ref().child("invitedUsers");
  //init storage
  var invitations = {}; // stores all inviters and # of invites
  var user;
  var invBy;
  var reversed = {}; // stores list of invitees for each inviter
  var chains = {}; // stores invite chain data for inviters
  var invites = 0;

  //track max inviter and # invites
  var maxInvites = 0;
  var maxInviter = "nobody";

  var payInviters = {};

  //iterate through invited users to find all invite chains
  iuRef.orderByChild("invitedBy").once("value", function(snapshot){ //snapshot.key = invitedUsers
    snapshot.forEach(function(cSnapshot){ // cSnapshot.key = invitee
      user = cSnapshot.key; //invitee
      invBy = cSnapshot.val().invitedBy; //inviter

      if(user != invBy){ //not self invited
        invites++;
      }

      if(invitations.hasOwnProperty(invBy)){
        var temp = invitations[invBy]++;//increment num invites for this user if in list
        if( temp > maxInvites ){ //check max values
          maxInvites = temp;
          maxInviter = invBy;
        }
      }
      else{
        invitations[invBy] = 1; //set value if not in list yet
      }

      if(!reversed.hasOwnProperty(invBy)){//populate reversed and chains objects with inviters
        reversed[invBy] = {};//holds invites from an inviter
        chains[invBy] = {};//holds chain stats from inviter
      }

      reversed[invBy][user] = invitations[invBy];//stores invitee with their number in order (first invitee, etc.)
    });

    //get activePayments
    var actPayments = {};//to store number of active payments for each user
    firebase.database().ref().child("activePayments").orderByKey().once("value", function(apSnap){
      apSnap.forEach(function(ap){//ap.key is an active payment

        var sid = ap.val()["sender_id"];
        var rid = ap.val()["recip_id"];

        actPayments[sid] = (actPayments.hasOwnProperty(sid) ? actPayments[sid] + 1 : 1);//increment if sender
        actPayments[rid] = (actPayments.hasOwnProperty(rid) ? actPayments[rid] + 1 : 1);//increment if recip

      });

      //use this to count total invites, mostly for debugging

      //var total = 0;
      //var count = 0;
      /*if(!snapshot.child(key).exists()){//OG inviter, not on invited list
        total += chains[key]["avg"]*chains[key]["cns"];
        count += countChildren(reversed, key);
      }*/

      var ovMax = 0; //overall max chain length
      var ovMaxID = ""; //uID of og inviter in max chain

      var ovAvg = 0; //overall average chain length
      var chaintot = 0; //total number of chains

      var ovCns = 0; //overall max number of chains by user
      var ovCnsID = ""; //user with max number of chains

      for(key in reversed){ //for each inviter
        if(!chains[key].hasOwnProperty("max")){//if no data,
          chains[key] = chainData(reversed,key,chains);// add data
        }

        if(!snapshot.child(key).exists()){//not in snap = OG inviter
          //update max values (OGs should have larges)
          if(chains[key]["max"] > ovMax){
            ovMax = chains[key]["max"];
            ovMaxID = key;
          }
          if(chains[key]["cns"] > ovCns){
            ovCns = chains[key]["cns"];
            ovCnsID = key;
          }
          ovAvg += chains[key]["avg"]*chains[key]["cns"];//calculate overall avg
          chaintot += chains[key]["cns"];//calculate overall number of chains
        }
      }

      //make FlexList for invite data
      var invFlexList = '<div class="flex-list" id="purposeList">Top Inviters</div>';
      var count = 0;
      var array = [];
      for(key in reversed){
        var numInv = 0;
        for(child in reversed[key]){
          numInv++;
        }
        array.push([key,numInv]);
      }
      array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent
      for(var i = 0; i < array.length; i++){
        var ari = array[i];
        invFlexList += '<div class="flex-list" id="' + ari[0] + '">' + (++count) + '. ' + ari[0] + ': ' + ari[1] + ' &nbsp AP: ' + (actPayments.hasOwnProperty(ari[0]) ? actPayments[ari[0]] : 0) + '</div>';
        if(count > 20){
          break;
        }
      }
      while(count < 20){//fill List to appropriate size
        count++;
        invFlexList += '<div class="flex-list" id="empty"></div>';
      }
      //for appearance of list only
      invFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';



      //create FlexList for chain data
      var chainFlexList = '<div class="flex-list" id="purposeList">Largest Invite Chains</div>';
      var count = 0;
      var array = []; //for sorting
      for(key in chains){
        array.push([key,chains[key]["max"]]);
      }
      array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent

      for(var i = 0; i < array.length; i++){
        var ari = array[i];
        chainFlexList += '<div class="flex-list" id="' + ari[0] + '">' + (++count) + '. ' + ari[0] + ': ' + ari[1] + '&nbsp&nbsp&nbsp Avg: ' + Math.round(chains[ari[0]]["avg"]*100)/100 + '</div>';
        if(count >= 20){
          break;
        }
      }
      while(count < 20){
        count++;
        chainFlexList += '<div class="flex-list" id="empty"></div>';
      }
      chainFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';


      document.getElementById("chainLength").innerHTML = "<br/><br/>Max chain length: " + ovMax + "<br/>By User<br/>" + (ovMaxID.length > 17 ? ovMaxID.substr(0,16)+"...":ovMaxID) + "</font><br/><br/>Average chain length: " + (chaintot = 0 ? 0 : Math.round(ovAvg/chaintot*100)/100);
      document.getElementById("inviteStats").innerHTML = "<br/><br/>Most invites sent: " + maxInvites + "<br/>By User<br/>" + (maxInviter.length > 17 ? maxInviter.substr(0,16)+"...":maxInviter) + "</font><br/><br/>Most chains: " + ovCns + "<br/>By User<br/>" + (ovCnsID.length > 17 ? ovCnsID.substr(0,16)+"...":ovCnsID);
      document.getElementById("chainLength").onclick = function(){document.getElementById("display").innerHTML = chainFlexList};
      document.getElementById("inviteStats").onclick = function(){document.getElementById("display").innerHTML = invFlexList};


      //get purposes from each paymentInvite (can use for any payments with new ref)

      var purpList = {};
      var maxPurpNum = 0;
      var sender = 0;
      var recip = 0;
      var maxPurpose = "";

      var piRef = firebase.database().ref().child("paymentInvites");
      piRef.once("value", function(piSnap){
        piSnap.forEach(function(piChild){
          if(piChild.val().invitee == "sender"){ sender++ }
          else{ recip++ }

          var inviter = piChild.val().inviter;
          var invitee = (piChild.val().invitee == "sender" ? piChild.val().sender_name : piChild.val().recip_name);
          var purpose = piChild.val().purpose;
          var cost = parseInt(piChild.val().amount);

          if(!payInviters.hasOwnProperty(purpose)){
            payInviters[purpose] = {};
          }
          if(!payInviters[purpose].hasOwnProperty(inviter)){
            payInviters[purpose][inviter] = {};
          }
          if(!payInviters[purpose][inviter].hasOwnProperty(invitee)){
            payInviters[purpose][inviter][invitee] = 1;
          }
          else{payInviters[purpose][inviter][invitee]++}

          purpList[purpose] = (purpList.hasOwnProperty(purpose) ? {"cost":purpList[purpose]["cost"]+cost,"count":purpList[purpose]["count"] + 1} :{"cost":cost,"count":1});
        });

        //find most common purpse
        for(key in purpList){
          if( purpList[key]["count"] > maxPurpNum ){
            maxPurpNum = purpList[key]["count"];
            maxPurpose = key;
          }
        }

        //find most expensive purpose (avg payment)
        var expPurpNum = 0;
        var expPurpose = "";
        for(key in purpList){
          if( purpList[key]["cost"]/purpList[key]["count"] > expPurpNum ){
            expPurpNum = purpList[key]["cost"]/purpList[key]["count"];
            expPurpose = key;
          }
        }

        //calculate average invitees for a common payment (same invitee and purpose)
        for(purp in payInviters){
          var invitees = 0;
          var inviters = 0;
          for(inv in payInviters[purp]){
            inviters++;
            for(invitee in payInviters[purp][inv]){
              invitees++;
            }
          }
          purpList[purp]["avg"] = (inviters == 0 ? 0 : invitees/inviters);
        }

        //create FlexList for payment purpose data
        var purpFlexList = '<div class="flex-list" id="purposeList">Top Purposes for Payment Invites</div>';
        var count = 0;
        var array = [];

        for(key in purpList){
          array.push([key,purpList[key]["count"],purpList[key]["cost"],purpList[key]["avg"]]);
        }
        array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent

        for(var i = 0; i < array.length; i++){
          var ari = array[i];
          purpFlexList += '<div class="flex-list" id="' + ari[0] + '">' + (++count) + '. ' + ari[0] + ': ' + ari[1] + ' &nbsp&nbsp Avg Cost: ' + ari[2]/ari[1] + ' &nbsp&nbsp Avg Inv: '+ ari[3] + '</div>';
          if(count >= 20){
            break;
          }
        }
        while(count < 20){
          count++;
          purpFlexList += '<div class="flex-list" id="empty"></div>';
        }
        purpFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';

        var numInviters = {};
        firebase.database().ref().child("invitedNumbers").once("value", function(inSnap){
          inSnap.forEach(function(number){
            var inviter = number.val()["inviter"];
            if(!numInviters.hasOwnProperty(inviter)){
              numInviters[inviter] = {
                "joined" : 0,
                "total" : 0,
              };
            }
            if(number.val()["joined"]){
              numInviters[inviter]["joined"]++;
            }
            numInviters[inviter]["total"]++;
          });

          //make FlexList for number invite data
          var recipFlexList = '<div class="flex-list" id="purposeList">Most Number Invites</div>';
          var count = 0;
          var array = [];

          for(key in numInviters){
            array.push([key,numInviters[key]["total"],numInviters[key]["joined"]]);
          }
          array.sort(function(a,b){return b[1]-a[1]}); //sort by most number invites sent
          for(var i = 0; i < array.length; i++){
            var ari = array[i];
            recipFlexList += '<div class="flex-list" id="' + ari[0] + '">' + (++count) + '. ' + ari[0] + ': ' + ari[1] + ' &nbsp&nbsp Acc: ' + Math.round((ari[1] == 0 ? 0 : ari[2]/ari[1])*100) + '%</div>';
            if(count >= 20){
              break;
            }
          }

          while(count < 20){
            count++;
            recipFlexList += '<div class="flex-list" id="empty"></div>';
          }
          recipFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';



          document.getElementById("invPurpose").innerHTML = "<br/>Most Common Pay Inv:<br/>" + maxPurpose + "<br/>Total: " + maxPurpNum + "<br/><br/>Priciest Pay Inv:<br/>" + expPurpose + "<br/>Avg Cost: " + expPurpNum;
          document.getElementById("invRecip").innerHTML = "<br/><br/>Invitee is Recip:<br/>" + (sender == -recip ? 0 : Math.round(100*recip/(sender+recip))) + " %<br/><br/>Total PayInvites: <font size = 3>" + (sender+recip);
          document.getElementById("invPurpose").onclick = function(){document.getElementById("display").innerHTML = purpFlexList};
          document.getElementById("invRecip").onclick = function(){document.getElementById("display").innerHTML = recipFlexList};
        });
      });
    });
  });//end of snapshot
});//end of main


//Recursively gets the max and average chain length, avg ppl per invite, num chains
function chainData(rev, uid, chain){
  //document.getElementById("h1").innerHTML = uid, rev[uid]);
  if(chain[uid].hasOwnProperty("max")){//already has data
    return chain[uid];
  }
  var max = 0;
  var avg = 0; //avg stores total sub invitees until the end, when
  var inv = 0; //   it is divided by inv to get the actual average
  var cns = 0; //num of chains

  for(cid in rev[uid]){ //for each child ID invited by uID
    inv++;
    if(uid == cid){//ignore self invite
      var data = {
        "max":0,
        "avg":0,
        "inv":0,
        "cns":0,
      };
      return data;
    }

    if(!rev.hasOwnProperty(cid)){ //invitee is leaf of inviteTree
      max = (max == 0 ? 1:max);
      avg += 1; //adds the leaf to total count
      cns += 1;
    }

    else{//invitee is also an inviter

      var tempData = chainData(rev,cid,chain);

      chain[cid] = { //workaround for storing data in chain[cid] without it being unrecognized
        "max":0,
        "avg":0,
        "inv":0,
        "cns":0,
      };
      chain[cid]["max"] = tempData["max"];
      chain[cid]["avg"] = tempData["avg"];
      chain[cid]["inv"] = tempData["inv"];
      chain[cid]["cns"] = tempData["cns"];

      max = (chain[cid]["max"] >= max ? chain[cid]["max"]+1:max);
      avg += (1 + chain[cid]["avg"])*chain[cid]["inv"];
      cns += chain[cid]["cns"];
    }
  }
  var data =
  {
    "max": max,
    "avg": (inv == 0 ? 0 : avg/cns),
    "inv": inv,
    "cns": cns,
  };
  return data;
}

//Recursively counts the number of users in this user's invite subtree
function countChildren(rev,uid){
  var count = 0;
  for(cid in rev[uid]){
    if(!rev.hasOwnProperty(cid)){// leaf
      count += 1;
    }
    else{// not leaf
      count += 1 + countChildren(rev,cid);
    }
  }
  return count;
}
