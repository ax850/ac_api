let router = require('express').Router();
const db = require('./../../db_conn');
const tokenHelper = require('../../helper/auth.helpers');
const {authenticationConstants} = require('./APIConstants/authentication.constants');
const {friendConstants} = require('./APIConstants/friends.constants');

router.route('/')
  .get(function (req, res) {
    /*
    * Get All Friends
    * @header-param authorization-token
    * */
    const token = req.headers['authorization-token'];
    if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

    tokenHelper.getUserFromToken(token, function (err, data) {
      if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
      let username = data['profile']['username'];

      getFriends(username, handleGetResponse)
    });

    function handleGetResponse(err, result, msg) {
      if (err) return res.status(401).send({ error: true, message: msg})
      else {
        return res.send({
          friends:result,
          success:true
        })
      }
    }
  })
  .post(function (req, res) {
    /*
    * Remove Friend
    * @header-param authorization-token
    * @body friend Username of friend
    * */
    const token = req.headers['authorization-token'];
    if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

    const {friend} = req.body;

    tokenHelper.getUserFromToken(token, function (err, data) {
      if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
      let username = data['profile']['username'];

      if (req.query.action){
        switch (req.query.action){
          case 'remove': removeFriend(username, friend, handlePostResponse); break;
          default:
            res.send({
              error: true,
              msg: friendConstants.NO_ACTION
            });
            break;
        }
      }
    });

    function handlePostResponse(err, result, msg) {
      if (err) return res.status(401).send({ error: true, message: msg})
      else {
        return res.send({
          message:msg,
          success:true
        })
      }
    }
  });


module.exports = router;

function getFriends(username, callback) {
  let sql = "SELECT 2 as status, User.user_id, User.username, User.first_name, User.last_name FROM Friends INNER JOIN User on Friends.user_2=User.username " +
      "WHERE Friends.user_1=?";
  
  db.query(sql, username, function (err, result) {
    if (err) return callback(err, result, friendConstants.GET_FAIL);
    else return callback(null, result, friendConstants.GET_SUCCESS)
  })
}

function removeFriend(username, friend, callback) {
  let sql = "DELETE from Friends WHERE " +
      "(user_1=? AND user_2=?) OR (user_1=? AND user_2=?)";
  db.query(sql, [username, friend, friend, username], function (err, result) {
    if (err) return callback(err, result, friendConstants.REMOVE_FAIL);
    else return callback(null, result, friendConstants.REMOVE_SUCCESS)
  })
}