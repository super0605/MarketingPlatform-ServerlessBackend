const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

//const tableNameGear = process.env.Table_Name_Gear;
const tableNameOrderGear = process.env.Table_Name_order_gear;
const indexName = process.env.Table_Name_order_index_on_userid;

/*const tableNameGear = 'creative-marketing-gears';
const tableNameOrderGear = 'creative-marketing-order-gears-details';*/

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
        var numberOfJsonObject = Object.keys(data.UserAttributes);

        var json = { };
        var userid = data.Username;
        for(var i =0;i< numberOfJsonObject.length;i++){
          
            json[data.UserAttributes[i].Name] = data.UserAttributes[i].Value;
        }
        json.userid = userid;
        if(userid.includes("Facebook")){
          json.userType = "1";
        }
        else if(userid.includes("Google")){
          json.userType = "2";
        }else{
          json.userType = "3";
        }

        console.log(json);

        callback(null, json);
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


module.exports.userDashboardRentalProductList = (event, context,callback) => {
  Sync(function(){
     
    var accessToken =event.headers['accesstoken'];

    var response = getUserInformationFromAccessToken.sync(null,accessToken);
    
    if(response === 'Access Token has expired'){
    var param = {errorMessage:response};

     callback(null,createResponse(403,param));
   }else{
      
  var gearList = getDataFromDB.sync(null,response.userid);

  for(var i = 0; i < gearList.Count;i++){
    var data = getDataFromUserTableDB.sync(null,gearList.Items[i].ownerUserid);
   // gearList.Items[i].clientDP = pic;
    gearList.Items[i].clientDP = data.picture;
    gearList.Items[i].clientName = data.given_name;
   }
  
  callback(null,createResponse(200,gearList));
   }
});
}
function getDataFromDB(userid, callback) {
  const params = {
      TableName: tableNameOrderGear,
      IndexName: indexName,
      KeyConditionExpression: "userid = :u",
      FilterExpression:  "orderStatus= :c",
      ExpressionAttributeValues: {
        ":u": userid,
        ":c":"rented"
    },
  };
  console.log(params);

process.nextTick(function(){
      dynamo.query(params, function(err, data) {
          if (err) {
            var param = {errorMessage:err.message};

              callback(null, param);
          } else {
              callback(null, data);
          }
      });      
  });    
};
function getDataFromUserTableDB(userid, callback) {
  const params = {
      TableName: "creative-marketing-users",
      IndexName: "userid-index",
      KeyConditionExpression: "userid = :u ",
      //FilterExpression:  "orderStatus= :c",
      ExpressionAttributeValues: {
        ":u": userid
    },
  };
 // console.log(params);

process.nextTick(function(){
      dynamo.query(params, function(err, data) {
          if (err) {
            var param = {errorMessage:err.message};
              callback(null, param);
          } else {
              callback(null, data.Items[0].cognitoPool.userAttributes);
          }
      });      
  });    
};
