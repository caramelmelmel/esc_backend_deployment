const pool = require('../config/database')
const stats = require('../helpers/status')

const getAllNonCompliances = async(req,res)=>{
    //tenant email
    res.send("You are trying to get all the non compliances")
    const ten_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const noncomp = await pool.query('select noncompliances from new_audit where tenant_id = $1',[ten_id])[0].noncompliances
    if (!noncomp){
        return res.status(404).send(noncomp)
    }
    return res.status(stats.status.success).json(noncomp)
}

const UpdateNoncompfromtenant = async(req,res)=>{
    const ten_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const non_comp = await pool.query('update new_audit set noncompliances = $1 where tenant_id = $2 returning noncompliances',[req.body.noncompliances,ten_id])[0].noncompliances
    if (!noncomp){
        return res.status(404).send("return unsuccessfully")
    }
    return res.status(stats.status.success).send(`The list of non compliances is ${non_comp}`)
}

module.exports = {getAllNonCompliances,UpdateNoncompfromtenant}
