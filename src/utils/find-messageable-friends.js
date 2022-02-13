BIRTHDAY_DATE_FOR_LEAPERS = new Date("2000/02/28")
BIRTHDAY_DATE_IN_LEAP_YEAR = new Date("2000/02/29")

module.exports.findMessageableFriends = (friends, todaysDate = new Date()) => {
  if (friends.length > 0) {
    return friends.filter(friend => {
      return friend && shouldSendBirthdayMessage(friend, todaysDate)
    })
  }
  
  return []
}

/**
 * Should send a birthday message if today is the friends birthday or 
 * today is 28th of Feb and their birthday is the 29th of Feb
 * @param friend {object}
 * @param date {date}
 */

const shouldSendBirthdayMessage = ({ dob }, date) => {
  const dobDate = new Date(dob)

  return dateMatches(dobDate, date) || (dateMatches(dobDate, BIRTHDAY_DATE_IN_LEAP_YEAR) && dateMatches(date, BIRTHDAY_DATE_FOR_LEAPERS))
}

const dateMatches = (dobDate, date) => {
  return dobDate.getDate() == date.getDate() && dobDate.getMonth() == date.getMonth()
}