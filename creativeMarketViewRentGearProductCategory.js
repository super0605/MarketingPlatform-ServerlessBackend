const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableName = process.env.Table_Name_Gear;
const indexName = process.env.Table_Name_Gear_index_on_categoryName;

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


module.exports.showRentGearProductsList = (event, context,callback) => {
  Sync(function(){
  const body = JSON.parse(event.body);
  var accessToken =event.headers['accesstoken'];

   
  var categoryName = body.categoryName;
  var brand = body.brand.toLowerCase();
  var region = body.product_region.toLowerCase();
  

  console.log(accessToken);
  var userid = getUserInformationFromAccessToken.sync(null,accessToken);
  console.log(userid);

if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};

  callback(null,createResponse(403,param));
 }else{

  if(typeof categoryName !== 'undefined' && categoryName !== null && categoryName !== '' && typeof brand !== 'undefined' && brand !== null && brand !== '' && typeof region !== 'undefined' && region !== null && region !== ''){
  
  var ExpressionAttributeValues ={
    ":cg": categoryName,
    ':b' :  brand,
    ':m' :  brand,
    ':c' :  region,
    ':r' :  region
};
var filterexpress = '((contains (brand, :b) or contains (model, :m)) and (contains(city, :c) or contains(product_region, :r)))';

}

if(typeof categoryName !== 'undefined' && categoryName !== null && categoryName !== '' && typeof brand !== 'undefined' && brand !== null && brand !== '' && region === ''){
  
  var ExpressionAttributeValues ={
    ":cg": categoryName,
    ':b' :  brand,
    ':m' :  brand
};
var filterexpress = '(contains (brand, :b) or contains (model, :m))';

}
if(typeof categoryName !== 'undefined' && categoryName !== null && categoryName !== '' && typeof region !== 'undefined' && region !== null && region !== '' && brand === ''){
  
  var ExpressionAttributeValues ={
    ":cg": categoryName,
    ':c' :  region,
    ':r' :  region
};
var filterexpress = '(contains(city, :c) or contains(product_region, :r))';

}
if(typeof categoryName !== 'undefined' && categoryName !== null && categoryName !== '' && region === '' && brand === ''){
  
  var ExpressionAttributeValues ={
    ":cg": categoryName
};
 filterexpress = '';

}
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: "categoryName = :cg",
    FilterExpression: filterexpress,

    ExpressionAttributeValues
};
if(filterexpress === ''){
delete params.FilterExpression;
}
  console.log(params);
  dynamo.query(params, function(err, data) {
      if (err) {
        var param = {errorMessage:err.message};
        console.log(param);
       callback(null,createResponse(503,param));
    } else {
      console.log(data.Items);

       callback(null,createResponse(200,data.Items));
      }
  });
  }
});
}