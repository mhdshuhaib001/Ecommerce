const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productsModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();




var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
});




const placeOrder = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const cartData = await Cart.findOne({ userId: user_id });
        const paymentMethod = req.body.formData.payment;
        const total = req.body.formData.total;
        const status = paymentMethod === 'COD' ? 'placed' : 'pending';
        const userData = await User.findById(user_id);
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
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const formattedTime = currentDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });

        const order = new Order({
            userId: user_id,
            deliveryDetails: address,
            orderProducts: productData,
            purchaseDate: formattedDate,
            purchaseTime: formattedTime,
            totalAmount: total,
            paymentMethod: paymentMethod,
            shippingMethod: cartData.shippingMethod,
            shippingAmount: cartData.shippingAmount
        });

        const orderData = await order.save();
        const orderId = orderData._id;

        if (orderData && status === 'placed') {
            for (let i = 0; i < cartData.product.length; i++) {
                let product = cartData.product[i].productId;
                let count = cartData.product[i].count;
                await Product.updateOne(
                    { _id: product },
                    { $inc: { quantity: -count } }
                );
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
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Error creating online payment order' });
                    return;
                }

                // Update the order status to 'placed'
                await Order.findByIdAndUpdate(
                    { _id: orderId },
                    { $set: { status: 'placed' } }
                );

                res.json({ razorpay: true, order });
            });
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
            await Order.findByIdAndUpdate(
                { _id: paymentData.order.receipt },
                { $set: { status: 'placed', paymentId: paymentData.payment.razorpay_payment_id } }
            );
            // Delete the cart data
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
        const deliveryDetails = order.deliveryDetails;

        if (orderData) {
            res.render("orderDetails", {
                orderData,
                userId,
                address: deliveryDetails,
            });
        } else {
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
        const updateResult = await Order.updateOne(
            { _id: orderId, 'orderProducts._id': productId },
            { $set: { 'orderProducts.$.status': 'Cancelled' } }
        );

        if (updateResult) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Order cancellation failed.' });
        }
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: 'An error occurred while cancelling the order.' });
    }
};



const returnRequest = async (req, res) => {
    try {

console.log(req.body,'req.body');
        const orderId = req.body.orderId;
        const productId = req.body.productId;

        const orderData = await Order.findOne({
            "_id": orderId,
            "orderProducts._id": productId
        });        console.log(orderData,'chekkkkkkkiiis');

        const updateReturn = await Order.updateOne(
            { _id: orderId, "orderProducts._id": productId },
            { $set: { "orderProducts.$.status": 'Returned' } }
        );

        console.log(updateReturn,'ivane kitti');

        if (updateReturn.nModified === 1) {
            res.status(200).json({ success: true, message: 'Return request processed successfully' });
        } else {
            // Handle the case where the document was not modified
            res.status(404).json({ success: false, message: 'Order or product not found' });
        }
    } catch (error) {
        console.error('Error in returnRequest controller:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}



const invoice = async (req, res) => {
    try {

        const orderId = req.query._id;
        const orderData = await Order.findOne({ _id: orderId }).populate('orderProducts.procutId');
        
        console.log(orderData, 'chekking the data ');
        res.render("invoice");
    } catch (error) {
        console.log(error.message);
    }
}






const loadOrderManagement = async (req, res) => {
    try {

        console.log(req.body,' in ordermanagement ');

        const itemPage = 5
        const page = +req.query.page || 1;
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / itemPage);
        const orderData = await Order.find()
            .sort({ purchaseDate: -1 })
            .skip((page - 1) * itemPage)
            .limit(itemPage);
        console.log(orderData,'this alpoha 101');
        res.render("orderManagement", { orderData, totalPages, currentPage: page });
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};



const updateOrder = async (req, res) => {
    try {

        console.log(req.body, 'chekkkkkkkkkkkkkkkkkkkkkkkkkk');
        const orderId = req.body.orderId;
        const orderStatus = req.body.status;
    

        const orderData = await Order.findOne({ _id: orderId });
        console.log(orderData, 'chek order data ');
        console.log(orderId, 'chekkk');
        console.log(orderStatus, 'chekk thissss ');
        const changeStatus = await Order.updateOne(
            { 'orderProducts._id': orderId },
            { $set: { 'orderProducts.$.status': orderStatus } }
        );
        console.log(changeStatus, 'cheange srtatus');

        res.json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};






const orderDetails = async (req, res) => {
    try {
        const orderId = req.query._id;
        console.log(orderId, 'cheking order id ');
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
    returnRequest
};
