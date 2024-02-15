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
    const productData = await Products.findById({ _id: productId }).populate("category");
    console.log(productData,'-------');
    const productQuantity = productData.quantity;
    const count = req.body.count ? parseInt(req.body.count) : 1;
    
    
    if (productQuantity <= 0) {
      return res.json({ success: false, newProduct: true, message: "Product is out of stock" });
    }

    const totalPrice = productData.price * count;

    const products = {
      productId: productId,
      productPrice: productData.price,
      productName: productData.name,
      totalPrice: totalPrice,
      category:productData.category.name,
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
      // Check if adding the count exceeds available quantity
      if (productQuantity < count + existCartData.product[existProductIndex].count) {
        return res.json({ success: false, newProduct: false, message: "Quantity limit reached!" });
      }

      existCartData.product[existProductIndex].count += count;
      await existCartData.save();
      return res.json({ success: true, newProduct: false });
    } else {
      // Check if adding the count exceeds available quantity
      if (productQuantity < count) {
        return res.json({ success: false, newProduct: true, message: "Quantity limit reached!" });
      }

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
      console.log(discountAmount,'total maount 2 ');

      const cartCount = cartData.product.length;
      let instock = true;
      for (const product of cartData.product) {
          if (product.productId.quantity < product.count) {
              instock = false;
              proName = product.productId.name;
              break;
          }
      }

      // calculatte the shipping amount 
      let shippingAmount = 0;
      if (cartTotal < 1300) {
          shippingAmount = 90;
      } else {
          shippingAmount = 0;
      }

      let totalamount = 0;

      if(couponDiscountAmount> 0){
        console.log('hallooooo');
        totalamount = cartTotal - couponDiscountAmount;
      }else {
        totalamount +=cartTotal;
      }
     console.log(totalamount,'totalamount');

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
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};


module.exports = {
  loadCart,
  addToCart,
  removeCartItem,
  quantityUpdate,
  loadCheckOut
};
