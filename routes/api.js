var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var identicon = require('identicon.js');
var mysql = require('mysql');

var user = require('./apis/user');
var categories = require('./apis/categories');
var articles = require('./apis/articles');
var featured = require('./apis/featured');
var comments = require('./apis/comments');

var helpers = require('./api-helpers');
var config = require('../config')

router.all('/', (req, res, next) => {
  helpers.send(res, config.e.E_OK, "welcome to the api");
});

router.all('/info/node', (req, res, next) => {
  helpers.send(res, config.e.E_OK, {
    version: process.version
  });
});

router.all('/info/mysql', (req, res, next) => {
  var q = mysql.format('select version() as version;');

  helpers.query(q, (err, results, fields) => {
    helpers.send(res, config.e.E_OK, results[0]);
  });
});

router.get('/avatar/:username', function(req, res, next){
  var hash = crypto.createHash('md5').update(req.params.username).digest("hex");
  var data = new identicon(hash, {format: 'svg'}).toString(true);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(data);
});

router.use('/', user);
router.use('/', categories);
router.use('/', articles);
router.use('/', featured);
router.use('/', comments);

module.exports = router;
