const User = require("../models/userModel");
const Cart = require("../models/cartModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findById(req.session.user_id);
      if (userData.is_blocked) {
        res.redirect("/login");
      } else {
        // Retrieve the user's cart
        const cart = await Cart.findOne({ userId: req.session.user_id });

        // Set cartCount in locals
        res.locals.cartCount = cart ? cart.product.length : 0;

        next();
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const cart = await Cart.findOne({ userId: req.session.user_id });

      res.locals.cartCount = cart ? cart.product.length : 0;

      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout
};
