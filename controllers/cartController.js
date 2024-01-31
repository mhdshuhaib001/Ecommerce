const Cart = require("../models/cartModel");
const Products = require("../models/productsModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");

//-------------Cart-------------------
const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userId: userId }).populate("product.productId");

    if (cartData && cartData.product.length > 0) {
      const product = cartData.product;
      let total = 0;
      for (let i = 0; i < product.length; i++) {
        total += product[i].totalPrice;
      }
      const subTotal = total;
      const cart = await Cart.findOne({ userId: req.session.user_id })
      let cartCount = 0;
      if (cart) { cartCount = cart.product.length }

      res.render("cart", {
        user: userId,
        userId,
        cart: cartData,
        products: product,
        total: total,
        subTotal,
        cartCount
      });
    } else {
      res.render("cart", { userId });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;
    const userData = await User.findOne({ _id: userId });
    const productData = await Products.findById({ _id: productId });
    const productQuantity = productData.quantity;
    const count = req.body.count ? parseInt(req.body.count) : 1;
    const totalPrice = productData.price * count;
    const products = {
      productId: productId,
      productPrice: productData.price,
      productName: productData.name,
      totalPrice: totalPrice,
      count: count,
      image: productData.images.image1
    };
    const existCartData = await Cart.findOne({ userId: userId });

    if (!existCartData) {
      const newCartData = await Cart.create({
        userId: userId,
        userName: userData.name,
        product: [products]
      });
      return res.json({ success: true, newProduct: true });
    }
    const existProductIndex = existCartData.product.findIndex((p) => p.productId == productId);
    if (existProductIndex !== -1) {
      existCartData.product[existProductIndex].count += count;
      await existCartData.save();
      return res.json({ success: true, newProduct: false });
    } else {
      existCartData.product.push(products);
      await existCartData.save();
      return res.json({ success: true, newProduct: true });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//------------- Remove Cart ----------------//
const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.product;
    const cartData = await Cart.findOne({ userId: userId });
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
      if (updateQuantity <= 1 || Math.abs(count) > updateQuantity) {
        res.json({ success: false, message: "Minimum quantity reached!" });
        return;
      }
    }

    const cartdata = await Cart.updateOne(
      { userId: userData, "product.productId": proId },
      { $inc: { "product.$.count": count } }
    );

    const updatedCartData = await Cart.findOne({ userId: userData });
    const updatedProduct = updatedCartData.product.find(
      (product) => product.productId == proId
    );
    const updatedQuantity = updatedProduct.count;

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
    const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0;
    if (cart) { cartCount = cart.product.length }
    const products = cartData.product;
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
          cartCount
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
