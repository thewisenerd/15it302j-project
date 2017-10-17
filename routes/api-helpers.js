var bcrypt = require('bcryptjs')
var mysql = require('mysql')
var moment = require('moment')

var config = require('../config')
var pool = require('../mysql-wrapper');

/**
 * res
 * err
 * data
 */
module.exports.send = (res, err, data) => {
  res.send({
    status: err[0],
    data: data
  });
}; // module.exports.send

module.exports.errexit = (res, err, error = null) => {
  res.send({
    status: err[0],
    data: {
      "msg": err[1]
    }
  });

  if (error) {
    console.log(error);
  }
}; // module.exports.errexit

/**
 *  query
 *  callback function(err, results, fields)
 */
module.exports.query = (query, callback) => {
  pool.getConnection( (err, conn) => {
    if (err) {
      return callback(err, null, null);
    }

    conn.query(query, (error, results, fields) => {
      conn.release();

      callback(error, results, fields);
    });
  });
}; // module.exports.query

/**
 * key
 * callback function(err, auth, user)
 * auth: bool
 */
module.exports.authenticate = (key, callback) => {
  if ( ! key ) {
    return callback(config.e.E_WRONG_PARAMETERS, false, null);
  }

  if ( key.length != 128 ) {
    return callback(config.e.E_WRONG_PARAMETERS, false, null);
  }

  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['user'],
      'key', key
    ]
  );

  module.exports.query(q, (err, results, fields) => {
    if (err) {
      return callback(config.e.E_DBFAIL, false, null);
    }

    if (results.length == 0) {
      return callback(config.e.E_KEY_FAILURE, false, null);
    }

    callback(null, true, results[0]);
  });
}; // module.exports.authenticate

/**
 * req
 * callback function(err, auth, user)
 * auth: bool
 */
module.exports.authenticatepass = (username, pass, callback) => {
  if (!username || !pass) {
    return callback(config.e.E_WRONG_PARAMETERS, false, null);
  }

  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['user'],
      'username', username,
    ]
  );

  module.exports.query(q, (err, results, fields) => {
    if (err) {
      return callback(config.e.E_DBFAIL, false, null);
    }

    /* this is an invalid user. */
    if (results.length == 0) {
      return callback(config.e.E_WRONG_PARAMETERS, false, null);
    }

    if (!bcrypt.compareSync(pass, results[0].pass)) {
      return callback(config.e.E_AUTH_FAILURE, false, null);
    }

    return callback(null, true, results[0]);
  });
};

/**
 * username
 * callback function(err)
 */
module.exports.purgekey = (username, callback) => {
  var q = mysql.format(
    'update ?? set ?? = ? where ?? = ?',
    [
      config.db.tables['user'],
      'key', null,
      'username', username
    ]
  );
  module.exports.query(q, (err, results, fields) => {
    if (err){
      return callback(err);
    }

    callback(null);
  });
}; // module.exports.purgekey

/**
 * articleid
 * callback function(err, article)
 */
module.exports.getarticle = (articleid, callback) => {
  var q = mysql.format(
    'select * from ?? where ?? = ?;',
    [
      config.db.tables['articles'],
      'articleid', articleid
    ]
  );

  module.exports.query(q, (err, results, fields) => {
    if (err) {
      return callback(err, null);
    }

    if (results.length == 0) {
      return callback(config.e.E_INT_ARTICLE_DOES_NOT_EXIST, null);
    }

    callback(null, results[0]);
  });
}; // module.exports.getarticle

/**
 * articleid
 * commentid = null
 * callback function(err, thread)
 */
module.exports.buildcommentthread = function(articleid, commentid = null, callback){
  var q = mysql.format(
    'select * from ?? where ?? = ?',
    [
      config.db.tables['comments'],
      'articleid', articleid
    ]
  );

  module.exports.query(q, ((argcommentid) =>
  (err, results, fields) => {
    if (err) {
      return callback(err, null);
    }

    var tree = {};
    var mktree = function( tree, children, parent ) {
      var orphans = [];
      children.forEach(function(comment) {
        if (comment.parent == parent) {
          comment['children'] = {};
          tree[comment.commentid] = comment;
          tree[comment.commentid]['daterel'] = moment(tree[comment.commentid].date).fromNow();
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

    if (argcommentid) {
      callback(null, search(thread, argcommentid));
    } else {
      callback(null, thread);
    }
  })(commentid)); // query - select * from comments where ?? = ?
}; // module.exports.buildcommentthread

/**
 * articleid
 * commentid
 * callback function(err, comment)
 */
module.exports.getcomment = function(articleid, commentid, callback) {
  var q = mysql.format(
    'select * from ?? where ?? = ? and ?? = ?',
    [
      config.db.tables['comments'],
      'articleid', articleid,
      'commentid', commentid
    ]
  );

  module.exports.query(q, (err, results, fields) => {
    if (err) {
      return callback(err, null);
    }

    if (results.length == 0) {
      return callback(config.e.E_WRONG_PARAMETERS, null);
    }

    callback(null, results[0]);
  }); // query - select * from comments where ?? = ? and ?? = ?
}; // module.exports.getcomment
