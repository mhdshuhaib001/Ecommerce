const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deliveryDetails: {
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
  orderId: {
    type: String,
  },
  orderProducts: [
    {
      productName: {
        type: String,
        required: true,
      },
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Products',
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
        default: 'Placed',
      },
      returnReason: {
        type: String,
      },
      cancelReason: {
        type: String,
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
    type: String,
  },
  shippingMethod: {
    type: String,
  },
  couponUsed: {
    type: mongoose.Types.ObjectId,
    ref: 'coupons',
    default: null,
  },
  status: {
    type: String,
  },
})

module.exports = mongoose.model('Order', orderSchema)
