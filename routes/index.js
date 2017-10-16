var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var moment = require('moment')
var mysql = require('mysql');

var config = require('../config');
var helpers = require('./api-helpers');

// TESTING
var debug = 0;
if (debug) {
  let debug_key = '4a49d3ac6c4333aba07a4a80786402123db46112a725c1503c2739593cd113ea591d133c31d63cf1e02d31879302dcbcd4422b2d00751230a68b87e4f30d5792';
  router.use((req, res, next) => {
    req.session.key = debug_key;
    next();
  });
}

// check for authentication everywhere but few places
var checkauth = (req, res, next) => {
  if (
    req.session.key ||           // key set
    req.path === '/auth' ||      // auth access
    req.path === '/signup' ||    // new signup
    req.path.startsWith("/api/") // api access
  ) {

    /* if key is set */
    if (req.session.key) {

      /* try authenticating key */
      helpers.authenticate(req.session.key, (err, auth, user) => {

        /* if errors, invalid key; redirect to /auth */
        if (err || !auth) {
          delete req.session.key;
          res.redirect('/auth');
          return;
        }

        /* if not invalid, store user data */
        res.locals.user = user;
        next();
      });

      return;
    }

    /* if no key set,e it is one of the auth paths or api */
    next();
  } else {
    res.redirect('/auth');
  }
};
router.use(checkauth);

router.get('/auth', (req, res, next) => {

  if (req.session.key){
    res.redirect('/');
    return;
  }

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
  res.render('index', {
    header: {
      read: true,
      edit: false,
      write: false,
    }
  });
});

router.get('/write', (req, res, next) => {
  helpers.query('select * from writr_categories;', (err, results, fields) => {
    if (err) {
      res.send("db failure. try agian.");
      return;
    }
    res.locals.categories = results;
    next();
  });
}, (req, res, next) => {
  res.render('write', {
    header: {
      read: false,
      edit: false,
      write: true,
    },
    categories: res.locals.categories,
  });
});

router.get('/edit/:articleid', (req, res, next) => {
  helpers.query('select * from writr_categories;', (err, results, fields) => {
    if (err) {
      res.send("db failure. try agian.");
      return;
    }
    res.locals.categories = results;
    next();
  });
}, (req, res, next) => {

  let q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['articles'],
      'articleid', req.params.articleid
    ]
  );
  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try again.");
      return;
    }

    if (results.length == 0) {
      res.send("Wrong Article ID.");
      return;
    }

    res.locals.article = results[0];

    // TODO: check for editor here.
    if (res.locals.article.author != res.locals.user.username) {
      res.send("Wrong Article ID.");
      return;
    }

    next();
  });
}, (req, res, next) => {
  res.render('edit', {
    header: {
      read: false,
      edit: true,
      write: false,
    },
    categories: res.locals.categories,
    article: res.locals.article,
  });
});


router.get('/edit', (req, res, next) => {
  // TODO: check for editor here.

  let q = mysql.format(
    'select * from ?? where ?? = ? order by ?? desc',
    [
      config.db.views['articles'],
      'author', res.locals.user.username,
      'articleid' /* order by */
    ]
  );

  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try agian.");
      return;
    }

    res.locals.articles = results;
    next();
  });

}, (req, res, next) => {

  for (var i = 0;  i < res.locals.articles.length; i++) {
    var ar = res.locals.articles[i];

    if (ar.isdraft == 1) {
      ar['draft'] = true
    } else {
      ar['draft'] = false
    }

    ar['daterel'] = moment(ar.date).fromNow();
  }

  res.render('edit-list', {
    header: {
      read: false,
      edit: true,
      write: false,
    },
    categories: res.locals.categories,
    articles: res.locals.articles,
  });
});

module.exports = router;
