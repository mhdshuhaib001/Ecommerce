const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category',
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    image1: {
      type: String,
      required: true,
    },
    image2: {
      type: String,
      required: true,
    },
    image3: {
      type: String,
      required: true,
    },
    image4: {
      type: String,
      required: true,
    },
  },
  quantity: {
    type: Number,
    default: 0,
    required: true,
  },

  blocked: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
    required: true,
  },
})

module.exports = mongoose.model('Products', productSchema)
