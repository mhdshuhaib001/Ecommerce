const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const Category = require("../models/categoryModel");
const categoryModel = require("../models/categoryModel");
const Order = require("../models/orderModel");
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const ejs = require('ejs');
const ExcelJS = require('exceljs');



const adminLoginPage = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message)
        res.status(500).render("500");
    }
}

//-------------------------Log out---------------------
const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect("/admin")
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500");
    }
}


const adminVerify = async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;
        const adminData = await User.findOne({ email: email });

        if (adminData) {
            const matchPassword = await bcrypt.compare(password, adminData.password);

            if (matchPassword) {
                if (adminData.is_admin === true) {
                    req.session.admin_id = adminData._id;
                    console.log("Admin chck")
                    res.redirect('/admin/home');
                } else {
                    res.render('login', { error: 'email not found' });
                }
            } else {
                res.render('login', { error: 'incorrect password' });
            }

        } else {
            res.render('login', { error: 'Email not found' })
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500");

    }
}

//---------------------load Dashboard----------------

const loadDashboard = async (req, res) => {
    try {
        const currentDate = new Date();
        const startDate = new Date(currentDate - 30 * 24 * 60 * 60 * 1000);

        const userData = await User.find();
        // const userCount = userData.length;
        const orderData = await Order.find({ purchaseDate: { $gte: startDate, $lt: currentDate } });
        const totalProduct = orderData ? orderData.length : 0;
        const verifiedUserCount = await User.countDocuments({ is_verified: true });
        let deliveredOrders = 0;
        let totalRevenue = 0;
        let razorpayAmount = 0;
        let codAmount = 0;
        let walletAmount = 0;


        orderData.forEach((order) => {
            deliveredOrders += order.orderProducts.reduce((acc, delivered) => (delivered.status === 'Delivered' ? acc + 1 : acc), 0);
            totalRevenue += order.orderProducts.reduce((acc, product) => (product.status === 'Delivered' ? acc + product.totalPrice : acc), 0);

            order.orderProducts.forEach((product) => {
                if (product.status === 'Delivered') {
                    if (order.paymentMethod === 'razorpay') {
                        razorpayAmount += product.totalPrice;
                    } else if (order.paymentMethod === 'COD') {
                        codAmount += product.totalPrice;
                    } else if (order.paymentMethod === 'wallet') {
                        walletAmount += product.totalPrice;
                    }
                }
            });
        });

        //--------------------------------sales graph--------------------

        const dailyProductSales = await Order.aggregate([
            { $match: { 'orderProducts.status': 'Delivered', purchaseDate: { $gte: startDate, $lt: currentDate } } },
            { $unwind: '$orderProducts' },
            { $addFields: { formattedDate: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } } } },
            { $group: { _id: { date: '$formattedDate' }, revenue: { $sum: '$orderProducts.totalPrice' } } },
        ]);

        const weeklyProductSales = await Order.aggregate([
            { $match: { 'orderProducts.status': 'Delivered', purchaseDate: { $gte: startDate, $lt: currentDate } } },
            { $unwind: '$orderProducts' },
            { $addFields: { week: { $isoWeek: '$purchaseDate' }, year: { $isoWeekYear: '$purchaseDate' } } },
            { $group: { _id: { week: '$week', year: '$year' }, revenue: { $sum: '$orderProducts.totalPrice' } } },
        ]);

        console.log(dailyProductSales, 'jojojoooooooooooooooooooooojjjjjjjjjjjjjj');

        console.log(weeklyProductSales, 'jjiiuhuiuiigygyguygyuuuy');
        const monthlyProductSales = await Order.aggregate([
            { $match: { 'orderProducts.status': 'Delivered' } },
            { $unwind: '$orderProducts' },
            { $addFields: { formattedDate: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate', }, }, }, },
            { $group: { _id: { date: '$formattedDate' }, revenue: { $sum: '$orderProducts.totalPrice' }, }, },
        ]);


        const dailyLabels = dailyProductSales.map(entry => entry._id.date);
        const dailyData = dailyProductSales.map(entry => entry.revenue);
        console.log(dailyLabels, 'dailyLabels');
        console.log(dailyData, 'dailyData');

        const weeklyLabels = weeklyProductSales.map(entry => `Week ${entry._id.week}, ${entry._id.year}`);
        const weeklyData = weeklyProductSales.map(entry => entry.revenue);


        const salesDataMonthly = Array.from({ length: 12 }, () => 0);
        const salesDataYearly = Array.from({ length: 12 }, () => 0);
        const currentYear = currentDate.getFullYear();
        const years = [];

        for (const entry of monthlyProductSales) {
            const entryYear = new Date(entry._id.date).getFullYear();
            const monthIndex = new Date(entry._id.date).getMonth();

            if (!years.includes(entryYear)) {
                years.push(entryYear);
            }

            if (entryYear === currentYear) {
                salesDataYearly[monthIndex] = entry.revenue;
            }
            salesDataMonthly[monthIndex] += entry.revenue;
        }

        const yearlyLabels = years.map(String);

        const paymentMethodDatas = await Order.aggregate([{ $match: { 'orderProducts.status': 'Delivered' } }, { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }]);



        //========================================best selling prodcut====================
        const bestSellingProducts = await Order.aggregate([
            { $match: { 'orderProducts.status': 'Delivered' } },
            { $unwind: '$orderProducts' },
            {
                $group: {
                    _id: '$orderProducts.productId',
                    productName: { $first: '$orderProducts.productName' },
                    totalSold: { $sum: '$orderProducts.count' },
                    status: { $first: '$orderProducts.status' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
        ]);


        const bestSellingCategories = await Order.aggregate([
            { $match: { 'orderProducts.status': 'Delivered' } },
            { $unwind: '$orderProducts' },
            {
                $lookup: {
                    from: 'Products',
                    localField: 'orderProducts.productId',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalSold: { $sum: '$orderProducts.count' },
                    products: { $push: '$productDetails' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
        ]);
        const bestProduct = bestSellingProducts.map(product => product.productName);


        res.render('dashboard', {
            bestSellingProducts,
            totalProduct,
            verifiedUserCount,
            yearlyLabels,
            salesDataMonthly,
            salesDataYearly,
            deliveredOrders,
            totalRevenue,
            paymentMethodDatas,
            razorpayAmount,
            codAmount,
            dailyLabels,
            dailyData,
            weeklyLabels,
            weeklyData,
        });
    } catch (error) {
        console.log(error.message);
    }
};




//-----------------------User Management--------------------

const usermanagementload = async (req, res) => {
    try {
        const itemPage = 8;
        const page = +req.query.page || 1;
        const totalUsers = await User.countDocuments({ is_admin: false });

        const totalPages = Math.ceil(totalUsers / itemPage);

        const userData = await User.find({ is_admin: false })
            .sort({ purchaseTime: 1 })
            .skip((page - 1) * itemPage)
            .limit(itemPage)
            .lean();

        res.render("usermanagement", { users: userData, totalPages, currentPage: page, itemPage });
    } catch (error) {
        console.error(error.message);
        res.status(500).render("500"); 
    }
};

//-------------------- Block Or Unblock User -------------

const userBlocked = async (req, res) => {
    try {
        const userId = req.body.userId;
        const blockedUser = await User.findOne({ _id: userId });

        if (!blockedUser.is_blocked) {
            await User.updateOne({ _id: userId }, { $set: { is_blocked: true } });
            res.json({ success: true, message: "User Blocked" });
        } else {
            await User.updateOne({ _id: userId }, { $set: { is_blocked: false } });
            res.json({ success: true, message: "User Unblocked" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
};


//----------------LOAD CATEGORY MANAGEMENT-----------------

const loadcategory = async (req, res) => {
    try {

        const categoryData = await Category.find()
        res.render("categorymanagement", { categoryData: categoryData })

    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}

//----------------LOAD ADD CATEGORY-----------------

const loadAddCategory = async (req, res) => {

    try {
        res.render("addcategory")
    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}


const addCategory = async (req, res) => {
    try {
        const name = req.body.categoryname
        const data = new categoryModel({
            name: req.body.categoryname
        });

        const already = await categoryModel.findOne({ name: { $regex: name, $options: "i" } });
        console.log(already)
        if (already) {
            res.render("addcategory", { message: "Entered category is already exist." });
        } else {
            const categoryData = await data.save();
            res.redirect("/admin/categorymanagement");
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}

//--------------------BLOCK AND UNBLOCK CATEGORY--------------------------

const blockCategory = async (req, res) => {
    try {

        const blockedcategory = await Category.findOne({ _id: req.body.catId })
        if (!blockedcategory.blocked) {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: true } })
            res.json({ success: true })
        } else {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: false } })
            res.json({ success: true })
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}

//----------------LOAD EDIT CATEGORY PAGE--------------

const loadeditCategory = async (req, res) => {
    try {

        const categoryId = req.query.id
        const category = await Category.findOne({ _id: categoryId })
        res.render("editcategory", { category: category })

    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}


//--------------------UPDATE CATEGORY-------------

const updateCategory = async (req, res) => {
    try {

        const categoryId = req.query.id
        const updatecategory = await Category.updateOne({ _id: categoryId }, { $set: { name: req.body.categoryName } })
        if (updatecategory) {
            res.redirect("/admin/categorymanagement")
        } else {
            res.render("editcategory", { message: "There is an error occured, try again!" })
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}


//----------------DELETE CATEGORY IN CATEGORY MANAGEMENT-----------------

const deleteCategory = async (req, res) => {
    try {

        await Category.deleteOne({ _id: req.query.id })
        res.redirect("/admin/categorymanagement")

    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}



const salesReport = async (req, res) => {
    try {
        const duration = req.query.sort;
        const currentDate = new Date();
        const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);

        const orders = await Order.aggregate([
            {
                $unwind: "$orderProducts",
            },
            {
                $match: {
                    'orderProducts.status': "delivered",
                    'purchaseDate': { $gte: startDate, $lte: currentDate },
                },
            },
            {
                $lookup: {
                    from: "Products",
                    localField: "orderProducts.productId",
                    foreignField: "_id",
                    as: "orderProducts.productDetails",
                },
            },
            {
                $addFields: {
                    "orderProducts.productDetails": {
                        $arrayElemAt: ["$orderProducts.productDetails", 0],
                    },
                },
            },
            {
                $sort: { purchaseDate: -1 },
            },
        ]);

        res.render('salesReport', { orders });
    } catch (error) {
        console.error(error.message);
        res.status(500).render("500"); 
    }
};

const pdfDownload = async (req, res) => {
    try {
        const duration = req.query.sort;
        const currentDate = new Date();
        const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);

        const orders = await Order.aggregate([
            {
                $unwind: "$orderProducts",
            },
            {
                $match: {
                    'orderProducts.status': "delivered",
                    'purchaseDate': { $gte: startDate, $lte: currentDate },
                },
            },
            {
                $lookup: {
                    from: "Products",
                    localField: "orderProducts.productId",
                    foreignField: "_id",
                    as: "orderProducts.productDetails",
                },
            },
            {
                $addFields: {
                    "orderProducts.productDetails": {
                        $arrayElemAt: ["$orderProducts.productDetails", 0],
                    },
                },
            },
            {
                $sort: { purchaseDate: -1 },
            },
        ]);

        const totalRevenue = orders.reduce((acc, order) => {
            const orderProductsArray = Array.isArray(order.orderProducts) ? order.orderProducts : [order.orderProducts];
            return acc + orderProductsArray.reduce((acc, product) => {
                return acc + (product.status === 'delivered' ? product.totalPrice : 0);
            }, 0);
        }, 0);

        const totalDeliveredProductsCount = orders.reduce((acc, order) => {
            const orderProductsArray = Array.isArray(order.orderProducts) ? order.orderProducts : [order.orderProducts];
            return acc + orderProductsArray.reduce((acc, product) => {
                return acc + (product.status === 'delivered' ? 1 : 0);
            }, 0);
        }, 0);

        const ejsPagePath = path.join(__dirname, '../views/admin/reportPdf.ejs');
        const ejsPage = await ejs.renderFile(ejsPagePath, { orders, totalRevenue, totalDeliveredProductsCount });
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(ejsPage);
        const pdfBuffer = await page.pdf();
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}



const excelDownload = async (req, res) => {
    try {
        const duration = req.query.sort;
        const currentDate = new Date();
        const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);

        const orders = await Order.aggregate([
            {
                $unwind: "$orderProducts",
            },
            {
                $match: {
                    'orderProducts.status': "delivered",
                    'purchaseDate': { $gte: startDate, $lte: currentDate },
                },
            },
            {
                $lookup: {
                    from: "Products",
                    localField: "orderProducts.productId",
                    foreignField: "_id",
                    as: "orderProducts.productDetails",
                },
            },
            {
                $addFields: {
                    "orderProducts.productDetails": {
                        $arrayElemAt: ["$orderProducts.productDetails", 0],
                    },
                },
            },
            {
                $sort: { purchaseDate: -1 },
            },
        ]);

        const totalRevenue = orders.reduce((acc, order) => {
            const orderProductsArray = Array.isArray(order.orderProducts) ? order.orderProducts : [order.orderProducts];
            return acc + orderProductsArray.reduce((acc, product) => {
                return acc + (product.status === 'delivered' ? product.totalPrice : 0);
            }, 0);
        }, 0);

        const totalDeliveredProductsCount = orders.reduce((acc, order) => {
            const orderProductsArray = Array.isArray(order.orderProducts) ? order.orderProducts : [order.orderProducts];
            return acc + orderProductsArray.reduce((acc, product) => {
                return acc + (product.status === 'delivered' ? 1 : 0);
            }, 0);
        }, 0);


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.addRow(['Order ID', 'Billing Name', 'Date', 'Total', 'Payment Method']);

        orders.forEach(order => {
            worksheet.addRow([
                order._id,
                order.deliveryDetails.fullname,
                order.orders,
             
            ]);
        });

        worksheet.addRow(['', '', '', 'Total Products:', totalDeliveredProductsCount]);
        worksheet.addRow(['', '', '', 'Total Revenue:', totalRevenue]);

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        res.send(buffer);

    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}





module.exports = {
    adminLoginPage,
    adminVerify,
    loadDashboard,
    usermanagementload,
    userBlocked,
    logout,
    loadcategory,
    loadAddCategory,
    addCategory,
    loadeditCategory,
    blockCategory,
    updateCategory,
    deleteCategory,
    salesReport,
    pdfDownload,
    excelDownload
}