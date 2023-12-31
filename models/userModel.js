const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
     is_admin:{
        type:Number,
        required:true,
        default:false
    },
    is_blocked:{
        type:Boolean,
        required:true,
        default:false
    },
    is_verified:{
        type:Boolean,
        default:false,
        required:true,
       
    }
})

// module.exports = mongoose.model("User",userSchema)

const User = mongoose.model('User', userSchema);
module.exports = User;