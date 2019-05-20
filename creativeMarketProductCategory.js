'use strict';

const AWS = require("aws-sdk");
const fetch = require('node-fetch');
const date = require('date-and-time');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

AWS.config.update({region: 'us-east-1'});

const dynamo = new AWS.DynamoDB.DocumentClient();

const table_name = process.env.Table_Name_Product_Category;

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


module.exports.getAllProductsCategory = (event, context,callback) => {

  /*const body = JSON.parse(event.body);
  var rangeStartLimit = body.startRange;
  var rangeEndLimit = body.endRange;*/

  var params = {
    TableName: table_name,
    KeyConditionExpression: "categoryid = :c",
    ProjectionExpression: "categoryNumber,categoryName,categoryLogo",
    ExpressionAttributeValues: {
        ":c": 1
    },
};
  dynamo.query(params, function(err, data) {
      if (err) {
        callback(null,createResponse(503,err.message));
    } else {
        callback(null,createResponse(200,data.Items));
      }
  });

};