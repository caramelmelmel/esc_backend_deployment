const pool = require('../config/database')
const stats = require('../helpers/status')

const getAllNonCompliances = async(req,res)=>{
    try{
    //tenant email
    console.log("You are trying to get all the non compliances")
    //const ten_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const ten_id = await pool.query('select tenant_id from tenant where store_name = $1',[req.body.store_name])
    const tenant_id = ten_id.rows[0].tenant_id
    const staffget = await pool.query('select staff_id from staff where email=$1',[req.body.staff_email])
    const staff_id = staffget.rows[0].staff_id
    const noncomp = await pool.query('select noncompliances from new_audit where tenant_id = $1 and staff_id = $2',[tenant_id,staff_id])
    const non_comp = noncomp.rows[0].noncompliances
    if (!non_comp){
        return res.status(404).send(noncomp)
    }
    console.log('retrieving from db')
    return res.status(stats.status.success).json(noncomp)
}
    catch(error){
        console.log(`${error}`)
        //return res.status(stats.status.bad).send('Bad request')
    }
}

const UpdateNoncompfromtenant = async(req,res)=>{
    //const ten_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const ten_id = await pool.query('select tenant_id from tenant where store_name = $1',[req.body.store_name])
    const tenant_id = ten_id.rows[0].tenant_id
    const non_comp = await pool.query('update new_audit set noncompliances = $1 where tenant_id = $2 returning noncompliances',[req.body.noncompliances,tenant_id])
    const noncomp = non_comp.rows[0].noncompliances
    if (!noncomp){
        return res.status(404).send("return unsuccessfully")
    }
    return res.status(stats.status.success).json(noncomp)
}

module.exports = {getAllNonCompliances,UpdateNoncompfromtenant}
