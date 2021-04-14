//CORE functionalities 
// THIS FILE IS FOR STAFF ONLY 

const stats = require('../helpers/status')
const pool = require("../config/database")
//import the staff and tenant check 
const checkStaffTenant = require('../helpers/checkstaffTenant')
const fs = require('fs')

// for the staff route only

//1. create audit 

//need tenant name, 
const createAudit = async(req,res)=>{
    console.log(`${req.body}`)
    checkStaffTenant(req)
    //new audit insert 
    const crNewAuditQuery = 'INSERT INTO new_audit (aud_score,date_record,inst_id,category_ID,tenant_id,staff_id,noncompliances) values ($1, $2,$3,$4,$5,$6,$7) RETURNING *'

    try{
    const crNewAudit = pool.query(crNewAuditQuery,[req.body.performancescore,req.body.date,rows[0].institution_id,rows[0].category_id,tenantIn[0].tenant_id,rows[0].staff_id,req.body.noncomplainces])

    //insert properly check 
    stats.successMessage.data = crNewAudit
    return res.status
    }
    catch(error){
        console.log(error)
        stats.errorMessage.error = 'Operation was not successful'
        return res.status(stats.status.error).send(stats.errorMessage)
    }
}

//2. view the audit in progress (update uncompleted audits)
//use the update query
/*staffemail:

tenantemail:

auditid: "5",

institution_name: "CGH"

Staffemail:

institution_name: "CGH",

store_name: "Popular",

type: “FB” OR “Non_FB” ,

auditdate: "2018-01-03T19:04:28.809Z",

performancescore: 95,

comments:[ text, image, staff/tenant ]

noncomplainces: {

{ncprofessionalism_02:  comments: [[Example, data:image/jpeg;base64,/9j/4, staff], [Example, data:image/jpeg;base64,/9j/4, tenant]], resolved: false }, */
const ViewuncompletedAudits = async(req,res)=>{
    checkStaffTenant(req)
    const queryStaffID = 'select * from staff where email = $1'
    const queryGetAud = 'SELECT * from new_audit where staff_id = $1'
    //json object
    var allAudits = {}
    
    //retrieve all audits with respect to the staff id
    try{
        const getstaff = pool.query(queryStaffID,[req.body.Staffemail]);
        const getaud = pool.query(queryGetAud,[getstaff[0].staff_id])
        //get length of the table queried
        const countaud = pool.query('select count(*) from $1',[getaud])

        //send the audit to front end in json for rendering 
        for(var i = 0;i<countaud[0].count;i++){
            var audit = "audit" + i;
            const tenant_name = pool.query('SELECT store_name from tenant where tenant_id = $1',[getaud[i].tenant_id])
            const category_name = pool.query('SELECT category_name from category where category_id = $1',[getaud[i].category_id])
            const inst_name = pool.query('SELECT institution_name from singhealth_institutions where institution_id = $1',[getaud[i].institution_id])
            allAudits[audit] =  {
                "tenant_name": tenant_name[0],
                "category": category_name[0],
                "institution_name": inst_name[0],
                "noncompliances":getaud[i].noncompliances,
                "performance_score ": getaud[i].aud_score
            }
        }
        res.status(stats.status.successMessage).send(allAudits);
    }
    catch(err){
        res.status(stats.error).send("Error retrieving from the tenant or staff")

    }
}


const viewtenantUpdates = async(req,res)=>{
    //get json 
    //get tenant_id
    //get staff_id
    const tenant_id = pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const staff_id = pool.query('select staff_id from staff where email = $1',[req.body.staff_email])[0].staff_id
    const getnoncompliances = pool.query('select ')

}


//3.update audits (update the audits table)
//if there are audits to update 
const updateAudit = {

}

//4. past audits (look at staff view)
const pastAudits = async (req,res)=>{

}

//5. resolve audits (send via email)
const resolveAudits = async

module.exports = {
    resolveAudits,
    pastAudits,
    updateAudit,
    viewtenantUpdates,
    ViewuncompletedAudits,
    createAudit
}
