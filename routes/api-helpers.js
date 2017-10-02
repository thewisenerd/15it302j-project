var pool = require('../mysql-wrapper');

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

module.exports.query = function(res, query, callback) {
  pool.getConnection(function(err, conn) {
    if (err) {
      callback(err, null, null);
      return;
    }

    conn.query(query, function(err, results, fields) {
      conn.release();

      if (err) {
        callback(err, null, null);
        return;
      }

      callback(err, results, fields);
    });
  });
};

