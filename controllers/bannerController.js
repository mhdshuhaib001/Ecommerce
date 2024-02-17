

const loadBanner = async (req, res) =>  {
    try {
        res.render('bannerManagement')
    } catch (error) {
        console.log(error.message);
    }
}

const addBanner = async (req,res)=>{
    try{
        res.render('addBanner');
    } catch{
        console.log(error.message);
    }
}

module.exports={
    loadBanner,
    addBanner
}