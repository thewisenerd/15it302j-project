var express = require('express');
var router = express.Router();

var mysql = require('mysql');

var config = require('../../config');
var helpers = require('../api-helpers');

router.route('/categories')
.get(function(req, res, next) {

  var q = mysql.format(
    'select * from ?? order by ? asc;',
    [
      config.db.tables['categories'],
      'order'
    ]
  );

  helpers.query(q, (err, results, fields) => {
    if (err){
      return helpers.errexit(res, config.e.E_DBFAIL, err);
    }

    helpers.send(res, config.e.E_OK, results);
  });

}).post(function(req, res, next) {

  var categories_post_handler = () => {

    var err = false;
    if (Array.isArray(req.body.categories)) {
      if (req.body.categories.length > 0) {
        for (var i = 0; i < req.body.categories.length; i++) {
          if ( ! req.body.categories[i]['categoryid'] || ! req.body.categories[i]['order'] ) {
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
      return helpers.errexit(res, config.e.E_WRONG_PARAMETERS);
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

    for (var i = 0; i < req.body.categories.length; i++) {
      q2 += mysql.format(q2b, [
        req.body.categories[i]['categoryid'],
        req.body.categories[i]['order'],
      ]);

      ids.push(req.body.categories[i]['categoryid']);
    }

    q3 = mysql.format(q3, ['categoryid']);

    var q35 = ', ?'.repeat(req.body.categories.length);
    q35 = q35.substr(2);

    q35 = mysql.format(q35, ids);

    var q = q1 + q2 + q3 + q35 + q4;

    helpers.query(q, (err, results, fields) => {
      if (err){
        return helpers.errexit(res, config.e.E_DBFAIL, err);
      }

      if (results.affectedRows) {
        helpers.errexit(res, config.e.E_OK);
      } else {
        helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
      }
    });
  }; // categories_post_handler

  helpers.authenticate(req.body.key, (err, auth, user) => {

    if (err) {
      return helpers.errexit(res, err);
    }

    if (user.role != 'E') {
      return helpers.errexit(res, config.e.E_ACCESS);
    }

    return categories_post_handler();
  }); // authenticate
}); // POST: /categories

router.route('/categories/:category')
.get((req, res, next) => {
  helpers.send(res, config.e.E_ACCESS, {
    msg: "resource only supports POST."
  });
}).post((req, res, next) => {
  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['categories'],
      'name', req.params.category
    ]
  );

  helpers.query(q, (err, results, fields) => {
    if (err) {
      return helpers.errexit(res, config.e.E_DBFAIL, err);
    }

    if (results.length) {
      return helpers.send(res, config.e.E_OK, results);
    }

    helpers.authenticate(req.body.key, (err, auth, user) => {
      if (err) {
        return helpers.errexit(res, err);
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
      helpers.query(q, (err, results, fields) => {
        if (err){
          return helpers.errexit(res, config.e.E_DBFAIL, err);
        }

        if (results.affectedRows) {
          helpers.errexit(res, config.e.E_OK);
        } else {
          helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
        }
      }); // insert into ?? values ?
    }); // authenticate
  }); // select * from categories where name = ?
}); // POST: /categories/:category

module.exports = router;
