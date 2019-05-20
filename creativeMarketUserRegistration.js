'use strict';
const uuidv1 = require('uuid/v1');

const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const date = require('date-and-time');
const Sync = require('sync');

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const s3 = new AWS.S3();
AWS.config.update({region: process.env.Region});

const dynamo = new AWS.DynamoDB.DocumentClient();

const table_name = process.env.Table_Name_User;
const indexName = process.env.Table_Name_User_index_on_userid;
const bucketName = process.env.S3_User_Bucket;
const bucketPath = process.env.S3_User_Bucket_Path;

const poolid = process.env.Pool_ID;
const clientid = process.env.Client_ID;

const poolData = { UserPoolId : poolid, ClientId : clientid};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

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

module.exports.socialProviderSignup = (event, context,callback) => {

  var eventObject = Object.assign({},event);
  var externalProvider = eventObject.triggerSource;
  
  Sync(function(){
    console.log("Context : "+JSON.stringify(context));
  console.log(eventObject);

  if(externalProvider === 'PreSignUp_ExternalProvider') {
             
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  var now = new Date();
  var timestamp =date.format(now, 'YYYY-MM-DD HH:mm:ss');

  eventObject.email = eventObject.request.userAttributes.email;
  eventObject.record_created = timestamp;
  var socialProvideUser = eventObject.userName;

  if(socialProvideUser.includes("Facebook")){
    eventObject.userType = "1";
  }
  if(socialProvideUser.includes("Google")){
    eventObject.userType = "2";
  }
  var str = JSON.stringify(eventObject);
  var str = str.replace("userName","userid");
  str = str.replace("cognito:","");
  str = str.replace("cognito:","");
  str = str.replace("request","cognitoPool");
  str = str.replace("response","userConfirmationStatus");

  var delete_attribute = JSON.parse(str);
  delete delete_attribute.cognitoPool.userAttributes.email_alias;
  delete delete_attribute.cognitoPool.userAttributes.phone_number_alias;
  
  var userDPImage = delete_attribute.cognitoPool.userAttributes.picture;
  
  var userImageURL = '';
  var s3UserDPPath = '';
  if(socialProvideUser.includes("Facebook")){

    var now = new Date();
    var timestamp =date.format(now, 'YYYYMMDDHHmmss');

    var userDPImageObject = JSON.parse(userDPImage);
    var keyPath = socialProvideUser+'/UserDP/'+ timestamp +'.jpeg';
    delete_attribute.cognitoPool.userAttributes.picture = bucketPath+ keyPath;
    
    var userImageURL = userDPImageObject.data.url;
    var s3UserDPPath = keyPath;
  }
  if(socialProvideUser.includes("Google")){
    
    var keyPath = socialProvideUser+'/UserDP/'+ timestamp +'.jpeg'; 
    delete_attribute.cognitoPool.userAttributes.picture = bucketPath+ keyPath;

    var userImageURL = userDPImage;
    var s3UserDPPath = keyPath;
  }

  var item = delete_attribute;

  var base64String = convertURLToBase64String.sync(null,userImageURL);
  var uploadOnS3 = uploadUserDPImageS3.sync(null,base64String,s3UserDPPath);

  console.log(uploadOnS3);

  const params = {
    TableName: table_name,
    Item: item
};
console.log(params);

  var dbResult = insertIntoDB.sync(null,params);
  console.log(dbResult);
  //console.log(dbResult);

  context.done(null,event);
           
}if(externalProvider === 'PreSignUp_SignUp') {
  context.done(null,event);
}
});
};

function convertURLToBase64String(urlString, callback) {
  var request = require('request').defaults({ encoding: null });

 process.nextTick(function(){
      request.get(urlString, function (error, response, body) {
          if (error) {
               console.log(error);
           }else{
               var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer.from(body).toString('base64');
               callback(null, data);
           }
       })
});
};
function uploadUserDPImageS3(base64StringlString,key, callback) {

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
        console.log(err)
      }else{
          callback(null, data);
      } 
    });
  });    
};

function insertIntoDB(params, callback) {
  console.log("Added item:");

process.nextTick(function(){
      dynamo.put(params, function(err, data) {
          if (err) {
              console.error("Unable to add item. Error JSON:", JSON.stringify(err.message, null, 2));
          } else {
              callback(null, JSON.stringify(data, null, 2));
          }
      });      
  });    
};

