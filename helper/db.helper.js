/* Used For Testing Purposes */

const db = require('./../db_conn');

function clearDatabase() {

  let sql = 'DELETE FROM a_c_test.Friends';
  db.query(sql);

  sql = 'ALTER TABLE a_c_test.Friends AUTO_INCREMENT = 1';
  db.query(sql);

  sql = 'DELETE FROM a_c_test.Invite';
  db.query(sql);

  sql = 'ALTER TABLE a_c_test.Invite AUTO_INCREMENT = 1';
  db.query(sql);

  sql = 'DELETE FROM a_c_test.User_Memory';
  db.query(sql);

  sql = 'ALTER TABLE a_c_test.User_Memory AUTO_INCREMENT = 1';
  db.query(sql);

  sql = 'DELETE FROM a_c_test.Memory';
  db.query(sql);

  sql = 'ALTER TABLE a_c_test.Memory AUTO_INCREMENT = 1';
  db.query(sql);

  sql = 'DELETE FROM a_c_test.User';
  db.query(sql);

  sql = 'ALTER TABLE a_c_test.User AUTO_INCREMENT = 1';
  db.query(sql);

}

module.exports = {
  clearDatabase
};