//checks if users password and password confirmation match
function passwordMatch(){
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
}

$('#password').keyup(function () {
        $('#strengthMessage').html(checkStrength($('#password').val()))
    });

//function that checks strength of password and applies css
function checkStrength(password) {
  var strength = 0
  if (password.length < 6) {
    $('#strengthMessage').removeClass()
    $('#strengthMessage').addClass('Short')
    $('#submit').attr("disabled", true);
    $('button').css('background', '#282828');

    return 'Too short'
  }
  if (password.length > 7) strength += 1
  // If password contains both lower and uppercase characters, increase strength value.
  if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1
  // If it has numbers and characters, increase strength value.
  if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) strength += 1
  // If it has one special character, increase strength value.
  if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
  // If it has two special characters, increase strength value.
  if (password.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
  // Calculated strength value, we can return messages
  // If value is less than 2
  if (strength < 2) {
    $('#strengthMessage').removeClass()
    $('#strengthMessage').addClass('Weak')
    $('#submit').attr("disabled", true);
    $('button').css('background', '#282828');
    return 'Weak'
  } else if (strength == 2) {
    $('#strengthMessage').removeClass()
    $('#strengthMessage').addClass('Good')
    passwordMatch()
    return 'Good'
  } else {
    $('#strengthMessage').removeClass()
    $('#strengthMessage').addClass('Strong')
    passwordMatch()
    return 'Strong'
    }
  }
