var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var moment = require('moment')
var mysql = require('mysql');

var config = require('../config');
var helpers = require('./api-helpers');

// TESTING: Login as Editor by Default.
router.use((req, res, next) => {
  req.session.key = 'd8d2f1a46829e33c552f2615e89ab73eea487033e6ee0b000b721aee27ad6ab6ec788fae66e9b3c5ee3ee589de10673fae20e2ef32905b9d71cc04df27fd52bc';
  next();
});

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
      res.send("db failure. try agian.");
      return;
    }

    if (results.length == 0) {
      res.send("wrong article");
      return;
    }

    res.locals.article = results[0];

    if (res.locals.article.author != res.locals.user.username) {
      res.send("you do not own this.");
      return;
    }

    next();
  });
}, (req, res, next) => {

  console.log(res.locals.article);

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
  let q = mysql.format(
    'select \
    writr_articles.articleid, writr_articles.title, writr_categories.name as category, \
    writr_articles.isdraft, writr_articles.date \
    from ?? \
    left join writr_categories on writr_articles.categoryid = writr_categories.categoryid \
    where ?? = ? \
    order by writr_articles.articleid desc',
    [
      config.db.tables['articles'],
      'author', res.locals.user.username
    ]
  );

  console.log(q);

  helpers.query(q, (err, results, fields) => {
    if (err) {
      console.log(err);
      res.send("db failure. try agian.");
      return;
    }

    if (results.length == 0) {
      res.send("no articles written by you.");
      return;
    }

    res.locals.articles = results;
    next();


  });

}, (req, res, next) => {

  // res.json(res.locals.articles);

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
