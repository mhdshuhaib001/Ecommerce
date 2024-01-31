const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const Category = require("../models/categoryModel");
const categoryModel = require("../models/categoryModel");




const adminLoginPage = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message)
    }
}

//-------------------------Log out---------------------

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect("/admin")
    } catch (error) {
        console.log(error.message);
    }
}


const adminVerify = async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;
        const adminData = await User.findOne({ email: email });

        if (adminData) {
            const matchPassword = await bcrypt.compare(password, adminData.password);

            if (matchPassword) {
                if (adminData.is_admin === true) {
                    req.session.admin_id = adminData._id;
                    console.log("Admin chck")
                    res.redirect('/admin/home');
                } else {
                    res.render('login', { error: 'email not found' });
                }
            } else {
                res.render('login', { error: 'incorrect password' });
            }

        } else {
            res.render('login', { error: 'Email not found' })
        }
    } catch (error) {
        console.log(error.message);

    }
}

//---------------------load Dashboard----------------

const loadDashboard = async (req, res) => {
    try {
        res.render("home")
    } catch (error) {
        console.log(error.message)
    }
}

//-----------------------User Management--------------------

const usermanagementload = async (req, res) => {
    try {
         const userData = await User.find({ is_admin: false });
        res.render("usermanagement", { users: userData });
    } catch (error) {
        console.log(error.message)
    }
}

//-------------------- Block Or Unblock User -------------

const userBlocked = async (req, res) => {
    try {
        const userId = req.body.userId;
        const blockedUser = await User.findOne({ _id: userId });
        console.log(blockedUser)

        if (!blockedUser.is_blocked ) {
             await User.updateOne({ _id: userId }, { $set: { is_blocked: true } });
            res.json({remove:true})

        } else {
            await User.updateOne({ _id: userId }, { $set: { is_blocked: false } })
            res.json({remove:true})        }
    } catch (error) {
        console.log(error.message);
    }
} 


//----------------LOAD CATEGORY MANAGEMENT-----------------

const loadcategory = async (req, res) => {
    try {

         const categoryData = await Category.find()
        res.render("categorymanagement",{ categoryData: categoryData })
        

    } catch (error) {
        console.log(error.message);
    }
}

//----------------LOAD ADD CATEGORY-----------------

const loadAddCategory = async (req, res) => {

    try {
        res.render("addcategory")
    } catch (error) {
        console.log(error.message)
    }
}


const addCategory = async (req,res) =>{
    try {

        
        const name = req.body.categoryname
      
        const data = new categoryModel({
            name: req.body.categoryname
        });
        console.log(data)

        const already = await categoryModel.findOne({ name: { $regex: name, $options: "i" } });
         console.log(already)
        if(already) {
            res.render("addcategory", { message: "Entered category is already exist." });
        }else {
            const categoryData = await data.save();
            res.redirect("/admin/categorymanagement");
        }

        
    } catch (error) {
        console.log(error.message);
        
    }
}

//--------------------BLOCK AND UNBLOCK CATEGORY-----------

const blockCategory = async (req, res) => {
    try {

        const blockedcategory = await Category.findOne({ _id: req.body.catId })
        if (!blockedcategory.blocked ) {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: true } })
            // res.redirect("/admin/categorymanagement")
            res.json({success:true})
        } else {
            await Category.updateOne({ _id: req.body.catId }, { $set: { blocked: false } })
            // res.redirect("/admin/categorymanagement")
            res.json({success:true})
        }

    } catch (error) {
        console.log(error.message)

    }
}

//----------------LOAD EDIT CATEGORY PAGE--------------

const loadeditCategory = async (req, res) => {
    try {

        const categoryId = req.query.id
        const category = await Category.findOne({ _id: categoryId })
        res.render("editcategory", { category: category })

    } catch (error) {
        console.log(error.message)

        }
}


//--------------------UPDATE CATEGORY-------------

const updateCategory = async (req, res) => {
    try {

        const categoryId = req.query.id
        const updatecategory = await Category.updateOne({ _id: categoryId }, { $set: { name: req.body.categoryName } })
        if (updatecategory) {
            res.redirect("/admin/categorymanagement")
        } else {
            res.render("editcategory", { message: "There is an error occured, try again!" })
        }
    } catch (error) {
        console.log(error.message)

    }
}


//----------------DELETE CATEGORY IN CATEGORY MANAGEMENT-----------------

const deleteCategory = async (req, res) => {
    try {

        await Category.deleteOne({ _id: req.query.id })
        res.redirect("/admin/categorymanagement")

    } catch (error) {
        console.log(error.message)
    }
}






module.exports = {
    adminLoginPage,
    adminVerify,
    loadDashboard,
    usermanagementload,
    userBlocked,
    logout,
    loadcategory,
    loadAddCategory,
    addCategory,
    loadeditCategory,
    blockCategory,
    updateCategory,
    deleteCategory,  
}