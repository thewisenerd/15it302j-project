var express = require('express');
var router = express.Router();

var user = require('./apis/user');
var categories = require('./apis/categories');
var articles = require('./apis/articles');
var featured = require('./apis/featured');
var comments = require('./apis/comments');

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
router.use('/', featured);
router.use('/', comments);

module.exports = router;
