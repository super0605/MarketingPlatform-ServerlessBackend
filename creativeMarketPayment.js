const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');
const Sync = require('sync');

const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableName = process.env.Table_Name_order_gear;
const indexName = process.env.Table_Name_order_index_on_userid;

const poolid = process.env.Pool_ID;
const clientid = process.env.Client_ID;

const poolData = { UserPoolId : poolid, ClientId : clientid};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


module.exports.payment = (event, context,callback) => {

  Sync(function(){

console.log(event.headers);

var accessToken =event.headers['accesstoken'];

console.log(accessToken);

var userid = getUserInformationFromAccessToken.sync(null,accessToken);

console.log(userid);

if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};
  callback(null,createResponse(403,param));
 }else{

    var viewDBdata = viewGearsInCart.sync(null,userid);
  
    console.log(viewDBdata);

    var count = viewDBdata.Count;

    for(var i = 0;i < count;i++){

    var gearid =   viewDBdata.Items[i].gearid;
    var orderid = viewDBdata.Items[i].orderid;

    var startDate = viewDBdata.Items[i].startDate;//'2019-01-23';
    var endDate = viewDBdata.Items[i].endDate;//'2019-01-24';
    var numberOfDays = getRentedTotalNumberOfDays.sync(null,startDate,endDate);
    console.log(numberOfDays);

    var updateStatus = updateTableWithRented.sync(null,gearid,orderid,numberOfDays);
    console.log(updateStatus);
    }
    var calculattotalPayment = calculatePayment.sync(null,count,viewDBdata,numberOfDays);
    callback(null,createResponse(200,calculattotalPayment));
  }
  });
 };
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

function viewGearsInCart(userid, callback) {
  const params = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: "userid = :u",
      FilterExpression:  "orderStatus= :c",
      ExpressionAttributeValues: {
        ":u": userid,
        ":c":"cart"
    },
  };
process.nextTick(function(){
      dynamo.query(params, function(err, data) {
          if (err) {
              callback(null, "Unable to show");

          } else {
              callback(null, data);
          }
      });      
  });    
};

function updateTableWithRented(gearid,orderid,numberOfDay, callback) {
  var params = {
    TableName:tableName,
    Key:{
      "gearid": gearid,
      "orderid":orderid
  },
    UpdateExpression: "set orderStatus = :r, totalRentedNumerOfDay =:d",
    ExpressionAttributeValues:{
      ":r":"rented",
      ":d":numberOfDay
    },
    ReturnValues:"UPDATED_NEW"
};
dynamo.update(params, function(err, data) {
  if (err) {
      var param = {errorMessage:err.message};
      console.log("1"+param);
     callback(null,param);
      } else {

     callback(null,data);

  }
});
};
function calculatePayment(count,viewDBdata,numberOfDays, callback) {
  var totalAmonut = 0;
  for(var i = 0;i < count;i++){

    totalAmonut =   Number(viewDBdata.Items[i].pricePerDay) + totalAmonut;
    console.log(totalAmonut);

    }
    var tax = totalAmonut*.21;

    var fee= 0;
    var amount = totalAmonut+tax+fee;

    var param = {total:totalAmonut*numberOfDays,tax:tax,fee:fee,amount:amount};
    console.log(totalAmonut);

     callback(null,param);
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
function getRentedTotalNumberOfDays(startDate,endDate, callback) {
   
    
  process.nextTick(function(){

    var date1 = new Date(startDate);
    var date2 = new Date(endDate); //less than 1
    var start = Math.floor(date1.getTime() / (3600 * 24 * 1000)); //days as integer from..
    var end = Math.floor(date2.getTime() / (3600 * 24 * 1000)); //days as integer from..
    var daysDiff = end - start; // exact dates
   
    callback(null,daysDiff);
    });    
  };