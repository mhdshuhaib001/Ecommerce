const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Products = require("../models/productsModel")
const User = require('../models/userModel');


const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log(userId, 'checking1');

        const cartData = await Cart.findOne({ userId: userId }).populate("product.productId");
        console.log(cartData);

        res.render("cart", {
            userId,
            cartData
        });
    } catch (error) {
        console.error(error.message);
        // Handle the error appropriately, e.g., send an error response or render an error page.
        res.status(500).send("Internal Server Error");
    }
};




const addToCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log('userId checking 123', userId);
        const productId = req.body.productId;
        console.log(productId);

        const productData = await Products.findById(productId);

        // if (!products) {
        //     return res.status(404).json({ success: false, message: "Product not found." });
        // }

        const products = {
            productId: productId,
            price: productData.price,
            // totalPrice: productData.totalPrice
        }

        console.log('checking Product or note',products)

        await Cart.findOneAndUpdate(
            { userId: userId },
            {
                $addToSet: {
                    product: products 
                    

                }
            },
            { upsert: true, new: true }
        );


        return res.status(200).json({ success: true, stock: products.quantity > 0 });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    loadCart,
    addToCart

}
