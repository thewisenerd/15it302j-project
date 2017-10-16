var express = require('express');
var router = express.Router();

var mysql = require('mysql');

var config = require('../../config');
var helpers = require('../api-helpers');

/**
 * threaded comm?
 *  rules;
 *    - every :articleid will have comment thread
 *    - the root comment of :articleid will have parent 0
 *    - only GET /comments/:articleid will return all comments for article
 *      - [
 *          {
 *            "commentid",
 *            "message",
 *            "author",
 *            "date",
 *            "children": [ { ... }, { ... }, ... ]
 *          },
 *          { ... }
 *        ]
 *    - POST /comments/:articleid will create a new comment
 *    - /:articleid/:commentid
 *      - GET: {comemntid, articleid, message, parent, author, date}
 *      - POST: if (key); { message }
 */
var route_comments_article = function(req, res, next) {
  helpers.buildcommentthread(req.params.articleid, req.params.commentid, (err, thread) => {
    if (err) {
      return helpers.errexit(res, err, err);
    }

    helpers.send(res, config.e.E_OK, thread);
  });
};
router.route('/comments/:articleid')
.get(function(req, res, next) {
  route_comments_article(req, res, next);
}).post(function(req, res, next) {
  /* post must have a key, else fall back to get. */
  if (! req.body.key) {
    route_comments_article(req, res, next);
    return;
  }

  if (! req.body.key || ! req.body.comment) {
    return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "wrong parameters. send {key, comment}"
    });
  }

  helpers.getarticle(req.params.articleid, (err, article) => {

    /* cannot comment on inexistent articles */
    if (err){
      if (config.e.E_INT_ARTICLE_DOES_NOT_EXIST) {
        helpers.errexit(res, config.e.E_WRONG_PARAMETERS);
      } else {
        helpers.errexit(res, err);
      }
      return;
    }

    /* cannot comment on draft articles */
    if (article.isdraft) {
      helpers.errexit(res, config.e.E_ACCESS);
      return;
    }

    /* authenticate key, and insert comment */
    helpers.authenticate(req.body.key, ((argarticle) => (err, auth, user) => {
      if (err) {
        helpers.errexit(res, err);
        return;
      }
      if (!auth) {
        helpers.errexit(res, config.e.E_KEY_FAILURE);
        return;
      }

      /* insert into ?? values */
      var q = mysql.format(
        'insert into ?? (??, ??, ??, ??) values (?, ?, ?, ?);',
        [
          config.db.tables['comments'],
          'articleid', 'message', 'parent', 'author',
          argarticle.articleid, req.body.comment, 0, user.username
        ]
      );

      helpers.query(q, (err, results, fields) => {
        if (err) {
          return helpers.errexit(res, config.e.E_DBFAIL, err);
        }

        if (results.affectedRows) {
          helpers.send(res, config.e.E_OK, {
            commentid: results.insertId
          });
        } else {
          helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
        }
      }); // query - insert into comments (??) values (?)
    })(article)); // authenticate
  }); // getarticle
}); // /comments/:articleid post

router.route('/comments/:articleid/:commentid')
.get(function(req, res, next) {
  route_comments_article(req, res, next);
}).post(function(req, res, next) {
  if (! req.body.key || ! req.body.comment) {
    return helpers.send(res, config.e.E_WRONG_PARAMETERS, {
      msg: "wrong parameters. send {key, comment}"
    });
  }

  helpers.authenticate(req.body.key, (err, auth, user) => {
    if (err) {
      return helpers.errexit(res, err);
    }
    if (!auth) {
      return helpers.errexit(res, config.e.E_KEY_FAILURE);
    }

    helpers.getcomment(req.params.articleid, req.params.commentid, ((arguser) => (err, comment) => {
      if (err) {
        return helpers.errexit(res, err, err);
        return;
      }

      if (comment.author == arguser.username || (arguser.role == 'E' && req.body.moderate)) {
        /* if from owner of comment, it is an edit */
        /* if it is from the editor, with the 'moderate' key in body, it is an edit */
        var q = mysql.format(
          'update ?? set ?? = ? where ?? = ?',
          [
            config.db.tables['comments'],
            'message', req.body.comment,
            'commentid', comment.commentid
          ]
        );

        helpers.query(q, (err, results, fields) => {
          if (err) {
            return helpers.errexit(res, config.e.E_DBFAIL, err);
          }

          if (results.affectedRows) {
            helpers.errexit(res, config.e.E_OK);
          } else {
            helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
          }
        });
      } else {
        /* else, it is a reply */
        /* insert into ?? values */
        var q = mysql.format(
          'insert into ?? (??, ??, ??, ??) values (?, ?, ?, ?);',
          [
            config.db.tables['comments'],
            'articleid', 'message', 'parent', 'author',
            req.params.articleid, req.body.comment, comment.commentid, arguser.username
          ]
        );

        helpers.query(q, (err, results, fields) => {
          if (err) {
            return helpers.errexit(res, config.e.E_DBFAIL, err);
          }

          if (results.affectedRows) {
            helpers.send(res, config.e.E_OK, {
              commentid: results.insertId
            });
          } else {
            helpers.errexit(res, config.e.E_SHOULD_NOT_HAPPEN);
          }
        });
      } // comment is a reply
    })(user)); // getcomment
  }); // authenticate
}); // POST: /comments/:articleid/:commentid

module.exports = router;
