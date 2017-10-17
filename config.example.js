module.exports.db = {
  connectionLimit: 1000,
  rounds: 512
};

module.exports.e = {
  E_OK: [0, "ok."],
  E_WRONG_PARAMETERS: [1, "wrong parameters."],
  E_ACCESS: [2, "you are not allowed to access this resource."],
  E_DBFAIL: [3, "db query failed. please try again."],
  E_AUTH_FAILURE: [4, "authentication failure. check {username, pass}."],
  E_KEY_FAILURE: [5, "key failure. check {key}."],
  E_SHOULD_NOT_HAPPEN: [6, "this shouldn't have happened. send us an email."],
  E_INT_ARTICLE_DOES_NOT_EXIST: [9000, "article does not exist"],
  E_SUCCESS: [0, "success."]
};

module.exports.db['tables'] = {
  "user": "writr_users",
  "articles": "writr_articles",
  "categories": "writr_categories",
  "featured": "writr_featured",
  "comments": "writr_comments",
};

module.exports.db['views'] = {
  "articles": "writr_view_articles",
  "featured": "writr_view_featured",
};
