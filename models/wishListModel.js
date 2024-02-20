const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    ref: "User  ",
  },
  products: [
    {
      productId: {
        type: String,
        required: true,
        ref: "Products",
      },
    },
  ],
});

module.exports = mongoose.model("Wishlist", wishlistSchema);