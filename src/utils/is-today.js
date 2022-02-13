module.exports.isToday = (dob, today = new Date()) => {
  const dobDate = new Date(dob)

  return dobDate.getDate() == today.getDate() &&
  dobDate.getMonth() == today.getMonth()
}