const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const { name } = require("ejs");


const loadCouponManagement = async (req, res) => {
    try {
        const couponData = await Coupon.find();
        res.render("couponManagement", { couponData });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}

const addCouponLoad = async (req, res) => {
    try {
        res.render("addCoupon");
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
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

        console.log(req.body);
        const CouponData = new Coupon({
            name: req.body.name,
            couponCode: req.body.code,
            discountAmount: req.body.discount,
            activeDate: formattedActiveDate,
            expiryDate: formattedExpiryDate,
            criteriaAmount: req.body.criteriaAmount,
            userLimit: req.body.userLimit
        });

        await CouponData.save();

        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
};


const blockCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const couponData = await Coupon.findOne({ _id: couponId });

        if (!couponData.is_blocked) {
            await Coupon.updateOne({ _id: couponId }, { $set: { is_blocked: true } });
            res.json({ success: true })

        } else {
            await Coupon.updateOne({ _id: couponId }, { $set: { is_blocked: false } });
            res.json({ success: true })
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render("500"); 
    }
}

const deletCouopon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        await Coupon.deleteOne({ _id: couponId });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}





//----------------------ApplayCoupon-----------------//

const applyCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const userId = req.session.user_id;
        const cartData = await Cart.findOne({ userId: userId });
        const cartTotal = cartData.product.reduce((acc, val) => acc + val.totalPrice, 0);
        const currentDate = new Date();
        const couponData = await Coupon.findOne({ _id: couponId });
        const existUser = couponData.usedUser.includes(userId);

        if (existUser) {
            res.json({ user: true, message: 'You have already used this coupon.' });
        } else {
            if (cartData.couponDiscount == null) {
                const couponData = await Coupon.findOne({ _id: couponId });
                if (couponData) {
                    if (couponData.userLimit <= 0) {
                        res.json({ limit: true, message: 'Coupon usage limit reached.' });
                    } else {
                        if (couponData.expiryDate <= currentDate) {
                            res.json({ expired: true, message: 'This coupon has expired.' });
                        } else {
                            if (couponData.criteriaAmount >= cartTotal) {
                                res.json({ cartAmount: true, message: 'Your cart total does not meet the coupon criteria.' });
                            } else {
                                const discountPercentage = couponData.discountAmount;
                                const discountAmount = Math.round((discountPercentage / 100) * cartTotal);
                                await Coupon.findOneAndUpdate({ _id: couponId }, { $push: { usedUser: userId } });
                                await Cart.findOneAndUpdate({ userId: userId }, { $set: { couponDiscount: couponId } });
                                res.json({ coupon: true, message: 'Coupon applied successfully.' });
                            }
                        }
                    }
                }
            } else {
                res.json({ used: true, message: 'You have already applied a coupon.' });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
};


const removeCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const userId = req.session.user_id;
        const updateCoupo = await Coupon.findOneAndUpdate({ _id: couponId }, { $pull: { usedUser: userId } });
        const cartStatus = await Cart.findOneAndUpdate({ userId: userId }, { $set: { couponDiscount: null } });

        res.json({ couponRemove: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).render("500"); 
    }
}

module.exports = {
    loadCouponManagement,
    addCouponLoad,
    addCoupon,
    blockCoupon,
    deletCouopon,
    applyCoupon,
    removeCoupon,
    // loadEditCoupon
}