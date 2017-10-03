var express = require('express');
var router = express.Router();

var user = require('./apis/user.js');
var categories = require('./apis/categories.js');
var articles = require('./apis/articles.js');

var helpers = require('./api-helpers');

router.get('/', function(req, res, next) {
  helpers.send(res, config.e.E_OK, "welcome to the api");
});

router.get('/info/node', function(req, res, next) {
  helpers.send(res, config.e.E_OK, {
    version: process.version
  });
});

router.get('/info/mysql', function(req, res, next) {
  helpers.query(res, 'select version() as version;', function(err, results, fields) {
    send(res, config.e.E_OK, results[0]);
  });
});

router.use('/', user);
router.use('/', categories);
router.use('/', articles);

module.exports = router;
