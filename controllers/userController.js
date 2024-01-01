const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/productsModel");
const userOtpVerification = require('../models/userOtpModel')
const Cart = require('../models/cartModel');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { product } = require("./productController");
const { default: mongoose } = require("mongoose");
dotenv.config()


//========== Bcrypt password ============//
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    // res.render("500Error");
  }
};

// Home
const loadHome = async (req, res) => {
  try {
    // const userData = await User.findOne({_id:user_id})
    // console.log("Inside loadHome function");

    const user_id = req.session.user_id
    const cartData = await Cart.findOne({ user: user_id }).populate("product.productId")
    const userData = await User.findOne({ _id: user_id })

    res.render('home', { user: userData, cart: cartData });
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

// Signup and Storing data to database

const insertUser = async (req, res) => {
  try {
    const userId = req.session.user_id
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
      const result = await data.save()
      console.log(result);

      // Update user information is verifide or note;
      await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

      sendOtpVerification(result, res);
    }

  } catch (error) {
    console.log(error.message)
  }
}



// const verifyOTP = async (req, res) => {
//   try {
//        console.log("this is veryfy")
//         req.session.user_id = req.query.id;
//         console.log("Session ID set :", req.session.user_id);
//         console.log("Session ID set :", req.query.id);

//        res.render('userOtpSignup');
//     const userId = req.query.id
//     const otp = req.body.a + req.body.b + req.body.c + req.body.d + req.body.e + req.body.f;
//     console.log(otp);
//     const user = await userOtpVerification.findOne({ userId });
//     const otpHash = await bcrypt.compare(otp, user.otp);
//     console.log(otpHash);
//     if (otpHash == true) {
//       req.session.user_id = user._id;
//       res.redirect('/home');
//     } else {
//       res.render('userOtpSignup', { message: "Enter valid OTP" })
//     }

//   } catch (error) {
//     console.log("Error setting session:", error.message);

//   }
// }

const verifyOTP = async (req, res) => {
  try {
    req.session.user_id = req.query.id;
    res.render('userOtpSignup')
  } catch (error) {
    console.log(error);
  }
}

const veryfyPost = async (req, res) => {
  try {

    const otp = req.body.a + req.body.b + req.body.c + req.body.d + req.body.e + req.body.f;
    const userId = req.session.user_id;
    console.log(otp)
    console.log(userId, "vre");
    const userOTPVerificationRecord = await userOtpVerification.find({ userId })
    console.log(userOTPVerificationRecord);
    if (userOTPVerificationRecord.length == 0) {
      res.render('userOtpSignup', { message: "record doesn't exist or has been verified already" })
      // throw Error("record doesn't exist or has been verified already")       
    } else {
      const { expiresAt } = userOTPVerificationRecord[0];
      const hashedOTP = userOTPVerificationRecord[0].otp;
      console.log(hashedOTP, "hashed");
      if (expiresAt < Date.now()) {
        await userOTPVerificationRecord.deleteMany({ userId });
        res.render('userOtpSignup', { message: "your otp has been expired" })
        // throw new Error("your otp has been expired")
      } else {
        const validOTP = await bcrypt.compare(otp, hashedOTP);
        if (!validOTP) {
          // throw new ("Invalid code")
          res.render('userOtpSignup', { message: "Invalid code" })
        } else {
          const updateInfo = await User.updateOne({ _id: userId }, { is_verified: 1 });
          console.log(updateInfo);
          await userOtpVerification.deleteMany({ userId });
          //    res.json({
          //     status:"VERIFIED",
          //     message:"user email verified successfully"
          //    })
          res.redirect('home');
        }
      }
    }
  } catch (error) {
    console.log(error.message)

  }
}



// -------SEND-OTP-FOR-SIGNUP------

const sendOtpVerification = async ({ name, _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 900000)}`
    console.log("SendOtp" + otp);


    // Send the OTP to the user's email

    const mailOPtions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "OTP verification",
      html: "<h1> Hi " + name + ",please verify your email " + otp + ""
    };

    // Hashing Otp
    const hashedOtp = await bcrypt.hash(otp, 10)

    const newUserOtp = new userOtpVerification({
      userId: _id,
      otp: hashedOtp,
      createAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    // Save the Otp records

    await newUserOtp.save(),
      await transporter.sendMail(mailOPtions);
    console.log("heloo11111");
    res.redirect(`/userOtpSignup?id=${_id}`);

    // res.render('userOtpSignup', { id:+_id });

  } catch (error) {
    console.log(error.message)
  }
}

// Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  // requireTLS: true,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS
  }
});




// userOtp
const loadUserOtp = async (req, res) => {
  try {
    req.session.userId = req.query.id;
    console.log("Ottpp")
    res.render('userOtpSignup');
  } catch (error) {
    console.log(error.message);
  }
}



//======= Login =========
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

// Verify Login
// const verifyLogin = async (req, res) => {
//   try {
//     const email = req.body.email;
//     const password = req.body.password;
//     const userData = await User.findOne({ email: email });

//     if (userData) {
//       const passwordMatch = await bcrypt.compare(password, userData.password);
//       if (passwordMatch) {

//         if (userData.is_blocked === false) {

//           if (userData.is_verified === true) {

//             req.session, user_id = userData._id;
//             res.redirect('/');

//           } else {
//             req.session.user_id = userData._id;
//             console.log(req.session.user_id)
//             res.redirect('/home');
//           }
//         }
//         else {
//           res.render('login', { error: 'Admin blocked you' })
//         }

//       } else {
//         res.render('login', { error: 'incorrect password' })
//       }

//     } else {
//       res.render('login', { error: 'Email not found' })
//     }






//   } catch (error) {
//     console.log(error.message);
//   }
// }

//verify login
// const verifyLogin = async (req,res)=>{
//   try {

//     const email = req.body.email
//     const password = req.body.password
//     const userData = await User.findOne({email:email}) 

//     if (userData) {
       
//       const matchPassword = await bcrypt.compare(password,userData.password)

//       if (matchPassword) {

//         if(userData.is_blocked===false){

//           if(userData.is_verified==true){

//             req.session.user_id = userData._id;
//             res.redirect('/')
//           }else{

//             sendVerifyMail(userData.name,userData.email)
//             res.render('home',{email:userData.email})

//           }
//         }else{
//           res.render('login',{error:'Admin blocked you'})
//         }
        
//       } else {
//         res.render('login',{error:'Incorrect password'})
//       }
      
//     }else{
//       res.render('login',{error:'Email not found'})
//     }

//   } catch (error) {
//     console.log(error.message);
//   }
// }

const verifyLogin = async (req, res) => {
  try {
    console.log('Verifying login...');
    const email = req.body.email;
    const password = req.body.password;
    console.log('Email:', email);

    const userData = await User.findOne({ email: email });

    if (userData) {
      console.log('User found:', userData);

      const matchPassword = await bcrypt.compare(password, userData.password);

      if (matchPassword) {
        console.log('Password matches');

        if (userData.is_blocked === false) {
          if (userData.is_verified === true) {
            req.session.user_id = userData._id;
            console.log('Redirecting to /');
            res.redirect('/home');
          } 
        } else {
          console.log('Admin blocked the user');
          res.render('login', { error: 'Admin blocked you' });
        }
      } else {
        console.log('Incorrect password');
        res.render('login', { error: 'Incorrect password' });
      }
    } else {
      console.log('Email not found');
      res.render('login', { error: 'Email not found' });
    }
  } catch (error) {
    console.log('Error in verifyLogin:', error.message);
  }
};




// shop
const loadShop = async (req, res) => {
  try {
    const productData = await Product.find({});

    res.render("shop", { products: productData });
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
    res.render("product");
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
}

// -------Logout-----
const logout = async (req, res) => {
  try {
    // console.log("session distroy checking ");
    req.session.destroy();
    res.redirect('/');

  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  loadHome,
  loadShop,
  loadSignup,
  loadLogin,
  verifyLogin,
  loadWishlist,
  loadContact,
  loadUserOtp,
  verifyOTP,
  veryfyPost,
  insertUser,
  loadError404,
  logout,
  loadProduct
};
