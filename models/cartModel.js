const mongoose = require("mongoose")

const cartSchema = mongoose.Schema({

    userId: {
      type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      product: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Product",
          },
          count: {
            type: Number,
            default: 1,
          },
          productPrice: {
            type: Number,
            required: true,
          },
          totalPrice: {
            type: Number,
            default: 0,
          },
          image:{
            type:String,
            required:true
          },
          productName:{
            type:String,
            required:true
          },
          category:{
            type:String,
            required:true
          }

        },
      ],
    });

module.exports = mongoose.model("Cart",cartSchema);

