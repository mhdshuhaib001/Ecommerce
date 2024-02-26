const Category = require("../models/categoryModel");
const Products = require("../models/productsModel");
const Cart = require("../models/cartModel")
const sharp = require("sharp");
const fs = require("fs")
const path = require("path");
const User = require("../models/userModel")
const { userBlocked } = require("./adminController");




//--------------LOAD PRODUCT MANAGEMENT IN ADMIN SIDE------------------

const loadproduct = async (req, res) => {
    try {
        const itemPage = 10;
        const page = +req.query.page || 1;
        const totalProducts = await Products.countDocuments();
        const totalPages = Math.ceil(totalProducts / itemPage);
        const productData = await Products.find()
            .sort({ price: -1 })
            .skip((page - 1) * itemPage)
            .limit(itemPage)
            .populate('category')
        res.render("productmanagement", { productData, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}


//--------------------LOAD ADD PRODUCT PAGE---------------------

const loadAddProduct = async (req, res) => {
    try {
        const nameAlready = req.session.proNameAlready
        const categoryData = await Category.find({ blocked: false })
        console.log(categoryData);
        res.render("addproduct", { categoryData, nameAlready })
    } catch (error) {
        console.log(error.message);
    }
}


const addProduct = async (req, res) => {
    try {
        const alredy = await Products.findOne({ name: req.body.name });
        if (alredy) {
            req.session.proNameAlready = true;
            return res.redirect("/admin/loadAddProduct");
        }

        const details = req.body;
        const files = req.files;

        // Check if files are available
        if (!files || !Array.isArray(files)) {
            console.log("No files found");
            return console.log("No files found");
        }

        // Process each uploaded image
        const img = files.map((file) => file.filename);

        for (let i = 0; i < img.length; i++) {
            await sharp("public/products/images/" + img[i])
                .resize(500, 500)
                .toFile("public/products/crops/" + img[i])
        }
        console.log('Details:', details);

        const products = await Products.find({});

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
            product.images["image" + (index + 1)] = filename;
        });

        const result = await product.save();
        res.redirect("/admin/productmanagement");

    } catch (error) {
        console.log(error.message);

    }

}

//---------------------BLOCK AND UNBLOCK PRODUCTS IN ADMIN SIDE---------------

const blockProduct = async (req, res) => {
    try {
        console.log(req.body.proId)
        const blockedproduct = await Products.findOne({ _id: req.body.proId })
        if (!blockedproduct.blocked) {
            await Products.updateOne({ _id: req.body.proId }, { $set: { blocked: true } })
            // res.redirect("/admin/productmanagement")
            res.json({ success: true })
        } else {
            await Products.updateOne({ _id: req.body.proId }, { $set: { blocked: false } })
            // res.redirect("/admin/productmanagement")
            res.json({ success: true })
        }


    } catch (error) {
        console.log(error.message);
    }
}

//----------------------DELETING PRODUCT FROM PRODUCT MANAGEMENT-------------------

const deleteProduct = async (req, res) => {
    try {

        await Products.deleteOne({ _id: req.query.id })
        res.redirect("/admin/productmanagement")

    } catch (error) {
        console.log(error.message)
    }
}

//--------------------LOAD EDITE PRODUCT PAGE-------------------

const loadEditProduct = async (req, res) => {
    try {

        const categoryData = await Category.find({ blocked: 0 })
        const editProduct = await Products.findOne({ _id: req.query.id })
        res.render("editproductpage", { product: editProduct, categoryData })

    } catch (error) {
        console.log(error.message)

    }
}



//----------------------UPDATING PRODUCTS ----------------------------------------


const editedProduct = async (req, res) => {
    try {

        let details = req.body;
        let imagesFiles = req.files;
        let currentData = await Products.findOne({ _id: req.query.id });

        const oldImg = [
            imagesFiles.image1 ? currentData.images.image1 : false,
            imagesFiles.image2 ? currentData.images.image2 : false,
            imagesFiles.image3 ? currentData.images.image3 : false,
            imagesFiles.image4 ? currentData.images.image4 : false,
        ];

        const img = [
            imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1,
            imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2,
            imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3,
            imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4,
        ];


        for (let k = 0; k < oldImg.length; k++) {
            if (oldImg[k] && !img.includes(oldImg[k])) {
                let imagePath = path.resolve('public/products/images', oldImg[k]);
                let cropPath = path.resolve('public/products/crops', oldImg[k]);


                // Delete original image
                fs.unlinkSync(imagePath);

                // Delete cropped image
                fs.unlinkSync(cropPath);
            }
        }



        for (let i = 0; i < img.length; i++) {
            await sharp("public/products/images/" + img[i])
                .resize(500, 500)
                .toFile("public/products/crops/" + img[i]);
        }

        let img1, img2, img3, img4;

        img1 = imagesFiles.image1 ? imagesFiles.image1[0].filename : currentData.images.image1;
        img2 = imagesFiles.image2 ? imagesFiles.image2[0].filename : currentData.images.image2;
        img3 = imagesFiles.image3 ? imagesFiles.image3[0].filename : currentData.images.image3;
        img4 = imagesFiles.image4 ? imagesFiles.image4[0].filename : currentData.images.image4;

        let update = await Products.updateOne(
            { _id: req.query.id },
            {
                $set: {
                    name: details.name,
                    price: details.price,
                    quantity: details.quantity,
                    category: details.category,
                    description: details.description,
                    "images.image1": img1,
                    "images.image2": img2,
                    "images.image3": img3,
                    "images.image4": img4,
                },
            }
        );
        res.redirect("/admin/productmanagement");

    } catch (error) {
        console.log(error.message)

    }
}








// product
const loadProduct = async (req, res) => {
    try {
        const productView = await Products.findOne({ _id: req.query.id, blocked: 0 }).populate("category");
        if (!productView) {
            return res.status(404).render("404");
        }

        const categoryId = productView.category;
        console.log(categoryId, 'categoryId');

        const userData = req.session.user_id;
        
        const products = await Products.find({ blocked: 0 });
        const category = await Category.find({ blocked: 0 }); 

        console.log(productView, ']]]]]]]]]]]]]]]]]]');
        
        const cart = await Cart.findOne({ userId: req.session.user_id });
        const relatedProduct = await Products.find({ category: categoryId, blocked: 0 }).populate('category')


        let cartCount = 0;
        if (cart) {
            cartCount = cart.product.length;
        }

        res.render("product", { productView, category, products, cartCount, user: userData, relatedProduct });
    } catch (error) {
        console.error(error.message);
        res.status(500).render("500"); 
    }
};
const filterProducts = async (req, res) => {
    try {
        const priceRange = req.body.price;
        const sortOrder = req.body.sortOrder || 'lowToHigh';  
        const category = await Category.find({ blocked: 0 });

        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        let filtered;
        let count;

        const cart = await Cart.findOne({ userId: req.session.user_id });
        let cartCount = cart ? cart.product.length : 0;

        const user = await User.findOne({ _id: req.session.user_id });
        let wishCount = 0;

        if (priceRange !== undefined && priceRange !== '0-1000000000') {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);

            filtered = await Products.find({
                blocked: 0,
                price: { $gte: minPrice, $lte: maxPrice }
            }).sort({ price: sortOrder === 'highToLow' ? -1 : 1 })
            .skip(skip)
            .limit(limit);
            count = await Products.find({
                blocked: 0,
                price: { $gte: minPrice, $lte: maxPrice }
            }).count();
        } else {
            filtered = await Products.find({ blocked: 0 }).sort({ price: sortOrder === 'highToLow' ? -1 : 1 }).skip(skip).limit(limit);
            count = await Products.find({ blocked: 0 }).count();
        }

        res.render("shop", {
            category,
            count,
            name: req.session.name,
            products: filtered,
            cartCount,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            limit,
            totalProducts: count,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).render(500).send("Internal Server Error");
    }
};


module.exports = {
    loadproduct,
    loadAddProduct,
    addProduct,
    blockProduct,
    // deleteProduct,
    loadEditProduct,
    editedProduct,
    loadProduct,
    filterProducts,
}
