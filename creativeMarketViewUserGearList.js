const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableNameGear = process.env.Table_Name_Gear;
const tableNameOrderGear = process.env.Table_Name_order_gear;

const Sync = require('sync');


function getUserInformationFromAccessToken(accessToken,callback){
    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

    process.nextTick(function(){
    var params = {
        AccessToken: accessToken
      };
      cognitoidentityserviceprovider.getUser(params, function(err, data) {
        if (err) { callback(null, "Access Token has expired");
        }
        else  { 
            callback(null, data.Username);
        }         
      });
    });
}
function createResponse(statusCode, message){
  return {
    statusCode: statusCode,
    headers: { "Access-Control-Allow-Origin": "*" ,
    "Access-Control-Allow-Methods" : "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization,AccessToken,RefreshToken, X-Requested-With"
        },
    body: JSON.stringify(message)
  };
}


module.exports.viewUserGearList = (event, context,callback) => {
  Sync(function(){
     
  var accessToken =event.headers['accesstoken'];

  console.log(accessToken);

  var userid = getUserInformationFromAccessToken.sync(null,accessToken);
  console.log(userid);
if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};

  callback(null,createResponse(403,param));
 }else{
  var gearList = getUserGearList.sync(null,userid);
  var gearListCount = gearList.Count;
  for(var i= 0; i< gearListCount;i++){
    var gearid = gearList.Items[i].gearid;
    var bookedDateInCart = showGearAvailibility.sync(null,gearid);
    var bookedDateInCartCount = bookedDateInCart.Count;

  //  console.log(bookedDateInCart);

     if(bookedDateInCartCount ===0){
       gearList.Items[i].orderStatus = "available";
     }if(bookedDateInCartCount > 0){
       var statusCount = 0;
      for(var j= 0; j< bookedDateInCartCount;j++){
        var from = bookedDateInCart.Items[j].startDate;//'2019-01-23';
        var to = bookedDateInCart.Items[j].endDate;//'2019-01-24';
        var startDateCheck = dateCheck.sync(null,from,to);
        if(startDateCheck === true){
          gearList.Items[i].orderStatus = "rented";
          var statusCount =1;
          break;
        }
      }
      if(statusCount === 0){
        gearList.Items[i].orderStatus = "available";
      }
    }
    //console.log(bookedDateInCart);
  }
  console.log(gearList);
  callback(null,createResponse(200,gearList));

  //var bookedDateInCart = showGearAvailibility.sync(null,gearid);   

 }
});
}


function getUserGearList(userid, callback) {
  var params = {
    TableName: tableNameGear,
    KeyConditionExpression: "userid = :u",
    ExpressionAttributeValues: {
        ":u": userid
    },
  };
  
process.nextTick(function(){
  dynamo.query(params, function(err, data) {
    if (err) {
      var param = {errorMessage:err.message};

      callback(null,param);
  } else {
      callback(null,data);
    }
});      
  });    
};

function showGearAvailibility(gearid,callback){
  var now = new Date();
  var todayDate  =date.format(now, 'YYYY-MM-DD');

  process.nextTick(function(){
      var params = {
          TableName: tableNameOrderGear,
          KeyConditionExpression: "gearid = :u",
          FilterExpression:  "orderStatus= :c and startDate >= :s",
          ExpressionAttributeValues: {
              ":u": gearid,
              ":c":"rented",
              ":s": todayDate
          },
        };
       // console.log(params);
        dynamo.query(params, function(err, data) {
          if (err) {
            var param = {errorMessage:err.message};
            callback(null,param);
        } else {      
           callback(null,data);
          }
      });
  });
}
function dateCheck(from,to,callback) {
  var now = new Date();
  var todayDate  =date.format(now, 'YYYY-MM-DD');
  console.log("from : "+from+"  to : "+to+" check: "+todayDate);
   var fDate,lDate,check;

   process.nextTick(function(){
      fDate = from;
      lDate = to;
      check = todayDate;
        
   if(check <= lDate && check >= fDate ) {
       console.log("rented");
        callback(null,true);
   }
   else{
    console.log("available");
    callback(null,false);
   }
});
}
