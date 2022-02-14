'use strict';
const csv = require('@fast-csv/parse');
const { findMessageableFriends } = require("./utils/find-messageable-friends")
const AWS = require('aws-sdk');

AWS.config.update({region:'eu-west-1'})

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

module.exports.handler = async (_event, _context, _callback, todaysDate = new Date()) => {
  console.log("Checking friends birthdays")

  try {

    const friends = await fetchFriends()

    const messageableFriends = findMessageableFriends(friends, todaysDate)

    const numberOfMessageableFriends = messageableFriends.length

    console.log(`Found ${numberOfMessageableFriends} messageable fiends`)

    if (numberOfMessageableFriends > 0) {

      const responses = await Promise.all(messageableFriends.map(friend => {
        const QueueUrl = String(process.env.QUEUE_URL)

        const params = {
          MessageBody: JSON.stringify(friend),
          QueueUrl,
          MessageGroupId: friend.contact
        }

        console.log(`sending SQS message queue ${QueueUrl}`)

        const response = sqs.sendMessage(params).promise()

        console.log(`sent message to SQS for friend: ${friend.contact}`)

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
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: process.env.AWS_BUCKET_KEY,
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
