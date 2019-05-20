const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');
const Sync = require('sync');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableName = process.env.Table_Name_User;
const indexName = process.env.Table_Name_User_index_on_userid;

const poolid = process.env.Pool_ID;
const clientid = process.env.Client_ID;

const poolData = { UserPoolId : poolid, ClientId : clientid};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


module.exports.checkOut = (event, context,callback) => {

Sync(function(){

const body = JSON.parse(event.body);

var fullName = body.fullName;
var city = body.city;
var zip = body.zip;
var address = body.address;
var product_region = body.product_region; 
var saveAddress = body.saveAddress;

console.log(event.headers);

var accessToken =event.headers['accesstoken'];

console.log(accessToken);

var userid = getUserInformationFromAccessToken.sync(null,accessToken);

console.log(userid);

if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};
  callback(null,createResponse(403,param));
 }else{
    if(saveAddress===true){
  var response = getDataFromDB.sync(null,userid);
  var numberOfAddress = response.Items[0].userBillingAddress;
  var email = response.Items[0].email;
  var userType = response.Items[0].userType;
if(numberOfAddress === undefined){

    var address_1= {
        fullName : fullName,
        city : city,
         zip : zip,
         address : address,
         product_region : product_region
       };
      var userBillingAddress = {address_1};
      var params = {
        TableName:tableName,
        Key:{
          "email": email,
          "userType": userType
      },
        UpdateExpression: "set userBillingAddress = :b",
        ExpressionAttributeValues:{
          ":b":userBillingAddress
        },
        ReturnValues:"UPDATED_NEW"
    };
    console.log("Updating the item...");
    dynamo.update(params, function(err, data) {
    if (err) {
        var param = {errorMessage:err.message};
        console.log(param);
       callback(null,createResponse(503,param));
    } else {
       console.log("UpdateItem succeeded:", JSON.stringify(data));
       var param = {status:"Checkout is done."};

       callback(null,createResponse(200,param));

    }
});
}else{
    var userNumberOfaddress = Object.keys(numberOfAddress);
    var count = userNumberOfaddress.length+1;
    if(count <=10){
    console.log(count);
    var userAddress = {
        fullName : fullName,
        city : city,
         zip : zip,
         address : address,
         product_region : product_region
       };
      var params = {
        TableName:tableName,
        Key:{
          "email": email,
          "userType": userType
      },
        UpdateExpression: "set userBillingAddress.address_"+count +"= :b",
        ExpressionAttributeValues:{
          ":b":userAddress
        },
        ReturnValues:"UPDATED_NEW"
    };
    console.log("Updating the item...");
    dynamo.update(params, function(err, data) {
    if (err) {
        var param = {errorMessage:err.message};
        console.log(param);
       callback(null,createResponse(503,param));
        } else {
       console.log("UpdateItem succeeded:", JSON.stringify(data));
       var param = {status:"Checkout is done."};

       callback(null,createResponse(200,param));

    }
});
    }else{
        var param = {errorMessage:"You can add maximum 10 billing addresses"};
        console.log(param);
       callback(null,createResponse(503,param));
    }
}   
  }
  if(saveAddress===false){
    console.log("User don't want to save data into DB");

    var param = {status:"Checkout is done."};
    callback(null,createResponse(200,param));
  }
  }
});
}

function getDataFromDB(userid, callback) {
    const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: "userid = :u",
        ExpressionAttributeValues: {
          ":u": userid
      },
    };
    console.log(params);

  process.nextTick(function(){
        dynamo.query(params, function(err, data) {
            if (err) {
                callback(null, err.message);
            } else {
                callback(null, data);
            }
        });      
    });    
  };
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