module.exports.signup = (event, context,callback) => {
  Sync(function(){
  var jsonString = JSON.parse(event.body);
  
  var email =jsonString.username;
  var  phoneNumber = jsonString.phoneNumber;
  var  fullName =jsonString.fullName;
  var  gender = jsonString.gender;
  var address = jsonString.address;
  var password = jsonString.password;
  var picture = jsonString.picture;

  var attributeList = [];

  var dataEmail = { Name : 'email', Value : email};
  var dataPhoneNumber = { Name : 'phone_number',Value : phoneNumber};
  var dataGivenName = { Name : 'given_name', Value : fullName};
  var dataGender = { Name : 'gender', Value : gender};
  var dataAddress = { Name : 'address', Value : address};
  var dataPicture = { Name : 'picture', Value : "Actucal_Picture_URL_Exists_In_DB.jpeg"};

  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
  var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);
  var attributeGivenName = new AmazonCognitoIdentity.CognitoUserAttribute(dataGivenName);
  var attributeGender = new AmazonCognitoIdentity.CognitoUserAttribute(dataGender);
  var attributeAddress = new AmazonCognitoIdentity.CognitoUserAttribute(dataAddress);
  var attributePicture = new AmazonCognitoIdentity.CognitoUserAttribute(dataPicture);

  attributeList.push(attributeEmail);
  attributeList.push(attributePhoneNumber);
  attributeList.push(attributeGivenName);
  attributeList.push(attributeGender);
  attributeList.push(attributeAddress);
  attributeList.push(attributePicture);

  console.log("congnito function : " + attributeList);

  
  var cognitoResponseJsonString = insertUserInCognitoPoolForSignup.sync(null,email , password, attributeList);

  console.log(JSON.stringify(cognitoResponseJsonString));

  var userID = cognitoResponseJsonString.userSub;

  if(typeof userID !== 'undefined' && userID !== null){
    console.log(userID);

    var keyPath = insertCognitoUserDataIntoDB.sync(null,attributeList,userID);
    console.log(keyPath);
    var inertIntoS3 = uploadUserDPImageS3.sync(null,picture,keyPath)

    console.log(inertIntoS3);
    var param = {status:"Successfully user signed up"};

    callback(null,createResponse(200,param));

  }else{
    console.log(cognitoResponseJsonString);
    var param = {errorMessage:cognitoResponseJsonString};

    callback(null,createResponse(403,param));

  }
});
 }

 function insertUserInCognitoPoolForSignup(email , password, attributeList, callback) {
  
 process.nextTick(function(){
  userPool.signUp(email , password, attributeList, fetch, function(err, result){
    if (err) {
      callback(null,err.message);
    }else{
      console.log("User successfully inserted into Cognito Pool : " + result.user.getUsername());
      callback(null, result);
    }
});
});
};
function insertCognitoUserDataIntoDB(attributeList,userID,callback) {
  
  var now = new Date();
    var timestamp =date.format(now, 'YYYYMMDDHHmmss');

    var keyPath = userID+'/UserDP/'+ timestamp +'.jpeg';

    console.log(keyPath);


  var recordCreatedTimestamp = date.format(now, 'YYYY-MM-DD HH:mm:ss');
  var s3UserDPPath = bucketPath+ keyPath;

  var userAttributesJson = {userAttributes: {}};

  for (var k = 0; k < attributeList.length; k++) {
      var objName = attributeList[k].getName();
      var objValue = attributeList[k].getValue();
      if (objValue !== ''){
      userAttributesJson.userAttributes[objName] = objValue;
      }
  }  

  userAttributesJson.userAttributes.picture = s3UserDPPath;

  var userConfirmationStatus = {
    autoConfirmUser: false,
    autoVerifyEmail :false,
    autoVerifyPhone : false
  }; 
 var item ={userConfirmationStatus,cognitoPool:userAttributesJson,userType:"3","userid": userID,"email":userAttributesJson.userAttributes.email,"record_created":recordCreatedTimestamp};
  
  console.log(item);

   const params = {
      TableName: table_name,
      Item: item
    };
    dynamo.put(params, function(err, data) {
        if (err) {
            callback(null, "Unable to add item. Error JSON:");
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            callback(null, keyPath);

        }
    });
  };
