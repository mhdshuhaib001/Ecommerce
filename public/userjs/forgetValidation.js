$(document).ready(function () {
  $('#forgetForm').submit(function (e) {
    e.preventDefault()

    const email = $('#sendEmail').val()
    const errorMessage = $('#error-message')

    $.ajax({
      url: '/forgetPassword',
      data: {
        email: email,
      },
      method: 'post',
      success: function (response) {
        errorMessage.hide().text('')

        if (
          response.emailPatt ||
          response.email_require ||
          response.email_space ||
          response.mailverify ||
          response.wrong
        ) {
          errorMessage.show().text(getErrorMessage(response))
        } else {
          Swal.fire({
            title: 'Success!',
            html: `Check your inbox for the reset instructions sent to: <strong>${email}</strong>`,
            icon: 'success',
            customClass: {
              popup: 'small-swal',
            },
          })

          setTimeout(function () {
            window.location.href = '/login'
          }, 2000)
        }
      },
    })
  })




  function getErrorMessage(response) {
    if (response.emailPatt) return 'Please enter a valid email address.'
    if (response.email_require)
      return 'Please fill in this field and submit again.'
    if (response.email_space) return 'Email cannot contain spaces.'
    if (response.mailverify) return 'Given email is not verified.'
    if (response.wrong) return 'This email is not registered.'
    return ''
  }
})




document
  .getElementById('resetPassword')
  .addEventListener('click', function (e) {
    e.preventDefault()
  
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm').value;
    const password_message = document.getElementById('password_error');
    const confirm_message = document.getElementById('confirm_error');
console.log('password',password);
console.log('confirmPassword',confirmPassword);
    // Reset error messages
    password_message.style.display = 'none';
    confirm_message.style.display = 'none';

    // Define password pattern with at least 8 characters, including letters and numbers
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (password.trim() === '') {
      console.log('jheabfdchd',);
      password_message.style.display = 'block';
      password_message.textContent = 'Password cannot be empty.';
    } else if (!passwordPattern.test(password)) {
      console.log('chek this 1',);
      password_message.style.display = 'block';
      password_message.textContent =
        'Password must be at least 8 characters and include both letters and numbers.';
    } else {
      if (confirmPassword.trim() === '') {
        confirm_message.style.display = 'block';
        confirm_message.textContent = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        confirm_message.style.display = 'block';
        confirm_message.textContent = 'Passwords do not match.';
      } else {
      $.ajax({
      url: '/resetPassword',
      data: {
        password: password,
        confirm: confirmPassword,
      },
      method: 'POST',
      success: (response) => {
        if (response.required) {
        } else if (response.password_space) {
          password_message.style.display = 'block'
          password_message.textContent = 'Password cannot contain space.'
        } else if (response.paslength) {
          password_message.style.display = 'block'
          password_message.textContent = 'Password must contain 4 digits.'
        } else if (response.password_require) {
          password_message.style.display = 'block'
          password_message.textContent =
            'Please fill this field and submit again.'
        } else if (response.confirm_require) {
          confirm_message.style.display = 'block'
          confirm_message.textContent =
            'Please fill this field and submit again.'
        } else if (response.wrong) {
          password_message.style.display = 'block'
          confirm_message.textContent = 'Confirm the correct password.'
        } else {
          Swal.fire({
            title: 'success',
            text: 'Password successfully changed.',
            icon: 'success',
          }).then((data) => {
            if (data.value) {
              window.location.href = '/login'
            }
          })
        }
      },
    })
  }
  }
  })




