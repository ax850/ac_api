const db = require('./../db_conn');
const {userConstants} = require('./../routes/api/APIConstants/user.constants')

function checkUserById(user_id, callback) {
  let sql = "SELECT * FROM User WHERE user_id = ?";
  db.query(sql, user_id, function (err, result) {
    if (err || result.length < 1) return callback(true, userConstants.DOES_NOT_EXIST);
    else return callback(null, true);
  })
}

function checkUserByName(username, callback) {
  let sql = "SELECT * FROM User WHERE username = ?";
  db.query(sql, username, function (err, result) {
    if (err || result.length < 1) return callback(true, userConstants.DOES_NOT_EXIST);
    else return callback(null, true);
  })
}

module.exports = {
  checkUserById,
  checkUserByName
};