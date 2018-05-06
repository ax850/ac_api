
function getDate(date, timezone) {
  //const date_now = new Date();

  const tz = getTimeZone(timezone);
  let newDate = null;
  if (date === 'Current') {
    newDate = new Date(); // UTC Time
    newDate.setHours(newDate.getHours() - tz); // Change time according to time zone
  }

  return newDate;

}

module.exports = {
  getDate,
};


function getTimeZone(tz) {
  switch (tz) {
    case 'EST':
      return 4;
    default:
      return 0;
  }
}
