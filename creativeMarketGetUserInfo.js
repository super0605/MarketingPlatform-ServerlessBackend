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

module.exports.getUserInfo = (event, context,callback) => {

Sync(function(){

console.log(event.headers);

var accessToken =event.headers['accesstoken'];

console.log(accessToken);

var userid = getUserInformationFromAccessToken.sync(null,accessToken);

console.log(userid);

//var userid = '3e974ee3-5cfe-4539-aaf7-b5a24bd20163';
if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};
  callback(null,createResponse(403,param));
 }else{

   var response = getDataFromDB.sync(null,userid);
   
   var userData = response.Items[0].cognitoPool.userAttributes;
    userData.userid =  response.Items[0].userid;
    userData.userType =  response.Items[0].userType;
    if(response.Items[0].userBillingAddress === undefined){
      var userAttributeData = {
        userAttributes: userData,
        userBillingAddress :""
      }; 
    }else{
      userData.userBillingAddress =  response.Items[0].userBillingAddress;
      var userAttributeData = {
        userAttributes: userData
      }; 
    }
   console.log(userAttributeData);
   callback(null,createResponse(200,userAttributeData));

   
  }
});
}

module.exports.getUserRefreshTokens = (event, context,callback) => {

  Sync(function(){

    //console.log(event);
    var refreshtoken =event.headers['refreshtoken'];
   
    var jsonString = JSON.parse(event.body);
  
    var userid =jsonString.username;

    console.log(userid);
    var tokenStatus = getUserRefreshedTokens.sync(null,refreshtoken,userid);

if(tokenStatus === 'Refresh Token has expired' || userid === 'Access Token has expired'){
  var param = {errorMessage:'Access Token has expired'};
  callback(null,createResponse(403,param));
 }else{

  callback(null,createResponse(200,tokenStatus));
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
function getUserRefreshedTokens(refreshtoken,userid,callback){
  
  var refreshTokenObject = new AmazonCognitoIdentity.CognitoRefreshToken({RefreshToken: refreshtoken});
  
  var userData = {
      Username : userid,
      Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  process.nextTick(function(){
  
    cognitoUser.refreshSession(refreshTokenObject, (err, data) => {
      if (err) {
        callback(null, "Refresh Token has expired");
      } else {
        console.log(data);
        callback(null, data);
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
