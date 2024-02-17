const User = require('../models/userModel')

const isLogin = async (req,res,next)=>{
    try {
        
        if(req.session.user_id){
            const blockedUser = await User.findOne({ _id: req.session.user_id });
            if(blockedUser.is_blocked === false){
                next()
            }else{
                let regSuccess = false
                res.render('login',{is_blocked: true ,regSuccess})
            }
        }else{
            res.redirect('/')
        }
      

    } catch (error) {
        console.log(error);
    }
}

const isLogout = async (req,res,next)=>{
    try {
        
        if(req.session.user_id){
            res.redirect('/home')
        }else{
            next()
        }
        

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isLogin,
    isLogout
}