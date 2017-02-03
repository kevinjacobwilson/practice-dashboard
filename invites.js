$(document).ready(function(){
  //make references
  var iuRef = firebase.database().ref().child("invitedUsers");
  //init storage
  var invitations = {};
  var user;
  var invBy;
  var reversed = {};
  var chains = {};
  var invites = 0;
  var maxInvites = 0;
  var maxInviter = "nobody";

  var payInviters = {};

  iuRef.orderByChild("invitedBy").once("value", function(snapshot){ //snapshot.key = invitedUsers
    snapshot.forEach(function(cSnapshot){ // cSnapshot.key = invitee
      user = cSnapshot.key; //invitee
      invBy = cSnapshot.val().invitedBy; //inviter
      if(user != invBy){ //not self invited
        invites++;
      }
      if(invitations.hasOwnProperty(invBy)){
        var temp = invitations[invBy]++;
        if( temp > maxInvites ){
          maxInvites = temp;
          maxInviter = invBy;
        }
      }
      else{
        invitations[invBy] = 1;
      }

      if(!reversed.hasOwnProperty(invBy)){
        reversed[invBy] = {};//holds invites from an inviter
        chains[invBy] = {};//holds chain stats from inviter
      }
      reversed[invBy][user] = invitations[invBy];

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
        if(chains[key]["max"] > ovMax){
          ovMax = chains[key]["max"];
          ovMaxID = key;
        }
        if(chains[key]["cns"] > ovCns){
          ovCns = chains[key]["cns"];
          ovCnsID = key;
        }
        ovAvg += chains[key]["avg"]*chains[key]["cns"];
        chaintot += chains[key]["cns"];
      }
    }

    //make FlexList for side panel
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
      invFlexList += '<div class="flex-list" id="' + array[i][0] + '">' + (++count) + '. ' + array[i][0] + ': ' + array[i][1] + '</div>';
      if(count > 20){
        break;
      }
    }
    while(count < 20){
      count++;
      invFlexList += '<div class="flex-list" id="empty"></div>';
    }
    invFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';

    var chainFlexList = '<div class="flex-list" id="purposeList">Largest Invite Chains</div>';
    var count = 0;
    var array = [];
    for(key in chains){
      array.push([key,chains[key]["max"]]);
    }
    array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent

    for(var i = 0; i < array.length; i++){
      chainFlexList += '<div class="flex-list" id="' + array[i][0] + '">' + (++count) + '. ' + array[i][0] + ': ' + array[i][1] + '&nbsp&nbsp&nbsp Avg: ' + Math.round(chains[array[i][0]]["avg"]*100)/100 + '</div>';
      if(count >= 20){
        break;
      }
    }
    while(count < 20){
      count++;
      chainFlexList += '<div class="flex-list" id="empty"></div>';
    }
    chainFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';


    document.getElementById("chainLength").innerHTML = "<br/><br/>Max chain length: " + ovMax + "<br/>By User<br/><font size = 3>" + (ovMaxID.length > 20 ? ovMaxID.substr(0,19)+"...":ovMaxID) + "</font><br/><br/>Average chain length: " + (chaintot = 0 ? 0 : Math.round(ovAvg/chaintot*100)/100);
    document.getElementById("inviteStats").innerHTML = "<br/><br/>Most invites sent: " + maxInvites + "<br/>By User<br/><font size = 3>" + (maxInviter.length > 20 ? maxInviter.substr(0,19)+"...":maxInviter) + "</font><br/><br/>Most chains: " + ovCns + "<br/>By User<br/><font size = 3>" + (ovCnsID.length > 20 ? ovCnsID.substr(0,19)+"...":ovCnsID);
    document.getElementById("chainLength").onclick = function(){document.getElementById("display").innerHTML = chainFlexList};
    document.getElementById("inviteStats").onclick = function(){document.getElementById("display").innerHTML = invFlexList};



    //Do interesting bonus stuff
    var purpList = {};
    var maxPurpNum = 0;
    var maxPurpose = "";
    var piRef = firebase.database().ref().child("paymentInvites");
    piRef.once("value", function(piSnap){
      piSnap.forEach(function(piChild){
        var inviter = piChild.val().inviter;
        var invitee = (piChild.val().invitee == "sender" ? piChild.val().sender_name : piChild.val().recip_name);
        var purpose = piChild.val().purpose;
        var cost = parseInt(piChild.val().amount);
        //store payments by inviter/purpose to find common groups of invitees
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
      //do stuff with purpList after the snap is generated

      //find most common purpose
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

      //now do stuff with payInviters
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


      var purpFlexList = '<div class="flex-list" id="purposeList">Top Purposes for Payment Invites</div>';
      var count = 0;
      var array = [];
      for(key in purpList){
        array.push([key,purpList[key]["count"],purpList[key]["cost"],purpList[key]["avg"]]);
      }
      array.sort(function(a,b){return b[1]-a[1]}); //sort by most invites sent

      for(var i = 0; i < array.length; i++){
        purpFlexList += '<div class="flex-list" id="' + array[i][0] + '">' + (++count) + '. ' + array[i][0] + ': ' + array[i][1] + ' &nbsp&nbsp&nbsp Avg Cost: ' + array[i][2]/array[i][1] + ' &nbsp&nbsp&nbsp Avg Inv: '+ array[i][3] + '</div>';
        if(count >= 20){
          break;
        }
      }
      while(count < 20){
        count++;
        purpFlexList += '<div class="flex-list" id="empty"></div>';
      }
      purpFlexList += '<div class="flex-list" id="tail" style="background:rgba(5,5,5,0);font-size:0px;margin-top:0px;padding-top:0px"><font color = orange>.</div>';


      document.getElementById("invPurpose").innerHTML = "<br/>Most Common Payment Inv:<br/>" + maxPurpose + "<br/>Total: " + maxPurpNum + "<br/><br/>Most Expensive Payment Inv:<br/>" + expPurpose + "<br/>Avg Cost: " + expPurpNum;
      document.getElementById("invPurpose").onclick = function(){document.getElementById("display").innerHTML = purpFlexList};
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