module.exports.confirmUser = (event, context, callback) =>{
  Sync(function(){
const body = JSON.parse(event.body);

var username = body.username;
var userData = {Username : username,Pool : userPool};

var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

var confirmationStatus = confirmUserViaEmailConfirmationCode.sync(null,cognitoUser,body.confirmationCode);
    console.log(confirmationStatus);
    if(confirmationStatus === 'SUCCESS'){
      
var confirmUserStatus = changeUserConfirmationStatusInDB.sync(null,username);
console.log(confirmUserStatus);
var param = {status:"User has been confirmed"};

callback(null,createResponse(200,param));
    }else{
      var param = {errorMessage:confirmationStatus};

     callback(null,createResponse(403,param));
    }

});
 };
 function confirmUserViaEmailConfirmationCode(cognitoUser, confirmationCode, callback) {
  
  process.nextTick(function(){
    cognitoUser.confirmRegistration(confirmationCode, true, function(err, result) {
      if (err) {
        callback(null,err.message);
      }else{
        callback(null, result);
      }
    });
 });
 };
 function changeUserConfirmationStatusInDB(username, callback) {
  
  process.nextTick(function(){
    const params = {
      TableName: table_name,
      Key: {
          "email":username,
          "userType":"3"
      },
      UpdateExpression: 'set userConfirmationStatus.autoConfirmUser = :v, userConfirmationStatus.autoVerifyEmail = :v',
      ExpressionAttributeValues : {
          ':v' : true
      },
      ReturnValues: 'ALL_NEW'
  };
   dynamo.update(params, function(err, data) {
      if (err) {
          callback(null, err.message);

      } else {
        callback(null, "Item is updated");
      }
  });
 });
 };
module.exports.resendConfirmationCode = (event, context, callback) =>{
  
const body = JSON.parse(event.body);

var userData = {Username : body.username,Pool : userPool};

var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

cognitoUser.resendConfirmationCode(function(err, result) {
  if (err) {
    var param = {errorMessage:err.message};

    callback(null,createResponse(403,param));
  }else{
    var param = {status:result};

    callback(null,createResponse(200,param));
  }
});
 };

 module.exports.signOut = (event, context, callback) =>{
  
    //const body = JSON.parse(event.body);
    //const accesToken = body.accesToken;

    var accessToken =event.headers['accesstoken'];

    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

     var params = {
    AccessToken: accessToken
  };
  cognitoidentityserviceprovider.globalSignOut(params, function (err, data) {
    if (err) {
      var param = {errorMessage:err.message};

      callback(null,createResponse(503,param));
    } 
    else{
      var param = {status:"User access Token has been revoked"};

      callback(null,createResponse(200,param));
    }  
  });
};
   
module.exports.sendCodeForgotPaswordUser = (event, context, callback) =>{
  Sync(function(){
  const body = JSON.parse(event.body);
  const username = body.username;
  //var accessToken =event.headers['accesstoken'];

 // var userid = getUserInformationFromAccessToken.sync(null,accessToken);

  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  var params = {
    ClientId: clientid, 
    Username: username
  };
  cognitoidentityserviceprovider.forgotPassword(params, function(err, data) {
    if (err) {
      var param = {errorMessage:err.message};
      callback(null,createResponse(503,param));
    } 
    else{
      var param = {status:data};

      callback(null,createResponse(200,param));
    }  
  });
});
};
module.exports.confirmForgotPasswordUser = (event, context, callback) =>{
  
  const body = JSON.parse(event.body);
  const username = body.username;
  const password = body.password;
  const confirmationCode = body.confirmationCode;

  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  var params = {
    ClientId: clientid, 
    ConfirmationCode: confirmationCode, 
    Password: password, 
    Username: username
  };
  cognitoidentityserviceprovider.confirmForgotPassword(params, function(err, data) {
    if (err) {
      var param = {errorMessage:err.message};

      callback(null,createResponse(503,param));
    } 
    else{
      var param = {status:"Passward has been reset"};
      callback(null,createResponse(200,param));
    }  
  });

};   
  
