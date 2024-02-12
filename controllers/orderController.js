const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productsModel");
const ReturnRequest = require("../models/returnRequestsModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require("dotenv");
dotenv.config();

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
});





//-----------orderPlaced-----------------

const placeOrder = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const cartData = await Cart.findOne({ userId: user_id });
        const paymentMethod = req.body.formData.payment;
        const total = req.body.formData.total;
        const shippingAmount = req.body.formData.shippingAmount; // Corrected this line
        const status = paymentMethod === 'COD' ? 'placed' : 'pending';
        const userData = await User.findById(user_id);
        const walletBalance = userData.wallet;
        const address = req.body.formData.address;

        const productData = cartData.product.map(product => ({
            productId: product.productId,
            count: product.count,
            productPrice: product.productPrice,
            image: product.image,
            totalPrice: product.totalPrice,
            status: status,
            productName: product.productName,
            category: product.category,
        }));

        // Format date and time
        const purchaseDate = new Date();

        let shipingTotalAmount = 1500;
        if (paymentMethod === 'COD' && total > shipingTotalAmount) {
            res.json({ maxAmount: true });
            return;
        }

        console.log(shippingAmount, 'shipping amount--------------------');
        const order = new Order({
            userId: user_id,
            deliveryDetails: address,
            orderProducts: productData,
            purchaseDate: purchaseDate,
            totalAmount: total,
            paymentMethod: paymentMethod,
            shippingMethod: cartData.shippingMethod,
            shippingAmount: shippingAmount,
        });

        const orderData = await order.save();
        const orderId = orderData._id;

        if (orderData.paymentMethod === 'COD') {
            for (let i = 0; i < cartData.product.length; i++) {
                let product = cartData.product[i].productId;
                let count = cartData.product[i].count;
                await Product.updateOne({ _id: product }, { $inc: { quantity: -count } });
            }

            await Cart.deleteOne({ userId: user_id });
            return res.json({ codsuccess: true, orderId });
        } else if (orderData.paymentMethod == "onlinePayment") {
            var options = {
                amount: orderData.totalAmount * 100,
                currency: "INR",
                receipt: "" + orderId,
            };
            instance.orders.create(options, async function (err, order) {
                // Update the order status to 'placed'
                await Order.findByIdAndUpdate(
                    { _id: orderId },
                    { $set: { status: 'placed' } }
                );
                return res.json({ razorpay: true, order });
            });
        } else if (orderData.paymentMethod === "wallet") {
            const totalAmount = orderData.totalAmount;
            console.log(totalAmount, 'totalAmount');

            const TransactuonDate = new Date();

            console.log(formattedDate, 'date', formattedTime, 'time');
            if (walletBalance >= totalAmount) {
                const wallet = await User.findOneAndUpdate(
                    { _id: user_id },
                    {
                        $inc: { wallet: -totalAmount },
                        $push: {
                            walletHistory: {
                                transactionDate: TransactuonDate,
                                amount: totalAmount,
                                direction: "Debited"
                            },
                        },
                    },
                    { new: true }
                );

                if (wallet) {
                    console.log("Amount debited from wallet");

                    for (let i = 0; i < cartData.product.length; i++) {
                        let product = cartData.product[i].productId;
                        await Order.updateOne(
                            { _id: orderId, "orderProducts.productId": product },
                            { $set: { "orderProducts.$.status": 'placed' } }
                        );
                    }

                    // Update the overall order status to 'placed'
                    const orderUpdate = await Order.findByIdAndUpdate(
                        { _id: orderId },
                        { $set: { status: 'placed' } }
                    );
                    await Cart.deleteOne({ userId: user_id });
                    console.log(orderUpdate, 'Order status updated to placed');
                    return res.json({ placed: true, orderId });
                } else {
                    console.log("Not debited from wallet");
                    return res.json({ walletFailed: true });
                }
            } else {
                return res.json({ walletFailed: true });
            }
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// onnlince payment 
const verifyPayment = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const paymentData = req.body;
        const cartData = await Cart.findOne({ userId: user_id });

        const hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
        hmac.update(paymentData.payment.razorpay_order_id + '|' + paymentData.payment.razorpay_payment_id);
        const hmacValue = hmac.digest('hex');

        if (hmacValue === paymentData.payment.razorpay_signature) {
            // Update the product quantities
            for (const productData of cartData.product) {
                const { productId, count } = productData;
                await Product.updateOne({ _id: productId }, { $inc: { quantity: -count } });
            }
            // Update the order status to 'placed'
            const orderData = await Order.findByIdAndUpdate(
                { _id: paymentData.order.receipt },
                { $set: { status: 'placed', paymentId: paymentData.payment.razorpay_payment_id } }
            );
            // Delete the cart data

            const productData = cartData.product.map(product => ({
                productId: product.productId,
                count: product.count,
                productPrice: product.productPrice,
                image: product.image,
                totalPrice: product.totalPrice,
                status: 'placed',
                productName: product.productName,
                category: product.category,
            }));

            console.log(productData, 'orderData');
            const razoOrder = await Order.findOneAndUpdate({ _id: orderData._id }, { $set: { orderProducts: productData } }, { new: true })
            console.log(razoOrder, 'jjj');
            await Cart.deleteOne({ userId: user_id });


            return res.json({ placed: true });
        }

        res.status(400).json({ error: 'Invalid payment verification' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const success = async (req, res) => {
    try {
        console.log(req.params);
        const userId = req.session.user_id;

        const orderData = await Order.find({ _id: userId });
        console.log(orderData, 'ordderData');
        res.render("orderSuccess", { orderData });
    } catch (error) {
        console.log(error.message);
    }
};


const OrderDetailsLoad = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderId = req.query._id;
        const orderData = await Order.findOne({ _id: orderId }).populate("orderProducts.productId").exec();

        const order = await Order.findOne({ _id: orderId })
        const deliveryDetails = order && order.deliveryDetails ? order.deliveryDetails : null;

        if (orderData) {
            res.render("orderDetails", {
                orderData,
                userId,
                address: deliveryDetails,
            });
        } else {
            console.log('chekkiung the sdata ');
            res.render("orderDetails", { userId });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const orderCancel = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.productId;
        const orderId = req.body.orderId;

        const orderData = await Order.findOne({ _id: orderId });

        const orderProduct = orderData.orderProducts.find((val) => {
            return val._id.toString() === productId
        });

        const prodcutTotalPrice = orderProduct.totalPrice;


        if (orderData.paymentMethod !== "COD") {

            const walletUpdate = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $inc: { wallet: prodcutTotalPrice },
                    $push: {
                        walletHistory: {
                            date: new Date(),
                            amount: prodcutTotalPrice,
                            direction: "Credited"
                        },

                    },
                },
                { new: true }
            );

            if (walletUpdate) {
                console.log(`Added ${prodcutTotalPrice} to the wallet.`);
            } else {
                console.log("User not found.");
            }
        } else if (orderData.paymentMethod === "COD") {

            const updateResult = await Order.findOneAndUpdate(
                { _id: orderId, 'orderProducts._id': productId },
                { $set: { 'orderProducts.$.status': 'Cancelled' } }
            );

            if (updateResult) {
                return res.json({ success: true });
            } else {
                return res.json({ success: false, message: 'Order cancellation failed.' });
            }
        }

    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: 'error occurred while cancelling the order.' });
    }
};



