const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/productsModel");
const userOtpVerification = require("../models/userOtpModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
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
    const cartData = await Cart.findOne({ user: user_id }).populate(
      "product.productId"
    );
    const userData = await User.findOne({ _id: user_id });

    res.render("home", { user: userData, cart: cartData });
  } catch (error) {
    console.log(error.message);
  }
};



// Signup and Storing data to database
const insertUser = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { name, email, mobile, password } = req.body;
    const check = await User.findOne({ email });

    if (check) {
      res.render("signup", { error: "Email alredy exist" });
    } else {
      const sPassword = await securePassword(password);
      const data = new User({
        name,
        email,
        mobile,
        password: sPassword
      });
      const result = await data.save();
      console.log(result);

      // Update user information is verifide or note;
      await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

      // sendOtpVerification(result, res);
      sendOtpVerification({ name, _id: result._id, email }, res);
    }
  } catch (error) {
    console.log(error.message);
  }
};


//-------- OTP ----------
const verifyOTP = async (req, res) => {
  try {
    req.session.user_id = req.query.id;
    res.render("userOtp");
  } catch (error) {
    console.log(error);
  }
};

const veryfyPost = async (req, res) => {
  try {
    const otp =
      req.body.a +
      req.body.b +
      req.body.c +
      req.body.d +
      req.body.e +
      req.body.f;
    const userId = req.session.user_id;
    console.log(otp);

    const userOTPVerificationRecord = await userOtpVerification.find({
      userId
    });
    console.log(userOTPVerificationRecord);

    if (userOTPVerificationRecord.length == 0) {
      res.render("userOtp", {
        message: "record doesn't exist or has been verified already"
      });
    } else {
      const { expiresAt } = userOTPVerificationRecord[0];
      const hashedOTP = userOTPVerificationRecord[0].otp;
      console.log(hashedOTP, "hashed");
      if (expiresAt < Date.now()) {
        await userOTPVerificationRecord.deleteMany({ userId });
        res.render("userOtp", { message: "your otp has been expired" });
      } else {
        const validOTP = await bcrypt.compare(otp, hashedOTP);
        if (!validOTP) {
          res.render("userOtp", { message: "Invalid code" });
        } else {
          const updateInfo = await User.updateOne(
            { _id: userId },
            { is_verified: true }
          );
          console.log(updateInfo);
          await userOtpVerification.deleteMany({ userId });
          res.json({
            status: "VERIFIED",
            message: "user email verified successfully"
          });
          res.redirect("home");
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};




// -------SEND-OTP-FOR-SIGNUP------
const sendOtpVerification = async ({ name, _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 900000)}`;
    console.log("SendOtp" + otp);

    // Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
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
      html: "<h1> Hi " + name + ",please verify your email " + otp + ""
    };

    // Hashing Otp
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newUserOtp = new userOtpVerification({
      userId: _id,
      otp: hashedOtp,
      createAt: Date.now(),
      expiresAt: Date.now() + 3600000
    });
    // Save the Otp records

    await newUserOtp.save(), await transporter.sendMail(mailOPtions);

    console.log("heloo11111");
    res.redirect(`/userOtp?id=${_id}`);
  } catch (error) {
    console.log(error.message);
  }
};

// userOtp
const loadUserOtp = async (req, res) => {
  try {
    let verifyErr = req.session.verifyErr;
    req.session.userId = req.query.id;
    console.log("Ottpp");
    res.render("userOtp", { verifyErr });
  } catch (error) {
    console.log(error.message);
  }
};

//----------To resend Otp-----------
const resendOtp = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.session.user_email });
    sendOtpVerification(userData.name, userData.email);
    res.render("userOtp");
  } catch (error) { }
};

//======= Login =========
const loadLogin = async (req, res) => {
  try {
    res.render("login",);
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
            } else {
              const userData = await User.findOne({ email: email });
              if (userData && userData.is_admin == true) {
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
    next(error);
  }
};

//---------------FORGET PASSWORD-----------------------
const sendPassResetMail = async (name, email, token) => {
  try {
    console.log(email, "chcek");
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
    next(error);
  }
};

const forgetLoad = async (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};

//----------- forget passwoed load--------
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    console.log(email,'Email check')

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

          if (userData) {
            if (userData.is_varified == 1) {
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
      res.status(404); // ADD RES RENDER 404 PAGEE
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
    console.log('co jsn djfics')
    console.log(confirm, 'dcks djcjwdsncjsdcs')

    if (Password.trim() === "") {
      req.json({ require: true });
    } else {
      if (Password.startsWith(" ") || Password.includes(" ")) {
        req.json({ password_space: true });
      } else {
        if (Password.length < 4) {
          req.json({ paslength: true });
        } else {
          if (confirm.trim() === "") {
            req.json({ confirm_space: true });
          } else {
            if (Password !== confirm) {
              req.json({ wrong: true });
            } else {
              const email = req.body.email;
              console.log(email, 'chcejdshsc')

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
    console.log(error.messageFFF)
  }
};

//-------------Shop-------------------
const loadShop = async (req, res) => {
  try {
    const productData = await Product.find({});
    const userData = req.session.user_id;

    res.render("shop", { user: userData, products: productData });
  } catch (error) {
    console.log(error.message);
  }
};

// ------------Logout------------
const logout = async (req, res) => {
  try {
    req.session.destroy();
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

// product
const loadProduct = async (req, res) => {
  try {
    console.log("kjckjsdkcs")
    const _id = req.query.id
    console.log(_id, 'njsndv')
    const product = await Product.findOne({ _id: _id })
    res.render("product", { product });
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

    const userData = await User.findOne({ _id: req.session.user_id });
    const addressData = await Address.findOne({ user: req.session.user_id });
    
    console.log(userData,'vjcfsjc')
    console.log(addressData,'cj ksdv c')

    res.render("userProfile", { userData, addressData });
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req,res) => {
  try {
    const userData = await User.findOne({_id: req.session.user_id });
    const passwordMatch = await bcrypt.compare(req.body.currPass , userData.password);
    
    console.log('fcjksd bc shdvc')
    if(passwordMatch) {
      const securePass = await securePassword(req.body.newPass);
      await User.updateOne({_id:req.session.user_id},{$set: {password: securePass}});
      res.json({change:true});
    } else {
      console.log("wrong Password")
      res.json({wrongPass: true})
    }

  } catch (error) {
    console.log(error.message);
    
  }
}



const loadCheckOut = async (req, res) => {
  try {
    res.render("checkout");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadHome,
  loadShop,
  loadSignup,
  loadLogin,
  verifylogin,
  loadWishlist,
  loadContact,
  loadUserOtp,
  verifyOTP,
  veryfyPost,
  insertUser,
  loadError404,
  logout,
  loadProduct,
  resendOtp,
  forgetLoad,
  forgetVerify,
  loadForgetpage,
  resetPassword,
  loadprofile,
  loadCheckOut,
  changePassword
};
