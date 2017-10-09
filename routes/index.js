var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var mysql = require('mysql');

var config = require('../config');
var helpers = require('./api-helpers');

// dead simple auth check. mic drop.
var checkauth = (req, res, next) => {
  if (
    req.session.key ||           // key set
    req.path === '/auth' ||      // auth access
    req.path === '/signup' ||    // new signup
    req.path.startsWith("/api/") // api access
  ) {

    if (req.session.key) {
      // assume auth pass here
      helpers.authenticate(req.session.key, (err, auth, user) => {
        // * ASSUME PASS! > *?/
        if (err || !auth) {
          delete req.session.key;
          res.redirect('/auth');
          return;
        }

        res.locals.user = user;
        next();
      });

      return;
    }
    next();
  } else {
    res.redirect('/auth');
  }
};
router.use(checkauth);

router.get('/auth', (req, res, next) => {
  res.render('landing');
});

router.post('/auth', (req, res, next) => {

  helpers.authenticatepass(req.body.username, req.body.pass, (err, auth, user) => {
    if (err || !auth) {
      res.send("invalid username/password combination.");
      return;
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

    helpers.query(q, ((argkey) => (err, results, fields) => {
      /* helpers.query failed or db overload */
      if (err){
        res.send("db error. contact admin.");
        return;
      }


      req.session.key = argkey;
      res.redirect('/');
    })(key)); // update users set key = ? where username = ?
  }); // authenticatepass
}); // post /login

router.all('/', (req, res, next) => {
  console.log(req.session.key);
  console.log(res.locals.user);
  res.send("hello user.");
});

module.exports = router;
