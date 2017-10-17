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


window.COMMENT = {
  new: (articleid) => {
    var newcomment = prompt("Enter new comment");
    if (newcomment == null) {
      return;
    }
    newcomment = newcomment.trim();
    if (newcomment == "") {
      return;
    }

    let url = '/api/comments/' + articleid;
    $.post( url, {
      key: window.KEY,
      comment: newcomment,
    }, ( res ) => {

      if (res.status == 0) {
        console.log(res);
        notify("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        notify("db error. contact admin.");
      }

    });
  },


  edit: (articleid, commentid, that) => {
    var newcomment = prompt("Edit your comment", $(that).data('comment'));
    if (newcomment == null) {
      return;
    }
    newcomment = newcomment.trim();
    if (newcomment == "") {
      return;
    }

    let url = '/api/comments/' + articleid + '/' + commentid;
    $.post( url, {
      key: window.KEY,
      comment: newcomment,
    }, ( res ) => {

      if (res.status == 0) {
        console.log(res);
        notify("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        notify("db error. contact admin.");
      }

    });
  },


  reply: (articleid, commentid) => {
    var newcomment = prompt("Enter your Reply");
    if (newcomment == null) {
      return;
    }
    newcomment = newcomment.trim();
    if (newcomment == "") {
      return;
    }

    let url = '/api/comments/' + articleid + '/' + commentid;
    $.post( url, {
      key: window.KEY,
      comment: newcomment,
    }, ( res ) => {

      if (res.status == 0) {
        console.log(res);
        notify("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        notify("db error. contact admin.");
      }

    });
  }

};

$(() => {

  console.log(window.KEY);
});
