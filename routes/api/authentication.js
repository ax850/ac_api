let router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config.json')('./config.json');
const {authenticationConstants} = require('./APIConstants/authentication.constants');

const db = require('./../../db_conn');

router.route('/')
    .post(function (req, res) {

      const { username } = req.body;
      const { password } = req.body;

      getPasswordByUsername(username, function (err, result) {
        if (err) {
          return res.send({
            message: err,
            error: true
          })
        }

        if (!result.length){
          return res.send({
            message: authenticationConstants.USER_NOT_FOUND,
            error: true
          })
        }

        const hashPass = result[0]['password'];

        if (bcrypt.compareSync(password, hashPass)) {

          /* JWT Secret */
          const secret = config.secret;

          /* Payload */
          const user_id = result[0]['user_id'];
          const firstName = result[0]['first_name'];
          const lastName = result[0]['last_name'];
          const username = result[0]['username'];

          let token = createJWToken(user_id, firstName, lastName, username, hashPass, secret);

          return res.send({
            success: true,
            token: token,

          });
        }
        return res.send({
          message: authenticationConstants.WRONG_CRED,
          error: true
        });

      });
    });


module.exports = router;

function getPasswordByUsername(username, callback) {
  let sql = "SELECT * from User WHERE username=?";
  db.query(sql, [username], function (err, result) {
    if (err) callback(err, null);
    else callback(null, result)
  });
}

function createJWToken(user_id, firstName, lastName, username, hashPass, secret) {
  return jwt.sign(
    {user_id, firstName, lastName, username, hashPass}, secret,
    {expiresIn:86400}
  );
}