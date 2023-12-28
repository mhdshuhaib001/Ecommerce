const mongoose = require("mongoose")


const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:"User",
        require:true,
    },
    product : [{
        productId:{
            type:ObjectId,
            ref:"Products",
            required:true,
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            default:0
        },
        totalPrice:{
            type:Number,
            default:0
        }

    }]
})
// const cartSchema = mongoose.Schema({

//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: "User",
//       },
//       product: [
//         {
//           productId: {
//             type: mongoose.Schema.Types.ObjectId,
//             required: true,
//             ref: "Products",
//           },
//           count: {
//             type: Number,
//             default: 1,
//           },
//           productPrice: {
//             type: Number,
//             required: true,
//           },
//           totalPrice: {
//             type: Number,
//             default: 0,
//           },
//           image:{
//             type:String,
//             required:true
//           },
//           productName:{
//             type:String,
//             required:true
//           },
//           category:{
//             type:String,
//             required:true
//           }

//         },
//       ],
//     });

module.exports = mongoose.model("Cart",cartSchema);

