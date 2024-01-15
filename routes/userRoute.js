const express = require("express");
const user_Rout = express();
const session = require('express-session');
const config = require('../config/config');
const auth = require('../middleware/auth')

user_Rout.use(session({
    secret: config.sessionSecret
}))





//============= Controllers ==============//
const userController = require("../controllers/userController");
const addressController = require("../controllers/addressController")
const cartController = require("../controllers/cartController");

//======= View Engine ========//
user_Rout.set("views engine", "ejs");
user_Rout.set("views", "./views/users");






user_Rout.get("/", auth.isLogout, userController.loadHome);
user_Rout.get("/home", auth.isLogin, userController.loadHome);

//======================= Sign Up ===========================
user_Rout.get("/signup", auth.isLogout, userController.loadSignup);
user_Rout.post("/signup", auth.isLogout, userController.insertUser);
user_Rout.get('/userOtp', userController.verifyOTP);
user_Rout.post('/userOtp', userController.veryfyPost);
user_Rout.get('/login', auth.isLogout, userController.loadLogin);
user_Rout.post('/verifylogin', userController.verifylogin);
user_Rout.get('/logout', auth.isLogin, userController.logout);


user_Rout.get('/resend', auth.isLogout, userController.resendOtp);

//===========================Forget  Password=================================
user_Rout.get('/forgetpassword', auth.isLogout, userController.forgetLoad);
user_Rout.post('/forget', userController.forgetVerify);
user_Rout.get('/forget-password', auth.isLogout, userController.loadForgetpage)
user_Rout.post('/forget-password', userController.resetPassword)




//===================Cart====================//
user_Rout.get("/cart", auth.isLogin, cartController.loadCart);
user_Rout.post("/addToCart", cartController.addToCart)
user_Rout.post("/removeCartItem", cartController.removeCartItem)
user_Rout.post("/quantityUpdate", cartController.quantityUpdate)



user_Rout.get('/userProfile', auth.isLogin, userController.loadprofile);
user_Rout.post('/addAddress', addressController.addAddress);
user_Rout.post('/removeAddress',addressController.removeAddress);
user_Rout.post("/changePassword",auth.isLogin,userController.changePassword);



user_Rout.get('/checkout', userController.loadCheckOut)


user_Rout.get('/product', userController.loadProduct)

user_Rout.get("/shop", userController.loadShop);

user_Rout.get("/wishlist", userController.loadWishlist);

user_Rout.get("/contact", userController.loadContact);

user_Rout.get("/404", userController.loadError404);

module.exports = user_Rout;
