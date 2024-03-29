const express = require('express')
const user_Rout = express()
const session = require('express-session')
const config = require('../config/config')
const auth = require('../middleware/auth')
require('dotenv').config()

user_Rout.use(
  session({
    secret: config.sessionSecret,
  }),
)

//============= Controllers ==============//
const userController = require('../controllers/userController')
const addressController = require('../controllers/addressController')
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')
const orderControllers = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const wishController = require('../controllers/wishListController')
//======= View Engine ========//
user_Rout.set('views', './views/users')

user_Rout.get('/', auth.isLogout, userController.loadHome)
user_Rout.get('/home', auth.isLogin, userController.loadHome)

//======================= Sign Up ===========================
user_Rout.get('/signup', auth.isLogout,userController.loadSignup)
user_Rout.post('/signup', auth.isLogout,userController.insertUser)

user_Rout.get('/userOtp', auth.isLogout, userController.loadUserOtp)
user_Rout.post('/verifyOtp', auth.isLogout, userController.verifyOTP)
user_Rout.get('/resendOtp', userController.resendOtp)

user_Rout.get('/login', auth.isLogout, userController.loadLogin)
user_Rout.post('/verifylogin', userController.verifylogin)
user_Rout.get('/logout', auth.isLogin, userController.logout)
user_Rout.get('/resendOtp', userController.resendOtp)

//===========================Forget  Password=================================
user_Rout.get('/forgetpassword', auth.isLogout, userController.forgetLoad)
user_Rout.post('/forgetPassword', userController.forgetVerify)

user_Rout.get('/forget-password', auth.isLogout, userController.loadForgetpage)
user_Rout.post('/resetPassword', userController.resetPassword)

//===================Cart====================//
user_Rout.get('/cart', auth.isLogin, cartController.loadCart)
user_Rout.post('/addToCart', cartController.addToCart)
user_Rout.post('/removeCartItem', cartController.removeCartItem)
user_Rout.post('/quantityUpdate', cartController.quantityUpdate)

//===================== UserProfile =================================
user_Rout.get('/userProfile', auth.isLogin, userController.loadprofile)
user_Rout.post('/addAddress', addressController.addAddress)
user_Rout.post('/removeAddress', addressController.removeAddress)
user_Rout.post('/changePassword', auth.isLogin, userController.changePassword)
user_Rout.post('/editAddress', auth.isLogin, addressController.editAddress)
user_Rout.post('/editProfile', addressController.editProfile)

// =============================checkOut==================================
user_Rout.get('/checkout', auth.isLogin, cartController.loadCheckOut)
user_Rout.post('/placeOrder', auth.isLogin, orderControllers.placeOrder)
user_Rout.post('/verify-payment', auth.isLogin, orderControllers.verifyPayment)
user_Rout.get('/orderSuccess/:id', auth.isLogin, orderControllers.success)
user_Rout.get('/orderDetails', auth.isLogin, orderControllers.OrderDetailsLoad)
user_Rout.post('/returnRequest', orderControllers.returnRequest)
user_Rout.post('/orderCancel', auth.isLogin, orderControllers.orderCancel)
user_Rout.get('/invoice', orderControllers.invoice)


user_Rout.get('/searchAndFilter', productController.searchAndFilterProducts);

//=========================coupon========================
user_Rout.post('/appliCopuon', couponController.applyCoupon)
user_Rout.post('/removeCoupon', couponController.removeCoupon)

user_Rout.get('/product', productController.loadProduct)
user_Rout.get('/shop', userController.loadShop)

//======================Wishlkist==================================
user_Rout.get('/wishlist', auth.isLogin, wishController.loadWishlist)
user_Rout.post('/addWishlist', auth.isLogin, wishController.addWishList)
user_Rout.delete('/removeWish', auth.isLogin, wishController.removeWish)

user_Rout.get('/contact', userController.loadContact)
user_Rout.get('/about', userController.aboutLoad)
user_Rout.get('/404', userController.loadError404)
user_Rout.get('/500', userController.loadError500)

module.exports = user_Rout
