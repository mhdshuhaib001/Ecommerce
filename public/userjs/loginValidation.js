document.getElementById('log-btn-1').addEventListener('click', function (e) {
  e.preventDefault()
  const email = document.getElementById('exampleInputEmail1').value
  const password = document.getElementById('exampleInputPassword1').value
  const email_message = document.getElementById('email-error')
  const password_message = document.getElementById('password-error')

  $.ajax({
    url: '/verifylogin',
    data: {
      email: email,
      password: password,
    },
    method: 'POST',
    success: (response) => {
      if (response.register) {
        email_message.style.display = 'block'
        email_message.textContent =
          ' This account is not registered please register.'
      } else if (response.email_fillout) {
        email_message.style.display = 'block'
        email_message.textContent = 'Please fill this field and submit again.'
      } else if (response.password_fillout) {
        password_message.style.display = 'block'
        password_message.textContent =
          'Please fill this field and submit again.'
      } else if (response.email_space) {
        email_message.style.display = 'block'
        email_message.textContent = 'Email cannot contain spaces.'
      } else if (response.password_space) {
        password_message.style.display = 'block'
        password_message.textContent = 'Password cannot contain spaces.'
      } else if (response.wrong) {
        password_message.style.display = 'block'
        password_message.textContent = ' Please enter the correct password.'
      } else if (response.logemailPatt) {
        email_message.style.display = 'block'
        email_message.textContent = ' Please enter a valid email address'
      } else if (response.blocked) {
        email_message.style.display = 'block'
        email_message.textContent = "You can't access this account."
      } else if (response.is_blocked) {
        Swal.fire({
          title:
            "This account is restricted, You can't access with this account. ",
          showClass: {
            popup: `
                animate__animated
                animate__fadeInUp
                animate__faster
              `,
          },
          hideClass: {
            popup: `
                animate__animated
                animate__fadeOutDown
                animate__faster
              `,
          },
        }).then((data) => {
          window.location.href = '/home'
        })
      } else if (response.success) {
        window.location.href = '/home'
      } else if (response.verify) {
        window.location.href = '/userOtp'
      }
    },
  })
})
