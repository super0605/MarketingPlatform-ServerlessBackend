const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

//const tableNameGear = process.env.Table_Name_Gear;
const tableName = process.env.Table_Name_User;
const indexName = process.env.Table_Name_order_index_on_userid;
const bucketName = process.env.S3_User_Bucket;
const bucketPath = process.env.S3_User_Bucket_Path;


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


module.exports.userDashboardDisplayPictureEdit = (event, context,callback) => {
  Sync(function(){
     
    var accessToken =event.headers['accesstoken'];

    var jsonString = JSON.parse(event.body);
  
  var base64StringlString =jsonString.picture;

    var response = getUserInformationFromAccessToken.sync(null,accessToken);
    
    if(response === 'Access Token has expired'){
    var param = {errorMessage:response};

     callback(null,createResponse(403,param));
   }else{
    var uploadStatus = uploadUserDPImageS3.sync(null,base64StringlString,response.userid);
    if(uploadStatus === "error"){
      var param = {errorMessage:"Image is not uploaded on S3"};
      callback(null,createResponse(403,param));
      }else{
        var params = {
          TableName:tableName,
          Key:{
            "email": response.email,
            "userType": response.userType
        },
          UpdateExpression: "set cognitoPool.userAttributes.picture = :p",
          ExpressionAttributeValues:{
            ":p":uploadStatus
          },
          ReturnValues:"UPDATED_NEW"
      };
      console.log("Updating the item...");
      dynamo.update(params, function(err, data) {
      if (err) {
          var param = {errorMessage:err.message};
          console.log(param);
         callback(null,createResponse(403,param));
          } else {
         console.log("UpdateItem succeeded:", JSON.stringify(data));
         var param = {status:"Image is updated."};
  
         callback(null,createResponse(200,param));
  
      }
    });
      
      
  //var gearList = getDataFromDB.sync(null,response.userid);
  
  //callback(null,createResponse(200,gearList));
   }
   }
});
}
function uploadUserDPImageS3(base64StringlString,userid, callback) {

  var now = new Date();
    var timestamp =date.format(now, 'YYYYMMDDHHmmss');

    var keyPath = userid+'/UserDP/'+ timestamp +'.jpeg';

    var s3UserDPPath = bucketPath+ keyPath;


    console.log(keyPath);

  process.nextTick(function(){
        var buf = new Buffer.from(base64StringlString.replace(/^data:image\/\w+;base64,/, ""),'base64');
  
        var params = {
          Bucket: bucketName
        , Key: keyPath
        , Body: buf
        , ContentType: 'image/jpeg' 
        , ACL: 'public-read'
        };
      s3.upload(params, function (err, data) {
        if (err){
          console.log(err)
          callback(null, "error");

        }else{
            callback(null, s3UserDPPath);
        } 
      });
    });    
  };
  