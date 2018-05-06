const mysql = require('mysql');
const config = require('config.json')('./config.json');
let db;

const db_config = config.a_c.dbConfig;


function connectDatabase() {
  if (!db) {
    db = mysql.createConnection({
      host: db_config.host,
      user: db_config.user,
      port: db_config.port,
      database: process.env.NODE_ENV === 'test' ? db_config.db_test : db_config.db_dev,
      password: db_config.password
    });


    db.connect(function(err){
      if(!err) {
        console.log('Database is connected!');
      } else {
        console.log('Error connecting database!');
      }
    });
  }

  return db;
}

module.exports = connectDatabase();