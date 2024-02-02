const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const { name } = require("ejs");


const loadCouponManagement = async (req , res) =>{
    try {
        const couponData = await Coupon.find();
        res.render("couponManagement",{couponData});
    } catch (error) {
        console.log(error.message);
        
    }
}

const addCouponLoad = async (req, res)=>  {
    try {

     
        res.render("addCoupon");
    } catch (error) {
        console.log(error.message);
        
    }
}

const addCoupon = async (req, res) => {
    try {


        // For activeDate
        const activeDate = new Date();
        const formattedActiveDate = activeDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // For expiryDate
        const expiryDate = new Date(req.body.expiryDate);
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const CouponData = new Coupon({
            name: req.body.name,
            couponCode: req.body.code,
            discountAmount: req.body.discount,
            activeDate: formattedActiveDate,
            expiryDate: formattedExpiryDate,
            criteriaAmount: req.body.criteriaAmount,
            usersLimit: req.body.userLimits
        });

        await CouponData.save();

        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};


const blockCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        console.log(couponId,'ivan ahne tharam ');
        const couponData = await Coupon.findOne({_id:couponId});

        if(!couponData.is_blocked){
          await Coupon.updateOne({_id:couponId},{$set: {is_blocked: true}});
          res.json({success: true})

        } else {
             await Coupon.updateOne({_id:couponId},{$set: {is_blocked: false}});
             res.json({success: true})
        }
    } catch (error) {
        console.log(error.message)
    }
}


const deletCouopon = async (req, res) =>{
    try {
        console.log('chek this sanam')
        const couponId = req.body.couponId;
        console.log(couponId);

        await Coupon.deleteOne({_id: couponId});
        res.json({success: true})
    } catch (error) {
        console.log(error.message);
        
    }
}

module.exports= {
    loadCouponManagement,
    addCouponLoad,
    addCoupon,
    blockCoupon,
    deletCouopon
}