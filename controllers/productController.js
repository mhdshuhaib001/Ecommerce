const Category = require('../models/categoryModel')
const Products = require('../models/productsModel')
const Cart = require('../models/cartModel')
const sharp = require('sharp')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const User = require('../models/userModel')

//--------------LOAD PRODUCT MANAGEMENT IN ADMIN SIDE------------------

const loadproduct = async (req, res) => {
  try {
    const itemPage = 10
    const page = +req.query.page || 1
    const totalProducts = await Products.countDocuments()
    const totalPages = Math.ceil(totalProducts / itemPage)
    const productData = await Products.find()
      .sort({ price: -1 })
      .skip((page - 1) * itemPage)
      .limit(itemPage)
      .populate('category')
    res.render('productmanagement', {
      productData,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//--------------------LOAD ADD PRODUCT PAGE---------------------

const loadAddProduct = async (req, res) => {
  try {
    const nameAlready = req.session.proNameAlready
    const categoryData = await Category.find({ blocked: false })
    res.render('addproduct', { categoryData, nameAlready })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

const addProduct = async (req, res) => {
  try {
    const alredy = await Products.findOne({ name: req.body.name })
    if (alredy) {
      req.session.proNameAlready = true
      return res.redirect('/admin/loadAddProduct')
    }

    const details = req.body
    const files = req.files

    // Check if files are available
    if (!files || !Array.isArray(files)) {
      console.log('No files found')
      return console.log('No files found')
    }

    // Process each uploaded image
    const img = files.map((file) => file.filename)

    for (let i = 0; i < img.length; i++) {
      await sharp('public/products/images/' + img[i])
        .resize(500, 500)
        .toFile('public/products/crops/' + img[i])
    }
    console.log('Details:', details)

    const products = await Products.find({})

    let product = new Products({
      name: details.name,
      price: details.price,
      quantity: details.quantity,
      category: details.category,
      description: details.description,
      blocked: false,
    })

    // Set images in the product document
    img.forEach((filename, index) => {
      product.images['image' + (index + 1)] = filename
    })

    const result = await product.save()
    res.redirect('/admin/productmanagement')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//---------------------BLOCK AND UNBLOCK PRODUCTS IN ADMIN SIDE---------------

const blockProduct = async (req, res) => {
  try {
    console.log(req.body.proId)
    const blockedproduct = await Products.findOne({ _id: req.body.proId })
    if (!blockedproduct.blocked) {
      await Products.updateOne(
        { _id: req.body.proId },
        { $set: { blocked: true } },
      )
      res.json({ success: true, message:"Product Blocked"})
    } else {
      await Products.updateOne(
        { _id: req.body.proId },
        { $set: { blocked: false } },
      )
      res.json({ success: true , message:"Product Unblocked"})
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//----------------------DELETING PRODUCT FROM PRODUCT MANAGEMENT-------------------

const deleteProduct = async (req, res) => {
  try {
    await Products.deleteOne({ _id: req.query.id })
    res.redirect('/admin/productmanagement')
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//--------------------LOAD EDITE PRODUCT PAGE-------------------

const loadEditProduct = async (req, res) => {
  try {
    const categoryData = await Category.find({ blocked: 0 })
    const editProduct = await Products.findOne({ _id: req.query.id })
    res.render('editproductpage', { product: editProduct, categoryData })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

//----------------------UPDATING PRODUCTS ----------------------------------------

const editedProduct = async (req, res) => {
  try {
    let details = req.body;
    let imagesFiles = req.files;
    let currentData = await Products.findOne({ _id: req.query.id });

    console.log('Request Details:', details);
    console.log('Request Files:', imagesFiles);
    console.log('Current Data:', currentData);

    const oldImg = Object.values(currentData.images);
    const img = Object.values(imagesFiles).map(
      (file) => file[0]?.filename || currentData.images[file.fieldname],
    );

    console.log('Old Images:', oldImg);
    console.log('New Images:', img);

    for (let k = 0; k < oldImg.length; k++) {
      if (oldImg[k] && !img.includes(oldImg[k])) {
        // Delete old images not present in the updated request
        let imagePath = path.resolve(__dirname, 'public/products/images', oldImg[k]);
        let cropPath = path.resolve(__dirname, 'public/products/crops', oldImg[k]);

        console.log(`Deleting old image: ${imagePath}`);
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkError) {
          console.error(`Error deleting file: ${imagePath}`, unlinkError);
        }

        console.log(`Deleting crop image: ${cropPath}`);
        try {
          fs.unlinkSync(cropPath);
        } catch (unlinkError) {
          console.error(`Error deleting file: ${cropPath}`, unlinkError);
        }
      }
    }

    let updateData = {
      name: details.name,
      price: details.price,
      quantity: details.quantity,
      category: details.category,
      description: details.description,
    };

    for (let i = 0; i < img.length; i++) {
      updateData[`images.image${i + 1}`] = img[i];
      await sharp(path.resolve(__dirname, 'public/products/images', img[i]))
        .resize(500, 500)
        .toFile(path.resolve(__dirname, 'public/products/crops', img[i]));
    }

    let update = await Products.updateOne(
      { _id: req.query.id },
      { $set: updateData },
    );

    res.redirect('/admin/productmanagement');
  } catch (error) {
    console.error(error.message);
    res.status(500).render('500');
  }
};



// product
const loadProduct = async (req, res) => {
  try {
    const productView = await Products.findOne({
      _id: req.query.id,
      blocked: 0,
    }).populate('category')
    if (!productView) {
      return res.status(404).render('404')
    }

    const categoryId = productView.category
    const userData = req.session.user_id
    const products = await Products.find({ blocked: 0 })
    const category = await Category.find({ blocked: 0 })
    const cart = await Cart.findOne({ userId: req.session.user_id })
    const relatedProduct = await Products.find({
      category: categoryId,
      blocked: 0,
    }).populate('category')
    let cartCount = 0
    if (cart) {
      cartCount = cart.product.length
    }

    res.render('product', {
      productView,
      category,
      products,
      cartCount,
      user: userData,
      relatedProduct,
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500')
  }
}


const searchAndFilterProducts = async (req, res) => {
  try {

    const userId = req.session.user_id
    const previousUrl = req.get('Referer');
    const currentUrl = req.originalUrl;

    const cart = await Cart.findOne({ userId: req.session.user_id });
    const categoryData = await Category.find({ blocked: 0 });
    const searchQueryRegex = /searchQuary=([^&]*)/;
    const searchQueryMatch = previousUrl ? previousUrl.match(searchQueryRegex) : null;
    const searchQuery = searchQueryMatch ? searchQueryMatch[1] : null;
    const currentSearchQuery = req.query.searchQuary;
    const priceRange = req.query.price;
    const sortOrder = req.query.sortOrder || 'lowToHigh';
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let filtered;
    let count;
    let cartCount = 0;

    if (cart) {
      cartCount = cart.product.length;
    }

    const finalSearchQuery = searchQuery || currentSearchQuery;

    if (finalSearchQuery) {
      const searchRegex = new RegExp(`^${finalSearchQuery}`, 'i');
      filtered = await Products.find({
        name: { $regex: searchRegex },
        blocked: 0,
      }).sort({ price: sortOrder === 'highToLow' ? -1 : 1 });
    } else {
      filtered = await Products.find({ blocked: 0 });
    }
    if (priceRange !== undefined && priceRange !== '0-1000000000') {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      filtered = filtered.filter(
        (product) => product.price >= minPrice && product.price <= maxPrice
      );
    }

    count = filtered.length;
    filtered = filtered.slice(skip, skip + limit);

    res.render('shop', {
      category: categoryData,
      count,
      name: req.session.name,
      products: filtered,
      cartCount,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit,
      totalProducts: count,
      user: userId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('500');
  }
};




module.exports = {
  loadproduct,
  loadAddProduct,
  addProduct,
  blockProduct,
  deleteProduct,
  loadEditProduct,
  editedProduct,
  loadProduct,
  searchAndFilterProducts,
}
