const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryDetails: [
    {
      type: Object,
      required: true,
    }
  ],
  products: [
    {
      productId: {
        type: String,
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
      },
      status: {
        type: String,
      }
    },
  ],

  cancelReason: {
    type: String
  },
  returnReason: {
    type: String
  },
  totalAmount: {
    type: Number,
  },
  date: {
    type: Date,
  },
  status: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  orderId: {
    type: String,
  },
  paymentId: {
    type: String
  },
  shippingMethod: {
    type: String,
  },
  shippingAmount: {
    type: Number,
  },
});

module.exports = mongoose.model("Order", orderSchema);