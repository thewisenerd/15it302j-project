$(() => {
  window.editor = new Quill('#article-editor', {
    theme: 'snow',
    placeholder: 'Compose an epic...',
  });

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


    length = window.editor.getLength();
    if (length <= 1) {
      window.NOTIFY("enter some article content");
      return false;
    }

    var content = window.editor.getContents();
    article['content'] = JSON.stringify(content);

    let url = '/api/articles/0'
    $.post(url, article, (res) => {
      if (res.status == 0) {
        window.NOTIFY("article created successfully. redirecting to edit page.", "success");
        setTimeout( () => {
          window.location.href = '/edit/' + res.data.articleid
        }, 5000);
      } else {
        window.NOTIFY("db error. contact admin.");
      }
    }); // post

    return false;
  };

  console.log(window.KEY);
  $('#article-form').on('submit', article_submit_handler);
});
