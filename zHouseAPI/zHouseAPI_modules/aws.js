module.exports = function() {
  var AWS = require('aws-sdk');
  var config = require('../config.js');

  AWS.config.update({accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey});
  AWS.config.update({region: 'us-east-1'});

  var sns = new AWS.SNS({apiVersion: '2010-03-31'});

  function sendSMS(message) {
    var params = {
      Message: message,
      TopicArn: config.aws.topicArn 
    };

    sns.publish(params, function(error, data) {});
  }

  return{
    sendSMS: sendSMS
  }
}