var checkuserexists = (username) => {
  let url = '/api/user/' + username

  var jqXHR = $.ajax({
    url : url,
    type : "get",
    async: false
  });

  var j = JSON.parse(jqXHR.responseText)
  if (j.status == 0) {
    return true;
  } else {
    return false;
  }
};

var checkavailable = () => {
  let el = $('#signup-username')
  let icon = $('#username-availability-check')
  let user = $(el).val()

  if ($(el).val().trim() == '')
    return;

  if (checkuserexists(user)) {
    $(el).addClass('is-danger');
    $(icon).removeClass('fa-check')
    $(icon).addClass('fa-times')
  } else {
    $(el).removeClass('is-danger');
    $(icon).removeClass('fa-times')
    $(icon).addClass('fa-check')
  }
};

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

  let id = 'notification-' +  $('#notifications > .notification').length.toString();
  $(e).addClass(id);

  $(e).appendTo( '#notifications' );

  $('#notifications').on('click', '.'+id, function() {
    // console.log($(this));
    $(this).remove();
  });

};

var signup_form_submit_handler = (e) => {
  let form = $('#signup-form')


  let user = {
    username: $('#signup-username').val().trim(),
    pass: $('#signup-pass').val().trim(),
    displayname: $('#signup-displayname').val().trim(),
    displaydesc: $('#signup-displaydesc').val().trim(),
    email: $('#signup-email').val().trim(),
  };

  if ([user.username, user.pass, user.displayname, user.displaydesc, user.email].some((e, i, a) => (e == ""))) {
    notify("missing fields");
    return false;
  } else {
    if (checkuserexists(user.username)) {
      notify("username already taken.");
      return false;
    }
  }

  let url = '/api/user/' + user.username;
  $.post(url, user, (ret) => {
    if (ret.status == 0) {
      notify("user created! continue to sign in.", 'success');
    } else {
      notify("error in user creation. contact admin.");
    }
  });

  return false;
}; // signup form handler

$(() => {
  $('#signup-username').keyup(_.debounce(checkavailable, 500));
  $('#signup-form').on('submit', signup_form_submit_handler);
});
