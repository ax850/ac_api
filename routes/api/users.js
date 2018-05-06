let router = require('express').Router();
let date = require('./../../helper/getDate');
const db = require('./../../db_conn');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config.json')('./config.json');
const {userConstants} = require('./APIConstants/user.constants');
const {miscConstants} = require('./APIConstants/misc.constants');
const {authenticationConstants} = require('./APIConstants/authentication.constants');
const tokenHelper = require('../../helper/auth.helpers');


router.route('/all')
    .get(function (req, res) {
      /*
      * Fetch All users
      * @header-param authorization-token
      * */
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
        let user_id = data['profile']['user_id'];

        getAllUsers(user_id, handleGetResponse)
      });

      function handleGetResponse(err, result, msg) {
        if (err) return res.send({ error: true, message: msg})
        else {
          return res.send({
            users: result,
            success:true
          })
        }
      }
    });

router.route('/')
    .post(function (req, res) {
      /*
      * Create a user and hash the password
      * Create A User
      * @body firstName
      * @body lastName
      * @body password
      * @username username
      * */
      const {firstName} = req.body;
      const {lastName} = req.body;
      const {password} = req.body;
      const {username} = req.body;

      checkUserExists(username, function (err, result) {
        if (result.length > 0) {  // User Exists
          return res.send({
            message: userConstants.USERNAME_EXISTS,
            error: true
          });
        } else if (result.length === 0) { // Users Doesn't Exist
          createUser(firstName, lastName, username, password, function (err, result) {
            if (err) {
              return res.send({
                message: err,
                error: true
              })
            }
          });
          return res.send({
            message: userConstants.CREATE_USER_SUCCESS,
            success: true
          });

        } else { // Misc Errors
          return res.send({
            message: err,
            error: true
          })
        }
      });
    })
    .get(function (req, res) {
      /*
      * Get User profile
      * @header-param authorization-token
      * */
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

      jwt.verify(token, config.secret, function (err, decoded) {

        if (err) res.status(401).send({auth: false, message: miscConstants.INVALID_TOKEN});

        const {user_id} = decoded;
        const {username} = decoded;
        const {hashPass} = decoded;

        getUserProfile(user_id, username, hashPass, handleGetResponse)
      });

      function handleGetResponse(err, result, msg) {
        if (err) return res.send({ error: true, message: msg})
        else {
          return res.send({
            profile: result[0],
            success:true
          })
        }
      }
    });

module.exports = router;

function checkUserExists(username, callback) {

  db.query("Select * from User where username = ?", [username], function (err, result) {
    if (err) callback(err, null);
    else callback(null, result);
  });
}

function createUser(firstName, lastName, username, password, callback) {

  let salt = bcrypt.genSaltSync(10);
  let hashPass = bcrypt.hashSync(password, salt);

  const date_joined = date.getDate('Current', 'EST');

  let sql = "INSERT INTO User (first_name, last_name, username, password, date_joined)" +
      "VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [firstName, lastName, username, hashPass, date_joined], function (err, result) {
    if (err) callback(err, null);
    else callback(null, true);
  })
}

function getUserProfile(user_id, username, hashPass, callback) {
  let sql = "SELECT first_name, last_name, username, date_joined FROM User where user_id=? AND username=? AND password=?";

  db.query(sql, [user_id, username, hashPass], function (err, result) {
    if (err) callback(err, null, userConstants.GET_FAIL);
    else callback(null, result, userConstants.GET_SUCCESS)
  });
}

function getAllUsers(user_id, callback) {
  let sql = "SELECT user_id, first_name, last_name, username, date_joined FROM User where user_id <> ?";
  db.query(sql, user_id, function (err, result) {
    if (err) callback(err, result, userConstants.GET_ALL_FAIL);
    else callback(null, result, userConstants.GET_ALL_SUCCESS)
  });
}