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


module.exports.addGearIntoCart = (event, context,callback) => {
  Sync(function(){
    var orderDetails = JSON.parse(event.body);  
    var checkDate = []; 

     var gearid = orderDetails.gearid;  //'6b893930-0eb7-11e9-bc93-f3553e4f974c';
     var owneruserid = orderDetails.userid;//'45d9f0cf-3f88-4e7f-af21-61cf1c878810';

     var startDate = orderDetails.startDate;//'2019-01-23';
     checkDate.push(startDate);
     var endDate = orderDetails.endDate;//'2019-01-24';
     checkDate.push(endDate);

 var accessToken =event.headers['accesstoken'];
 console.log(accessToken);
//var userid ='jj';
var userid = getUserInformationFromAccessToken.sync(null,accessToken);
  console.log(userid);
if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};

  callback(null,createResponse(403,param));
 }else{
    if(startDate ==='' || endDate ===''){ 
    var bookedDate = showGearAvailibility.sync(null,gearid);
    console.log(bookedDate);
    callback(null,createResponse(200,bookedDate));

    } else{
        var now = new Date();
        var record_created  =date.format(now, 'YYYY-MM-DD HH:mm:ss');  

    var bookedDate = showGearAvailibility.sync(null,gearid);   
    if (bookedDate.Count === 0) {

    var bookedDateInCart = showGearAvailibilityInCart.sync(null,userid,gearid);   

    if (bookedDateInCart.Count === 0) {

    var gearitemDetails = getGearItemDetails.sync(null,owneruserid,gearid);  

    gearitemDetails[0].orderid = uuidv1();
    gearitemDetails[0].ownerUserid = owneruserid;
    gearitemDetails[0].userid = userid;
    gearitemDetails[0].orderDate = record_created;
    gearitemDetails[0].startDate = startDate;
    gearitemDetails[0].endDate = endDate;
    gearitemDetails[0].orderStatus = 'cart';
    gearitemDetails[0].returnStatus = false;

    var dbInertion = insertIntoDB.sync(null,gearitemDetails[0]);  

    console.log(JSON.stringify(dbInertion));
    if(dbInertion ==='Inserted'){
        var param = {status:"Inserted"};
        console.log(param);
      callback(null,createResponse(200,param));


    }else{
        var param = {errorMessage:dbInertion};
        console.log(param);
        callback(null,createResponse(403,param));

    }
    }else{
        var param = {errorMessage:"Gear is already in cart"};
        callback(null,createResponse(403,param));
    }
    }else{
        var bookedDateInCart = showGearAvailibilityInCart.sync(null,userid,gearid);   

        if (bookedDateInCart.Count === 0) {
    
    for(var i = 0;i<bookedDate.Count;i++){
    
        var from = bookedDate.Items[i].startDate.split(" ");
        var to = bookedDate.Items[i].endDate.split(" ");

        var startDateCheck = dateCheck.sync(null,from,to,checkDate);

        if(startDateCheck){
            var bookedDateStatus = true;
            break;
        }else{
            var bookedDateStatus = false;
        }
    }

    if(bookedDateStatus){
        var param = {errorMessage:"Please choose right date when your selected item is not booked."};
        console.log(param);
        callback(null,createResponse(403,param));

    }else{

    var gearitemDetails = getGearItemDetails.sync(null,owneruserid,gearid);  

    gearitemDetails[0].orderid = uuidv1();
    gearitemDetails[0].ownerUserid = owneruserid;
    gearitemDetails[0].userid = userid;
    gearitemDetails[0].orderDate = record_created;
    gearitemDetails[0].startDate = startDate;
    gearitemDetails[0].endDate = endDate;
    gearitemDetails[0].orderStatus = 'cart';
    gearitemDetails[0].returnStatus = false;
    
    var dbInertion = insertIntoDB.sync(null,gearitemDetails[0]);  

    console.log(JSON.stringify(dbInertion));
    if(dbInertion ==='Inserted'){
        var param = {status:"Inserted"};
        console.log(param);
        callback(null,createResponse(200,param));

    }else{
        var param = {errorMessage:dbInertion};
        console.log(param);
        callback(null,createResponse(403,param));

    }
    }
}else{
    var param = {errorMessage:"Gear is already in cart"};
    callback(null,createResponse(403,param));

}
}
}
 }
});
}
module.exports.viewUserCart = (event, context,callback) => {
    Sync(function(){
        
     var accessToken =event.headers['accesstoken'];
     console.log(accessToken);
     var userid = getUserInformationFromAccessToken.sync(null,accessToken);
      console.log("userId : "+userid);
    if(userid === 'Access Token has expired'){
      var param = {errorMessage:userid};
    
      callback(null,createResponse(403,param));
     }else{
        var viewDBdata = viewGearsInCart.sync(null,userid);
        if(viewDBdata ==="Unable to show"){
            var param = {errorMessage:viewDBdata};
            console.log(viewDBdata);
            callback(null,createResponse(403,param));
        }else{
            console.log(viewDBdata);
            callback(null,createResponse(200,viewDBdata));

        }
     }
  });
}
function showGearAvailibility(gearid,callback){

    process.nextTick(function(){
        var params = {
            TableName: tableName,
            KeyConditionExpression: "gearid = :u",
            FilterExpression:  "orderStatus= :c",
            ExpressionAttributeValues: {
                ":u": gearid,
                ":c":"rented"
            },
          };
          dynamo.query(params, function(err, data) {
            if (err) {
              var param = {errorMessage:err.message};
              callback(null,param);
          } else {      
             callback(null,data);
            }
        });
    });
}
function dateCheck(from,to,check,callback) {
   console.log("from : "+from+"  to : "+to+" check: "+check);
    var fDate,lDate,cDate;

    process.nextTick(function(){
    fDate = Date.parse(from);
    lDate = Date.parse(to);
    cDateStart = Date.parse(check[0]);
    cDateEnd = Date.parse(check[1]);
   
    if(cDateEnd < cDateStart){
        console.log("Start date is greater than end date.");
        callback(null,true);
    }
    else if(cDateStart <= lDate && cDateStart >= fDate || cDateEnd <= lDate && cDateEnd >= fDate) {
        console.log("chosen date is already booked");
         callback(null,true);
    }
    else{
    console.log("You can book gear in your chosen date");
    callback(null,false);
    }
});
}

