var pool = require('../mysql-wrapper');
var mysql = require('mysql')
var config = require('../config')

module.exports.send = function(res, error, data) {
  res.send({
    status: error[0],
    data: data
  });
};

module.exports.errexit = function(res, error) {
  res.send({
    status: error[0],
    data: {
      "msg": error[1]
    }
  });
};

/**
 * callback(err, results, fields)
 */
module.exports.query = function(res, query, callback) {
  pool.getConnection(function(err, conn) {
    if (err) {
      callback(err, null, null);
      return;
    }

    conn.query(query, function(err, results, fields) {
      conn.release();

      if (err) {
        callback(err, null, null);
        return;
      }

      callback(err, results, fields);
    });
  });
};

/**
 * callback(req, res, next, err, auth, user)
 * err = err
 * auth = true|false
 * data = data
 */
module.exports.authenticate = function(req, res, next, callback, data = null) {
  if ( ! req.body.key) {
    callback(req, res, next, config.e.E_WRONG_PARAMETERS, false, null, data);
    return;
  }

  if ( req.body.key.length != 128 ) {
    callback(req, res, next, config.e.E_WRONG_PARAMETERS, false, null, data);
    return;
  }

  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['user'],
      'key', req.body.key
    ]
  );
  module.exports.query(res, q, function(err, results, fields) {
    if (err) {
      callback(req, res, next, config.e.E_DBFAIL, false, null, data);
      return;
    }

    if (results.length == 0) {
      callback(req, res, next, null, false, null, data);
      return;
    }

    var user = results[0];
    callback(req, res, next, null, true, user, data);
  });
};

/**
 * callback(req, res, next, err, article)
 */
module.exports.getarticle = function(req, res, next, articleid, callback, data = null) {
  var q = mysql.format(
    'select * from ?? where ?? = ?;',
    [
      config.db.tables['articles'],
      'articleid', articleid
    ]
  );

  module.exports.query(res, q, function(err, results, fields) {
    if (err){
      callback(req, res, next, err, null);
      return;
    }

    if (results.length == 0) {
      callback(req, res, next, config.e.E_INT_ARTICLE_DOES_NOT_EXIST, null);
      return;
    }

    callback(req, res, next, null, results[0]);
  });
};
