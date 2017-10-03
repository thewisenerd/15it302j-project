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
module.exports.query = function(res, query, callback, data = null) {
  pool.getConnection(function(err, conn) {
    if (err) {
      callback(err, null, null, data);
      return;
    }

    conn.query(query, function(err, results, fields) {
      conn.release();

      if (err) {
        callback(err, null, null, data);
        return;
      }

      callback(err, results, fields, data);
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

/**
 * callback: function(req, res, next, err, thread, data)
 */
module.exports.buildcommentthread = function(req, res, next, articleid, commentid, callback, data = null){
  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['comments'],
      'articleid', articleid
    ]
  );

  module.exports.query(res, q, function(err, results, fields, data){
    if (err) {
      callback(req, res, next, err, null, data);
      return;
    }

    var tree = {};
    var mktree = function( tree, children, parent ) {
      var orphans = [];
      children.forEach(function(comment) {
        if (comment.parent == parent) {
          comment['children'] = {};
          tree[comment.commentid] = comment;
        } else {
          orphans.push(comment);
        }
      });

      for (commentid in tree) {
        mktree(tree[commentid]['children'], orphans, commentid);
      }
    };
    mktree(tree, results.slice(), 0);

    var thread = [];
    var mkthread = function(parent, tree) {
      for (commentid in tree) {
        parent.push(tree[commentid]);
      }
      parent.sort(function(a, b) {
        return b.date - a.date
      });

      parent.forEach(function(comment) {
        if (Object.keys(comment['children']).length) {
          var child = [];
          mkthread(child, comment['children']);
          comment['children'] = child;
        } else {
          delete comment['children'];
        }
      });
    };
    mkthread(thread, tree);

    if (data.commentid) {
      var search = function(thread, s) {
        for (var i = 0; i < thread.length; i++) {
          var comment = thread[i];
          if (comment.commentid == s) {
            return comment;
          } else {
            if (comment.children) {
              return search(comment.children, s);
            }
          }
        }; // for comment in thread
        return [];
      };
      callback(req, res, next, null, search(thread, data.commentid), data.data);
    } else {
      callback(req, res, next, null, thread, data.data);
    }
  }, {
    articleid: articleid,
    commentid: commentid,
    data: data
  }); // query - select * from comments where ?? = ?
};

/**
 * callback: function(req, res, next, err, comment, data)
 */
module.exports.getcomment = function(req, res, next, articleid, commentid, callback, data = null) {
  var q = mysql.format(
    'select * from ?? where ?? = ? and ?? = ?',
    [
      config.db.tables['comments'],
      'articleid', articleid,
      'commentid', commentid
    ]
  );

  module.exports.query(res, q, function(err, results, fields, data) {
    if (err){
      callback(req, res, next, err, null, data);
      return;
    }

    if (results.length == 0) {
      callback(req, res, next, config.e.E_WRONG_PARAMETERS, null, data);
      return;
    }

    callback(req, res, next, null, results[0], data);
  }, data);
};
