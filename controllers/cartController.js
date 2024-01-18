const Cart = require("../models/cartModel");
const Products = require("../models/productsModel");
const User = require("../models/userModel");



//-------------Cart-------------------
const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const cartData = await Cart.findOne({ userId: userId }).populate("product.productId");
    res.render("cart", {
      cart: cartData,
      userId
    });
  } catch (error) {
    console.error(error.message); F
    res.status(500).send("Internal Server Error");
  }
};


//-------- Add To Cart -------//
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    // console.log(userId, " user Id");
    const productId = req.body.id;
    // console.log(productId, "proid ")
    const userData = await User.findOne({ _id: userId })
    const productData = await Products.findById({ _id: productId });
    const cartData = await Cart.findOne({ userId: userId });

    // console.log(userData);
    // console.log(productData, 'checking product data')
    // const productQuantity = productData.quantity;



    const products = {
      productId: productId,
      price: productData.price,
      totalPrice: productData.totalPrice,
      count: productData.count,
      image: productData.images.image1
    };

    const addCart = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          userId: userId,
          userName: userData.name,
        },
        $push: {
          product: products
        },
      },
      { upsert: true, new: true }
    );
    console.log("Server received request:", req.body);

    // console.log(cartData, 'data entered or note')
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



//------------- Remove Cart ----------------//
const removeCartItem = async (req, res) => {
  try {

    console.log("remove cart")
    const userId = req.session.user_id;
    const productId = req.body.product;
    console.log("check product idd", productId);
    const cartData = await Cart.findOne({ userId: userId });

    // console.log(userId, 'check')
    console.log(cartData, 'cartData');
    if (cartData) {
      await Cart.findOneAndUpdate(
        { userId: userId },
        {
          $pull: { product: { productId: productId } },
        }
      );
      res.json({ success: true });
    }

  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


//----------- QuantityUpdate --------//
const quantityUpdate = async (req, res) => {
  try {
    console.log("check------------------")
    const proId = req.body.product;
    const userData = req.session.user_id;
    let count = parseInt(req.body.count);

    console.log(proId, typeof (proId), 'product id checking')
    // console.log(userData, 'userId checking');
    // console.log(count, 'count checcking')

    const cartData = await Cart.findOne({ userId: userData });

    console.log(cartData, 'check data1 1')
    const product = cartData.product.find(pro => pro.productId == proId);
    console.log(product, 'product cheking');


    const productData = await Products.findOne({ _id: proId });
    const productQuantity = productData.quantity;
    const updateCartData = await Cart.findOne({ userId: userData });
    const updateProduct = updateCartData.product.find((pro) => pro.productId == proId);
    console.log(updateProduct, 'updateProduct');
    // console.log(updateCartData, 'updateCartData');
    // console.log(productData,'update productData');
    // console.log( updateCartData,'update  updateCartData');
    const updateQuantity = updateProduct.count;

    console.log("check updateQuantity-----------------", updateQuantity)
    if (count > 0) {
      if (updateQuantity + count > productQuantity) {
        res.json({ success: false, message: "Quantity limit reached!" });
        return;
      }
    } else if (count < 0) {
      // Quantity is being decreased
      if (updateQuantity <= 1 || Math.abs(count) > updateQuantity) {

        await Cart.updateOne(
          { userId: userData },
          { $pull: { product: { productId: proId } } }
        );
        res.json({ success: true });
        return
      }
    }

    const cartdata = await Cart.updateOne(
      { userId: userData, "product.productId": proId },
      { $inc: { "product.$.count": count } }
    );

    console.log(cartdata, 'chek cd----------------------')
    const updatedCartData = await Cart.findOne({ userId: userData });
    const updatedProduct = updatedCartData.product.find((product) => product.productId == proId);
    const updatedQuantity = updatedProduct.count;
    const productPrice = productData.price;

    const productTotal = productPrice * updatedQuantity;
    
    console.log("check totoal", productPrice)

    await Cart.updateOne(
      { userId: userData, "product.productId": proId },
      { $set: { "product.$.totalPrice": productTotal } }
    );
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};





module.exports = {
  loadCart,
  addToCart,
  removeCartItem,
  quantityUpdate,
};
