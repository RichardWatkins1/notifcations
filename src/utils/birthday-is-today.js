module.exports.birthdayIsToday = (dob, today = new Date()) => {
  const dobDate = new Date(dob)

  console.log("today", today)

  return dobDate.getDate() == today.getDate() &&
  dobDate.getMonth() == today.getMonth()
}