var express = require('express');
var router = express.Router();

var helpers = require('../api-helpers');
var mysql = require('mysql');
var config = require('../../config');

router.route('/featured')
.get((req, res, next) => {
  let q = mysql.format(
    'select * from ??;',
    [
      config.db.tables['articles_featured'],
    ]
  );
  helpers.query(q, (err, results, fields) => {
    if (err){
      return helpers.errexit(res, config.e.E_DBFAIL, err);
    }

    helpers.send(res, config.e.E_OK, results);
  });

}).post((req, res, next) => {


  helpers.authenticate(req.body.key, (err, auth, user) => {
    if (err) {
      return helpers.errexit(res, err, err);
    }
    if (user.role != 'E') {
      return helpers.errexit(res, config.e.E_ACCESS);
    }

    var err = false;
    if (Array.isArray(req.body.featured)) {
      if (req.body.featured.length > 0) {
        for (var i = 0; i < req.body.featured.length; i++) {
          if ( isNaN(parseInt(req.body.featured[i]['articleid'])) || isNaN(parseInt(req.body.featured[i]['order']))) {
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

    var q1 = 'insert into ?? values'
    q1 = mysql.format(q1, [config.db.tables['featured']]);
    var q2b = ', (?, ?)';
    var q2 = '';
    for (var i = 0; i < req.body.featured.length; i++) {
      q2 += mysql.format(q2b, [
        parseInt(req.body.featured[i]['articleid']),
        parseInt(req.body.featured[i]['order'])
      ]);
    };
    q2 = q2.substr(1);
    var q3 = ' on duplicate key update ?? = values(??);'
    q3 = mysql.format(q3, ['order', 'order']);

    var q = q1 + q2 + q3;

    helpers.query(q, (err, results, fields) => {
      if (err){
        if (err.errno == 1452) {
          helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            msg: "invalid article id."
          });
          return;
        }
        helpers.errexit(res, config.e.E_DBFAIL);
        return;
      }

      var q4 = ' delete from ?? where ?? = ?;'
      q4 = mysql.format(q4, [
        config.db.tables['featured'],
        'order', 0
      ]);

      helpers.query(q4, (err, results, fields) => {
        ; // this may go on in the bg.
      });

      if (results.affectedRows) {
        helpers.errexit(res, config.e.E_OK);
      } else {
        helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
      }
    });

  }); // authenticate user as E
}); // POST: /featured

module.exports = router;
