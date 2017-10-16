var notify = (str, type='danger') => {

  let b = $('<button />');
  $(b).addClass('delete');

  let e = $('<div />');
  $(e).addClass('notification');
  $(e).addClass('is-' + type);

  $(e).css('position', 'fixed');
  $(e).css('bottom', '5px');
  $(e).css('left', '5px');

  $(e).append(b);
  $(e).append(str);

  if ($('#notifications > .notification') != undefined) {
    var id = 'notification-' +  $('#notifications > .notification').length.toString();
  } else {
    var id = 'notification-0';
  }

  $(e).addClass(id);

  $(e).appendTo( '#notifications' );

  $('#notifications').on('click', '.'+id, function() {
    // console.log($(this));
    $(this).remove();
  });

};

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
      notify("enter some article content");
      return false;
    }

    var content = window.editor.getContents();
    article['content'] = JSON.stringify(content);

    let url = '/api/articles/' + window.ARTICLE.articleid;
    $.post(url, article, (res) => {
      if (res.status == 0) {
        console.log(res);
        notify("article saved successfully.", "success");
        // setTimeout( () => {
        //   window.location.href = '/edit/' + res.data.articleid
        // }, 5000);
      } else {
        notify("db error. contact admin.");
      }
    }); // post

    return false;
  };

  console.log(window.KEY);
  $('#article-form').on('submit', article_submit_handler);
});
