let router = require('express').Router();
const db = require('./../../db_conn');
const tokenHelper = require('../../helper/auth.helpers');
const date = require('./../../helper/getDate');
const userHelper = require('./../../helper/user.helper');
const {miscConstants} = require('./APIConstants/misc.constants');
const {authenticationConstants} = require('./APIConstants/authentication.constants');
const {inviteConstants} = require('./APIConstants/invite.constants');
const {userConstants} = require('./APIConstants/user.constants');

router.route('/')
    .post(function (req, res) {
      /*
      * Reponse to an invite or Cancel a sent Invite
      * @header-param authorization-token
      * @query-param: action What action to do for Invite
      * */
      const {to_user} = req.body;
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
        let from_user = data['profile']['username'];

        switch (req.query.action){
          case 'cancel': deleteInviteRequest(to_user, from_user, handlePostResponse); break;
          case 'accept': acceptRequest(to_user, from_user, handlePostResponse); break;
          case 'reject': rejectRequest(to_user, from_user, handlePostResponse); break;
          default:
            checkIfFriends(to_user, from_user, function (err, friends) {
              if (err) {
                return res.status(401).send({
                  message: data,
                  error: true
                })
              } else if (friends){
                return res.status(200).send({
                  message: inviteConstants.ALREADY_FRIENDS,
                  error: true
                })
              } else {
                createInviteRequest(to_user, from_user, handlePostResponse)
              }
            });
            break;
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
    })

    .get(function (req, res) {
      /*
      * Get all invites
      * @header-param authorization-token
      * */
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({auth: false, message: miscConstants.MISSING_TOKEN});

      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
        let username = data['profile']['username'];
        getAllInvites(username, handleGetResponse)

      });

      function handleGetResponse(err, result, msg) {
        if (err) return res.send({ error: true, message: msg})
        else {
          return res.send({
            invites: result,
            success:true
          })
        }
      }
    });

module.exports = router;

function checkIfFriends(to_user, from_user, callback) {
  let sql = "SELECT * FROM Friends where user_1=? AND user_2=?";

  db.query(sql, [to_user, from_user], function (err, data) {
    if (err ) return callback(err, data);
    else if (data.length > 0) return callback(null, true); // They Are Friends
    else return callback(null, false);  // They Are not Friends
  })
}

function deleteInviteRequest(to_user, from_user, callback) {
  userHelper.checkUserByName(to_user, function (err, exists) {
    if (err) return callback(err, exists);

    let sql = "DELETE FROM Invite WHERE to_user=? AND from_user=?";

    db.query(sql, [to_user, from_user], function (err, result) {
      if (err) return callback(err, result, inviteConstants.DELETE_FAIL);
      else return callback(null, result, inviteConstants.DELETE_SUCCESS)
    });

  });
}

function createInviteRequest(to_user, from_user, callback) {
  userHelper.checkUserByName(to_user, function (err, data) {
    if (err) return callback(err, data, userConstants.DOES_NOT_EXIST);
    let curr_date = date.getDate('Current', 'EST');
    let sql = "INSERT INTO Invite (from_user, to_user, status, date) " +
        "VALUES (?, ? , ?, ?)";


    /* Status
    * 0 === Declined
    * 1 === Pending
    * 2 === Accepted
    * */

    db.query(sql, [from_user, to_user, 1, curr_date], function (err, result) {
      if (err) return callback(err, result, inviteConstants.CREATE_FAIL);
      else return callback(null, result, inviteConstants.CREATE_SUCCESS);
    });

  });
}

function getAllInvites(username, callback) {
  let sql = "SELECT to_user as username, status, first_name, last_name FROM Invite INNER JOIN User on User.username=Invite.to_user " +
      "WHERE Invite.from_user = ? AND status=1";

  db.query(sql, username, function (err, result) {
    if (err) return callback(err, result, inviteConstants.GET_FAIL);

    let sent_invites = result;

    sql = "SELECT true as received, from_user as username, status, first_name, last_name FROM Invite INNER JOIN User on User.username=Invite.from_user" +
        " WHERE Invite.to_user = ? AND status=1";
    db.query(sql, username, function (err, result) {
      if (err) return callback(err, result, inviteConstants.GET_FAIL);

      let invites = {
        sent_invites,
        received_invites: result
      };
      return callback(null, invites, inviteConstants.GET_SUCCESS)
    })

  })
}

function acceptRequest(to_user, from_user, callback) {
  let sql = "UPDATE Invite set status=2 where to_user=? AND from_user=?";
  /* from and to user swapped */
  db.query(sql, [from_user, to_user], function (err, result) {
    if (err) return callback(err, result);

    sql = "INSERT INTO Friends (user_1, user_2, date) VALUES (?, ?, ?), (?, ?, ?)";

    let curr_date = date.getDate('Current', 'EST');

    db.query(sql, [from_user, to_user, curr_date, to_user, from_user, curr_date], function (err, result) {
      if (err) return callback(err, result, inviteConstants.ACCEPT_FAIL);
      else return callback(null, result, inviteConstants.ACCEPT_SUCCESS)
    });
  });
}

function rejectRequest(to_user, from_user, callback) {
  let sql = "UPDATE Invite set status=0 where to_user=? AND from_user=?";

  db.query(sql, [from_user, to_user], function (err, result) {
    if (err) return callback(err, result, inviteConstants.REJECT_FAIL);
    else return callback(null, result, inviteConstants.REJECT_SUCCESS);
  });
}