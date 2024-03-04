
const Banner = require("../models/bannerModel")
const fs = require("fs")


const bannerLoad = async (req, res) => {
    try {

        const bannerData = await Banner.find({})
        res.render("bannerManagement",{bannerData}); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const loadaddBanner = async(req,res)=>{
    try {
        res.render("addBanner")
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
}


const addBanner = async (req, res) =>{
    try {

        const BannerData = new Banner({
            title:  req.body.title,
            description:req.body.description,
            image:req.file.originalname,
            is_blocked:false
        })
        await BannerData.save()

        res.redirect('/admin/bannerManagement')

    } catch (error) {
        
    }
}


const blockAndunblock = async (req, res) => {
    try {
        const bannerId = req.body._id;

        const bannerData = await Banner.findById({bannerId});

 
        if (bannerData.is_blocked === true) {
            await Banner.findOneAndUpdate({ _id: bannerId }, { $set: { is_blocked: false } });
            res.json({ block: true, message: 'Banner successfully unblocked.' });
        } else {
            await Banner.findOneAndUpdate({ _id: bannerId }, { $set: { is_blocked: true } });
            res.json({ block: true, message: 'Banner successfully blocked.' });
        }
    } catch (error) {
        res.render('500');
    }
};


const deleteBanner = async(req,res) =>{
    try {
        const bannerId = req.body._id;
        await Banner.findOneAndDelete({_id:bannerId})
        res.json({delete:true , message:'Banner successfully Deleted.'})
    } catch (error) {
        res.render('500');

    }
}


const editBannerload = async (req,res) =>{
    try {
        const bannerId = req.query._id
        const bannerData = await Banner.findById(bannerId)
        res.render("editBanner",{banner:bannerData})
    } catch (error) {
        
        res.render("500");
    }
}

const editBanner = async (req, res) => {
    try {
      let image;
      const bannerId = req.query._id;
      const bannerData = await Banner.findById(bannerId);
  
      const imagePathOrginal = `public/admin/images/bannerImg/images/${bannerData.image}`;
      if (fs.existsSync(imagePathOrginal)) {
        fs.unlinkSync(imagePathOrginal);
      } else {
        console.log('File does not exist:', imagePathOrginal);
      }
  
      if (req.file && req.file.originalname) {
        image = req.file.originalname;
      } else {
        image = bannerData.image;
      }
  
      await Banner.findOneAndUpdate(
        { _id: bannerId },
        {
          title: req.body.title,
          description: req.body.description,
          image: image,
        }
      );
  
      res.redirect("/admin/bannerManagement");
    } catch (error) {
      console.error(error.message);
      res.render('500');
    }
  };
  

module.exports = {
    bannerLoad,
    loadaddBanner,
    addBanner,
    blockAndunblock,
    deleteBanner,
    editBannerload,
    editBanner
};
