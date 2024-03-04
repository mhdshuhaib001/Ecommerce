const multer = require('multer')
const path = require('path')
const fs = require('fs')

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, '../public/products/images'))
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname),
    )
  },
})

const upload = multer({ storage: Storage })

const productImagesUpload2 = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
])

module.exports = {
  productImagesUpload2,
}
