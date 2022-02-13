const { handler } = require("../src/check-brithdays")
const { v4 } = require("uuid")
const nock = require("nock")
const crypto = require("crypto")
const querystring = require("querystring")
const fs = require('fs')
const path = require("path")

const friendsFile = fs.readFileSync(
  path.join(__dirname, "fixtures", "friends.csv"),
);

const s3NockConstructor = (file = friendsFile) => {
  const s3Nock = nock(`https://s3.eu-west-1.amazonaws.com`)
    .get(/.*/)
    .reply(200, file);
  
    return s3Nock
};

const sqsNockConstructor = () => {
  const sqsNock = nock("https://sqs.eu-west-1.amazonaws.com")
    .persist()
    .post("/", (body) => {
      sqsBody = body;
      return true;
    })
    .reply(
      200,
      (uri, requestBody) => {
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
  
  return sqsNock
}

describe("check birthdays handler", () => {
  beforeAll(() => {
    // jest.useFakeTimers()
    // jest.setSystemTime(new Date("2022-03-20"))
  });

  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // jest.useRealTimers()
  });

  
  describe("success", () => {
    it("reads friends from s3 if it's their birthday send an SQS message containing their details", async () => {
      jest.spyOn(global, 'Date').mockImplementation(() => new Date('2022-03-20'));

      const logDate = new Date()

      console.log({logDate})
      const s3Nock = s3NockConstructor()
      
      const sqsNock = sqsNockConstructor()

      const response = await handler()

      expect(response).toEqual({
        message: "sent notifications"
      })

      expect(s3Nock.isDone()).toEqual(true)
      expect(sqsNock.isDone()).toEqual(true)
    })
  })
}) 