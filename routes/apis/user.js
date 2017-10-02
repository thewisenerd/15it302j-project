var express = require('express');
var router = express.Router();

var helpers = require('../api-helpers');
var mysql = require('mysql');
var config = require('../../config');

const bcrypt = require('bcrypt');
var crypto = require('crypto');

var route_user_username = function(method, req, res, next){
  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [config.db.tables['user'], 'username', req.params.username]
  );

  helpers.query(res, q, function(err, results, fields) {
    /* helpers.query failed or db overload */
    if (err){
      helpers.errexit(config.e.E_DBFAIL);
      return;
    }

    /* if no users, check if this is a new user definition */
    if (results.length == 0) {
      var rq = req.body;

      /* this is tryin to make a new user */
      if (method == 'post' && (rq.pass || rq.displayname || rq.displaydesc || rq.email)) {

        /* this is a wrong argument. we're missing arguments */
        if (!rq.pass || !rq.displayname || !rq.displaydesc || !rq.email) {
          helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            "msg": "missing parameters. requires {pass, displayname, displaydesc, email}."
          });
          return;
        }

        /* this is where we make a new user */
        var user = {
          username: req.params.username,
          pass: bcrypt.hashSync(rq.pass, config.db.rounds),
          key: null, /* do not set key unless we have a login */
          display: {
            name: rq.displayname,
            desc: rq.displaydesc,
          },
          email: rq.email
        };

        helpers.query(res, mysql.format(
          'insert into ?? (??, ??, ??, ??, ??, ??) values(?, ?, ?, ?, ?, ?);',
          [
            config.db.tables['user'],
            'username', 'pass', 'key', 'displayname', 'displaydesc', 'email',
            user.username,
            user.pass,
            user.key,
            user.display.name,
            user.display.desc,
            user.email
          ]
        ), function(err, results, fields) {
          if (err) {
            helpers.send(res, config.e.E_DBFAIL, {
              msg: "create new user fail. error code: " + err.code
            });
            return;
          }

          helpers.send(res, config.e.E_OK, results);
        });
      } else {
      /* this is an empty helpers.query, not trying to make a new user. */
        helpers.send(res, config.e.E_WRONG_PARAMETERS, {
          "msg": "user does not exist!"
        });
        return;
      }
    } else { // results.length == 0
      var rq = req.body;

      if ( rq.key && (rq.pass || rq.displayname || rq.displaydesc || rq.email)) {
        var user = {
          username: req.params.username,
          key: req.body.key
        };

        /* check key validity */
        var q = mysql.format(
          'select * from ?? where ?? = ? and ?? = ?',
          [
            config.db.tables['user'],
            'username', user.username,
            'key', user.key
          ]
        );
        helpers.query(res, q, function(err, results, fields) {
          if (err) {
            helpers.send(res, config.e.E_DBFAIL, {
              msg: "create new user fail. error code: " + err.code
            });
            return;
          }

          if (results.length == 0) {
            helpers.errexit(res, config.e.E_AUTH_FAILURE);
            return;
          }

          var dbres = results[0];
          user['pass'] = dbres.pass;
          user['display'] = {
            name: dbres['displayname'],
            desc: dbres['displaydesc']
          };
          user['email'] = dbres.email;

          if (rq.pass) {
            user['pass'] = bcrypt.hashSync(rq.pass, config.db.rounds);
          }

          if (rq.displayname) {
            user['display'].name = rq.displayname;
          }

          if (rq.displaydesc) {
            user['display'].desc = rq.displaydesc;
          }

          if (rq.email) {
            user['email'] = rq.email;
          }

          var q = mysql.format(
            'update ?? set ?? = ?, ?? = ?, ?? = ?, ?? = ? where ?? = ? and ?? = ?',
            [
              config.db.tables['user'],
              'pass', user.pass,
              'displayname', user.display.name,
              'displaydesc', user.display.desc,
              'email', user.email,
              'username', user.username,
              'key', user.key
            ]
          );
          helpers.query(res, q, function(err, results, fields) {
            if (err){
              helpers.errexit(config.e.E_DBFAIL);
              return;
            }

            /* helpers.query update, and helpers.send resp */
            if (results.affectedRows == 1) {
              helpers.send(res, config.e.E_OK, user);
            } else {
              helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
            }
          }); // helpers.query - update info
        }); // helpers.query - check key validity
      } else { // key && (rq.{pass|displayname|displaydesc|email})
        // remove sensitive information
        var user = results[0];
        delete user['pass'];
        // user is not -owner-
        if (user.username != req.params.username || req.body.key  != user.key) {
          delete user['key'];
          delete user['email'];
        }

        // helpers.send -safe- data
        helpers.send(res, config.e.E_OK, user);
      }
    } // results.length == 1 /
  }); // helpers.query
}; // route_user_username
router.route('/user/:username')
  .get(function(req, res, next) {
    route_user_username('get', req, res, next);
  }).post(function(req, res, next) {
    route_user_username('post', req, res, next);
  });