const returnRequest = async (req, res) => {
    try {

        const orderId = req.body.order;
        const productId = req.body.id;
        const returnReason = req.body.returnReason;
        const updateReturn = await Order.updateOne(
            { _id: orderId, "orderProducts._id": productId },
            { $set: { "orderProducts.$.status": 'request', "orderProducts.$.returnReason": returnReason } }
        );
        if (updateReturn) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error in returnRequest controller:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}


const returnOrder = async (req, res) => {
    try {
        const productId = req.body.productId;
        const count = req.body.count;
        const orderId = req.body.orderId;

        const order = await Order.findById(orderId);
        const returnedProduct = order.orderProducts.find((val) => val._id.toString() === productId);
        const productTotalPrice = returnedProduct.totalPrice;

        const totalRefundedAmount = productTotalPrice;

        const updatedOrder = await Order.updateOne(
            { _id: orderId, "orderProducts._id": productId },
            {
                $set: { "orderProducts.$.status": "Accepted" },
            }
        );

        const updatedProduct = await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { quantity: count } }
        );

        const userId = order.userId;

        const user = await User.findById(userId);

        const transactionDate = new Date();

        const newTotalAmount = order.totalAmount - totalRefundedAmount;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { wallet: totalRefundedAmount },
                $push: {
                    walletHistory: {
                        transactionDate: transactionDate,
                        amount: totalRefundedAmount,
                        direction: "Credited",
                    },
                },
            },
            { new: true }
        );

        console.log(updatedUser, 'hey the data inserted');

        const updatedOrderTotal = await Order.findByIdAndUpdate(
            orderId,
            { $set: { totalAmount: newTotalAmount } },
            { new: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const invoice = async (req, res) => {
    try {
        const orderId = req.query._id;

        const orderData = await Order.findById({ _id: orderId }).populate('orderProducts._id');

        const deliveredOrder = orderData.orderProducts.filter((product) => product.status === "delivered");
        console.log(deliveredOrder, 'checking this ');

        if (deliveredOrder.length === 0) {
            return res.status(404).send('No delivered products found for the specified order.');
        }

        // Rendering the invoice template with deliveredOrder
        const templatePath = path.join(__dirname, '../views/users/invoice.ejs');
        const templateContent = await ejs.renderFile(templatePath, { order: orderData, orderProducts: deliveredOrder });

        // Generate PDF using puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(templateContent);
        const pdfBuffer = await page.pdf();
        await browser.close();

        // Sending the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500)
    }
};







const loadOrderManagement = async (req, res) => {
    try {

        const itemPage = 10
        const page = +req.query.page || 1;
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / itemPage);
        const orderData = await Order.find({
            "orderProducts.status": { $nin: ["pending"] }
        }).sort({ purchaseTime: 1 })
            .skip((page - 1) * itemPage)
            .limit(itemPage);

        res.render("orderManagement", { orderData, totalPages, currentPage: page });
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};



const updateOrder = async (req, res) => {
    try {

        const orderId = req.body.orderId;
        const orderStatus = req.body.status;


        const orderData = await Order.findOne({ _id: orderId });
        const changeStatus = await Order.updateOne(
            { 'orderProducts._id': orderId },
            { $set: { 'orderProducts.$.status': orderStatus } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};






const orderDetails = async (req, res) => {
    try {
        const orderId = req.query._id;
        const orderData = await Order.findOne({ _id: orderId }).populate("orderProducts.productId");
        if (orderData) {
            res.render('orderDetails', { orderData });
        } else {
            res.render('orderDetails', { userId: req.session.user_id });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};





module.exports = {
    placeOrder,
    success,
    OrderDetailsLoad,
    loadOrderManagement,
    orderDetails,
    updateOrder,
    orderCancel,
    verifyPayment,
    invoice,
    returnRequest,
    returnOrder
};
