document.getElementById("submitAddress").addEventListener("click", function (e) {
  e.preventDefault();

  const fullname = document.getElementById('fullname').value;
  const pincode = document.getElementById('pincode').value;
  const phone = document.getElementById('mobile').value;
  const addressEmail = document.getElementById('addressEmail').value;
  const houseName = document.getElementById('houseName').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const efnameError = document.getElementById('fnameError');
  const epinError = document.getElementById('pinError');
  const ephoneError = document.getElementById('phoneError');
  const eaddEmailError = document.getElementById('addEmailError');
  const ehouseError = document.getElementById('houseError');
  const ecityError = document.getElementById('cityError');
  const estateError = document.getElementById('stateError');
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  const mobilePattern = /^\d{10}$/;
  const namePattern = /^[a-zA-Z\s]+$/;
  const pincodePattern = /^\d{6}$/;

  // Clear existing error messages
  efnameError.style.display = "none";
  epinError.style.display = "none";
  ephoneError.style.display = "none";
  eaddEmailError.style.display = "none";
  ehouseError.style.display = "none";
  ecityError.style.display = "none";
  estateError.style.display = "none";

  // Validate the form
  if (fullname.trim() === "") {
    efnameError.style.display = "block";
    efnameError.textContent = "Name is required.";
  } else if (!namePattern.test(fullname)) {
    efnameError.style.display = "block";
    efnameError.textContent = "Full name cannot contain non-alphabetic characters.";
  } else if (fullname.length < 3) {
    efnameError.style.display = "block";
    efnameError.textContent = "Full name must contain at least 3 letters.";
  } else if (pincode.trim() === "") {
    epinError.style.display = "block";
    epinError.textContent = "Pincode is required.";
  } else if (!pincodePattern.test(pincode)) {
    epinError.style.display = "block";
    epinError.textContent = "Enter a valid pincode.";
  } else if (phone.trim() === "") {
    ephoneError.style.display = "block";
    ephoneError.textContent = "Phone number is required.";
  } else if (!mobilePattern.test(phone) || phone === "0000000000") {
    ephoneError.style.display = "block";
    ephoneError.textContent = "Enter a valid 10-digit phone number.";
  } else if (addressEmail.trim() === "") {
    eaddEmailError.style.display = "block";
    eaddEmailError.textContent = "Email is required.";
  } else if (!emailPattern.test(addressEmail)) {
    eaddEmailError.style.display = "block";
    eaddEmailError.textContent = "Enter a valid email address.";
  } else if (houseName.trim() === "") {
    ehouseError.style.display = "block";
    ehouseError.textContent = "House name is required.";
  } else if (city.trim() === "") {
    ecityError.style.display = "block";
    ecityError.textContent = "City name is required.";
  } else if (state.trim() === "") {
    estateError.style.display = "block";
    estateError.textContent = "State name is required.";
  } else {
    $.ajax({
      url: "/addAddress",
      data: {
        fullname: fullname,
        mobile: phone,
        email: addressEmail,
        houseName: houseName,
        city: city,
        state: state,
        pincode: pincode,
      },
      method: "post",
      success: (response) => {
        if (response.success) {
          window.location.reload('/addAddress');
        } else {
          console.error('Failed to add address.');
        }
      },
    });
  }
});


//============ Remove Address============
function removeAddress(addressId) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/removeAddress",
        data: {
          id: addressId,
        },
        method: "POST",
        success: (response) => {
          if (response.remove) {
            $("#addressReload").load("/userProfile #addressReload");
          }
        },
        error: (error) => {
          console.error("Error during AJAX request:", error);
        },
      });
    }
  });
}


//=========================ChangePassword=======================
document.getElementById('changePass').addEventListener('click', function (e) {
  e.preventDefault();
  console.log("Change password");

  const newPass = document.getElementById('newPass').value;
  const currPass = document.getElementById('password').value;
  const conPass = document.getElementById('conPass').value;
  const passError = document.getElementById('newpassError');
  const conError = document.getElementById('conpassError');
  const currError = document.getElementById('currError');

  if (currPass.trim() === "" || newPass.trim() === "" || conPass.trim() === "") {
    currError.style.display = "block";
    currError.textContent = "Must fill out all fields.";
  } else if (newPass.length < 4) {
    passError.style.display = "block";
    passError.textContent = "Password must contain at least 4 characters.";
  } else if (newPass !== conPass) {
    conError.style.display = "block";
    conError.textContent = "Confirm the correct password.";
  } else {
    $.ajax({
      url: "/changePassword",
      data: {
        newPass: newPass,
        currPass: currPass
      },
      method: "post",
      success: (response) => {
        if (response.success) {
          // Password changed successfully
          const successMessage = document.getElementById('successMessage');
          successMessage.style.display = "block";
          successMessage.textContent = "Password changed successfully.";

          // Reload the password form after a delay
          setTimeout(() => {
            $("#passForm").load("/userProfile #passForm");
          }, 3000);
        } else if (response.wrongpass) {
          currError.style.display = "block";
          currError.textContent = "Current password is incorrect.";
        }
      },
    });
  }
});



//=================Edit Address===================


