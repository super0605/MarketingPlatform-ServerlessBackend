const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

/*const tableName = process.env.Table_Name_Gear;
const indexName = process.env.Table_Name_Gear_index_on_categoryName;
const productTableName = process.env.Table_Name_Product_Category;*/

const productTableName = "creative-marketing-products-category";
const tableName = "creative-marketing-gears";
const indexName = "categoryName-gearid-index";

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

module.exports.showHomePageSearch = (event, context,callback) => {
  Sync(function(){
 
  const body = JSON.parse(event.body);
  var accessToken =event.headers['accesstoken'];

   
  //var categoryName = body.categoryName;
  var brand = body.brand.toLowerCase();
  var region = body.product_region.toLowerCase();
  
  console.log(accessToken);
  var response = getUserInformationFromAccessToken.sync(null,accessToken);
  
 //var response = "test";
 //var brand ='comp';
 //var region ="isl";
  //console.log(response);

if(response === 'Access Token has expired'){
  var param = {errorMessage:response};

  callback(null,createResponse(403,param));
 }else{
  var getProductStatus = getProductCategory.sync(null,brand);
  //console.log(getProductStatus);
 if(getProductStatus.Count > 0){
   var categoryName = getProductStatus.Items[0].categoryName ;
  if(region === ''){
  
    var ExpressionAttributeValues ={
      ":cg": categoryName
  };
   filterexpress = '';
  
  }
  if(region !== 'undefined' && region !== null && region !== ''){
  
    var ExpressionAttributeValues ={
      ":cg": categoryName,
      ':c' :  region,
      ':r' :  region
  };
  var filterexpress = '(contains(city, :c) or contains(product_region, :r))';
  
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
    console.log(data);
    callback(null,createResponse(200,data.Items));
    }
});
}else{

  if(region === ''){
  
    var ExpressionAttributeValues ={
      ":c": 1,
    ":cg": brand
  };
   filterexpress = 'contains(categoryName_brand_model, :cg)';
  
  }
  if(region !== 'undefined' && region !== null && region !== ''){
    var ExpressionAttributeValues ={
      ":c": 1,
    ":cg": brand,
    ':r1' :  region,
    ':r2' :  region
  };
  // filterexpress = 'contains(categoryName_brand_model, :cg)';
  var filterexpress = '((contains(city, :r1) or contains(product_region, :r2)) and contains(categoryName_brand_model, :cg))';
  
  }
//"categoryName_brand_model_PK_Index":1,
  const params = {
    TableName: tableName,
    IndexName: "categoryName_brand_model_PK_Index-index",
    KeyConditionExpression: "categoryName_brand_model_PK_Index = :c",
    FilterExpression: filterexpress,

    ExpressionAttributeValues
};

dynamo.query(params, function(err, data) {
  if (err) {
    var param = {errorMessage:err.message};
    console.log(param);
   callback(null,createResponse(503,param));
} else {
  console.log(data);
  callback(null,createResponse(200,data.Items));

}
});

}

 }
});
 }
function getProductCategory(categoryName,callback){

  process.nextTick(function(){
    var params = {
      TableName: productTableName,
      KeyConditionExpression: "categoryid = :c",
      FilterExpression: '(contains(categoryNameLowerCase, :n))',
      ProjectionExpression: "categoryName",
      ExpressionAttributeValues: {
          ":c": 1,
          ":n":categoryName
      },
  };
    dynamo.query(params, function(err, data) {
        if (err) {
          callback(null,err.messag);
      } else {
          callback(null,data);
        }
    });
  });
}