module.exports.changePassword = (event, context, callback) =>{
  Sync(function(){
    const body = JSON.parse(event.body);

    var accessToken =event.headers['accesstoken'];

      var response = getUserInformationFromAccessToken.sync(null,accessToken);
      
      if(response === 'Access Token has expired'){
      var param = {errorMessage:response};

       callback(null,createResponse(403,param));
     }else{

  
    var authenticationData = {Username : response.userid, Password : body.oldPassword };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
  
    var userData = {Username : response.userid,Pool : userPool};
    
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {

        cognitoUser.changePassword(body.oldPassword, body.newPassword, function(err, result1) {
          if (err) {
            var param = {errorMessage:err.message};

            callback(null,createResponse(503,param));
          }
          var param = {status:result1};

          callback(null,createResponse(200,param));
        });
      
          },
          onFailure: function(err) {
            var param = {errorMessage:err.message};

              callback(null,createResponse(503,param));
          }
      });
    }
  });
    };
    module.exports.updateCognitoUserAttributes = (event, context, callback) =>{
      Sync(function(){

      const body = JSON.parse(event.body);
      var userAttribute = body;

      var accessToken =event.headers['accesstoken'];

      var response = getUserInformationFromAccessToken.sync(null,accessToken);
      
      if(response === 'Access Token has expired'){
      var param = {errorMessage:response};

       callback(null,createResponse(403,param));
     }else{

      var cognitoUpdateStatus = updateCognitUserAttribute.sync(null,accessToken,userAttribute);
      if(cognitoUpdateStatus===true){
        var dbStatus = updateCognitoUserAttributeInDB.sync(null,response,userAttribute);
        if(dbStatus==="upated"){
          var param = {status:"Updated"};

          callback(null,createResponse(200,param));
        }if(dbStatus==="error"){
          var param = {status:"error during updating record in db"};
          callback(null,createResponse(403,param));
        }

      }
      if(cognitoUpdateStatus===false){
        var param = {status:"error during updating record in db or pool"};
        callback(null,createResponse(403,param));
        
      }
    }
            });
            
    };
    function updateCognitUserAttribute(accessToken,userAttribute,callback){
  
      process.nextTick(function(){
        

        var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
       
        var params = {
          AccessToken: accessToken, 
          UserAttributes: [ 
            userAttribute
          ]
        };
   
        cognitoidentityserviceprovider.updateUserAttributes(params, function(err, data) {
                  if (err) {  
                    callback(null,false);
                  }
                  else {
                    callback(null,true);
                 
                }
                });
      });

    }
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
       
function updateCognitoUserAttributeInDB (response,userAttribute,callback){
 
  process.nextTick(function(){
  var attribute = userAttribute.Name;
  var value = userAttribute.Value;

  console.log('attribute'+ attribute);
  console.log('value'+ value);

  const params = {
      TableName: table_name,
      Key: { "email":response.email,"userType":response.userType},
      //ConditionExpression: 'attribute_exists(userid)',
      UpdateExpression: 'set cognitoPool.userAttributes.'+attribute+' =:v',
      ExpressionAttributeValues : {
          ':v' : value
      },
      ReturnValues: 'UPDATED_NEW'
  };
    dynamo.update(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:"+ JSON.stringify(err.message));
          callback(null, "error");

      } else {
        //param = {status:"upated"};
        console.log("Updated item:"+ JSON.stringify(data));
        callback(null, "upated");
      }
  });
});
};

module.exports.signin = (event, context, callback) =>{
  
  Sync(function(){
  const body = JSON.parse(event.body);

  var authenticationData = {Username : body.username, Password : body.password };
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  var userData = {Username : body.username,Pool : userPool};
  
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  
  var cognitoResponseJsonString = signinUserFromCognito.sync(null,cognitoUser , authenticationDetails);
  
  var idToken = cognitoResponseJsonString.idToken;

  if(typeof idToken !== 'undefined' && idToken !== null){

    var response = getUserDateFromDB.sync(null,body.username);

    var userData = response.Items[0].cognitoPool.userAttributes;
    userData.userid =  response.Items[0].userid;
    userData.userType =  response.Items[0].userType;

    var userAttributeData = {
      userAttributes: userData,
      tokens :cognitoResponseJsonString
    }; 
       console.log(userAttributeData);
    callback(null,createResponse(200,userAttributeData));

  }else{
    var param = {errorMessage:cognitoResponseJsonString};
    callback(null,createResponse(403,param));
  }

});
};

function signinUserFromCognito(cognitoUser , authenticationDetails, callback) {

  process.nextTick(function(){
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
         var tokens = {"refreshToken" :result.refreshToken.token,
                       "idToken" : result.idToken.jwtToken,
                       "accessToken" : result.accessToken.jwtToken};
        callback(null, tokens);

          },
          onFailure: function(err) {
            console.log("Error Message : "+err.message);
            callback(null,err.message);
          }
      });
 });
 };

 function getUserDateFromDB(username, callback) {
  process.nextTick(function(){
    var params = {
      TableName: table_name,
      KeyConditionExpression: "email = :e and userType =:u" ,
   // ProjectionExpression: "cognitoPool.userAttributes.email,cognitoPool.userAttributes.gender,cognitoPool.userAttributes.picture",
      ExpressionAttributeValues: {
          ":e": username,
          ":u":"3"
      },
  };
    dynamo.query(params, function(err, data) {
        if (err) {
          callback(null,err.message);
      } else {
        callback(null, data);
        }
    });
 });
 };