document.getElementById('editAddress').addEventListener('click', function (e) {
  e.preventDefault()
  console.log("Edit address check")
  const id = document.getElementById('addressId').value;
  const fullname = document.getElementById('fullnames').value;
  const pin = document.getElementById('pincodes').value;
  const phone = document.getElementById('mobiles').value;
  const addressEmail = document.getElementById('emails').value;
  const houseName = document.getElementById('houseNames').value;
  const city = document.getElementById('citys').value;
  const state = document.getElementById('states').value;
  const fnameError = document.getElementById('fnameError');
  const pinError = document.getElementById('pinError');
  const phoneError = document.getElementById('phoneError');
  const addEmailError = document.getElementById('addEmailError');
  const houseError = document.getElementById('houseError');
  const cityError = document.getElementById('cityError');
  const stateError = document.getElementById('stateError');
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  const mobilePattern = /^\d{10}$/;
  const namePattern = /^[a-zA-Z\s]+$/;
  const pincodePattern = /^\d{6}$/;
  if (fullname.trim() === "") {
    console.log("check erorr validation")
    fnameError.style.display = "block";
    fnameError.textContent = "Name is required."
  } else if (!namePattern.test(fullname)) {
    console.log("check erorr validation1")

    fnameError.style.display = "block";
    fnameError.textContent = "Full name not contain any non alphabets."
  } else if (fullname.length < 3) {
    fnameError.style.display = "block";
    fnameError.textContent = "Full name atleast contain 3 letters."
  } else if (pin.trim() == "") {
    pinError.style.display = "block";
    pinError.textContent = "Pincode is required."
  } else if (!pincodePattern.test(pin)) {
    pinError.style.display = "block";
    pinError.textContent = "Enter the valid pincode."
  } else if (phone.trim() === "") {
    phoneError.style.display = "block";
    phoneError.textContent = "Phone number is required."
  } else if (!mobilePattern.test(phone) || phone === "0000000000") {
    phoneError.style.display = "block";
    phoneError.textContent = "Enter the valid Phone number (must contain 10 numbers)."
  } else if (addressEmail.trim() === "") {
    addEmailError.style.display = "block";
    addEmailError.textContent = "Email is required."
  } else if (!emailPattern.test(addressEmail)) {
    addEmailError.style.display = "block";
    addEmailError.textContent = "Enter the valid email address."
  } else if (houseName.trim() === "") {
    houseError.style.display = "block";
    houseError.textContent = "House name is required"
  } else if (city.trim() === "") {
    cityError.style.display = "block";
    cityError.textContent = "City name is required"
  } else if (state.trim() === "") {
    stateError.style.display = "block";
    stateError.textContent = "State name is required"
  } else {

    $.ajax({
      url: "/editAddress",
      data: {
        fullname: fullname,
        email: addressEmail,
        mobile: phone,
        houseName: houseName,
        city: city,
        state: state,
        pincode: pin,
        id: id
      },
      method: "post",
      success: (response) => {
        console.log(response, 'check the responce')
        if ((response.success)) {
          $('#editAddressModal').modal('hide');
          $('.modal-dropback').remove();
          // $("#reloadDiv").load("/userProfile #reloadDiv");

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          })

          Toast.fire({
            icon: 'success',
            title: 'Billing address updated successfully.'
          })
          setTimeout(() => {
            window.location.reload("/userProfile");
          }, 2000);

        } else {
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
          })

          Toast.fire({
            icon: 'error',
            title: 'Oops !! try again.'
          })
        }
      },
    });
  }
});



  function showEditAddressModal(fullname, mobile, email, houseName, city, state, pincode, addressId) {
    document.getElementById('fullnames').value = fullname;
    document.getElementById('emails').value = email;
    document.getElementById('mobiles').value = mobile;
    document.getElementById('states').value = state;
    document.getElementById('citys').value = city;
    document.getElementById('pincodes').value = pincode;
    document.getElementById('houseNames').value = houseName;
    document.getElementById('addressId').value = addressId;

    $('#editAddressModal').modal('show');
  }













  document.getElementById('editProfile').addEventListener('click', function (e) {
    e.preventDefault();


    const editFullname = document.getElementById('editFullname').value;
    const editEmail = document.getElementById('editEmail').value;
    const editMobile = document.getElementById('editMobile').value;

    console.log(editFullname, 'chek');
    console.log(editEmail, 'chek');
    console.log(editMobile, 'chek');


    // Validation patterns
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const mobilePattern = /^\d{10}$/;
    const namePattern = /^[a-zA-Z\s]+$/;

    // Error elements
    const nameError = document.getElementById('editFullnameError');
    const emailError = document.getElementById('editEmailError');
    const mobError = document.getElementById('editMobileError');

    // Reset previous errors
    nameError.style.display = "none";
    emailError.style.display = "none";
    mobError.style.display = "none";

    // Validation
    if (editFullname.trim() === "" || !namePattern.test(editFullname) || editFullname.length < 3) {
      nameError.style.display = "block";
      nameError.textContent = "Enter a valid full name.";
    } else if (editEmail.trim() === "" || !emailPattern.test(editEmail)) {
      emailError.style.display = "block";
      emailError.textContent = "Enter a valid email address.";
    } else if (editMobile.trim() === "" || !mobilePattern.test(editMobile) || editMobile === "0000000000") {
      mobError.style.display = "block";
      mobError.textContent = "Enter a valid phone number.";
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You want to update your profile?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
      cancelButtonText: "Not now",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: "/editProfile",
          data: {
            fullname: editFullname,
            email: editEmail,
            mobile: editMobile
          },
          method: "post",
          success: (response) => {
            if (response.success) {
              $('#editProfileModal').modal('hide');
              $('.modal-dropback').remove();

              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
              })

              Toast.fire({
                icon: 'success',
                title: 'Profile updated successfully.'
              })

              setTimeout(() => {
                window.location.reload("/userProfile");
              }, 2000);
            } else {
              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
              })

              Toast.fire({
                icon: 'error',
                title: 'Oops!! Try again.'
              })
            }
          },
        });
      }
    });
  });



  function showEditProfileModal(fullname, email, mobile) {
    // Pre-fill the form fields
    document.getElementById('editFullname').value = fullname;
    document.getElementById('editEmail').value = email;
    document.getElementById('editMobile').value = mobile;

    // Show the modal
    $('#editProfileModal').modal('show');
  }
