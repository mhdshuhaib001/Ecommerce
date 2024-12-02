const express = require('express')
const admin_Rout = express()
const auth = require('../middleware/adminAuth')
const multer = require('../middleware/multer')
const multer2 = require('../middleware/multer2')

const session = require('express-session')
const config = require('../config/config')
const { productImagesUpload, bannerUpload } = require('../middleware/multer');


// =========================================< MiddleWare >=================================================
admin_Rout.use(
  session({
    secret: config.sessionSecret,
  }),
)

//--------------view engine------------------
admin_Rout.set('view engine', 'ejs')
admin_Rout.set('views', './views/admin')
//-------------------------------------------
admin_Rout.use(express.json())
admin_Rout.use(express.urlencoded({ extended: true }))

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const bannerController = require('../controllers/bannerController')

admin_Rout.get('/', auth.isLogout, adminController.adminLoginPage)
admin_Rout.post('/', auth.isLogout, adminController.adminVerify)
admin_Rout.get('/home', auth.isLogin, adminController.loadDashboard)
admin_Rout.get('/logout', auth.isLogin, adminController.logout)

//=====================================USER-MANAGEMENT==================================
admin_Rout.get('/usermanagement',auth.isLogin,adminController.usermanagementload,)
admin_Rout.post('/userBlocked', auth.isLogin, adminController.userBlocked)
admin_Rout.get("/userOrders",auth.isLogin,adminController.userOrdes)

//=====================CATEGORY-MANAGEMENT=====================================
admin_Rout.get('/categorymanagement', adminController.loadcategory)
admin_Rout.get('/loadaddcategory',auth.isLogin,adminController.loadAddCategory,)
admin_Rout.post('/addcategory', auth.isLogin, adminController.addCategory)
admin_Rout.post('/block-category', auth.isLogin, adminController.blockCategory)
admin_Rout.get('/edit-category', auth.isLogin, adminController.loadeditCategory)
admin_Rout.post('/editCategory', auth.isLogin, adminController.updateCategory)
//=====================ProductManagement=====================================

admin_Rout.get(
  '/productmanagement',
  auth.isLogin,
  productController.loadproduct,
)
admin_Rout.get(
  '/loadAddProduct',
  auth.isLogin,
  productController.loadAddProduct,
)
admin_Rout.post(
  '/addProduct',
  auth.isLogin,
  multer.productImagesUpload,
  productController.addProduct,
)
admin_Rout.post('/block-product', auth.isLogin, productController.blockProduct)
admin_Rout.get(
  '/edit-product-page',
  auth.isLogin,
  productController.loadEditProduct,
)
admin_Rout.post(
  '/editProduct',
  auth.isLogin,
  multer2.productImagesUpload2,
  productController.editedProduct,
)

//=====================orderManagement=====================================
admin_Rout.get(
  '/orderManagement',
  auth.isLogin,
  orderController.loadOrderManagement,
)
admin_Rout.put('/updateOrder', auth.isLogin, orderController.updateOrder)
admin_Rout.get('/orderSummery', auth.isLogin, orderController.orderDetails)
admin_Rout.post('/returnOrder', auth.isLogin, orderController.returnOrder)

//============================ CouponManagement=====================
admin_Rout.get('/coupon', auth.isLogin, couponController.loadCouponManagement)
admin_Rout.get('/addCoupon', auth.isLogin, couponController.addCouponLoad)
admin_Rout.post('/addCoupon', auth.isLogin, couponController.addCoupon)
admin_Rout.put('/blockCoupon', auth.isLogin, couponController.blockCoupon)
admin_Rout.delete('/couponDelet', auth.isLogin, couponController.deletCouopon)


//========================BannerManagement===============================

admin_Rout.get("/bannermanagement", auth.isLogin, bannerController.bannerLoad);
admin_Rout.get("/addBanner",auth.isLogin,bannerController.loadaddBanner);
admin_Rout.post('/addBanner', bannerUpload, bannerController.addBanner);
admin_Rout.put("/blockBanner",auth.isLogin,bannerController.blockAndunblock);
admin_Rout.post("/deleteBanner",auth.isLogin,bannerController.deleteBanner);
admin_Rout.get("/editBanner",auth.isLogin,bannerController.editBannerload)
admin_Rout.post('/editBanner', bannerUpload, bannerController.editBanner);


admin_Rout.get('/salesReport', auth.isLogin,adminController.salesReport)
admin_Rout.get('/pdfDown', auth.isLogin,adminController.pdfDownload)
admin_Rout.get('/exelDown', auth.isLogin,adminController.excelDownload)

admin_Rout.get('*', function (req, res) {
  res.redirect('/admin')
})

module.exports = admin_Rout
