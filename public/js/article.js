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
        window.NOTIFY("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        window.NOTIFY("db error. contact admin.");
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
        window.NOTIFY("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        window.NOTIFY("db error. contact admin.");
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
        window.NOTIFY("comment added.", "success");
        setTimeout( () => {
          location.reload();
        }, 500);
      } else {
        window.NOTIFY("db error. contact admin.");
      }

    });
  }
};
