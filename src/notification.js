'use strict';
const AWS = require("aws-sdk");

AWS.config.update({region:'eu-west-1'})

const ses = new AWS.SES({apiVersion: '2010-12-01'});

module.exports.handler = async (event) => {

  console.log("Received event", event)

  const records = event.Records

  if ( records.length !== 1) {
    const errMessage = "Only able to process 1 message at a time"
    console.log(errMessage)
    throw new Error(errMessage)
  }

  try {
    
    const record = records[0]

    const message = JSON.parse(record.body)

    switch(message.messageType) {
      // Add different message types when appropriate
      // case "sms":
      //   const response = await sendSms()
      //   console.log("sms response", response)
      default:
        console.log("Sending Email Via SES", { message })
        const response = await sendEmail(message)
        console.log("ses response", response)
    }
  
    return {
      message: `sent ${message.messageType} notification to ${message.firstName} ${message.lastName}`
    };

  } catch(err) {
    console.log("failed to send notification", event)
    throw new Error(err)
  }
};

const sendEmail = async ({contact, firstName}) => {
  const sendEmailConfig = {
    Source: process.env.VERIFIED_EMAIL || "user@exmaple.com",
    Destination: {
      ToAddresses: [contact],
    },
    Message: {
      Subject: {
        Data: "Happy Birthday!",
        Charset: "utf-8",
      },
      Body: {
        Html: {
          Data: `<h1>Happy birthday, dear ${firstName}!</h1>`,
          Charset: "utf-8",
        },
      },
    },
  };
  const res = await ses.sendEmail(sendEmailConfig).promise();
  return res
}