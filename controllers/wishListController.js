const Wishlist = require("../models/wishListModel");

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
        const wishId = req.body.wishId;
        const userId = req.session.user_id;
        const wishData = await Wishlist.findOne({ 'products.productId': wishId });

console.log(wishData,'wishData');
        if(wishId) {
          console.log('wishdata remove ');
         const remove= await Wishlist.findOneAndUpdate(
            { 'products.productId': wishId},
            { $pull: { 'products': { 'productId': wishId} } }
          );
          console.log(remove,'produuct remove ');
          res.json({remove:true, message:"removed "})
        } else{
          console.log("wishdata added");
        const wishlistUpdate = await Wishlist.findOneAndUpdate(
            { user: userId },
            { $addToSet: { 'products': { productId: wishId } } }, 
            { upsert: true, new: true }
        );
        console.log(wishlistUpdate,'wishlistUpdate');
        res.json({ added: true,message: "Wishlist added successfully" }); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
}
}


  module.exports={
    loadWishlist,
    addWishList
  }