const { findMessageableFriends } = require("../../src/utils/find-messageable-friends")

const friends = [
  {
    firstName: 'John',
    lastName: 'Doe',
    dob: '1982/10/08',
    contact: 'john.doe@foobar.com',
    messageType: 'email'
  },
  {
    firstName: 'Mary',
    lastName: 'Ann',
    dob: '1975/09/11',
    contact: 'mary.ann@foobar.com',
    messageType: 'email'
  },
  {
    firstName: 'Shatner',
    lastName: 'William',
    dob: '1931/03/20',
    contact: 'bill.shatner@example.com',
    messageType: 'email'
  },
  {
    firstName: 'Clark',
    lastName: 'Kent',
    dob: '1976/02/29',
    contact: 'clark.kent@example.com',
    messageType: 'email'
  }
]

describe("findMessageableFriends",() => {
  it("returns an array of friends who's birthday matches the provided date", () => {
    const todaysDateMock = new Date("2022/03/20")
    const result = findMessageableFriends(friends, todaysDateMock)

    expect(result).toEqual([{
      firstName: 'Shatner',
      lastName: 'William',
      dob: '1931/03/20',
      contact: 'bill.shatner@example.com',
      messageType: 'email'
    }])
  })

  it("returns friends who's birthday is 29th Feb when the date provided is the 28th Feb", () => {
    const todaysDateMock = new Date("2022/02/28")
    const result = findMessageableFriends(friends, todaysDateMock)

    expect(result).toEqual([{
      firstName: 'Clark',
      lastName: 'Kent',
      dob: '1976/02/29',
      contact: 'clark.kent@example.com',
      messageType: 'email'
    }])
  })

  it("returns an empty array if no friends data of birth matches provided date", () => {
    const todaysDateMock = new Date("2022/09/10")
    const result = findMessageableFriends(friends, todaysDateMock)

    expect(result).toEqual([])
  })

  it("returns an empty array an empty list of friends is provided", () => {
    const result = findMessageableFriends([])

    expect(result).toEqual([])
  })
})