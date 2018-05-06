let router = require('express').Router();
const db = require('./../../db_conn');
const config = require('config.json')('./config.json');
const tokenHelper = require('../../helper/auth.helpers');
const date = require('./../../helper/getDate');

const {miscConstants} = require('./APIConstants/misc.constants');
const {authenticationConstants} = require('./APIConstants/authentication.constants');
const {memoryConstants} = require('./APIConstants/memory.constants');

let multer = require('multer');

let cloudinary = require('cloudinary');
let cloudinaryStorage = require('multer-storage-cloudinary');

/* Cloudinary Configurations */
cloudinary.config({
  cloud_name: 'ax850',
  api_key: config.cloudinary.CLOUDINARY_API_KEY,
  api_secret:config.cloudinary.CLOUDINARY_API_SECRET_KEY
});

/* Cloudinary Settings */
let storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'Memory',
  allowedFormats: ['jpg', 'png'],
  filename: function (req, file, cb) {
    cb(undefined, req.originalname);
  }
});

let upload = multer({
  storage: storage
});

/* Using Multer to Parse MultiPart Data */
router.route('/')
    .post(upload.any('image'), function (req, res, err) {
      /*
      * Create A memory and store image to Cloudainry
      * @header-param authorization-token
      * @body location
      * @body description
      * @body image
      * */
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({ auth: false, message: miscConstants.MISSING_TOKEN });
      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.end({message: authenticationConstants.USER_NOT_FOUND});
        let user = data['profile']['username'];
        let location = req.body['location'];
        let description = req.body['description'];
        let secure_image_url = req.files[0].secure_url;
        let cloudinary_image_id = req.files[0]['public_id'];

        createMemory(user, location, description, secure_image_url, cloudinary_image_id, handlePostResponse)

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
      * Get all memories
      * @header-param authorization-token
      * */
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({ auth: false, message: miscConstants.MISSING_TOKEN });

      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.status(401).send({auth: false, message: miscConstants.INVALID_TOKEN});
        let user = data['profile']['username'];

        getMemory(user, handleGetResponse)
      });

      function handleGetResponse(err, result, msg) {
        if (err) return res.status(401).send({ error: true, message: msg})
        else {
          return res.send({
            memory:result,
            success:true
          })
        }
      }
    });

router.route('/:memory_id')
    .delete(function (req, res) {
      /*
      * Delete a memory created by same user
      * @param memory_id id of memory
      * */
      const memory_id = req.params.memory_id;
      const token = req.headers['authorization-token'];
      if (!token) return res.status(401).send({ auth: false, message: miscConstants.MISSING_TOKEN });

      tokenHelper.getUserFromToken(token, function (err, data) {
        if (err) return res.status(401).send({auth: false, message: miscConstants.INVALID_TOKEN});
        let user = data['profile']['username'];

        deleteMemory(user,memory_id, handleDeleteResponse)

      });

      function handleDeleteResponse(err, result, msg) {
        if (err) return res.status(401).send({ error: true, message: msg});
        else {
          return res.send({
            memory:result,
            success:true
          })
        }
      }

    });

module.exports = router;

function getMemory(username, callback) {
  let sql = "SELECT distinct Memory.memory_id as id, image_url, location, description, User_Memory.user FROM User_Memory " +
      "INNER JOIN Memory on User_Memory.memory=Memory.memory_id " +
      "LEFT JOIN Friends on User_Memory.user=Friends.user_2 " +
      "WHERE User_Memory.user=? OR (User_Memory.user=Friends.user_2 AND Friends.user_1=?)";

  db.query(sql, [username, username], function (err, result) {
    if (err) callback(err, result);
    else callback(null, result);
  })

}

function createMemory(username, location, description, secure_image_url, cloudinary_id, callback) {
  let sql = "INSERT INTO Memory (location, description, image_url, cloudinary_public_id)" +
      "VALUES (?, ? ,?, ?)";
  db.query(sql, [location, description, secure_image_url, cloudinary_id], function (err, result) {
    if (err) return callback (err, result, memoryConstants.CREATE_FAIL);
    const memory_id = result.insertId;
    const curr_date = date.getDate('Current', 'EST');
    createUserMemory(username, memory_id, curr_date, function (err, result) {
      if (err) callback (err, result, memoryConstants.CREATE_FAIL);
      else callback(null, result, memoryConstants.CREATE_SUCCESS);
    });

  });
}

function createUserMemory(username, memory_id, date, callback) {
  let sql = "INSERT INTO User_Memory (user, memory, date)" +
      "VALUES (?, ?, ?)";

  db.query(sql, [username, memory_id, date], function (err, result) {
    if (err) callback(err, result);
    else callback(null, result)
  });
}

function deleteMemory(username, memory_id, callback) {

  let sql = "SELECT * FROM Memory WHERE memory_id=?";

  db.query(sql, memory_id, function (err, result) {
    if (err) callback (err, result)
    let cloudinary_id = result[0]['cloudinary_public_id'];
    if (cloudinary_id){
      cloudinary.uploader.destroy(cloudinary_id, function (result) {
        return true
      });
    }
  });

  /* Must Delete From User_Memory First due to Foreign Key Constraint */
  sql = "DELETE FROM User_Memory where user=? AND memory=?";

  db.query(sql, [username, memory_id], function (err, result) {
    if (err) callback(err, result);

    sql = "DELETE FROM Memory Where memory_id=?";
    db.query(sql, memory_id, function (err, result) {
      if (err) callback(err, result);
      else callback(null, result)
    });
  });
}