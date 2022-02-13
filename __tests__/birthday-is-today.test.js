const { birthdayIsToday } = require("../src/utils/birthday-is-today")


describe("birthdayIsToday",() => {
  it("returns true if the day and month match todays date", () => {
    const date = "1993/01/13"
    const todaysDateMock = new Date("2022/01/13")
    const result = birthdayIsToday(date, todaysDateMock)
    expect(result).toEqual(true)
  })

  it("returns false if the month and date don't match", () => {
    const date = "1993/01/12"
    const todaysDateMock = new Date("1993/01/20")
    const result = birthdayIsToday(date, todaysDateMock)
    expect(result).toEqual(false)
  })
})