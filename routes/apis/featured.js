var express = require('express');
var router = express.Router();

var helpers = require('../api-helpers');
var mysql = require('mysql');
var config = require('../../config');

router.route('/featured')
.get(function(req, res, next) {
  helpers.query(res, mysql.format(
    'select * from ?? where ?? != ? order by ? asc;',
    [
      config.db.tables['featured'],
      'order', 0,
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

  // TODO: check if user is editor here.

  var err = false;
  if (Array.isArray(req.body)) {
    if (req.body.length > 0) {
      for (var i = 0; i < req.body.length; i++) {
        if ( isNaN(parseInt(req.body[i]['articleid'])) || isNaN(parseInt(req.body[i]['order']))) {
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
  for (var i = 0; i < req.body.length; i++) {
    q2 += mysql.format(q2b, [
      parseInt(req.body[i]['articleid']),
      parseInt(req.body[i]['order'])
    ]);
  };
  q2 = q2.substr(1);
  var q3 = ' on duplicate key update ?? = values(??);'
  q3 = mysql.format(q3, ['order', 'order']);

  var q = q1 + q2 + q3;

  helpers.query(res, q, function(err, results, fields) {
    console.log(err);

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

    helpers.query(res, q4, function(err, results, fields) {
      ; // this may go on in the bg.
    });

    if (results.affectedRows) {
      helpers.errexit(res, config.e.E_OK);
    } else {
      helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
    }
  });
});

module.exports = router;
