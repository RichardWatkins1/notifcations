const { isToday } = require("../src/utils/is-today")


describe("isToday",() => {
  it("returns true if the day and month match todays date", () => {
    const date = "1993/02/13"
    const todaysDateMock = new Date("1993/02/13")
    const result = isToday(date, todaysDateMock)
    expect(result).toEqual(true)
  })

  it("returns false if the month and date don't match", () => {
    const date = "1993/02/12"
    const todaysDateMock = new Date("1993/02/13")
    const result = isToday(date, todaysDateMock)
    expect(result).toEqual(false)
  })
})