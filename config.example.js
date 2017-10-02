/* modify this */
module.exports.db = {
  connectionLimit: 1000,
  host: "host",
  user: 'user',
  password: 'password',
  database: 'database'
};

/* do not modify after this line */
module.exports.e = {
  E_OK: 0,
  E_WRONG_PARAMETERS: 1,
  E_ACCESS: 2,
  E_DBFAIL: 3,
  E_DBOVERLOAD: 4,
  E_SUCCESS: 0
};
