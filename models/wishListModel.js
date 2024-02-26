const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    ref: "User",
  },
  products: [
    {
      type: String,
      ref: "Products",
    },
  ],
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
