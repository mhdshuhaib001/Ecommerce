const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    blocked:{
        type:Number,
        default:false
    }

});

 module.exports = mongoose.model("Category",categorySchema)