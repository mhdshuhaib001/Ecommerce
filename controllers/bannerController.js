



const bannerLoad = async(req,res)=>{
    try {
        
        res.render("/bannerManagement")
    } catch (error) {
        
    }
}



module.exports ={
    bannerLoad
}