const User = require("../models/userModel");

const isLogin = async (req,res,next)=>{

    try {
        if(req.session.user_id){
            console.log('Cannot Logem1');

            const userData = await User.findById(req.session.user_id)
            if(userData.is_blocked){
                console.log('Cannot Loge2');

                res.redirect('/login')
            }else{
                console.log('Cannot Loge3');

                next();
            }   
        }else{
            console.log('Cannot Loge4');

            res.redirect('/login')
        }
        
    } catch (error) {
        
        console.log(error.message);

    }
}

const isLogout = async (req, res, next) => {
    try {
        
        if (req.session.user_id) {
           res.redirect('/home');
        } else {
            next();
        }
        
    } catch (error) {
        
        console.log(error.message);

    }
}

module.exports = {
    isLogin,
    isLogout
}