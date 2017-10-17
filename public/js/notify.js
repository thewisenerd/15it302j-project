window.NOTIFY = (str, type='danger') => {

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
