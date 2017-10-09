var mysql = require('mysql');
var config = require('./config');

require('dotenv').config()

var pool = mysql.createPool({
  connectionLimit : config.db.connectionLimit,
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME,
  charset  : process.env.DB_CHAR
});

module.exports = pool;
