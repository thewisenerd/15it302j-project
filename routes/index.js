var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var moment = require('moment')
var mysql = require('mysql');

var toPlaintext = require('quill-delta-to-plaintext');
var Delta  = require('quill-delta');
var render = require('quill-render');

var config = require('../config');
var helpers = require('./api-helpers');

// TESTING
var debug = 0;
if (debug) {
  let debug_key = '4b427bff695d2c1fbbc4305a5e39c08266e3fb860755c88d4e755b6131bccd74e5394914074b6219c700c797e6f102eaea37f8018828472900208544c1674578';
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
}); /* ROUTE /auth */

var package_article_for_fp = (article) => {

  let c = JSON.parse(article.content);
  let d = new Delta(c["ops"]);

  article.html = render( c["ops"] );
  article.text = toPlaintext(d);


  if (article.text.length > 200) {
    article.text = article.text.substring(0,200);
    article.text += '&hellip;';
  }

  article['daterel'] = moment(article.date).fromNow();


  return article;
};

router.all('/', (req, res, next) => {
  let q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.views['featured'],
      'isdraft', 0
    ]
  );
  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try agian.");
      return;
    }

    for (let i = 0; i < results.length; i++) {
      results[i] = package_article_for_fp(results[i]);
    }

    res.locals.featured = results;
    next();
  });
}, (req, res, next) => {

  let q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.views['articles'],
      'isdraft', 0
    ]
  );
  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try agian.");
      return;
    }

    for (let i = 0; i < results.length; i++) {
      results[i] = package_article_for_fp(results[i]);
    }

    res.locals.articles = results;
    next();
  });
}, (req, res, next) => {

  res.render('index', {
    header: {
      read: true,
      edit: false,
      write: false,
    },
    featured: res.locals.featured,
    articles: res.locals.articles,
  });
}); /* ROUTE / */

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
}); /* ROUTE /write */

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
}); /* ROUTE /edit/:articleid */

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
}); /* ROUTE /edit */

router.get('/article/:articleid', (req, res, next) => {
  let q = mysql.format(
    'select * from ?? where ?? = ? and ?? = ?',
    [
      config.db.views['articles'],
      'articleid', req.params.articleid,
      'isdraft', 0
    ]
  );

  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try again.");
      return;
    }

    if (results.length == 0) {
      res.send("Invalid URL.");
      return;
    }

    res.locals.article = results[0];
    next();
  });
}, (req, res, next) => {
  let article = res.locals.article;

  res.locals.article = package_article_for_fp(article);

  next();
}, (req, res, next) => {
  let q = mysql.format (
    'select * from ?? where ?? = ?',
    [
      config.db.tables['user'],
      'username', res.locals.article.author
    ]
  );
  helpers.query(q, (err, results, fields) => {
    if (err) {
      res.send("db failure. try again.");
      return;
    }

    res.locals.author = {
      "name": results[0].displayname,
      "desc": results[0].displaydesc,
    };
    next();
  });
}, (req, res, next) => {
  let article = res.locals.article;

  helpers.buildcommentthread(article.articleid, null, (err, thread) => {
    if (err) {
      res.send("db failure. try again.");
      return;
    }

    res.locals.comments = thread;
    next();
  });
}, (req, res, next) => {

  console.log(res.locals.comments);

  res.render('article', {
    header: {
      read: true,
      edit: false,
      write: false,
    },
    user: res.locals.user,
    article: res.locals.article,
    author: res.locals.author,
    comments: res.locals.comments,
  });
});

module.exports = router;
