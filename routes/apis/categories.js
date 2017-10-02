var express = require('express');
var router = express.Router();

var helpers = require('../api-helpers');
var mysql = require('mysql');
var config = require('../../config');

router.route('/categories')
.get(function(req, res, next) {
  helpers.query(res, mysql.format(
    'select * from ?? order by ? asc;',
    [
      config.db.tables['categories'],
      'order'
    ]
  ), function(err, results, fields) {
    if (err){
      console.log(err);
      helpers.errexit(res, config.e.E_DBFAIL);
      return;
    }

    console.log(results);
    helpers.send(res, config.e.E_OK, results);
  });

}).post(function(req, res, next) {

  var err = false;
  if (Array.isArray(req.body)) {
    if (req.body.length > 0) {
      for (var i = 0; i < req.body.length; i++) {
        if ( ! req.body[i]['categoryid'] || ! req.body[i]['order'] ) {
          err = true;
          break;
        }
      }
    } else {
      err = true;
    }
  } else {
    err = true;
  };

  if (err) {
    helpers.errexit(res, config.e.E_WRONG_PARAMETERS);
    return;
  }

  var q1 = 'update ?? set ?? = case ??'
  var q2b = 'when ? then ? '
  var q2 = ' '
  var q3 = 'end where ?? in ('
  var q4 = ');'
  var ids = [];

  q1 = mysql.format(q1, [
    config.db.tables['categories'],
    'order', 'categoryid'
  ]);

  for (var i = 0; i < req.body.length; i++) {
    q2 += mysql.format(q2b, [
      req.body[i]['categoryid'],
      req.body[i]['order'],
    ]);

    ids.push(req.body[i]['categoryid']);
  }

  q3 = mysql.format(q3, ['categoryid']);

  var q35 = ', ?'.repeat(req.body.length);
  q35 = q35.substr(2);

  q35 = mysql.format(q35, ids);

  var q = q1 + q2 + q3 + q35 + q4;

  helpers.query(res, q, function(err, results, fields) {
    if (err){
      console.log(err);
      helpers.errexit(res, config.e.E_DBFAIL);
      return;
    }

    console.log(results);
    if (results.affectedRows) {
      helpers.errexit(res, config.e.E_OK);
    } else {
      helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
    }
  });
});

var route_categories_category = function(req, res, next) {
  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['categories'],
      'name', req.params.category
    ]
  );
  helpers.query(res, q, function(err, results, fields) {
    if (err){
      console.log(err);
      helpers.errexit(res, config.e.E_DBFAIL);
      return;
    }

    if (results.length) {
      helpers.send(res, config.e.E_OK, results);
      return;
    }

    var category = req.params.category;
    var q = mysql.format(
      'insert into ?? (??, ??) select ?, (max(??)+1) from ??',
      [
        config.db.tables['categories'],
        'name', 'order',
        category, 'order', config.db.tables['categories']
      ]
    );
    helpers.query(res, q, function(err, results, fields) {
      if (err){
        console.log(err);
        helpers.errexit(res, config.e.E_DBFAIL);
        return;
      }

      if (results.affectedRows) {
        helpers.errexit(res, config.e.E_OK);
      } else {
        helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
      }
    }); // insert into ?? values ?
  }); // select from categories where category = ?
};
router.route('/categories/:category')
  .get(function(req, res, next) {
    helpers.send(res, config.e.E_ACCESS, {
      msg: "resource only supports POST."
    });
  }).post(function(req, res, next) {
    route_categories_category(req, res, next);
  });

module.exports = router;
