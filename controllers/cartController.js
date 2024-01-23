const Cart = require("../models/cartModel");
const Products = require("../models/productsModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");

//-------------Cart-------------------
const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userId: userId }).populate("product.productId");
    console.log(cartData, ' check the data');

    if (cartData && cartData.product.length > 0) {
      const product = cartData.product;
      console.log("check");
      let total = 0;
      for (let i = 0; i < product.length; i++) {
        total += product[i].totalPrice;
      }

      const subTotal = total;
      console.log(subTotal, "subtotal");
      const userData = await User.find();

      res.render("cart", {
        cart: cartData,
        userId,
        products: product,
        total: total,
        subTotal
      });
    } else {
      res.render("cart", { userId });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


//-------- Add To Cart -------//
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;
    const userData = await User.findOne({ _id: userId });
    const productData = await Products.findById({ _id: productId });
    const productQuantity = productData.quantity;

    const products = {
      productId: productId,
      productPrice: productData.price,
      totalPrice: productData.totalPrice,
      count: productData.count,
      image: productData.images.image1
    };

    const addCartData = await Cart.findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          userId: userId,
          userName: userData.name
        },
        $push: {
          product: products
        }
      },
      { upsert: true, new: true }
    );

    const updatedProduct = addCartData.product.find((p) => p.productId == productId);
    const updatedQuantity = updatedProduct ? updatedProduct.count : 0;

    if (updatedQuantity + 1 > productQuantity) {
      return res.json({ success: false, message: " Quantity limit reached" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------- Remove Cart ----------------//
const removeCartItem = async (req, res) => {
  try {
    console.log("remove cart");
    const userId = req.session.user_id;
    const productId = req.body.product;
    console.log("check product idd", productId);
    const cartData = await Cart.findOne({ userId: userId });

    // console.log(userId, 'check')
    console.log(cartData, "cartData");
    if (cartData) {
      await Cart.findOneAndUpdate(
        { userId: userId },
        {
          $pull: { product: { productId: productId } }
        }
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error removing cart item:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const quantityUpdate = async (req, res) => {
  try {
    console.log("check------------------");
    const proId = req.body.product;
    const userData = req.session.user_id;
    let count = parseInt(req.body.count);

    const cartData = await Cart.findOne({ userId: userData });
    const product = cartData.product.find((pro) => pro.productId == proId);

    const productData = await Products.findOne({ _id: proId });
    const productQuantity = productData.quantity;
    const updateCartData = await Cart.findOne({ userId: userData });
    const updateProduct = updateCartData.product.find((pro) => pro.productId == proId);
    const updateQuantity = updateProduct.count;

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
        return;
      }
    }

    const cartdata = await Cart.updateOne(
      { userId: userData, "product.productId": proId },
      { $inc: { "product.$.count": count } }
    );

    console.log(cartdata, "chek cd----------------------");
    const updatedCartData = await Cart.findOne({ userId: userData });
    const updatedProduct = updatedCartData.product.find(
      (product) => product.productId == proId
    );
    const updatedQuantity = updatedProduct.count;

    // Calculate the correct total price
    const productTotal = productData.price * updatedQuantity;

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


const loadCheckOut = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const userData = await User.findOne({ _id: req.session.user_id });
    const cartData = await Cart.findOne({ userId: user_id }).populate(
      "product.productId"
    );
    const addressId = req.session.id;
    const addressData = await Address.findOne({ user: user_id });

    const products = cartData.product;
    console.log(products, "check this ");
    console.log(userData, "check this ");
    console.log(addressId, "check thisaddressId ");

    let total = 0;
    for (let i = 0; i < products.length; i++) {
      total += products[i].totalPrice;
    }

    let stock = [];
    let countCart = [];

    for (let i = 0; i < stock.length; i++) {
      stock.push(cartData.product[i].productId.quantity);
      countCart.push(cartData.product[i].count);
    }

    let instock = true;
    let productIndex = 0;

    for (let i = 0; i < stock.length; i++) {
      if (stock[i] > countCart[i] || stock[i] == countCart[i]) {
        instock = true;
      } else {
        instock = false;
        productIndex = i;
        break;
      }
    }

    const proName = cartData.product[productIndex].productId.name;

    if (user_id) {
      if (instock === true) {
        const Total = total;
        const totalamount = total;
        const userId = userData._id;

        res.render("checkout", {
          user: userData,
          addressData,
          userId,
          cartData,
          products: products,
          Total,
          totalamount,
        });
      } else {
        res.render("cart", { message: proName, name: req.session.name });
      }
    } else {
      res.redirect("/loadLogin");
    }

  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadCart,
  addToCart,
  removeCartItem,
  quantityUpdate,
  loadCheckOut
};
