const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Products = require("../models/productsModel")
const User = require('../models/userModel');


// Cart
// const loadCart = async (req, res) => {
//     try {

//         const userId = req.session.user_id;
//         console.log(userId,'cheking1');
        
//         const cartData = await Cart.findOne({ userId: userId }).populate("products.productId");
//         console.log(cartData);
       

//         res.render("cart", {
//             userId,
//             cartData
//        })
//     } catch (error) {
//         console.log(error.message);
//     }
// };
// Cart
// const loadCart = async (req, res) => {
//     try {
//         const userId = req.session.user_id;
//         console.log(userId, 'cheking1');

//         // Correct the populate path to "products.productId"
//         const cartData = await Cart.findOne({ userId: userId }).populate("products.productId");
//         console.log(cartData);

//         res.render("cart", {
//             userId,
//             cartData
//         });
//     } catch (error) {
//         console.error(error.message);
//         // Handle the error appropriately, e.g., send an error response or render an error page.
//         res.status(500).send("Internal Server Error");
//     }
// };

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log(userId, 'checking1');

        // Correct the populate path to "products.productId"
        await Cart.findOne({ userId: userId }).populate("product.productId");
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





// const addToCart = async (req, res) => {
//     try {
//          console.log("checkk")
//         const userId = req.session.user_id;
//         const userData = await User.findOne({ _id: userId });

//         const productId = req.body.id;
//         const productData = await User.findOne({ _id: productId });
        
//         console.log(productData, "cheking ProductData");
//         const productName = productData.name
//         const category = productData.category
//         const productImage = productData.images.image1

//         const cartData = await Cart.findOneAndUpdate(
//             { userId: userId },
//             {
//                 $setOnInsert: {
//                     userId: userId,
//                     products: [],
//                 },
//             },
//             { upsert: true, new: true }
//         );

//         const updateProduct = cartData.products.find(
//             (product) => product.productId === productId
//         );

//         const price = productData.price;
//         const total = price;

//         if (updateProduct) {
//             await Cart.updateOne(
//                 { userId: userId, "products.productId": productId },
//                 {
//                     $inc: {
//                         "products.$.count": 1,
//                         "products.$.totalPrice": total,
//                     },
//                 }
//             );
//         } else {
//             cartData.products.push({
//                 productId: productId,
//                 // porductPrice : total,
//                 // totalPrice : total,
//                 image: productImage,
//                 productName: productName
//             });
//             await cartData.save();
//         }
//         res.json({ success: true });


//     } catch (error) {
//         console.log(error.message);

//     }
// }

// const addToCart = async (req, res) => {
//     try {
//         console.log("checkk");
//         const userId = req.session.user_id;
//         const userData = await User.findOne({ _id: userId });

//         const productId = req.body.id;
//         console.log(productId,"prpoductId checking");
//         const productData = await Products.findOne({ _id: productId }); // Corrected to use Products model

//         console.log(productData, "checking ProductData");

//         if (!productData) {
//             return res.status(404).json({ success: false, message: "Product not found." });
//         }

//         const productName = productData.name;
//         const category = productData.category;
//         const productImage = productData.images.image1;

//         const cartData = await Cart.findOneAndUpdate(
//             { userId: userId },
//             {
//                 $setOnInsert: {
//                     userId: userId,
//                     products: [],
//                 },
//             },
//             { upsert: true, new: true }
//         );

//         const updateProduct = cartData.products.find(
//             (product) => product.productId === productId
//         );

//         const price = productData.price;
//         const total = price;

//         if (updateProduct) {
//             await Cart.updateOne(
//                 { userId: userId, "products.productId": productId },
//                 {
//                     $inc: {
//                         "products.$.count": 1,
//                         "products.$.totalPrice": total,
//                     },
//                 }
//             );
//         } else {
//             cartData.products.push({
//                 productId: productId,
//                 productPrice: total,
//                 image: productImage,
//                 productName: productName,
//             });
//             await cartData.save();
//         }

//         res.json({ success: true });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, message: "Internal server error." });
//     }
// };

// const addToCart = async (req, res)=>{
//     try {
//         const userId = req.session.id;
//         console.log('userId cheking 123',userId)
//         const productId = req.body.productId;
//         console.log(productId);
//         const products = await Products.findById(productId);

//         if(products.quantity > 0) {
//             const cartProduct = await Cart.findOne({ user: userId, 'product.productId': productId });

//             if(cartProduct) {
//                 return res.status(200).json({ success: false, error: 'Product already in cart' });
//             }

//             const productData = {
//                 productId: productId,
//                 price: products.price,
//                 totalPrice: products.totalPrice
//             };

//             await Cart.findOneAndUpdate(
//                 {userId: userId},
//                 {
//                     $set: { user: userId },
//                     $push: { products: productData },
//                 },
//                 { upsert: true, new: true }
//             );
//             return res.status(200).json({ success: true, stock: true });
//         } else {
//             return res.status(200).json({ success: true, stock: false });
//         }

//     } catch (error) {
//         return res.status(500).json({ error: 'Internal Server Error' });
        
//     }
// }

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log('userId checking 123', userId);
        const productId = req.body.productId;
        console.log(productId);

        const products = await Products.findById(productId);

        if (!products) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const cartProduct = await Cart.findOneAndUpdate(
            { userId: userId },
            {
                $addToSet: {
                    products: {
                        productId: productId,
                        price: products.price,
                        totalPrice: products.totalPrice
                    }
                }
            },
            { upsert: true, new: true }
        );

        if (cartProduct) {
            return res.status(200).json({ success: false, error: 'Product already in cart' });
        }

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
