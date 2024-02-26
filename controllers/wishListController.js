const Wishlist = require("../models/wishListModel");
const Products = require("../models/productsModel")


// Wishlist
const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const wishData = await Wishlist.find({ user: userId }).populate("products");
    const productIds = wishData.map(wishlist => wishlist.products.map(product => product.productId));
console.log(wishData);
    console.log(productIds, '------productIds');

    res.render("wishlist", { wishData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addWishList = async (req, res) => {
  try {
      const wishId = req.body.productId;
      const userId = req.session.user_id;
console.log(wishId,'============',req.body);
      // Check if wishId is defined and not an empty string
      if (!wishId || typeof wishId !== 'string') {
          return res.status(400).json({ error: "Invalid wishId" });
      }

      // Check if the wishId exists in any wishlist for the user
      const wishData = await Wishlist.findOne({ 'products': wishId });
      console.log(wishData,'------------------');

      if (wishData) {
          // If wishId exists, remove it from the wishlist
          const removedWishlist = await Wishlist.findOneAndUpdate(
              { 'products': wishId },
              { $pull: { 'products': wishId } },
              { new: true } // Return the modified document
          );

          console.log(removedWishlist, 'Product removed from wishlist');
          res.json({ removed: true, message: "Item removed from wishlist" });
      } else {
          // If wishId doesn't exist, add it to the wishlist
          const wishlistUpdate = await Wishlist.findOneAndUpdate(
              { user: userId },
              { $addToSet: { 'products': wishId } },
              { upsert: true, new: true } // Create a new wishlist if not found
          );

          console.log(wishlistUpdate, 'Wishlist updated');
          res.json({ added: true, message: "Item added to wishlist" });
      }
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: error.message });
  }
};




  module.exports={
    loadWishlist,
    addWishList
  }