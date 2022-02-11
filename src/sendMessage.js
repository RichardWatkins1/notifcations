'use strict';
const AWS = require("aws-sdk");

AWS.config.update({region:'eu-west-1'})

const ses = new AWS.SES({apiVersion: '2010-12-01'});

module.exports.sendMessage = async (event) => {

  console.log("Received event", event)

  try {
    const { Records: { 0: record } = [] } = event

    console.log(record)

    const message = JSON.parse(record.body)

    switch(message.messageType) {
      case "sms":
        await sendSms()
        console.log("sms response", response)
      default:
        console.log("default", message)
        const response = await sendEmail(message)
        console.log("ses response", response)
    }
  
  
    return {
      message: `sent ${message.messageType} notification to ${message.firstName} ${message.lastName}`
    };

  } catch(err) {
    console.log("failed to send event", event)
    throw new Error(err)
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

const sendEmail = async ({email, firstName}) => {
  const sendEmailConfig = {
    Source: "test@example.com",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Happy Birthday!",
        Charset: "utf-8",
      },
      Body: {
        Html: {
          Data: "<h1>Happy birthday, dear <firstName>!</h1>",
          Charset: "utf-8",
        },
      },
    },
  };
  const res = await ses.sendEmail(sendEmailConfig).promise();
  return res
}

const sendSms = () => {
  console.log("sending sms")
}