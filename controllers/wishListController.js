const Wishlist = require('../models/wishListModel')
const Products = require('../models/productsModel')
const Cart = require('../models/cartModel')




// Wishlist
const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id
    const wishData = await Wishlist.find({ user: userId }).populate('products')
      const cart = await Cart.findOne({ userId: req.session.user_id })
    let cartCount = 0
    if (cart) {
      cartCount = cart.product.length
    }
    res.render('wishlist', { user: userId, wishData, cartCount })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}




const addWishList = async (req, res) => {
  try {
    const wishId = req.body.productId
    const userId = req.session.user_id
    const wishData = await Wishlist.findOne({ products: wishId })
    if (wishData) {
      const removedWishlist = await Wishlist.findOneAndUpdate(
        { products: wishId },
        { $pull: { products: wishId } },
        { new: true },
      )
      res.json({ removed: true, message: 'Item removed from wishlist' })
    } else {
      const wishlistUpdate = await Wishlist.findOneAndUpdate(
        { user: userId },
        { $addToSet: { products: wishId } },
        { upsert: true, new: true },
      )
      res.json({ added: true, message: 'Item added to wishlist' })
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500', { error: error.message })
  }
}





const removeWish = async (req, res) => {
  try {
    const productId = req.body.productId
    const userId = req.session.user_id

    const wishDelete = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { $in: [productId] } } },
      { new: true },
    )
    if (!wishDelete) {
      return res.status(404).json({ error: 'Product not found in wishlist' })
    } else {
      res.json({ remove: true, message: 'Item removed from wishlist' })
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500', { error: error.message })
  }
}

module.exports = {
  loadWishlist,
  addWishList,
  removeWish,
}
