const bcrypt = require('bcryptjs');
const User = require('../models/userModel')
const Product = require('../models/productsModel')
const Cart = require('../models/cartModel')
const Address = require('../models/addressModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const wishList = require('../models/wishListModel')
const Banner = require("../models/bannerModel");
const nodemailer = require('nodemailer')
const randomString = require('randomstring')
const config = require('../config/config')
const dotenv = require('dotenv')
const session = require('express-session')
dotenv.config()

//----------- Bcrypt password ----------//

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    console.log(passwordHash)
    return passwordHash
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}

//-----------  LoadHome --------------//

const loadHome = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const cartData = await Cart.findOne({ user: user_id }).populate(
      'product.productId',
    )
    const bannerData = await Banner.find({ is_blocked: false })
    const userData = await User.findOne({ _id: user_id })
    const productData = await Product.find({}).populate('category')
    const categoryData = await Category.find({})
    const limitedProductData = productData.slice(0, 10)
    const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0
    if (cart) {
      cartCount = cart.product.length
    }

    res.render('home', {
      user: userData,
      cart: cartData,
      cartCount,
      productData: limitedProductData,
      bannerData
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

// Signup and Storing data to database
const insertUser = async (req, res) => {
  try {
    const {
      name = '',
      email = '',
      mobile = '',
      password = '',
      confirmPassword = '',
    } = req.body


    const referralCode = req.body.referral;
    if (referralCode) {
      const ExistReferral = await User.findOne({ referralCode: referralCode });


      if (ExistReferral) {
        const data = {
          amount: 201,
          transactionDate: Date.now(),
          direction: 'Credit',  
        };
        const existingreferral = await User.findOneAndUpdate({ referralCode: referralCode }, { $inc: { wallet: 101 }, $push: { walletHistory: data } });


      } else {
        const message = "Invalid link"
        return res.render('signup', { message });
      }
    }


    if (name.trim() === '') {
      res.json({ name_require: true })
    } else {
      if (name.startsWith(' ') || name.includes(' ')) {
        res.json({ name_space: true })
      } else {
        if (name && name.length <= 2) {
          res.json({ name: true })
        } else {
          if (email.trim() === '') {
            res.json({ email_require: true })
          } else {
            if (email.startsWith(' ') || email.includes(' ')) {
              res.json({ email_space: true })
            } else {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
              if (!emailPattern.test(req.body.email)) {
                res.json({ emailPatt: true })
              } else {
                if (mobile.trim() === '') {
                  res.json({ mobile_require: true })
                } else {
                  if (mobile.startsWith(' ') || mobile.includes(' ')) {
                    res.json({ mobile_space: true })
                  } else {
                    let mobilePattern = /^\d{10}$/
                    if (
                      !mobilePattern.test(mobile) ||
                      mobile === '0000000000'
                    ) {
                      res.json({ mobile: true })
                    } else {
                      if (password.trim() === '') {
                        res.json({ password_require: true })
                      } else {
                        if (
                          password.startsWith(' ') ||
                          password.includes(' ')
                        ) {
                          res.json({ password_space: true })
                        } else {
                          if (password.length < 4) {
                            res.json({ password: true })
                          } else {
                            const alphanumeric = /^(?=.*[a-zA-Z])(?=.*\d).+$/
                            if (!alphanumeric.test(password)) {
                              res.json({ alphanumeric: true })
                            } else {
                              if (confirmPassword.trim() === '') {
                                res.json({ confirm_require: true })
                              } else {
                                if (
                                  confirmPassword.startsWith(' ') ||
                                  confirmPassword.includes(' ')
                                ) {
                                  res.json({ confirm_space: true })
                                } else {
                                  const emailchek = await User.findOne({
                                    email: req.body.email,
                                    is_verified: true,
                                  });
                                  if (emailchek) {
                                    res.json({ emailalready: true })
                                  } else {
                                    if (password == confirmPassword) {
                                      const spassword = await securePassword(
                                        req.body.password,
                                      )

                                      const refferalCode = randomString.generate({
                                        length: 11,
                                        charset: 'alphanumeric',
                                      });

                                      const Data = new User({
                                        name: req.body.name,
                                        email: req.body.email,
                                        mobile: req.body.mobile,
                                        password: spassword,
                                        referralCode: refferalCode,
                                        is_admin: 0,
                                      })

                                      const userData = await Data.save()

                                
                                      if (userData) {
                                        let randomNumber =
                                          Math.floor(Math.random() * 9000) +
                                          1000
                                        otp = randomNumber
                                        req.session.email = req.body.email
                                        req.session.password = spassword
                                        req.session.userName = req.body.name
                                        req.session.mobile = req.body.mobile

                                        req.session.otp = otp;

                                        console.log('otp', otp);
                                        sendVerifyMail({
                                          email: req.body.email,
                                          name: req.body.name,
                                          otp: randomNumber,
                                        })
                                        console.log('otp',otp);
                                        setTimeout(() => {
                                          otp =
                                            Math.floor(Math.random() * 9000) +
                                            1000
                                        }, 60000)
                                        req.session.otpsent = true
                                        res.json({ success: true })
                                      } else {
                                        res.json({ notsaved: true })
                                      }
                                      if (referralCode) {
          
                                        const existingreferral = await User.findOne({ referralCode: referralCode })

                                        if (existingreferral) {
                                          const data = {
                                            amount: 201,
                                            transactionDate: Date.now(),
                                            direction: 'Credit',  
                                          };
                                                          
                                            await User.updateOne(
                                                { _id: userData._id },
                                                { $inc: { wallet: 201 }, $push: { walletHistory: data } }
                                            );
                                        }
                                    }
                                    } else {
                                      res.json({ wrongpass: true })
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
    res.status(500).render('500')
  }
}

// userOtp
const loadUserOtp = async (req, res) => {
  try {
    let verifyErr = req.session.verifyErr
    let otpsend = req.session.otpsend

    res.render('userOtp', { verifyErr, otpsend })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}



// -------- OTP ----------
const verifyOTP = async (req, res) => {
  try {
    req.session.verifyErr = false;
    req.session.otpsent = false;
    const otpInput = req.body.otp;

    const email = req.session.email;
    const storedOTP = req.session.otp;

    const userData = await User.findOne({ email: email });

    if (otpInput.trim() === '') {
      res.json({ fill: true });
    } else {
      if (otpInput === storedOTP.toString()) {
        const verified = await User.findOneAndUpdate(
          { email: email },
          { $set: { is_verified: true } },
          { new: true }
        );

        if (verified) {
          if (userData) {
            req.session.user_id = userData._id;
          }
          req.session.regSuccess = true;
          res.json({ success: true });
        } else {
          res.json({ error: true });
        }
      } else {
        console.log('Invalid OTP');
        res.json({ wrong: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: true });
  }
};


let otp

// -------SEND-OTP-FOR-SIGNUP------
const sendVerifyMail = async ({ name, email, otp }) => {
  try {
    console.log('Admin Email:', process.env.ADMIN_EMAIL);
console.log('Admin Pass:', process.env.ADMIN_PASS);

    // Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS,
      },
    })
    // Send the OTP to the user's email
    const mailOPtions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: 'OTP verification',
      html:
        '<h1> Hallo ' +
        name +
        ', This is your Mail veryfication message <br> This is your OTP :' +
        otp +
        '',
    }

    transporter.sendMail(mailOPtions, function (err, info) {
      if (err) {
        console.log(err)
      } else {
        console.log('Email has been sent:-', info.response)
      }
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

// ----------To resend Otp-----------
const resendOtp = async (req, res) => {
  try {
    let otpsend = req.session.otpsend;
    let verifyErr = req.session.verifyErr;
    let email = req.session.email;
    let name = req.session.name || 'User';

    let randomNumber = Math.floor(Math.random() * 9000) + 1000;
    req.session.otp = randomNumber;


    setTimeout(() => {
      req.session.otpsend = false;
    }, 60000);
    await sendVerifyMail({ name, email, otp: req.session.otp });

    res.render('userOtp', {
      verifyErr,
      otpsend,
      resend: 'Resend the otp to your email address.',
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};



//======= Login =========
const loadLogin = async (req, res) => {
  try {
    const userId = req.session.user_id
    res.render('login')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//--------Login-------------
const verifylogin = async (req, res) => {
  try {
    const email = req.body.email
    const name = 'User'
    const password = req.body.password
    if (email.trim() == '') {
      res.json({ email_fillout: true })
    } else {
      if (email.includes(' ') || /\s/.test(email)) {
        res.json({ email_space: true })
      } else {
        let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

        if (!emailPattern.test(req.body.email)) {
          res.json({ logemailPatt: true })
        } else {
          if (password.trim() == '') {
            res.json({ password_fillout: true })
          } else {
            if (password.includes(' ') || /\s/.test(password)) {
              res.json({ password_space: true })
            } else {
              const userData = await User.findOne({ email: email })

              if (userData) {
                if (userData.is_verified == true) {
                  const passwordMatch = await bcrypt.compare(
                    password,
                    userData.password,
                  )
                  if (passwordMatch) {
                    if (userData.is_blocked == false) {
                      req.session.user_id = userData._id
                      req.session.name = userData.name
                      req.session.regSuccess = false
                      res.json({ success: true })
                    } else {
                      res.json({ blocked: true })
                    }
                  } else {
                    res.json({ wrong: true })
                  }
                } else {
                  const randomNumber = Math.floor(Math.random() * 9000) + 1000
                  otp = randomNumber
                  req.session.email = req.body.email
                  sendVerifyMail(name, email, randomNumber)
                  setTimeout(() => {
                    otp = Math.floor(Math.random() * 9000) + 1000
                  }, 60000)
                  req.session.verifyErr = true
                  res.json({ verify: true })
                }
              } else {
                res.json({ register: true })
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//---------------FORGET PASSWORD-----------------------
const sendPassResetMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS,
      },
    })

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: 'Password Reset',
      html: `
        <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f7f7f7; text-align: center;">
          <h1 style="color: #333;">Password Reset</h1>
          <p>Hello ${name},</p>
          <p>This message is for resetting your password.</p>
          <p>
            <strong>
              Click the following link to reset your password:
              <a href="http://localhost:8000/forget-password?token=${token}" style="color: #3498db; text-decoration: none;">
                Reset Password
              </a>
            </strong>
          </p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #888;">Loom Fashion Team</p>
        </div>
      `,
    }

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err)
      } else {
        console.log('Email has been sent:- ', info.response)
      }
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//----------- forget passwoed load--------

const forgetLoad = async (req, res) => {
  try {
    res.render('forgetpassword')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email
    console.log(email, 'Email check')

    if (email.trim() === '') {
      res.json({ email_require: true })
    } else {
      if (email.startsWith(' ') || email.includes(' ')) {
        res.json({ email_space: true })
      } else {
        let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
        if (!emailPattern.test(email)) {
          res.json({ emailPatt: true })
        } else {
          const userData = await User.findOne({ email: email })
          console.log('check 1', userData)
          if (userData) {
            if (userData.is_verified == true) {
              const random_String = randomString.generate()

              await User.updateOne(
                { email: email },
                { $set: { token: random_String } },
              )

              const user = await User.findOne({ email: email })

              sendPassResetMail(user.name, user.email, random_String)

              res.json({ response: true })
            } else {
              res.json({ mailverify: true })
            }
          } else {
            res.json({ wrong: true })
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadForgetpage = async (req, res) => {
  try {
    const token = req.query.token
    const tokenData = await User.findOne({ token: token })

    if (tokenData) {
      req.session.email = tokenData.email
      res.render('forget-password')
    } else {
      res
        .status(404)
        .render('404', { message: "Oop's.. Your token is invalid" })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//------------Reset Password------------
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const confirm = req.body.confirm;
    console.log('chek k', password);
    console.log('checj ', confirm);
    if (password.trim() === '') {
      res.json({ required: true });
    } else {
      if (confirm.trim() === '') {
        res.json({ confirm_require: true });
      } else {
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordPattern.test(password)) {
          res.json({ password_require: true });
        } else {
          if (password.startsWith(' ') || password.includes(' ')) {
            res.json({ password_space: true });
          } else {
            if (password.length < 4) {
              res.json({ paslength: true });
            } else {
              if (confirm.trim() === '') {
                res.json({ confirm_space: true });
              } else {
                if (password !== confirm) {
                  res.json({ wrong: true });
                } else {
                  const email = req.session.email;
                  const sPassword = await securePassword(password);
                  const updateData = await User.updateOne(
                    { email: email },
                    { $set: { password: sPassword, token: '' } }
                  );
                  if (updateData) {
                    console.log('uupdated', updateData);
                    req.session.email = false;
                    res.json({ response: true });
                  } else {
                    res.status(400);
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};

//-------------Shop-------------------

const loadShop = async (req, res) => {
  try {
    const userId = req.session.user_id
    const categoryId = req.query.category
    const categoryData = await Category.find()
    const wishlistData = await wishList.findOne({ user: userId })

    const page = parseInt(req.query.page) || 1
    const limit = 8
    const totalProducts = await Product.countDocuments({})
    const totalPages = Math.ceil(totalProducts / limit)
    const skip = (page - 1) * limit

    const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0
    if (cart) {
      cartCount = cart.product.length
    }

    let products

    if (categoryId) {
      products = await Product.find({ category: categoryId })
        .populate('category')
        .skip(skip)
        .limit(limit)
    } else {
      products = await Product.find({})
        .populate('category')
        .skip(skip)
        .limit(limit)
    }

    res.render('shop', {
      user: userId,
      products,
      currentPage: page,
      totalPages,
      limit,
      totalProducts,
      cartCount,
      category: categoryData,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}


// ------------Logout------------
const logout = async (req, res) => {
  try {
    req.session.user_id = null
    res.redirect('/')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//=========== Sign Up ============//

const loadSignup = async (req, res) => {
  try {
    res.render('signup')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

// Contact
const loadContact = async (req, res) => {
  try {
    res.render('contact')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

const aboutLoad = async (req, res) => {
  try {
    res.render('about')
  } catch {
    console.log(error.message)
    res.status(500).render('500')
  }
}

const loadprofile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findOne({ _id: userId });
    const addressData = await Address.findOne({ user: userId });
    const orderData = await Order.find({ userId: userId }).sort({
      purchaseDate: -1,
    });

    // Fetch user data with sorted walletHistory
    const walletData = await User.findOne({ _id: userId }).lean();
    if (walletData && Array.isArray(walletData.walletHistory)) {
      walletData.walletHistory.sort(
        (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
      );
    }
    console.log('walletData', walletData);

    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.product.length;
    }

    res.render('userProfile', {
      user: userData,
      addressData,
      orderData,
      cartCount,
      walletData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};


const changePassword = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id })
    const passwordMatch = await bcrypt.compare(
      req.body.currPass,
      userData.password,
    )

    if (passwordMatch) {
      const securePass = await securePassword(req.body.newPass)
      const passwordUpdate = await User.updateOne(
        { _id: req.session.user_id },
        { $set: { password: securePass } },
      )

      if (passwordUpdate) {
        res.json({ success: true, message: 'Password changed' })
      } else {
        res.json({ success: false, message: 'someting wrong' })
      }
    } else {
      res.json({ wrongpass: true })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

// Error404
const loadError404 = async (req, res) => {
  try {
    res.render('404')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

// Error404
const loadError500 = async (req, res) => {
  try {
    res.render('500')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

module.exports = {
  loadHome,
  loadShop,
  loadSignup,
  loadLogin,
  verifylogin,
  loadContact,
  loadUserOtp,
  verifyOTP,
  insertUser,
  loadError404,
  loadError500,
  logout,
  resendOtp,
  forgetLoad,
  forgetVerify,
  loadForgetpage,
  resetPassword,
  loadprofile,
  changePassword,
  aboutLoad,
}
