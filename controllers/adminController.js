const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const Category = require("../models/categoryModel");
const categoryModel = require("../models/categoryModel");
const Order = require("../models/orderModel");




const adminLoginPage = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message)
    }
}

//-------------------------Log out---------------------

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect("/admin")
    } catch (error) {
        console.log(error.message);
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

    }
}

//---------------------load Dashboard----------------

const loadDashboard = async (req, res) => {
    try {
        const currentDate = new Date();
        const startDate = new Date(currentDate - 30 * 24 * 60 * 60 * 1000);

        const userData = await User.find();
        const userCount = userData.length;

        const orderData = await Order.find({ purchaseDate: { $gte: startDate, $lt: currentDate } });

        const totalOrders = orderData ? orderData.length : 0;
        let deliveredOrders = 0;
        let totalRevenue = 0;

        orderData.forEach((order) => {
            deliveredOrders += order.orderProducts.reduce((acc, delivered) => (delivered.status === 'delivered' ? acc + 1 : acc), 0);
            totalRevenue += order.orderProducts.reduce((acc, product) => (product.status === 'delivered' ? acc + product.totalPrice : acc), 0);});

        console.log(deliveredOrders, 'Delivered Orders');
        console.log(totalRevenue, 'Total Revenue');

        const monthlyProductSales = await Order.aggregate([
            { $match: { 'orderProducts.status': 'delivered' } },
            { $unwind: '$orderProducts' },
            { $addFields: { formattedDate: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate',},},},},
            { $group: { _id: { date: '$formattedDate' },revenue: { $sum: '$orderProducts.totalPrice' }, },},
        ]);

        const salesDataMonthly = Array.from({ length: 12 }, () => 0);
        const salesDataYearly = Array.from({ length: 12 }, () => 0);
        const currentYear = currentDate.getFullYear();


        for (const entry of monthlyProductSales) {
            const entryYear = new Date(entry._id.date).getFullYear();
            const monthIndex = new Date(entry._id.date).getMonth();
            if (entryYear === currentYear) {
                salesDataYearly[monthIndex] = entry.revenue;
            }
            salesDataMonthly[monthIndex] += entry.revenue;
        }

        const paymentMethodDatas = await Order.aggregate([{  $match: { 'orderProducts.status': 'delivered' }},{$group: { _id: '$paymentMethod', count: { $sum: 1 } }}]);

        const bestSellingProducts = await Order.aggregate([
            { $match: { 'orderProducts.status': 'delivered' } },
            { $unwind: '$orderProducts' },
            {
                $group: {
                    _id: '$orderProducts.productId',
                    productName: { $first: '$orderProducts.productName' },
                    totalSold: { $sum: '$orderProducts.count' },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
        ]);

        const bestSellingCategories = await Order.aggregate([
            { $match: { 'orderProducts.status': 'delivered' } },
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
        
        console.log(bestSellingCategories);
        

        console.log(paymentMethodDatas, 'payment method data');

        res.render('dashboard', { salesDataMonthly, salesDataYearly, deliveredOrders, totalRevenue, paymentMethodDatas });
    } catch (error) {
        console.log(error.message);
    }
};




//-----------------------User Management--------------------

const usermanagementload = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: false });
        res.render("usermanagement", { users: userData });
    } catch (error) {
        console.log(error.message)
    }
}

//-------------------- Block Or Unblock User -------------

const userBlocked = async (req, res) => {
    try {
        const userId = req.body.userId;
        const blockedUser = await User.findOne({ _id: userId });
        console.log(blockedUser)

        if (!blockedUser.is_blocked) {
            await User.updateOne({ _id: userId }, { $set: { is_blocked: true } });
            res.json({ remove: true })

        } else {
            await User.updateOne({ _id: userId }, { $set: { is_blocked: false } })
            res.json({ remove: true })
        }
    } catch (error) {
        console.log(error.message);
    }
}


//----------------LOAD CATEGORY MANAGEMENT-----------------

const loadcategory = async (req, res) => {
    try {

        const categoryData = await Category.find()
        res.render("categorymanagement", { categoryData: categoryData })


    } catch (error) {
        console.log(error.message);
    }
}

//----------------LOAD ADD CATEGORY-----------------

const loadAddCategory = async (req, res) => {

    try {
        res.render("addcategory")
    } catch (error) {
        console.log(error.message)
    }
}


const addCategory = async (req, res) => {
    try {


        const name = req.body.categoryname

        const data = new categoryModel({
            name: req.body.categoryname
        });
        console.log(data)

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

    }
}

//--------------------BLOCK AND UNBLOCK CATEGORY-----------

const blockCategory = async (req, res) => {
    try {

        const blockedcategory = await Category.findOne({ _id: req.body.catId })
        if (!blockedcategory.blocked) {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: true } })
            // res.redirect("/admin/categorymanagement")
            res.json({ success: true })
        } else {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: false } })
            // res.redirect("/admin/categorymanagement")
            res.json({ success: true })
        }

    } catch (error) {
        console.log(error.message)

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

    }
}


//----------------DELETE CATEGORY IN CATEGORY MANAGEMENT-----------------

const deleteCategory = async (req, res) => {
    try {

        await Category.deleteOne({ _id: req.query.id })
        res.redirect("/admin/categorymanagement")

    } catch (error) {
        console.log(error.message)
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
console.log(orders,'------------------');
        res.render('salesReport', { orders });
    } catch (error) {
        console.error(error.message);
        // res.render('500Error');
    }
};





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
    salesReport
}