var route_user_username_auth = function(req, res, next) {
  if (!req.body.pass) {
    helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "requires {username, pass}."
    });
    return;
  }

  var user = {
    username: req.params.username,
    pass: req.body.pass
  };

  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['user'],
      'username', user.username,
    ]
  );

  helpers.query(res, q, function(err, results, fields) {
    /* helpers.query failed or db overload */
    if (err){
      helpers.errexit(config.e.E_DBFAIL);
      return;
    }

    /* this is an invalid user. */
    if (results.length == 0) {
      helpers.send(res, config.e.E_WRONG_PARAMETERS, {
        "msg": "user does not exist!"
      });
      return;
    }

    /* check password. */
    if (!bcrypt.compareSync(user.pass, results[0].pass)) {
      helpers.errexit(res, config.e.E_AUTH_FAILURE);
      return;
    }

    /* generate key, insert into db. */
    var key = crypto.randomBytes(64).toString('hex');
    var q = mysql.format(
      'update ?? set ?? = ? where ?? = ?',
      [
        config.db.tables['user'],
        'key', key,
        'username', results[0].username
      ]
    );

    helpers.query(res, q, function(err, results, fields) {
      /* helpers.query failed or db overload */
      if (err){
        helpers.errexit(config.e.E_DBFAIL);
        return;
      }

      helpers.send(res, config.e.E_OK, {
        msg: "login success",
        key: key
      });
    });
  }); // helpers.query
}; // route_user_username_auth
router.route('/user/:username/auth')
  .post(function(req, res, next) {
    route_user_username_auth(req, res, next);
  });


var route_user_username_purge = function(req, res, next) {
  /**
   * purge a key, or a pass
   */
  if ( ! (req.body.key || req.body.pass) ) {
    helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "requires {key} || {pass}."
    });
    return;
  }

  var user = {
    username: req.params.username,
    pass: req.body.pass,
    key: req.body.key
  };

  if (user.key) {
    /* user has provided key */
    var q = mysql.format(
      'update ?? set ?? = ? where ?? = ? and ?? = ?',
      [
        config.db.tables['user'],
        'key', null,
        'username', user.username,
        'key', user.key
      ]
    );
    helpers.query(res, q, function(err, results, fields) {
      if (err){
        helpers.errexit(config.e.E_DBFAIL);
        return;
      }

      if (results.changedRows == 1) {
        helpers.send(res, config.e.E_OK, {
          msg: "done."
        });
      } else {
        helpers.errexit(res, config.e.E_KEY_FAILURE);
      }
    });
  } else { // user.key
    /* user has provided pass */

    var q = mysql.format(
      'select * from ?? where ?? = ?',
      [
        config.db.tables['user'],
        'username', user.username,
      ]
    );

    helpers.query(res, q, function(err, results, fields) {
      /* helpers.query failed or db overload */
      if (err){
        helpers.errexit(config.e.E_DBFAIL);
        return;
      }

      /* this is an invalid user. */
      if (results.length == 0) {
        helpers.send(res, config.e.E_WRONG_PARAMETERS, {
          "msg": "user does not exist!"
        });
        return;
      }

      /* check password. */
      if (!bcrypt.compareSync(user.pass, results[0].pass)) {
        helpers.errexit(res, config.e.E_AUTH_FAILURE);
        return;
      }

      var q = mysql.format(
        'update ?? set ?? = ? where ?? = ?',
        [
          config.db.tables['user'],
          'key', null,
          'username', user.username
        ]
      );
      helpers.query(res, q, function(err, results, fields) {
        if (err){
          helpers.errexit(config.e.E_DBFAIL);
          return;
        }

        /**
         * this can only authfailure.
         * if bcrypt pass we're safe.
         */
        helpers.send(res, config.e.E_OK, {
          msg: "done."
        });
      }); // helpers.query - update [username]
    }); // helpers.query - select [username]
  } // user.pass
};
router.route('/user/:username/purge')
  .post(function(req, res, next) {
    route_user_username_purge(req, res, next);
  });

module.exports = router;
