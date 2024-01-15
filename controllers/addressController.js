const Address = require("../models/addressModel");
const User = require("../models/userModel");



const addAddress = async (req, res) => {
    try {
      const userId = req.session.user_id;
      console.log(userId, "check user Id ");
      
      // Retrieve the user's existing addresses
      const existingAddress = await Address.findOne({ user: userId });
      
      let addressData;
      
      if (existingAddress) {
        // If the user already has an address, use it
        addressData = existingAddress.address;
      } else {
        // If the user doesn't have an address, create a new empty array
        addressData = [];
      }
  
      // Create a new address object
      const newAddress = {
        fullname: req.body.fullname,
        mobile: req.body.mobile,
        email: req.body.email,
        houseName: req.body.houseName,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
      };
  
      // Push the new address to the addressData array
      addressData.push(newAddress);
  
      // Update or insert the address into the database
      const updatedAddress = await Address.findOneAndUpdate(
        { user: userId },
        { $set: { user: userId, address: addressData } },
        { upsert: true, new: true }
      );
  
      if (updatedAddress) {
        res.json({ success: true });
      } else {
        res.json({ failed: true });
      }
  
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  

const removeAddress = async (req,res)=>{
    try {
        const addressId = req.body._id;
        console.log(addressId,'Id')
        await Address.updateOne(
            {user: req.session.user_id},
            {$pull: {address: { address:addressId}}}
        );
        res.json({remove:true});
    } catch (error) {
        console.log(error.message);
        
    }
}




module.exports = {
  addAddress,
  removeAddress
};
