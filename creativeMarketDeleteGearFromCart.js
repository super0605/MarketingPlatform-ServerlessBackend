const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableName = process.env.Table_Name_order_gear;
const tableNameGear = process.env.Table_Name_Gear;
const indexName = process.env.Table_Name_order_index_on_userid;

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


module.exports.deleteGearFromCart = (event, context,callback) => {
  Sync(function(){
    var deleteGear = JSON.parse(event.body);  

     var gearid = deleteGear.gearid;  //'6b893930-0eb7-11e9-bc93-f3553e4f974c';
     var orderid = deleteGear.orderid;//'45d9f0cf-3f88-4e7f-af21-61cf1c878810';

 var accessToken =event.headers['accesstoken'];
 console.log(accessToken);
//var userid ='jj';
var response = getUserInformationFromAccessToken.sync(null,accessToken);
console.log(response.userid);
if(response === 'Access Token has expired'){
  var param = {errorMessage:response};

  callback(null,createResponse(403,param));
 }else{

    var gearDelete = deleteGearFromCart.sync(null,gearid,orderid);
    if(gearDelete === "delete"){
        callback(null,createResponse(200,gearDelete));
    }else{
        callback(null,createResponse(403,gearDelete));
    }
    
 }
});
}

function deleteGearFromCart(gearid,orderid, callback) {
    
  process.nextTick(function(){
    var params = {
        TableName:tableName,
        Key:{
            "gearid": gearid,
            "orderid": orderid
        }
    };
    console.log("Attempting a delete..."+params);
    dynamo.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:"+ err.message);
            callback(null, "Unable to delete");
        } else {
            console.log("DeleteItem succeeded:", +data);
            callback(null, "deleted");
        }
    });
    });    
  };