var express = require('express');
var router = express.Router();

var mysql = require('../mysql');
var config = require('../config');

var send = function(res, error, data) {
  res.send({
    status: error,
    data: data
  });
};

var query = function(res, query, callback) {
  mysql.getConnection(function(err, conn) {
    if (err) {
      send(res, config.e.E_DBOVERLOAD, {
        msg: "connection limit reached!"
      });
      callback(err, null, null);
      return;
    }

    conn.query(query, function(err, results, fields) {
      conn.release();

      if (err) {
        send(res, config.e.E_DBFAIL, {
          msg: "db query failed. please try again."
        });
        callback(err, null, null);
        return;
      }

      callback(err, results, fields);
    });
  });
};

router.get('/', function(req, res, next) {
  send(res, config.e.E_OK, "welcome to the api");
});

router.get('/info/node', function(req, res, next) {
  send(res, config.e.E_OK, {
    version: process.version
  });
});

router.get('/info/mysql', function(req, res, next) {
  query(res, 'select version() as version;', function(err, results, fields) {
    send(res, config.e.E_OK, results[0]);
  });
});

module.exports = router;
