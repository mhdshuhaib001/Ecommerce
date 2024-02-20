const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryDetails:
  {
    fullname: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    houseName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  orderProducts: [
    {

      productName: {
        type: String,
        required: true,
      },
      orderId: {
        type: String,

      },
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Products",
      },
      count: {
        type: Number,
        required: true,
        default: 1,
      },
      productPrice: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["Placed", "Shipped", "Delivered", "Cancelled"], 
        default: "Placed",
      },      
      returnReason: {
        type: String,
      },
      statusChangeTime: {
        type: Date,
        default: Date.now,
      },      
    },
  ],
  totalAmount: {
    type: Number,
  },
  purchaseDate: {
    type: Date,
    required: true,
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
  status: {
    type: String,
  }
});

module.exports = mongoose.model("Order", orderSchema);
