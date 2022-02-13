'use strict';
const AWS = require('aws-sdk');
const csv = require('@fast-csv/parse');

AWS.config.update({region:'eu-west-1'})

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

module.exports.handler = async (event) => {

  console.log("Checking friends birthdays")

  try {

    console.log("fetching file from s3")

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || "exampleBucket",
      Key: process.env.AWS_BUCKET_KEY || "exampleKey.csv",
    }

    const s3Response = await s3
      .getObject(params)
      .promise();

    const csvString = s3Response.Body.toString("utf-8")

    let eligibleFriends = []

    const stream = csv.parseString(csvString, { headers: true, trim: true });
    for await (const row of stream) {

      // if today is their birthday push to array
      const publishabledMesage = {
        firstName: row.first_name,
        lastName: row.last_name,
        dob: row.date_of_birth,
        contact: row.email,
        messageType: "email"
      };

      eligibleFriends.push(publishabledMesage)
    }

    await Promise.all(eligibleFriends.map(friend => {
      const QueueUrl = String(process.env.QUEUE_URL)
      const params = {
        MessageBody: JSON.stringify(friend),
        QueueUrl
      }
      
      console.log(`sending sqs message quueue ${QueueUrl}`)

      return sqs.sendMessage(params).promise()
    }))

    return {
      message: "sent notifications"
    };

  } catch(err) {

    console.log("failed to process friends list")
    throw new Error(err)
  }
};
