const Cart = require("../models/cartModel");
const Products = require("../models/productsModel");
const User = require("../models/userModel");


//-------------Cart-------------------
const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    // console.log(userId, "checking1");
    const cartData = await Cart.findOne({ userId: userId }).populate(
      "product.productId"
    );
    const subtotal = cartData.product.reduce(
      (acc, val) => acc + val.totalPrice,
      0
    );
    console.log(cartData);
    res.render("cart", {
      cart: cartData,
      subtotal,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


//-------- Add To Cart -------//
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log("userId checking 123", userId);
    const productId = req.body.productId;
    console.log(productId);

    const productData = await Products.findById(productId);

    if (productData.quantity > 0) {
      const cartProduct = await Cart.findOne({ user: userId, 'product.productId': productId })

      if (cartProduct) {
        return res.status(200).json({ success: false, error: 'Product alredy in cart' })
      }
    }

    const products = {
      productId: productId,
      price: productData.price,
      totalPrice: productData.totalPrice
    };
    console.log(products, 'cjdcnjskd')

    console.log("checking Product or note", products);

    await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $addToSet: {
          product: products,
        },
      },
      { upsert: true, new: true }
    );

    return res
      .status(200)
      .json({ success: true, stock: products.quantity > 0 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



//------------- Remove Cart ----------------//
const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.productId;
    console.log("check product idd", productId);
    const cartData = await Cart.findOne({ userId: userId });

    console.log(userId, 'check')
    console.log(cartData,'cartData');
   
    await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $pull: { product: { productId: productId } },
      },
     
    );

    res.json({ success: true });
    
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


//----------- QuantityUpdate --------//
// const quantityUpdate = async (req, res) => {
//   try {
//     const productId = req.body.productId;
//     const userId = req.session.userId;
//     const count = req.body.count;
//     console.log(count,"count")

//     const cartData = await Cart.findOne({ user: userId });

//     console.log("quantityUpdate", cartData);

//     let currentQuantity = 1;

//     if (count === -1) {
//       currentQuantity = cartData.product.find(
//         product => product.productId == productId
//       ).quantity;
//       console.log(currentQuantity, "check current quantity");

//       if (currentQuantity <= 1) {
//         return res.json({
//           success: false,
//           message: "Quantity cannot be decreased",
//         });
//       }
//     }

//     if (count === 1) {
//       if (currentQuantity + count > 5) {
//         return res.json({
//           success: false,
//           message: "Cannot add more than 5 items",
//         });
//       }
//     }


//     const cartDatas = await Cart.findOneAndUpdate(
//       { user: userId, "product.productId": productId },
//       {
//         $inc: {
//           "product.$.quantity": count,
//           "product.$.totalPrice":
//             count *
//             cartData.product.find(product =>
//               product.productId.equals(productId)
//             ).price,
//         },
//       }
//     );
//     res.json({ success: true });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };





module.exports = {
  loadCart,
  addToCart,
  removeCartItem,
  // quantityUpdate,
};
