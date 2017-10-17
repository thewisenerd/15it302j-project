$(() => {

  var article_submit_handler = (e) => {

    let article = {
      key: window.KEY,
      title: $('#article-title').val(),
      categoryid: $('#article-category').val(),
    };
    if ($('#article-isdraft').is( ":checked" )){
      article['isdraft'] = 0;
    } else {
      article['isdraft'] = 1;
    }

    console.log(article);

    length = window.editor.getLength();
    if (length <= 1) {
      window.NOTIFY("enter some article content");
      return false;
    }

    var content = window.editor.getContents();
    article['content'] = JSON.stringify(content);

    let url = '/api/articles/' + window.ARTICLE.articleid;
    $.post(url, article, (res) => {
      if (res.status == 0) {
        console.log(res);
        window.NOTIFY("article saved successfully.", "success");
      } else {
        window.NOTIFY("db error. contact admin.");
      }
    }); // post

    return false;
  };

  console.log(window.KEY);
  $('#article-form').on('submit', article_submit_handler);
});