function getGearItemDetails(userid,gearid,callback){

    process.nextTick(function(){
        var params = {
            TableName: tableNameGear,
            KeyConditionExpression: "userid = :u and gearid = :g",
            ProjectionExpression: "gearid,categoryName,numberOfUserImage,isKit,description,accessories,postalCode,address,brand,model,categoryLogo,city,product_region,pricePerDay,replacementValue",
            ExpressionAttributeValues: {
                ":u": userid,
                ":g" :gearid
            },
          };
            dynamo.query(params, function(err, data) {
                if (err) {
                  var param = {errorMessage:err.message};
          
                  callback(null,param);
              } else {
                  callback(null,data.Items);
                }
            });          
    });
}
function insertIntoDB(item, callback) {
    
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

  function viewGearsInCart(userid, callback) {
    const params = {
        TableName:tableName,// "creative-marketing-order-gears-details",
        IndexName: indexName,//"userid-index",
        KeyConditionExpression: "userid = :u",
        FilterExpression:  "orderStatus= :c",
        ExpressionAttributeValues: {
          ":u": userid,
          ":c":"cart"
      },
    };
    console.log(params);

  process.nextTick(function(){
        dynamo.query(params, function(err, data) {
            if (err) {
                callback(null, "Unable to show");

            } else {
                callback(null, data.Items);
            }
        });      
    });    
  };

  function showGearAvailibilityInCart(userid,gearid, callback) {
    const params = {
        TableName:tableName,// "creative-marketing-order-gears-details",
        IndexName: indexName,//"userid-index",
        KeyConditionExpression: "userid = :u and gearid = :g",
        FilterExpression:  "orderStatus= :c",
        ExpressionAttributeValues: {
          ":u": userid,
          ":g":gearid,
          ":c":"cart"
      },
    };
    console.log(params);

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