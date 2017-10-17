let checkuserexists = (username) => new Promise((resolve, reject) => {
  let url = '/api/user/' + username;

  $.get(url, (data) => {
    if (data.status == 0) {
      resolve();
    } else {
      reject();
    }
  });
});


var checkavailable = () => {
  let el = $('#signup-username')
  let icon = $('#username-availability-check')
  let user = $(el).val()

  if ($(el).val().trim() == '')
    return;

  checkuserexists(user)
    .then(() => {
      $(el).addClass('is-danger');
      $(icon).removeClass('fa-check')
      $(icon).addClass('fa-times')
    }).catch(() => {
      $(el).removeClass('is-danger');
      $(icon).removeClass('fa-times')
      $(icon).addClass('fa-check')
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
    window.NOTIFY("missing fields");
    return false;
  }


  checkuserexists(user.username)
    .then(() => {
      window.NOTIFY("username already taken.");
    }).catch(() => {

      let url = '/api/user/' + user.username;
      $.post(url, user, (ret) => {
        if (ret.status == 0) {
          window.NOTIFY("user created! continue to sign in.", 'success');
        } else {
          window.NOTIFY("error in user creation. contact admin.");
        }
      });

    });

  return false;
}; // signup form handler

$(() => {
  $('#signup-username').keyup(_.debounce(checkavailable, 500));
  $('#signup-form').on('submit', signup_form_submit_handler);
});
