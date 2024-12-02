const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
  },
  is_admin: {
    type: Boolean,
    required: true,
    default: false,
  },
  is_blocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  is_verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  token: {
    type: String,
    default: '',
  },
  wallet: {
    type: Number,
    default: 0,
  },
  walletHistory: [
    {
      transactionDate: {
        type: Date,
        required: true,
      },
      amount: {
        type: Number,
      },
      reason: {
        type: String,
      },
      direction: {
        type: String,
      },
    },
  ],
})

// module.exports = mongoose.model("User",userSchema)

const User = mongoose.model('User', userSchema)
module.exports = User
