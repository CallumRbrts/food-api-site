$('#password, #confirm_password').on('keyup', function () {
  if ($('#password').val() == $('#confirm_password').val()) {
    $('#message').html('Passwords match!').css('color', '#1DB954');
    $('#submit').attr("disabled", false);
    $('button').css('background', '#1DB954');
  } else{
    $('#message').html('Passwords don\'t match!').css('color', 'red');
    $('#submit').attr("disabled", true);
    $('button').css('background', '#282828');
  }
});
