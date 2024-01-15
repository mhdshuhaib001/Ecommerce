const { default: Swal } = require("sweetalert2");
const { response } = require("../../routes/userRoute");

document.getElementById('resetPassword ').addEventListener('click',function (e){
    e.preventDefault();

    const password = document.getElementById('password').value
    const conformPassword = document.getElementById('conform').value
    const password_message = document.getElementById('password_error');
    const confirm_message = document.getElementById('confirm_error');

    $ajax({
        url: "forget-Passwoe",
        data: {
            password: password,
            confirm: confirm
        },
        method: "POST",
        succsess: (response)=>{
            if (response.password_space) {
                password_message.style.display = "block";
                password_message.textContent = "Password cannot contain space."
            } else if (response.paslength) {
                password_message.style.display = "block";
                password_message.textContent = "Password must contain 4 digits."
            } else if (response.password_require) {
                password_message.style.display = "block";
                password_message.textContent = "Please fill this field and submit again."
            } else if (response.confirm_require) {
                password_message.style.display = "block";
                confirm_message.textContent = "Please fill this field and submit again."
            } else if (response.paslength) {
                password_message.style.display = "block";
                password_message.textContent = "Password must contain 4 digits."
            } else if (response.wrong) {
                password_message.style.display = "block";
                confirm_message.textContent = "Confirm the correct password."
            } else {
                Swal.fire({
                    title: "succsess",
                    text: "Password successfully changed.",
                    icon: "success",
                }).then((data)=>{
                    if(data){
                        window.location.href("/login")
                    }
                })
            }
        }
    })
})