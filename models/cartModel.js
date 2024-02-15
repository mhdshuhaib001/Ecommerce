const mongoose = require("mongoose")


const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
  userName: {
    type: String,
    required: true,
  },
  product: [
    {
      productId: {
        type: ObjectId,
        required: true,
        ref: "Products",
      },
      count: {
        type: Number,
        default: 1,
      },
      productPrice: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
      category: {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      productName: {
        type: String,
        required: true
      },

    },
  ],
  couponDiscount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
  }
});

module.exports = mongoose.model("Cart", cartSchema);


