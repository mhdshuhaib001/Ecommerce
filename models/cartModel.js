const mongoose = require("mongoose")


const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User",
        require: true,
    },
    product: [{
        productId: {
            type: ObjectId,
            ref: "Products",
            required: true,
        },
        count: {
            type: Number,
            default: 1
        },
        price: {
            type: Number,
            default: 0
        },
        totalPrice: {
            type: Number,
            default: 0
        },
        image: {
            type: String,
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        }

    }]
})

module.exports = mongoose.model("Cart", cartSchema);

