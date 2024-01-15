document.getElementById("addAddress").addEventListener("click", function (e) {
  e.preventDefault();

  const fullname = document.getElementById('fullname').value;
  const pincode = document.getElementById('pincode').value;
  const phone = document.getElementById('mobile').value;
  const addressEmail = document.getElementById('addressEmail').value;
  const houseName = document.getElementById('houseName').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
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

  // Clear existing error messages
  fnameError.style.display = "none";
  pinError.style.display = "none";
  phoneError.style.display = "none";
  addEmailError.style.display = "none";
  houseError.style.display = "none";
  cityError.style.display = "none";
  stateError.style.display = "none";

  // Validate the form
  if (fullname.trim() === "") {
      fnameError.style.display = "block";
      fnameError.textContent = "Name is required.";
  } else if (!namePattern.test(fullname)) {
      fnameError.style.display = "block";
      fnameError.textContent = "Full name cannot contain non-alphabetic characters.";
  } else if (fullname.length < 3) {
      fnameError.style.display = "block";
      fnameError.textContent = "Full name must contain at least 3 letters.";
  } else if (pincode.trim() === "") {
      pinError.style.display = "block";
      pinError.textContent = "Pincode is required.";
  } else if (!pincodePattern.test(pincode)) {
      pinError.style.display = "block";
      pinError.textContent = "Enter a valid pincode.";
  } else if (phone.trim() === "") {
      phoneError.style.display = "block";
      phoneError.textContent = "Phone number is required.";
  } else if (!mobilePattern.test(phone) || phone === "0000000000") {
      phoneError.style.display = "block";
      phoneError.textContent = "Enter a valid 10-digit phone number.";
  } else if (addressEmail.trim() === "") {
      addEmailError.style.display = "block";
      addEmailError.textContent = "Email is required.";
  } else if (!emailPattern.test(addressEmail)) {
      addEmailError.style.display = "block";
      addEmailError.textContent = "Enter a valid email address.";
  } else if (houseName.trim() === "") {
      houseError.style.display = "block";
      houseError.textContent = "House name is required.";
  } else if (city.trim() === "") {
      cityError.style.display = "block";
      cityError.textContent = "City name is required.";
  } else if (state.trim() === "") {
      stateError.style.display = "block";
      stateError.textContent = "State name is required.";
  } else {
      // Ajax request for adding the address
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
                  // Reload the user profile page
                  window.location.reload('/addAddress');
              } else {
                  console.error('Failed to add address.');
              }
          },
      });
  }
});


//============ Remove Address============

function removeAddress (addressId){
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
            console.log("check")
          $.ajax({
            url: "/removeAddress",
            data: {
              id: addressId,
            },
            method: "post",
            success: (response) => {
              if ((response.remove = true)) {
                $("#addressReload").load("/userProfile #addressReload");
              }
            },
          });
        }
      });
}


//==============ChangePassword===============

document.getElementById('changePass').addEventListener('click', function (e) {
    e.preventDefault();

    const newPass = document.getElementById('newPass').value;
    const currPass = document.getElementById('password').value;
    const conPass = document.getElementById('conPass').value;
    const passError = document.getElementById('newpassError');
    const conError = document.getElementById('conpassError');
    const currError = document.getElementById('currError');
    
  
    if(currPass.trim() === "" && newPass.trim() === "" && conPass.trim() === ""){
      conPass.style.display = "block";
      conPass.textContent = "Must fillout all fields."
    }else if(newPass.length < 4){
      passError.style.display = "block";
      passError.textContent = "Password contain atleast 4 digits."
    }else if(newPass != conPass){
      conError.style.display = "block";
      conError.textContent = "Confirm the correct password"
    }else{
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, change it!",
        cancelButtonText: "Not now",
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            url: "/changePassword",
            data: {
              newPass: newPass,
              currPass: currPass
            },
            method: "post",
            success: (response) => {
              if ((response.changed)) {
                const Toast = Swal.mixin({
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  timer: 3000,
                })
                
                Toast.fire({
                  icon: 'success',
                  title: 'Password changed.'
                })
                setTimeout(() => {
                  $("#passForm").load("/userProfile #passForm");
                }, 3000);
              }else if(response.wrongpass == true){
                currError.style.display = "block";
                currError.textContent = "Current password is incorrect."
              }
            },
          });
        }
      });
      
    }
})