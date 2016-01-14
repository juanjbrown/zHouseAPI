module.exports = function() {
  var AWS = require('aws-sdk');
  var config = require('../../config.js')[process.env.NODE_ENV];

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
  
  var ses = new AWS.SES({apiVersion: '2010-12-01'});

  function sendEmail(emailParams, callback) {
    var params = {
      Destination: {
        ToAddresses: [
          emailParams.toAddress,
        ]
      },
      Message: {
        Body: {
          Html: {
            Data: emailParams.htmlMessage
          },
          Text: {
            Data: emailParams.ptMessage
          }
        },
        Subject: {
          Data: emailParams.subject
        }
      },
      Source: config.aws.zhouseEmailAddress
    };

    ses.sendEmail(params, function(error, data) {
      if (error) {
        console.log(error);
        callback(false);
      } else {
        callback(true);
      }
    });
  }

  return{
    sendSMS: sendSMS,
    sendEmail: sendEmail
  }
}