const { handler } = require("../src/notification")
const { v4 } = require("uuid")
const nock = require("nock")

const sqsRecordBuilder = body => {
  return {
    Records: [{
      messageId: v4(),
      receiptHandle: "MessageReceiptHandle",
      body: JSON.stringify(body),
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1523232000000",
        SenderId: "123456789012",
        ApproximateFirstReceiveTimestamp: "1523232000001",
      },
      messageAttributes: {},
      md5OfBody: "{{{md5_of_body}}}",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      awsRegion: "us-east-1",
    }]
  }
}

const sesNockConstructor = () => {
  let sesBody

  const sesNock = nock("https://email.eu-west-1.amazonaws.com:443")
    .post("/", body => {
      sesBody = body
      console.log({sesBody})
      return true
    })
    .times(1)
    .reply(200);

  const sesMessage = () => sesBody
   
  return {
    sesNock,
    sesMessage
  }
}

describe("sendMessage", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });
  afterEach(() => {
    nock.cleanAll();
  });
  
  describe("sending an email", () => {
    describe("success", () => {
      it("sends an email when given a valid payload", async () => {
        const messageBody = {
          firstName: "Richard",
          lastName: "test",
          dob: "01/01/1990",
          contact: "test@example.com",
          messageType: "email"
        }
        const sqsEvent = sqsRecordBuilder(messageBody)
  
        const { sesNock, sesMessage } = sesNockConstructor()
  
        const response = await handler(sqsEvent)
  
        expect(response).toEqual({
          message: "sent email notification to Richard test"
        })
        expect(sesNock.isDone()).toEqual(true)
        expect(sesMessage()).toEqual({
          "Action": "SendEmail",
          "Destination.ToAddresses.member.1": "test@example.com",
          "Message.Body.Html.Charset": "utf-8",
          "Message.Body.Html.Data": "<h1>Happy birthday, dear Richard!</h1>",
          "Message.Subject.Charset": "utf-8",
          "Message.Subject.Data": "Happy Birthday!",
          "Source": "user@example.com",
          "Version": "2010-12-01"
        })
      })
    })

    describe("failure", () => {
      it("throws an error if there are multiple records in the SQS batch", async () => {
        const invalidSqsEvent = {
          Records: [
            {},
            {}
          ]
        }
  
        await expect(handler(invalidSqsEvent)).rejects.toThrowError()
      })
    })
  })
}) 