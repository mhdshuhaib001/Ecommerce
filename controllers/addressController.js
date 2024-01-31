const Address = require("../models/addressModel");
const User = require("../models/userModel");



const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const existingAddress = await Address.findOne({ user: userId });
    let addressData;
    if (existingAddress) {
      addressData = existingAddress.address;
    } else {
      addressData = [];
    }
    const newAddress = {
      fullname: req.body.fullname,
      mobile: req.body.mobile,
      email: req.body.email,
      houseName: req.body.houseName,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode
    };
    addressData.push(newAddress);
    const updatedAddress = await Address.findOneAndUpdate(
      { user: userId },
      { $set: { user: userId, address: addressData } },
      { upsert: true, new: true }
    );

    if (updatedAddress) {
      res.json({ success: true, message: "Address added!" });
    } else {
      res.json({ failed: true, message: "Someting went wrong!" });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const removeAddress = async (req, res) => {
  try {
    const addressId = req.body.id;
    await Address.updateOne(
      { user: req.session.user_id },
      { $pull: { address: { _id: addressId } } }
    );
    res.json({ remove: true });
  } catch (error) {
    console.log(error.message);

  }
}

const editAddress = async (req, res) => {
  try {
    const addressId = req.body.id;
    console.log(req.body)
    const updated = await Address.findOneAndUpdate(
      { user: req.session.user_id, "address._id": addressId },
      {
        $set: {
          "address.$.fullname": req.body.fullname,
          "address.$.email": req.body.email,
          "address.$.mobile": req.body.mobile,
          "address.$.houseName": req.body.houseName,
          "address.$.city": req.body.city,
          "address.$.state": req.body.state,
          "address.$.pincode": req.body.pincode,
          "address.$.default": req.body.isDefault
        }
      },
      { new: true }
    );
    res.json({ success: true, message: 'Address edited !' });
  } catch (error) {
    console.log(error.message);
  }
}


 const editProfile = async (req, res) => {
   try {

    console.log(req.body);
    const userId = req.session.user_id;
    console.log(userId);
    const update = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          name: req.body.fullname,
          email: req.body.email,
          mobile: req.body.mobile
        }
      },
      {new : true }
    )

      console.log(update,'chek update');
      if(update) {
        res.json({success: true});
      }
   } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
   }
}




module.exports = {
  addAddress,
  removeAddress,
  editAddress,
  editProfile
};
