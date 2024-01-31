const express = require("express");
const admin_Rout = express();
const auth = require('../middleware/adminAuth')
const multer = require('../middleware/multer')
const multer2 = require('../middleware/multer2')



const session = require("express-session");
const config = require("../config/config");


// =========================================< MiddleWare >=================================================
admin_Rout.use(session({
    secret: config.sessionSecret,
}))

//--------------view engine------------------
admin_Rout.set("view engine", "ejs")
admin_Rout.set("views", "./views/admin")
//-------------------------------------------
admin_Rout.use(express.json())
admin_Rout.use(express.urlencoded({ extended: true }));

const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController")


admin_Rout.get("/", auth.isLogout, adminController.adminLoginPage);
admin_Rout.post("/", adminController.adminVerify);
admin_Rout.get("/home", auth.isLogin, adminController.loadDashboard);

// USER-MANAGEMENT
admin_Rout.get('/usermanagement', auth.isLogin, adminController.usermanagementload);
admin_Rout.post("/userBlocked", auth.isLogin, adminController.userBlocked);
admin_Rout.get("/logout", auth.isLogin, adminController.logout);


// CATEGORY-MANAGEMENT
admin_Rout.get('/categorymanagement', adminController.loadcategory);
admin_Rout.get("/loadaddcategory", auth.isLogin, adminController.loadAddCategory);
admin_Rout.post("/addcategory", auth.isLogin, adminController.addCategory);
admin_Rout.post("/block-category", auth.isLogin, adminController.blockCategory);
admin_Rout.get("/edit-category", auth.isLogin, adminController.loadeditCategory);
admin_Rout.post("/editCategory", auth.isLogin, adminController.updateCategory)


admin_Rout.get("/productmanagement", auth.isLogin, productController.loadproduct)
admin_Rout.get("/loadAddProduct", auth.isLogin, productController.loadAddProduct)
admin_Rout.post("/addProduct", auth.isLogin, multer.productImagesUpload, productController.addProduct);
admin_Rout.post("/block-product", auth.isLogin, productController.blockProduct);
admin_Rout.get("/edit-product-page", auth.isLogin, productController.loadEditProduct)
admin_Rout.post("/editProduct", auth.isLogin, multer2.productImagesUpload2, productController.editedProduct);
admin_Rout.delete("/admin/removeImage", auth.isLogin, productController.removeImage);

admin_Rout.get("/order", auth.isLogin, orderController.loadOrderManagement)
admin_Rout.put("/updateOrder", orderController.updateOrder)
admin_Rout.get("/orderSummery", auth.isLogin, orderController.orderDetails)
















admin_Rout.get("*", function (req, res) {
    res.redirect("/admin")
})




module.exports = admin_Rout;