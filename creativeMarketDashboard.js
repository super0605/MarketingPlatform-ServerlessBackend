const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');
const date = require('date-and-time');


const s3 = new AWS.S3();
AWS.config.update({region: 'us-east-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const tableNameGear = 'creative-marketing-gears';
const tableNameOrderGear = 'creative-marketing-order-gears-details';

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


module.exports.viewUserDashboard = (event, context,callback) => {
  Sync(function(){
     

 var accessToken =event.headers['accesstoken'];

var makeDate = new Date();
  
var lastSixMonthTime = []; 

var makeDate = new Date();
var lastFiveMonth = new Date(makeDate.setMonth(makeDate.getMonth()-5));

var lastDisplayFiveMonth = lastFiveMonth;
 lastFiveMonth =date.format(lastFiveMonth, 'YYYY-MM');
 lastDisplayFiveMonth =date.format(lastDisplayFiveMonth, 'MMM-YYYY');

console.log(lastFiveMonth+'-01 00:00:00');

lastSixMonthTime.push(lastFiveMonth+'-01 00:00:00');

var makeDate = new Date();
var lastFourMonth = new Date(makeDate.setMonth(makeDate.getMonth()-4));
var lastDisplayFourMonth =lastFourMonth;
lastFourMonth =date.format(lastFourMonth, 'YYYY-MM');
lastDisplayFourMonth =date.format(lastDisplayFourMonth, 'MMM-YYYY');

console.log(lastFourMonth+'-01 00:00:00');

lastSixMonthTime.push(lastFourMonth+'-01 00:00:00');


var makeDate = new Date();
var lastThreeMonth = new Date(makeDate.setMonth(makeDate.getMonth()-3));
var lastDisplayThreeMonth =lastThreeMonth;
lastThreeMonth =date.format(lastThreeMonth, 'YYYY-MM');
lastDisplayThreeMonth =date.format(lastDisplayThreeMonth, 'MMM-YYYY');

console.log(lastThreeMonth+'-01 00:00:00');

lastSixMonthTime.push(lastThreeMonth+'-01 00:00:00');


var makeDate = new Date();
var lastTwoMonth = new Date(makeDate.setMonth(makeDate.getMonth()-2));
var lastDisplayTwoMonth = lastTwoMonth;
lastTwoMonth =date.format(lastTwoMonth, 'YYYY-MM');
lastDisplayTwoMonth =date.format(lastDisplayTwoMonth, 'MMM-YYYY');

console.log(lastTwoMonth+'-01 00:00:00');

lastSixMonthTime.push(lastTwoMonth+'-01 00:00:00');


var makeDate = new Date();
var lastOneMonth = new Date(makeDate.setMonth(makeDate.getMonth()-1));
var lastOneDisplayMonth = lastOneMonth;
lastOneMonth =date.format(lastOneMonth, 'YYYY-MM');
lastOneDisplayMonth =date.format(lastOneDisplayMonth, 'MMM-YYYY');

console.log(lastOneMonth+'-01 00:00:00');

lastSixMonthTime.push(lastOneMonth+'-01 00:00:00');

var makeDate = new Date();

var currentMonthStartDate = new Date(makeDate.setMonth(makeDate.getMonth()));
var currentMonthStartDisplayDate = currentMonthStartDate;
currentMonthStartDate =date.format(currentMonthStartDate, 'YYYY-MM');
currentMonthStartDisplayDate =date.format(currentMonthStartDisplayDate, 'MMM-YYYY');

console.log(currentMonthStartDate+'-01 00:00:00');

lastSixMonthTime.push(currentMonthStartDate+'-01 00:00:00');


var makeDate = new Date();
var currentDate = new Date(makeDate.setMonth(makeDate.getMonth()));
currentDate =date.format(currentDate, 'YYYY-MM-DD HH:mm:ss');
console.log(currentDate);

lastSixMonthTime.push(currentDate);


  var userid = getUserInformationFromAccessToken.sync(null,accessToken);
  console.log(userid);

if(userid === 'Access Token has expired'){
  var param = {errorMessage:userid};

  callback(null,createResponse(403,param));
 }else{
      var totalAvailableItems = 0;
      var totalRentedItems = 0;
      var totalEarning = 0;
      var inventoryValue = 0;
  var gearList = getUserGearList.sync(null,userid);
  var gearListCount = gearList.Count;
  var v1 =0,v2=0,v3=0,v4=0,v5=0,v6 = 0;
  var t1 =0,t2=0,t3=0,t4=0,t5=0,t6 = 0;
  for(var i= 0; i< gearListCount;i++){
    var gearid = gearList.Items[i].gearid;
    var gearAddedDate = gearList.Items[i].record_created;
    var bookedDateInCart = showGearAvailibility.sync(null,gearid);
    var bookedDateInCartCount = bookedDateInCart.Count;
    console.log("Total rented Gears pr gearid :"+ bookedDateInCartCount);
    var replacementValue = gearList.Items[i].replacementValue;





    var lastMonthValue = dateCheck.sync(null,lastSixMonthTime,gearAddedDate);
    if(lastMonthValue === 1){
      v1 = v1 + parseInt(replacementValue);
    }
    if(lastMonthValue === 2){
      v2 = v2 + parseInt(replacementValue);
    }
    if(lastMonthValue === 3){
      v3 = v3 + parseInt(replacementValue);
    }
    if(lastMonthValue === 4){
      v4 = v4 + parseInt(replacementValue);
    }
    if(lastMonthValue === 5){
      v5 = v5 + parseInt(replacementValue);
    }
    if(lastMonthValue === 6){
      v6 = v6 + parseInt(replacementValue);
    }

    
    if(replacementValue !== undefined){
    inventoryValue = inventoryValue+ Number(replacementValue);
    }

    if(bookedDateInCartCount === 0){
        totalAvailableItems = totalAvailableItems+1;
    }
      for(var j= 0; j< bookedDateInCartCount;j++){
     
          var numberOfDays = bookedDateInCart.Items[j].totalRentedNumerOfDay;
          var totalAmmount = Number(bookedDateInCart.Items[j].pricePerDay)*numberOfDays;
          totalEarning = totalEarning+totalAmmount;

          var monthValue = dateCheck.sync(null,lastSixMonthTime,bookedDateInCart.Items[j].startDate);
          
          if(monthValue === 1){
            t1 = t1 + totalAmmount;
          }
          if(monthValue === 2){
            t2 = t2 + totalAmmount;
          }
          if(monthValue === 3){
            t3 = t3 + totalAmmount;
          }
          if(monthValue === 4){
            t4 = t4 + totalAmmount;
          }
          if(monthValue === 5){
            t5 = t5 + totalAmmount;
          }
          if(monthValue === 6){
            t6 = t6 + totalAmmount;
          }
       
         totalRentedItems = totalRentedItems+1;
        }
      }
    }
    console.log("total value : "+t1);

    var inventoryMonthlyValue   =[{"Name":lastDisplayFiveMonth,"Value":v6},{"Name":lastDisplayFourMonth,"Value":v5},{"Name":lastDisplayThreeMonth,"Value":v4},{"Name":lastDisplayTwoMonth,"Value":v3},{"Name":lastOneDisplayMonth,"Value":v2},{"Name":currentMonthStartDisplayDate,"Value":v1}];

    var totalMonthlyEarning =[{"Name":lastDisplayFiveMonth,"Value":t6},{"Name":lastDisplayFourMonth,"Value":t5},{"Name":lastDisplayThreeMonth,"Value":t4},{"Name":lastDisplayTwoMonth,"Value":t3},{"Name":lastOneDisplayMonth,"Value":t2},{"Name":currentMonthStartDisplayDate,"Value":t1}];

    var totalMonthlyAverageEarning =[{"Name":lastDisplayFiveMonth,"Value":t6/30},{"Name":lastDisplayFourMonth,"Value":t5/30},{"Name":lastDisplayThreeMonth,"Value":t4/30},{"Name":lastDisplayTwoMonth,"Value":t3/30},{"Name":lastOneDisplayMonth,"Value":t2/30},{"Name":currentMonthStartDisplayDate,"Value":t1/30}];

    var param = {totalListingGear : gearListCount,
        rented: totalRentedItems,
        available:totalAvailableItems,
        totalEarning:totalEarning,
        monthlyAverage: totalEarning/30,
        productsValue:inventoryValue,
        monthlyProductsValue:inventoryMonthlyValue,
        monthlyTotalEarning:totalMonthlyEarning,
        monthlyTotalAvarageEarning:totalMonthlyAverageEarning


    };
    
  console.log(param);
 
  callback(null,createResponse(200,param));

});
}


function getUserGearList(userid, callback) {
  var params = {
    TableName: tableNameGear,
    KeyConditionExpression: "userid = :u",
    ExpressionAttributeValues: {
        ":u": userid
    },
  };
  
process.nextTick(function(){
  dynamo.query(params, function(err, data) {
    if (err) {
      var param = {errorMessage:err.message};

      callback(null,param);
  } else {
      callback(null,data);
    }
});      
  });    
};

function showGearAvailibility(gearid,callback){
  
  process.nextTick(function(){
      var params = {
          TableName: tableNameOrderGear,
          KeyConditionExpression: "gearid = :u",
          FilterExpression:  "orderStatus= :c",
          ExpressionAttributeValues: {
              ":u": gearid,
              ":c":"rented"
          },
        };
       // console.log(params);
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

function dateCheck(lastSixMonthTime,gearAddedDate,callback) {
  var check = gearAddedDate;
   var sixMonthDate,fiveMonthDate,fourMonthDate,threeMonthDate,twoMonthDate,oneMonthDate,cDateStart;

   
   process.nextTick(function(){
   sixMonthDate = Date.parse(lastSixMonthTime[0]);
   fiveMonthDate = Date.parse(lastSixMonthTime[1]);
   fourMonthDate = Date.parse(lastSixMonthTime[2]);
   threeMonthDate = Date.parse(lastSixMonthTime[3]);
   twoMonthDate = Date.parse(lastSixMonthTime[4]);
   oneMonthDate = Date.parse(lastSixMonthTime[5]);
   oneMonthStartDates = Date.parse(lastSixMonthTime[6]);

   cDateStart = Date.parse(check);
  
   if(cDateStart <= oneMonthStartDates && cDateStart >= oneMonthDate ) {
        callback(null,1);
   }
   else if(cDateStart <= oneMonthDate && cDateStart > twoMonthDate ) {
     callback(null,2);
   }else if(cDateStart <= twoMonthDate && cDateStart > threeMonthDate ) {
     callback(null,3);
   }else if(cDateStart <= threeMonthDate && cDateStart > fourMonthDate ) {
     callback(null,4);
   }else if(cDateStart <= fourMonthDate && cDateStart > fiveMonthDate ) {
     callback(null,5);
   }else if(cDateStart <= fiveMonthDate && cDateStart > sixMonthDate ) {
     callback(null,6);
   }
   else{
   console.log("You can book gear in your chosen date");
   callback(null,0);
   }
});
}
