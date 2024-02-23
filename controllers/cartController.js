const Cart = require("../models/cartModel");
const Products = require("../models/productsModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Coupon = require("../models/couponModel");




//-------------Cart-------------------
const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cartData = await Cart.findOne({ userId: userId }).populate("product.productId");

    if (cartData && cartData.product.length > 0) {
      const products = cartData.product;
      let total = 0;

      for (let i = 0; i < products.length; i++) {
        const productId = products[i].productId;
        const product = await Products.findById(productId).select("price");

        const count = products[i].count;
        const productPrice = product.price;
        const totalPrice = productPrice * count;

        total += totalPrice;
        cartData.product[i].totalPrice = totalPrice;
      }

      const subTotal = total;

      const shippingCharge = total < 1300 ? 90 : 0;
      const grandTotal = total + shippingCharge;

      const cart = await Cart.findOne({ userId: req.session.user_id });
      let cartCount = 0;

      if (cart) {
        cartCount = cart.product.length;
      }

      console.log(subTotal, 'subTotal');
      console.log(grandTotal, 'grandTotal');

      res.render("cart", {
        user: userId,
        userId,
        cart: cartData,
        products: cartData.product,
        total: total,
        subTotal,
        shippingCharge,
        grandTotal,
        cartCount
      });
    } else {
      res.render("cart", { user: userId, cartCount: 0 });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("500").send("Internal Server Error cart");
  }
};


const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.body.id;
    const userData = await User.findOne({ _id: userId });
    const productData = await Products.findById({ _id: productId }).populate("category");
    const productQuantity = productData.quantity;
    const count = req.body.count ? parseInt(req.body.count) : 1;

    if (!userId) {
      return res.json({ login: false, message: "Please log in to add products to your cart." });
    }

    if (productQuantity <= 0) {
      return res.json({ stock: true, message: "Product is out of stock." });
      console.log('haeloooooooooooooooo');
    }

    const totalPrice = productData.price * count;

    const products = {
      productId: productId,
      productName: productData.name,
      totalPrice: totalPrice,
      count: count,
      image: productData.images.image1
    };

    const existCartData = await Cart.findOne({ userId: userId });

    if (!existCartData) {
      // If cart doesn't exist for the user, create a new one
      const newCartData = await Cart.create({
        userId: userId,
        userName: userData.name,
        product: [products]
      });
      return res.json({ success: true, newProduct: true });
    }

    const existProductIndex = existCartData.product.findIndex((p) => p.productId == productId);

    if (existProductIndex !== -1) {
      // If the same product is already in the cart, redirect to the cart page
      return res.json({ exist: true, newProduct: false, message: "Product is already in your cart." });
    }

    if (productQuantity < count) {
      // If quantity exceeds the available stock, show a message
      return res.json({ success: false, limit: true, message: "Quantity limit reached!" });
    }

    // Add the product to the existing cart
    existCartData.product.push(products);
    await existCartData.save();
    return res.json({ success: true, newProduct: true });

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
      const userData = await User.findOne({ _id: user_id });
      const cartData = await Cart.findOne({ userId: user_id }).populate("product.productId");
      const cartTotal = cartData.product.reduce((acc, val) => acc + val.totalPrice, 0);
      const addressData = await Address.findOne({ user: user_id });
      const couponData = await Coupon.find({ usedUser: { $nin: [user_id] }});

      let couponDiscountAmount = 0;
      if (cartData.couponDiscount) {
          const coupon = await Coupon.findOne({ _id: cartData.couponDiscount });
          if (coupon) {
            couponDiscountAmount = Math.round((coupon.discountAmount / 100) * cartTotal);
          }
      }

      const discountAmount = cartTotal - couponDiscountAmount;

      const cartCount = cartData.product.length;
      let instock = true;
      for (const product of cartData.product) {
          if (product.productId.quantity < product.count) {
              instock = false;
              proName = product.productId.name;
              break;
          }
      }

      let shippingAmount = 0;
      if (cartTotal < 1300) {
          shippingAmount = 90;
      } else {
          shippingAmount = 0;
      }

      let totalamount = 0;

      if(couponDiscountAmount> 0){
        totalamount = cartTotal - couponDiscountAmount;
      }else {
        totalamount +=cartTotal;
      }

      if(cartData){
      res.render("checkout", {
          user: userData,
          addressData,
          userId:user_id,
          cartData,
          products: cartData.product,
          totalamount,
          cartCount,
          couponData,
          cartTotal,
          couponDiscountAmount,
          discountAmount,
          shippingAmount
      });
    } else {
      res.render("shop")
    }
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error ');
  }
};


module.exports = {
  loadCart,
  addToCart,
  removeCartItem,
  quantityUpdate,
  loadCheckOut
};
