//-------------SIGNUP VALIDATION---------------

document.getElementById('submit').addEventListener('click', function (e) {
  e.preventDefault()
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const mobile = document.getElementById("mobile").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const name_message = document.getElementById('name-error');
  const email_message = document.getElementById('email-error');
  const phone_message = document.getElementById('phone-error');
  const password_message = document.getElementById('password-error');
  const confirm_message = document.getElementById('confirm-error');
  const err_message = document.getElementById("error-message");
console.log(email)
  $.ajax({
    url: '/signup',
    data: {
      name: name,
      email: email,
      mobile: mobile,
      password: password,
      confirmPassword: confirmPassword
    },
    method: "post",
    success: (response) => {
      console.log('check data')

      if ((response.name_require)) {
        name_message.style.display = "block";
        name_message.textContent = "Please fill this field and submit again."
      } else if (response.email_require) {
        email_message.style.display = "block";
        email_message.textContent = "Please fill this field and submit again."
      } else if (response.mobile_require) {
        phone_message.style.display = "block";
        phone_message.textContent = "Please fill this field and submit again."
      } else if (response.password_require) {
        password_message.style.display = "block";
        password_message.textContent = "Please fill this field and submit again."
      } else if (response.confirm_require) {
        confirm_message.style.display = "block";
        confirm_message.textContent = "Please fill this field and submit again."
      } else if (response.name_space) {
        name_message.style.display = "block";
        name_message.textContent = "Name cannot contain spaces."
      } else if (response.email_space) {
        email_message.style.display = "block";
        email_message.textContent = "Email cannot contain spaces."
      } else if (response.mobile_space) {
        phone_message.style.display = "block";
        phone_message.textContent = "Mobile number cannot contain spaces."
      } else if (response.password_space) {
        password_message.style.display = "block";
        password_message.textContent = "Password cannot contain spaces."
      } else if (response.confirm_space) {
        confirm_message.style.display = "block";
        confirm_message.textContent = "Confirm password cannot contain spaces."
      } else if (response.emailPatt) {
        email_message.style.display = "block";
        email_message.textContent = "Enter the valid email address."
      } else if (response.mobile) {
        phone_message.style.display = "block";
        phone_message.textContent = "Enter the valid mobile number."
      } else if (response.password) {
        password_message.style.display = "block";
        password_message.textContent = "Password must contain 4 digits."
      } else if (response.alphanumeric) {
        password_message.style.display = "block";
        password_message.textContent = "Password should contain numbers & alphabets."
      } else if (response.emailalready) {
        email_message.style.display = "block";
        email_message.textContent = " This email already registered, please Log In."
      } else if (response.wrongpass) {
        confirm_message.style.display = "block";
        confirm_message.textContent = "Confirm the correct password."
      } else if (response.notsaved) {
        err_message.style.display = "block";
        err_message.textContent = "Uh-oh! Got some issues please try again."
      } else if (response.name) {
        name_message.style.display = "block";
        name_message.textContent = " Name atleast contain 3 letters."
      } else {
        window.location.href = "/userOtp"
      }

    },
  })

})