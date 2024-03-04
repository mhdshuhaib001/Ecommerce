const { default: mongoose } = require('mongoose')
const mongoos = require('mongoose')

const couponSchema = new mongoos.Schema({
  name: {
    type: String,
    required: true,
  },
  couponCode: {
    type: String,
    required: true,
  },
  discountAmount: {
    type: Number,
  },
  activeDate: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: String,
    required: true,
  },
  criteriaAmount: {
    type: Number,
    required: true,
  },
  usedUser: {
    type: Array,
    required: true,
  },
  userLimit: {
    type: Number,
    required: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
})

module.exports = mongoose.model('Coupon', couponSchema)
