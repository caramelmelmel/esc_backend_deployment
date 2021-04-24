const gettimeCpu = async (req,res)=>{
    try{
    res.send("Worker process is running at "+Date.now().toString())
    }
    catch(error){
        res.send("no worker proceess")
    }
}
module.exports = gettimeCpu