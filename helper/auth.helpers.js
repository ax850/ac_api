const jwt = require('jsonwebtoken');
const {miscConstants} = require('./../routes/api/APIConstants/misc.constants');
const config = require('config.json')('./config.json');
const db = require('./../db_conn');


function getUserFromToken(token, callback) {
  decodeJWT(token, function (err, data) {
    if (err) callback(err, null);

    const {user_id} = data;
    const {username} = data;
    const {hashPass} = data;
    getUserProfile(user_id, username, hashPass, function (err, profile) {
      if (err) callback(err, null);

      if (profile[0]['username']) callback(null, ({profile: profile[0], success:true}));
      else callback(true, {auth: false, message: miscConstants.INVALID_TOKEN});
    });

  });

}

module.exports = {
  getUserFromToken,
};

function getUserProfile(user_id, username, hashPass, callback) {
  let sql = "SELECT user_id, first_name, last_name, username FROM User where user_id=? AND username=? AND password=?";

  db.query(sql, [user_id, username, hashPass], function (err, result) {
    if (err) callback(err, null);
    else callback(null, result)
  });
}

function decodeJWT(token, cb) {
  jwt.verify(token, config.secret, function (err, decoded) {

    if (err) cb(err, {message: miscConstants.INVALID_TOKEN});
    else cb(null, decoded);

  });
}
