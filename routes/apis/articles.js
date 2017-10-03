var express = require('express');
var router = express.Router();

var helpers = require('../api-helpers');
var mysql = require('mysql');
var config = require('../../config');

var route_get_articles = function(method, req, res, next) {
  /* get request, no key set. return public articles. */

  var count = 10;
  var offset = 0;

  if (method == 'get') {
    if (parseInt(req.query.count)) {
      count = parseInt(req.query.count);
    }

    if (parseInt(req.query.offset)) {
      offset = parseInt(req.query.offset);
    }
  } else { // method == 'post'
    if (parseInt(req.body.count)) {
      count = parseInt(req.body.count);
    }

    if (parseInt(req.body.offset)) {
      offset = parseInt(req.body.offset);
    }
  }

  var q = mysql.format(
    'select ??, ??, ??, ??, ?? from ?? where ?? = ? limit ?,?;',
    [
      'articleid', 'categoryid', 'title', 'author', 'date',
      config.db.tables['articles'],
      'isdraft', 0,
      offset, count
    ]
  );

  helpers.query(res, q, function(err, results, fields) {
    if (err){
      helpers.errexit(res, config.e.E_DBFAIL);
      return;
    }

    helpers.send(res, config.e.E_OK, results);
  });
};
router.route('/articles')
.get(function(req, res, next) {
  route_get_articles('get', req, res, next);
}).post(function(req,res,next) {
  /* post must have a key, else fall back to get. */
  if (! req.body.key) {
    route_get_articles('post', req, res, next);
    return;
  }

  helpers.authenticate(req, res, next, function(req, res, next, err, auth, user) {
    if (err) {
      helpers.errexit(res, err);
      return;
    }
    if (!auth) {
      helpers.errexit(res, config.e.E_KEY_FAILURE);
      return;
    }

    var count = 10;
    var offset = 0;
    if (parseInt(req.body.count)) {
      count = parseInt(req.body.count);
    }

    if (parseInt(req.body.offset)) {
      offset = parseInt(req.body.offset);
    }
    var q = mysql.format(
      'select ??, ??, ??, ??, ?? from ?? where ?? = ? limit ?,?;',
      [
        'articleid', 'categoryid', 'title', 'content', 'date',
        config.db.tables['articles'],
        'author', user.username,
        offset, count
      ]
    );
    helpers.query(res, q, function(err, results, fields) {
      if (err){
        console.log(err);
        helpers.errexit(res, config.e.E_DBFAIL);
        return;
      }

      console.log(results);
      helpers.send(res, config.e.E_OK, results);
    }); // select from articles where author = ?
  }); // authenticate
}); // post /articles


/**
 * /articles/:articleid
 */
var route_get_articles_articleid = function(method, req, res, next) {
  if (req.params.articleid == 0) {
    helpers.send(res, config.e.E_OK, {
      msg: "dummy article. POST with {key} to create new article."
    });
    return;
  }

  helpers.getarticle(req, res, next, req.params.articleid, function(req, res, next, err, article) {
    if (err){
      if (config.e.E_INT_ARTICLE_DOES_NOT_EXIST) {
        helpers.errexit(res, config.e.E_WRONG_PARAMETERS);
      } else {
        helpers.errexit(res, err);
      }
      return;
    }

    if (article.isdraft) {
      helpers.errexit(res, config.e.E_ACCESS);
      return;
    }
    helpers.send(res, config.e.E_OK, article);
  });
}; // route_get_articles_articleid
router.route('/articles/:articleid')
.get(function(req, res, next) {
  route_get_articles_articleid('get', req, res, next);
}).post(function(req,res,next) {
  /* post must have a key, else fall back to get. */
  if (! req.body.key) {
    route_get_articles_articleid('post', req, res, next);
    return;
  }

  helpers.getarticle(req, res, next, req.params.articleid, function(req, res, next, err, article) {
    var newarticle = false;

    if (err){
      if (err == config.e.E_INT_ARTICLE_DOES_NOT_EXIST) {
        newarticle = true;
      } else {
        helpers.errexit(res, err);
        return;
      }
    }

    /* authenticate */
    helpers.authenticate(req, res, next, function(req, res, next, err, auth, user, data) {
      if (err) {
        helpers.errexit(res, err);
        return;
      }
      if (!auth) {
        helpers.errexit(res, config.e.E_KEY_FAILURE);
        return;
      }

      if (newarticle) {
        /* new article */

        // check if id is zero
        if (req.params.articleid != 0) {
          helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            msg: "send new articles to /articles/0"
          });
          return;
        }

        // check parameters
        var rq = req.body;
        if (!rq.categoryid || !rq.title || !rq.content) {
          helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            msg: "send {categoryid, title, content} ; optionally {isdraft}"
          });
          return;
        }

        var article = {
          isdraft: 1,
          categoryid: 1,
          title: rq.title,
          content: rq.content
        };
        if (rq.isdraft) {
          article.isdraft = rq.isdraft;
        }
        if (parseInt(req.query.categoryid)) {
          article.categoryid == rq.categoryid;
        }

        // sql query here
        var q = mysql.format(
          'insert into ?? (??, ??, ??, ??, ??) values (?, ?, ?, ?, ?);',
          [
            config.db.tables['articles'],
            'isdraft', 'categoryid', 'title', 'author', 'content',
            article.isdraft, article.categoryid, article.title, user.username, article.content
          ]
        );
        helpers.query(res, q, function(err, results, fields) {
          if (err){
            helpers.errexit(res, config.e.E_DBFAIL);
            return;
          }

          if (results.affectedRows) {
            helpers.send(res, config.e.E_OK, {
              articleid: results.insertId
            });
          } else {
            helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
          }
        });
      } else {
        /* not a new article */
        var article = data.article;

        // check if we own the article.
        if (article.author != user.username) {
          helpers.errexit(res, config.e.E_ACCESS);
          return;
        }

        // check parameters
        var rq = req.body;
        if (!rq.isdraft && !rq.categoryid && !rq.title && !rq.content) {
          helpers.send(res, config.e.E_WRONG_PARAMETERS, {
            msg: "send at least one of {isdraft, categoryid, title, content};"
          });
          return;
        }

        /* build upon -article- */
        if (rq.isdraft) {
          article.isdraft = rq.isdraft;
        }
        if (parseInt(req.query.categoryid)) {
          article.categoryid == rq.categoryid;
        }
        if (rq.title) {
          article.title = rq.title;
        }
        if (rq.content) {
          article.content = rq.content;
        }

        /* update set x = y */
        var q = mysql.format(
          'update ?? set ?? = ?, ?? = ?, ?? = ?, ?? = ? where ?? = ?',
          [
            config.db.tables['articles'],
            'isdraft', article.isdraft,
            'categoryid', article.categoryid,
            'title', article.title,
            'content', article.content,
            'articleid', article.articleid
          ]
        );

        helpers.query(res, q, function(err, results, fields) {
          if (err) {
            helpers.errexit(res, config.e.E_DBFAIL);
            return;
          }

          if (results.affectedRows) {
            helpers.errexit(res, config.e.E_OK);
          } else {
            helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
          }
        }); // update set ?? = ? where ?? = ?
      } // newarticle
    }, {article: article}); // authenticate
  }); // getarticle
}); // post - /articles/:articleid

module.exports = router;
