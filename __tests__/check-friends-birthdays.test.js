const { handler } = require("../src/check-friends-birthdays")
const { v4 } = require("uuid")
const nock = require("nock")
const crypto = require("crypto")
const querystring = require("querystring")
const fs = require('fs')
const path = require("path")

const friendsFile = fs.readFileSync(
  path.join(__dirname, "fixtures", "friends.csv"),
);

/**
 * Intercepts http request to s3 and returns valid response
 */

const s3NockConstructor = (file = friendsFile) => {
  const s3Nock = nock(`https://s3.eu-west-1.amazonaws.com`)
    .get(/.*/)
    .reply(200, file);
  
    return s3Nock
};

/**
 * Intercepts http request to SQS and returns valid response
 * pretty horrible but do it right once and reap the benefits everywhere
 */

const sqsNockConstructor = () => {
  let sqsBody
  
  const sqsNock = nock("https://sqs.eu-west-1.amazonaws.com")
    .post("/", (body) => {
      sqsBody = body;
      return true;
    })
    .times(1)
    .reply(
      200,
      (_uri, requestBody) => {
          const body = querystring.parse(requestBody).MessageBody;
          // md5 of message body
          const md5Body = crypto.createHash("md5").update(body).digest("hex");
          return `
          <SendMessageResponse>
          <SendMessageResult>
              <MD5OfMessageBody>${md5Body}</MD5OfMessageBody>
              <MD5OfMessageAttributes>${v4()}</MD5OfMessageAttributes>
              <MessageId>${v4()}</MessageId>
          </SendMessageResult>
          <ResponseMetadata>
              <RequestId>${v4()}</RequestId>
          </ResponseMetadata>
          </SendMessageResponse>
      `;
      },
      { "Content-Type": "text/xml" }
    );

  const sqsMessage = () => JSON.parse(sqsBody.MessageBody)
  
  return {
    sqsNock,
    sqsMessage
  }
}

describe("check birthdays handler", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  
  describe("success", () => {
    it("reads friends from s3 if it's their birthday send an SQS message containing their details", async () => {
      const williamShatnersBirthday = new Date("2000/03/20")
      const s3Nock = s3NockConstructor()
      
      const { sqsNock, sqsMessage} = sqsNockConstructor()

      const response = await handler({}, {}, () => undefined, williamShatnersBirthday)

      expect(response).toEqual({
        message: "sent 1 notification/s"
      })

      expect(s3Nock.isDone()).toEqual(true)
      expect(sqsNock.isDone()).toEqual(true)
      expect(sqsMessage()).toEqual({
        contact: "bill.shatner@example.com",
        dob: "1931/03/20",
        firstName: "William",
        lastName: "Shatner",
        messageType: "email"
      })
    })

    it("returns a valid response if their are not friends to message", async () => {
      const noFriendsHaveThisBirthday = new Date("2000/12/25")
      const s3Nock = s3NockConstructor()
      
      const { sqsNock} = sqsNockConstructor()

      const response = await handler({}, {}, () => undefined, noFriendsHaveThisBirthday)

      expect(response).toEqual({
        message: "No friends to message today"
      })

      expect(s3Nock.isDone()).toEqual(true)
      expect(sqsNock.isDone()).toEqual(false)
    })
  })

  describe("error", () => {
    it("throws an error if the date provided is not a valid date", async () => {
      const invalidDate = 123
      await expect(handler({}, {}, () => undefined, invalidDate)).rejects.toThrowError()
    })
  })
}) 