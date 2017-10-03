var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mysql = require('mysql');

var config = require('../../config');
var helpers = require('../api-helpers');

var route_user_username = (method, req, res, next) => {
  let q = mysql.format(
    'select * from ?? where ?? = ?',
    [config.db.tables['user'], 'username', req.params.username]
  );

  var create_new_user = (user) => {
    var q = mysql.format(
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
    );

    helpers.query(q, (err, results, fields) => {
      if (err) {
        return helpers.send(res, config.e.E_DBFAIL, {
          msg: "create new user fail. error code: " + err.code
        });
      }

      if (results.affectedRows) {
        helpers.errexit(res, config.e.E_OK);
      } else {
        helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
      }
    });
  }; // create_new_user

  var query_username_handler = (err, results, fields) => {
    if (err) {
      return helpers.errexit(res, config.e.E_DBFAIL, err);
    }

    // GET; no results; wrong username
    if (results.length == 0 && method == 'get') {
      return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
        "msg": "user does not exist!"
      });
    }

    // POST; no results: create new user
    if (results.length == 0 && method == 'post') {
      var rq = req.body;

      if (rq.pass || rq.displayname || rq.displaydesc || rq.email) {
        // check if any params set, and tell user about missing params

        if (!rq.pass || !rq.displayname || !rq.displaydesc || !rq.email) {
          return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            "msg": "missing parameters. requires {pass, displayname, displaydesc, email}."
          });
        }

        /* this is where we make a new user */
        var user = {
          username: req.params.username,
          pass: bcrypt.hashSync(req.body.pass, config.db.rounds),
          key: null, /* do not set key unless we have a login */
          display: {
            name: req.body.displayname,
            desc: req.body.displaydesc,
          },
          email: req.body.email
        };

        return create_new_user(user);
      } else {
        // if no params set, user probably wanted :username to exist
        return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
          "msg": "user does not exist!"
        });
      }
    } // POST; no results: create new user

    var user = results[0];
    helpers.authenticate(req.body.key, ((arguser) => (err, auth, user) => {

      if (req.body.key && err) {
        return helpers.errexit(res, err, err);
      }

      /* handle update */
      if (
        req.body.key &&
        auth &&
        (user.username == arguser.username) &&
        (req.body.pass || req.body.displayname || req.body.displaydesc || req.body.email)
      ) {
        var rq = req.body;
        if (rq.pass) {
          arguser['pass'] = bcrypt.hashSync(rq.pass, config.db.rounds);
        }

        if (rq.displayname) {
          arguser['displayname'] = rq.displayname;
        }

        if (rq.displaydesc) {
          arguser['displaydesc'] = rq.displaydesc;
        }

        if (rq.email) {
          arguser['email'] = rq.email;
        }

        var q = mysql.format(
          'update ?? set ?? = ?, ?? = ?, ?? = ?, ?? = ? where ?? = ? and ?? = ?',
          [
            config.db.tables['user'],
            'pass', arguser.pass,
            'displayname', arguser.displayname,
            'displaydesc', arguser.displaydesc,
            'email', arguser.email,
            'username', arguser.username,
            'key', arguser.key
          ]
        );


        helpers.query(q, (err, results, fields) => {
          if (err) {
            return errexit(res, config.e.E_DBFAIL, err);
          }

          if (results.affectedRows == 1) {
            delete arguser['pass'];
            helpers.send(res, config.e.E_OK, arguser);
          } else {
            helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
          }
        });

        /* update handled, return. */
        return;
      } /* handle update */

      /* show result in case no key, or update. */
      delete arguser['pass'];
      if (user.username == arguser.username) {
        delete arguser['email'];
        delete arguser['key'];
      }

      helpers.send(res, config.e.E_OK, arguser);
    })(user));
  }; // query_username_handler

  return helpers.query(q, query_username_handler);
}; // route_user_username
router.route('/user/:username')
  .get(function(req, res, next) {
    route_user_username('get', req, res, next);
  }).post(function(req, res, next) {
    route_user_username('post', req, res, next);
  });

router.route('/user/:username/auth')
.post((req, res, next) => {
  if (!req.body.pass) {
    return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "requires {pass}"
    });
  }

  var user = {
    username: req.params.username,
    pass: req.body.pass
  };

  helpers.authenticatepass(req.params.username, req.body.pass, (err, auth, user) => {
    if (err) {
      return helpers.errexit(res, err, err);
    }

    // TODO: regen until key not found in db
    var key = crypto.randomBytes(64).toString('hex');
    var q = mysql.format(
      'update ?? set ?? = ? where ?? = ?',
      [
        config.db.tables['user'],
        'key', key,
        'username', user.username
      ]
    );

    helpers.query(q, (err, results, fields) => {
      /* helpers.query failed or db overload */
      if (err){
        return helpers.errexit(res, config.e.E_DBFAIL, err);
      }

      helpers.send(res, config.e.E_OK, {
        msg: "login success",
        key: key
      });
    }); // update users set key = ? where username = ?
  }); // authenticatepass
}); // POST: /user/:username/auth

router.route('/user/:username/purge')
.post((req, res, next) => {
  if ( ! (req.body.key || req.body.pass) ) {
    return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "requires {key} || {pass}."
    });
  }

  var user = {
    username: req.params.username,
    pass: req.body.pass,
    key: req.body.key
  };

  var purge_handler = ( (arguser) => (err, auth, user) => {
    if (err) {
      return helpers.errexit(res, err, err);
    }

    return helpers.purgekey(arguser.username, (err) => {
      if (err) {
        return helpers.errexit(res, err, err);
      }

      helpers.errexit(res, config.e.E_OK);
    });
  })(user);

  if (user.key) {
    helpers.authenticate(user.key, purge_handler);
  } else {
    helpers.authenticatepass(user.username, user.pass, purge_handler);
  }
}); // POST: /user/:username/auth

module.exports = router;
