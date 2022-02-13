'use strict';
const AWS = require('aws-sdk');
const csv = require('@fast-csv/parse');
const { findMessageableFriends } = require("./utils/find-messageable-friends")

AWS.config.update({region:'eu-west-1'})

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

module.exports.handler = async (event, todaysDate = new Date()) => {

  console.log("Checking friends birthdays")

  try {

    const friends = await fetchFriends()

    const messageableFriends = findMessageableFriends(friends, todaysDate)

    const numberOfMessageableFriends = messageableFriends.length

    if (numberOfMessageableFriends > 0) {
      console.log(`Found ${messageableFriends.length} messageable fiends`)

      const responses = await Promise.all(messageableFriends.map(friend => {
        const QueueUrl = String(process.env.QUEUE_URL)
        const params = {
          MessageBody: JSON.stringify(friend),
          QueueUrl
        }

        console.log(`sending SQS message queue ${QueueUrl}`)

        const response = sqs.sendMessage(params).promise()

        console.log("sent message to SQS")

        return response
      }))

      console.log("send messages to SQS", {responses})

      return {
        message: `sent ${responses.length} notification/s`
      };
    }

    return { message: "No friends to message today"}

  } catch(err) {

    console.log("failed to process friends list")
    throw new Error(err)
  }
};

const fetchFriends = async () => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME || "exampleBucket",
    Key: process.env.AWS_BUCKET_KEY || "exampleKey.csv",
  }

  console.log("fetching file from s3")

  const s3Response = await s3
    .getObject(params)
    .promise();

  const csvString = s3Response.Body.toString("utf-8")

  let friends = []

  const stream = csv.parseString(csvString, { headers: true, trim: true });

  for await (const row of stream) {

    const publishabledMesage = {
      firstName: row.first_name,
      lastName: row.last_name,
      dob: row.date_of_birth,
      contact: row.email,
      messageType: "email"
    };

    friends.push(publishabledMesage)
  }

  console.log("Fetched friends", friends)

  return friends
}
