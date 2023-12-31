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
//======= View Engine ========//
user_Rout.set("views engine", "ejs");
user_Rout.set("views", "./views/users");






user_Rout.get("/", auth.isLogout, userController.loadHome);
user_Rout.get("/home", auth.isLogin, userController.loadHome);

//=========== Sign Up ==========// auth.isLogout,
user_Rout.get("/signup", auth.isLogout, userController.loadSignup);
user_Rout.post("/signup", auth.isLogout, userController.insertUser);
user_Rout.get('/userOtpSignup', userController.verifyOTP);
user_Rout.post('/userOtpSignup', userController.veryfyPost);
user_Rout.get('/login', auth.isLogout, userController.loadLogin);
user_Rout.post('/login', userController.verifyLogin);
user_Rout.get('/logout', auth.isLogin, userController.logout);


user_Rout.get('/userProduct', userController.loadProduct)

user_Rout.get("/shop", userController.loadShop);

user_Rout.get("/cart", userController.loadCart);

user_Rout.get("/wishlist", userController.loadWishlist);

user_Rout.get("/contact", userController.loadContact);

user_Rout.get("/404", userController.loadError404);

module.exports = user_Rout;
