const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productsModel");


const placeOrder = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const cartData = await Cart.findOne({ userId: user_id });
        console.log(req.body);
        const paymentMethod = req.body.payment
        const total = req.body.total;
        const userData = await User.findOne({ _id: user_id });
        const status = paymentMethod == "COD" ? "placed" : 'pending'

        const addressData = await Address.findOne({ user: user_id });
        const address = addressData.address[0];
        console.log("************************** ", address)
        const productData = cartData.product;


        const data = new Order({
            userId: user_id,
            deleveryDetails: address,
            products: productData,
            date: new Date(),
            totalAmount: total,
            status: status,
            paymentMethod: paymentMethod,
            shippingMethod: cartData.shippingMethod,
            shippingAmount:  cartData.shippingAmount,
        });

        const orderData = await data.save();

        if (status === "placed") {
            for (let i = 0; i < cartData.product.length; i++) {
                let  product = cartData.product[i].productId;
                let count  = cartData.product[i].count
                await Product.updateOne({_id:product},{$inc:{quantity:-count}});
            }

            await Cart.deleteOne({userId:user_id});
            res.json({placed:true})
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const success = async (req, res) => {
    try {
       const userId = req.session.user_id
        res.render("orderSuccess",{userId});

    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    placeOrder,
    success
}