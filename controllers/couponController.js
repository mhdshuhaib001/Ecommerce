const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const { name } = require("ejs");


const loadCouponManagement = async (req, res) => {
    try {
        const couponData = await Coupon.find();
        res.render("couponManagement", { couponData });
    } catch (error) {
        console.log(error.message);

    }
}

const addCouponLoad = async (req, res) => {
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

        console.log(req.body);
        const CouponData = new Coupon({
            name: req.body.name,
            couponCode: req.body.code,
            discountAmount: req.body.discount,
            activeDate: formattedActiveDate,
            expiryDate: formattedExpiryDate,
            criteriaAmount: req.body.criteriaAmount,
            usersLimit: req.body.usersLimit
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
    }
}


// const loadEditCoupon = async (req, res) => {
//     try {
//         console.log(req.query);
//         const couponId = req.query._id; // Use req.query._id to get the parameter value
//         console.log(couponId, '000000000000000000');
//         const couponData = await Coupon.findOne({ _id: couponId });
//         console.log(couponData, "-----------", couponId);
//         res.render('editCoupon', { couponData });
//     } catch (error) {
//         console.log(error.message);
//     }
// }


const deletCouopon = async (req, res) => {
    try {
        console.log('chek this sanam')
        const couponId = req.body.couponId;
        console.log(couponId);

        await Coupon.deleteOne({ _id: couponId });
        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
    }
}





//----------------------ApplayCoupon-----------------//

const applyCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const userId = req.session.user_id;
        const cartData = await Cart.findOne({ userId: userId })
        const cartTotal = cartData.product.reduce((acc, val) => acc + val.totalPrice, 0)
        const currentDate = new Date();
        const couponData = await Coupon.findOne({ _id: couponId });
        const existUser = couponData.usedUser.includes(userId);



        if (existUser) {
            res.json({ user: true });
        } else {
            if (cartData.couponDiscount == null) {

                const couponData = await Coupon.findOne({ _id: couponId });
                if (couponData) {
                    if (couponData.usersLimit <= 0) {
                        res.json({ limit: true });

                    } else {
                        if (couponData.expiryDate <= currentDate) {
                            res.json({ expired: true });
                        } else {
                            if (couponData.criteriaAmount >= cartTotal) {
                                res.json({ cartAmount: true });
                            } else {
                                const discountPercentage = couponData.discountAmount;
                                const discountAmount = Math.round((discountPercentage / 100) * cartTotal);
                                await Coupon.findOneAndUpdate({ _id: couponId }, { $push: { usedUser: userId } });
                                await Cart.findOneAndUpdate({ userId: userId }, { $set: { couponDiscount: discountAmount } });
                                res.json({ coupon: true });
                            }
                        }
                    }
                }
            } else {
               return res.json({used: true})
            }

        }
        // const cartExist = await Cart.findOne({ userId: userId });
        // if (cartExist && cartExist.discountAmount == null) {

        //     if (cartExist.couponDiscount) {
        //         console.log('chekk this ');
        //         await Coupon.updateOne({ _id: cartExist.couponId }, { $pull: { usedUser: userId } });
        //     } else {

        //     }
        // }


    } catch (error) {
        console.log(error.message);
    }
}



const removeCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        const userId = req.session.user_id;
        console.log(couponId, 'chkkk id  ', userId, 'hakoo');

        const updateCoupo = await Coupon.findOneAndUpdate({ _id: couponId }, { $pull: { usedUser: userId } });
        const cartStatus = await Cart.findOneAndUpdate({ userId: userId }, { $set: { couponDiscount: null } });

        res.json({ couponRemove: true });
    } catch (error) {
        console.log(error.message);

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