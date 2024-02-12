const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/productsModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Category = require('../models/categoryModel');
const Order = require("../models/orderModel");
const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const config = require("../config/config");
const dotenv = require("dotenv");
const session = require("express-session");
dotenv.config();

//----------- Bcrypt password ----------//

const securePassword = async password => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    // res.render("500Error");
  }
};

//-----------  LoadHome --------------//

const loadHome = async (req, res) => {
  try {

    const user_id = req.session.user_id;
    const cartData = await Cart.findOne({ user: user_id }).populate("product.productId");
    const userData = await User.findOne({ _id: user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0;
    if (cart) { cartCount = cart.product.length }

    res.render("home", { user: userData, cart: cartData, cartCount });
  } catch (error) {
    console.log(error.message);
  }
};



// Signup and Storing data to database
const insertUser = async (req, res) => {
  try {
    const { name = "", email = "", mobile = "", password = "", confirmPassword = "" } = req.body;
    if (name.trim() === "") {
      res.json({ name_require: true });
    } else {
      if (name.startsWith(" ") || name.includes(" ")) {
        res.json({ name_space: true });
      } else {
        if (name && name.length <= 2) {
          res.json({ name: true });
        } else {
          if (email.trim() === "") {
            res.json({ email_require: true });
          } else {
            if (email.startsWith(" ") || email.includes(" ")) {
              res.json({ email_space: true });
            } else {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
              if (!emailPattern.test(req.body.email)) {
                res.json({ emailPatt: true });
              } else {
                if (mobile.trim() === "") {
                  res.json({ mobile_require: true });
                } else {
                  if (mobile.startsWith(" ") || mobile.includes(" ")) {
                    res.json({ mobile_space: true });
                  } else {
                    let mobilePattern = /^\d{10}$/;
                    if (
                      !mobilePattern.test(mobile) ||
                      mobile === "0000000000"
                    ) {
                      res.json({ mobile: true });
                    } else {
                      if (password.trim() === "") {
                        res.json({ password_require: true });
                      } else {
                        if (
                          password.startsWith(" ") ||
                          password.includes(" ")
                        ) {
                          res.json({ password_space: true });
                        } else {
                          if (password.length < 4) {
                            res.json({ password: true });
                          } else {
                            const alphanumeric = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
                            if (!alphanumeric.test(password)) {
                              res.json({ alphanumeric: true });
                            } else {
                              if (confirmPassword.trim() === "") {
                                res.json({ confirm_require: true });
                              } else {
                                if (
                                  confirmPassword.startsWith(" ") ||
                                  confirmPassword.includes(" ")
                                ) {
                                  res.json({ confirm_space: true });
                                } else {
                                  const emailchek = await User.findOne({
                                    email: req.body.email,
                                  });
                                  if (emailchek) {
                                    res.json({ emailalready: true });
                                  } else {
                                    if (password == confirmPassword) {
                                      const spassword = await securePassword(
                                        req.body.password
                                      );
                                      const Data = new User({
                                        name: req.body.name,
                                        email: req.body.email,
                                        mobile: req.body.mobile,
                                        password: spassword,
                                        is_admin: 0,
                                      });

                                      const userData = await Data.save();

                                      console.log(userData);

                                      if (userData) {
                                        let randomNumber =
                                          Math.floor(Math.random() * 9000) +
                                          1000;
                                        otp = randomNumber;
                                        console.log(otp, "check otp");

                                        req.session.email = req.body.email;

                                        req.session.password = spassword;
                                        req.session.userName = req.body.name;
                                        req.session.mobile = req.body.mobile;

                                        sendVerifyMail({
                                          email: req.body.email,
                                          name: req.body.name,
                                          otp: randomNumber
                                        });
                                        setTimeout(() => {
                                          otp = Math.floor(Math.random() * 9000) + 1000;
                                        }, 60000);
                                        req.session.otpsent = true;
                                        res.json({ success: true });
                                      } else {
                                        res.json({ notsaved: true });
                                      }
                                    } else {
                                      res.json({ wrongpass: true });
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
  }
};


// userOtp
const loadUserOtp = async (req, res) => {
  try {
    let verifyErr = req.session.verifyErr;
    let otpsend = req.session.otpsend;

    res.render("userOtp", { verifyErr, otpsend });
  } catch (error) {
    console.log(error.message);
  }
};

//-------- OTP ----------
const verifyOTP = async (req, res) => {
  try {

    req.session.verifyErr = false;
    req.session.otpsent = false;

    const otpInput = req.body.otp;
    const email = req.session.email;
    console.log(email, 'veryfy');

    if (req.body.otp.trim() === "") {
      res.json({ fill: true });
    } else {
      if (otpInput == otp) {
        const verified = await User.findOneAndUpdate(
          { email: email },
          { $set: { is_verified: true } },
          { new: true }
        );
        if (verified) {
          req.session.reqSucces = true;
          res.json({ success: true });
        } else {
          req.json({ error: true });
        }
      } else {
        res.json({ wrong: true });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};






let otp;

// -------SEND-OTP-FOR-SIGNUP------
const sendVerifyMail = async ({ name, email, otp }) => {
  try {

    // Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS
      }
    });
    // Send the OTP to the user's email
    const mailOPtions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "OTP verification",
      html: "<h1> Hallo " + name + ", This is your Mail veryfication message <br> This is your OTP :" + otp + ""
    };

    transporter.sendMail(mailOPtions, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log("Email has been sent:-", info.response);
      }
    })
  } catch (error) {
    console.log(error.message);
  }
};


//----------To resend Otp-----------
const resendOtp = async (req, res) => {
  try {
    console.log("Resend OTP route hit");
    let otpsend = req.session.otpsend;
    let verifyErr = req.session.verifyErr;
    let email = req.session.email;
    let name = req.session.name || "User";
    let randomNumber = Math.floor(Math.random() * 9000) + 1000;


    console.log(email, '1');
    console.log(verifyErr, '2');
    console.log(name, '3');
    console.log(randomNumber, '3');
    setTimeout(() => {
      otp = Math.floor(Math.random() * 9000) + 1000;
    }, 60000);
    console.log(otp);

    sendVerifyMail({ name, email, randomNumber });
    res.render("userOtp", {
      verifyErr,
      otpsend,
      resend: "Resend the otp to your email address.",
    });
  } catch (error) {
    console.log(error.message);
  }
};


//======= Login =========
const loadLogin = async (req, res) => {
  try {
    const userId = req.session.user_id;
    res.render("login", { user: userId });
  } catch (error) {
    console.log(error.message);
  }
};


//--------Login-------------
const verifylogin = async (req, res) => {
  try {
    const email = req.body.email;
    const name = "User";
    const password = req.body.password;
    if (email.trim() == "") {
      res.json({ email_fillout: true });
    } else {
      if (email.includes(" ") || /\s/.test(email)) {
        res.json({ email_space: true });
      } else {
        let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

        if (!emailPattern.test(req.body.email)) {
          res.json({ logemailPatt: true });
        } else {
          if (password.trim() == "") {
            res.json({ password_fillout: true });
          } else {
            if (password.includes(" ") || /\s/.test(password)) {
              res.json({ password_space: true });
            }
            else {
              const userData = await User.findOne({ email: email });

              if (userData) {
                if (userData.is_verified == true) {
                  const passwordMatch = await bcrypt.compare(
                    password,
                    userData.password
                  );
                  if (passwordMatch) {
                    if (userData.is_blocked == false) {
                      req.session.user_id = userData._id;
                      req.session.name = userData.name;
                      req.session.regSuccess = false;
                      res.json({ success: true });
                    } else {
                      res.json({ blocked: true });
                    }
                  } else {
                    res.json({ wrong: true });
                  }
                } else {
                  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
                  otp = randomNumber;
                  req.session.email = req.body.email;
                  sendVerifyMail(name, email, randomNumber);
                  setTimeout(() => {
                    otp = Math.floor(Math.random() * 9000) + 1000;
                  }, 60000);
                  req.session.verifyErr = true;
                  res.json({ verify: true });
                }
              } else {
                res.json({ register: true });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
  }
};

//---------------FORGET PASSWORD-----------------------
const sendPassResetMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS
      }
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "For Reset Password",
      html:
        "<h2>Hello " +
        name +
        '. <br> This message for reset your password. <br> <strong>click here to <a href="http://localhost:8000/forget-password?token=' +
        token +
        '">Reset</strong ></a> your password.</h2>,'
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log("Email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};


//----------- forget passwoed load--------

const forgetLoad = async (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};



const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    console.log(email, 'Email check')

    if (email.trim() === "") {
      res.json({ email_require: true });
    } else {
      if (email.startsWith(" ") || email.includes(" ")) {
        res.json({ email_space: true });
      } else {
        let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
          res.json({ emailPatt: true });
        } else {
          const userData = await User.findOne({ email: email });
          console.log("check 1", userData)
          if (userData) {
            if (userData.is_verified == true) {
              const random_String = randomString.generate();

              await User.updateOne(
                { email: email },
                { $set: { token: random_String } }
              );

              const user = await User.findOne({ email: email });

              sendPassResetMail(user.name, user.email, random_String);

              res.json({ response: true });
            } else {
              res.json({ mailverify: true });
            }
          } else {
            res.json({ wrong: true });
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
  }
};

const loadForgetpage = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      req.session.email = tokenData.email;
      res.render("forget-password");
    } else {
      res
        .status(404)
        .render("404", { message: "Oop's.. Your token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};


//------------Reset Password------------
const resetPassword = async (req, res) => {
  try {
    const Password = req.body.password;
    const confirm = req.body.confirm;

    if (Password.trim() === "") {
      res.json({ required: true });
    } else {
      if (Password.startsWith(" ") || Password.includes(" ")) {
        res.json({ password_space: true });
      } else {
        if (Password.length < 4) {
          res.json({ paslength: true });
        } else {
          if (confirm.trim() === "") {
            res.json({ confirm_space: true });
          } else {
            if (Password !== confirm) {
              res.json({ wrong: true });
            } else {
              const email = req.session.email;
              console.log(email, 'emailcheck')
              const secure_password = await securePassword(Password);
              const updateData = await User.updateOne(
                { email: email },
                { $set: { password: secure_password, token: "" } }
              )
              if (updateData) {
                req.session.email = false;
                res.json({ response: true });
              } else {
                res.status(400)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
  }
};

//-------------Shop-------------------
const loadShop = async (req, res) => {
  try {
    const userData = req.session.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const totalProducts = await Product.countDocuments({});
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;
    const productData = await Product.find({})
      .skip(skip)
      .limit(limit);
    const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0;
    if (cart) { cartCount = cart.product.length }

    res.render("shop", {
      user: userData,
      products: productData,
      currentPage: page,
      totalPages,
      limit,
      totalProducts,
      cartCount
    });
  } catch (error) {
    console.log(error.message);
  }
};

const searchProducts = async (req , res)=>{
  try {

    console.log(req.query,'monte quarryy');
    const category = await Category.find({blocked:0 });
    const serchQuary = req.query.searchQuary;
    const searchRegex = new RegExp(`^${serchQuary}`, "i");
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const totalProducts = await Product.countDocuments({});
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;
    const productData = await Product.find({})
      .skip(skip)
      .limit(limit);


    const products = await Product.find({name:{$regex:searchRegex},blocked:0});

    console.log(searchRegex,'suiii');
    console.log(serchQuary);
    console.log('ividay okey ahne');
    res.render("shop",{
      products,
      currentPage:page,
      totalPages,
      limit,
      totalProducts
    })
  } catch (error) {
    console.log(error.message);
  }
}


// ------------Logout------------
const logout = async (req, res) => {
  try {
    req.session.destroy();
    console.log(req.session);
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

//=========== Sign Up ============//

const loadSignup = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error.message);
  }
};

// Wishlist
const loadWishlist = async (req, res) => {
  try {
    res.render("wishlist");
  } catch (error) {
    console.log(error.message);
  }
};
// Contact
const loadContact = async (req, res) => {
  try {
    res.render("contact");
  } catch (error) {
    console.log(error.message);
  }
};




// Error404
const loadError404 = async (req, res) => {
  try {
    res.render("404");
  } catch (error) {
    console.log(error.message);
  }
};

const loadprofile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findOne({ _id: userId });
    const addressData = await Address.findOne({ user: userId });
    const orderData = await Order.find({ userId: userId }).sort({ purchaseDate: -1 });
    const walletData = await User.findOne({ _id: userId }).sort({ 'walletHistory.transactionDate': -1 });
  console.log(orderData,'------------------------');
  console.log(walletData,'0000000000000000000000000');
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.product.length;
    }

    res.render("userProfile", { user: userData, addressData, orderData, cartCount, walletData });
  } catch (error) {
    console.log(error.message);
  }
};



const changePassword = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const passwordMatch = await bcrypt.compare(req.body.currPass, userData.password);

    if (passwordMatch) {
      const securePass = await securePassword(req.body.newPass);
      const passwordUpdate = await User.updateOne({ _id: req.session.user_id }, { $set: { password: securePass } });

      if (passwordUpdate) {
        res.json({ success: true, message: "Password changed" });
      } else {
        res.json({ success: false, message: "someting wrong" });

      }
    } else {
      res.json({ wrongpass: true });
    }
  } catch (error) {
    console.log(error.message);

  }
}









module.exports = {
  loadHome,
  loadShop,
  searchProducts,
  loadSignup,
  loadLogin,
  verifylogin,
  loadWishlist,
  loadContact,
  loadUserOtp,
  verifyOTP,
  // veryfyPost,
  insertUser,
  loadError404,
  logout,
  resendOtp,
  forgetLoad,
  forgetVerify,
  loadForgetpage,
  resetPassword,
  loadprofile,
  changePassword,
};
