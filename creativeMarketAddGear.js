const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableName = process.env.Table_Name_Gear;
const indexName = process.env.Table_Name_Gear_index_on_gearid;
const bucketName = process.env.S3_User_Bucket;
const bucketPath = process.env.S3_User_Bucket_Path;

const Sync = require('sync');

module.exports.addGearItem = (event, context,callback) => {

Sync(function(){

var gearAddItem = JSON.parse(event.body);

var accessToken =event.headers['accesstoken'];

console.log(accessToken);

var userid = getUserInformationFromAccessToken.sync(null,accessToken);
if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};
  callback(null,createResponse(403,param));
 }else{

var now = new Date();
var timestamp =date.format(now, 'YYYYMMDDHHmmss');
var record_created  =date.format(now, 'YYYY-MM-DD HH:mm:ss'); 


gearAddItem.userid = userid;
gearAddItem.gearid = uuidv1();
gearAddItem.record_created = record_created;

    var base64StringsLength = gearAddItem.numberOfUserImage.length;

    for(var i = 0;i<base64StringsLength;i++){

    var keyPath = gearAddItem.userid+'/'+'UserAddGearImages'+'/'+timestamp+'-';
         var key = keyPath+i+'.jpeg';
        
        var s3UploadStatus = uploadAddGearImagesOnS3.sync(null,gearAddItem.numberOfUserImage[i],key);
        console.log("S3 Load Status : "+ s3UploadStatus);
        gearAddItem.numberOfUserImage[i] = bucketPath + key;
   }
   console.log(gearAddItem);
   var dbStatus = insertIntoDB.sync(null,gearAddItem);
   if(dbStatus === 'Inserted'){
    var param = {status:gearAddItem.gearid};

    callback(null,createResponse(200,param));
   }else{
    var param = {errorMessage:"There is some issue during data insertion into db"};

    callback(null,createResponse(403,param));
   }
  }
});
}

function insertIntoDB(item, callback) {
    item.brand = item.brand.toLowerCase();
    item.city = item.city.toLowerCase();
    item.model = item.model.toLowerCase();
    item.product_region = item.product_region.toLowerCase();
    item.categoryName_brand_model = item.categoryName+"_"+item.brand+"_"+item.model;
    item.categoryName_brand_model_PK_Index = 1;
    item.newArrival_Index = 1;

    const params = {
        TableName: tableName,
        Item: item
    };
  console.log(item);
  process.nextTick(function(){
        dynamo.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err.message));
            } else {
                callback(null, "Inserted");
            }
        });      
    });    
  };

function uploadAddGearImagesOnS3(base64StringlString,key, callback) {

    process.nextTick(function(){
          var buf = new Buffer.from(base64StringlString.replace(/^data:image\/\w+;base64,/, ""),'base64');
    
          var params = {
            Bucket: bucketName
          , Key: key
          , Body: buf
          , ContentType: 'image/jpeg' 
          , ACL: 'public-read'
          };
        s3.upload(params, function (err, data) {
          if (err){
            callback(null, err);

          }else{
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
      console.log(params);
      cognitoidentityserviceprovider.getUser(params, function(err, data) {
        if (err) { callback(null, "Access Token has expired");
        }
        else  { 
            console.log("user ID : " +data.Username);
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


module.exports.viewAddedGearItem = (event, context,callback) => {
  Sync(function(){
  var gearAddedItem = JSON.parse(event.body);
     
  var accessToken =event.headers['accesstoken'];

  console.log(accessToken);

  var gearid = gearAddedItem.gearid;

  var userid = getUserInformationFromAccessToken.sync(null,accessToken);
  console.log(userid);
if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};

  callback(null,createResponse(403,param));
 }else{

var params = {
  TableName: tableName,
  IndexName: indexName,
  KeyConditionExpression: "gearid = :g",
  ExpressionAttributeValues: {
      ":g" :gearid
  },
};
  dynamo.query(params, function(err, data) {
      if (err) {
        var param = {errorMessage:err.message};

        callback(null,createResponse(503,param));
    } else {
        callback(null,createResponse(200,data.Items));
      }
  });
  }
});
}