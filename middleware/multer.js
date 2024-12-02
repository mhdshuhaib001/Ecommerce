const multer = require('multer');
const path = require('path');

// To upload multiple product images
const productImagesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/products/images'));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const productImagesUpload = multer({ storage: productImagesStorage }).array('images', 4);

// To upload a single banner image
const bannerStorage = multer.diskStorage({
  destination: "public/admin/bannerImg/images",
  filename: (req, file, cb)=> {

    const filename = file.originalname;
    cb(null, filename)

  }

});

const bannerUpload = multer({ storage: bannerStorage }).single('image');

module.exports = { productImagesUpload, bannerUpload };
