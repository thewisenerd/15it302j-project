var express = require('express');
var router = express.Router();

var user = require('./apis/user.js');

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

router.use('/', user);

module.exports = router;
