//CORE functionalities 
// THIS FILE IS FOR STAFF ONLY 

const stats = require('../helpers/status')
const pool = require('../config/database')
//import the staff and tenant check 
//const checkStaffTenant = require('../helpers/checkstaffTenant')


// for the staff route only

//1. create audit 

const createAudit = async(req,res)=>{
    console.log(`${req.body}`)
    const signinStaffQuery = 'SELECT * FROM staff WHERE email = $1';
    const signinTenantQuery = 'SELECT * FROM tenant WHERE email = $1';
    const categoryQuery = 'SELECT category_ID from category where category_name = $1'
    //verify the staff accessing the login 
    const {rows} = await pool.query(signinStaffQuery,[req.body.staff_email])
    const tenantIn = await pool.query(signinTenantQuery,[req.body.tenant_email])
    //get the category 
    const categoryRetrieve = await pool.query(categoryQuery,[req.body.type])
    if (!rows[0] && !tenantIn[0]){
        return res.status(stats.status.notfound).send('Unable to create as tenant and staff are not found')
    }

    //check for both tenant and staff to be under the same institute 
    else if(!(rows[0].institution_id === tenantIn[0].institution_id)){
        return res.status(stats.status.conflict).send("Both staff and tenant are not in the same institute")
    }

    //check if the tenant category also agrees with the category that is passed
    else if(!(tenantIn[0].category_id === categoryRetrieve[0].category_id)){
        return res.status(stats.status.bad).send("tenant is not in the correct category")
    }
    //new audit insert 
    const crNewAuditQuery = 'INSERT INTO new_audit (aud_score,date_record,inst_id,category_ID,tenant_id,staff_id,noncompliances) values ($1, $2,$3,$4,$5,$6,$7) RETURNING *'
    try{
    const crNewAudit = await pool.query(crNewAuditQuery,[req.body.performancescore,req.body.date,rows[0].institution_id,rows[0].category_id,tenantIn[0].tenant_id,rows[0].staff_id,req.body.non_compliances])

    //insert properly check 
    stats.successMessage.data = crNewAudit
    return res.status(stats.status.success).send('created new audit successfully!')
    }
    catch(error){
        console.log(error)
        stats.errorMessage.error = 'Operation was not successful'
        return res.status(stats.status.error).send(stats.errorMessage)
    }
}
//get non-comp when pressing button to view audit itself, front end to save
const getNonCompliance = async(req,res)=>{
    const tenant_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const staff_id = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])[0].staff_id
    const noncomp = await pool.query('select noncompliances from new_audit where tenant_id = $1 and staff_id = $2',[tenant_id,staff_id])[0].noncompliances
    if(!tenant_id||staff_id){
        return res.status(stats.status.bad).send("Tenant or staff not in the database");
    }
    return res.status(stats.status.success).send(noncomp)
}

//retrieve tenant email is the front end daichi
const ViewuncompletedAudits = async(req,res)=>{
    const signinStaffQuery = 'SELECT * FROM staff WHERE email = $1';
    const signinTenantQuery = 'SELECT * FROM tenant WHERE email = $1';
    //const categoryQuery = 'SELECT category_ID from category where category_name = $1'
    //verify the staff accessing the login 
    const {rows} = await pool.query(signinStaffQuery,[req.body.staff_email])
    const tenantIn = await pool.query(signinTenantQuery,[req.body.tenant_email])
    //get the category 

    //check for both tenant and staff to be under the same institute 
    if(!(rows[0].institution_id === tenantIn[0].institution_id)){
        return res.status(stats.status.conflict).send("Both staff and tenant are not in the same institute")
    }

    const queryStaffID = 'select * from staff where email = $1'
    const queryGetAud = 'SELECT * from new_audit where staff_id = $1'
    //json object
    var allAudits = {}
    
    //retrieve all audits with respect to the staff id
    try{
        const getstaff = await pool.query(queryStaffID,[req.body.Staffemail]);
        const getaud = await pool.query(queryGetAud,[getstaff[0].staff_id])
        //get length of the table queried
        const countaud = await pool.query('select count(*) from $1',[getaud])

        //send the audit to front end in json for rendering 
        for(var i = 0;i<countaud[0].count;i++){
            var audit = "audit" + i;
            const tenant_name = await pool.query('SELECT store_name from tenant where tenant_id = $1',[getaud[i].tenant_id])
            const category_name = await pool.query('SELECT category_name from category where category_id = $1',[getaud[i].category_id])
            const inst_name = await pool.query('SELECT institution_name from singhealth_institutions where institution_id = $1',[getaud[i].institution_id])
            allAudits[audit] =  {
                "tenant_name": tenant_name[0],
                "category": category_name[0],
                "institution_name": inst_name[0],
                "noncompliances":getaud[i].noncompliances,
                "performance_score ": getaud[i].aud_score
            }
        }
        return res.status(stats.status.successMessage).json(allAudits);
    }
    catch(err){
        return res.status(stats.error).send("Error retrieving from the tenant or staff")

    }
}


const viewtenantUpdates = async(req,res)=>{
    //get json 
    //get tenant_id
    //get staff_id
    const tenant_id = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])[0].tenant_id
    const staff_id = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])[0].staff_id
    const getnoncompliances = await pool.query('select noncompliances from new_audit where staff_id = $1 and tenant_id = $2',[staff_id,tenant_id])[0].noncompliances
    return res.status(201).send(getnoncompliances)
}


//3.update audits (update the audits table)
//if there are audits to update 
//not all compliances are resolved
const updateAudit = async(req,res)=>{
    //update the table with the new json
    const dbResponse = await pool.query('update new_audit set noncompliances = $1, update_date = $2 returning *',[req.body.noncompliances,req.body.update_date]);
    if(!dbResponse){
        return res.status(stats.status.bad).send('Update failure')
    }

    return res.status(stats.status.success).send('updated successfully')

}

//4. past audits (look at staff view)
//retrieve 
const pastAudits = async (req,res)=>{
    //tenant name 
    //staff email -> id 
    //performance score
    //resolved audit date
    const staff_id = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])[0].staff_id
    const startaud_date = await pool.query('select date_record from new_audit where staff_id = $1',[staff_id])[0]
    const getPastAud = await pool.query('select * from past_audits where staff_id = $1',[staff_id])
    var returnbody = {
        "staff_name": staff_id.staff_name,

    }

    //get length of the table
    const count_past_aud = await pool.query('select count(*) from past_audits where staff_id = $1',staff_id)[0].count

    //add objects to the json
    for(var i = 0; i<count_past_aud;i++){
        //get tenant
        const getTenant = await pool.query('select * from tenant where tenant_id = $1',[getPastAud[i].tenant_id])  
        returnbody[staff_name] = {
            "tenant_name": getTenant[0].tenant_name,
            "performance_score": getPastAud[i].aud_score,
            "resolved_aud_date": getPastAud[i].resolved_audit_date,
            "start_audit_date": getPastAud[i].audit_date            
        }
    }
    return res.status(stats.status.success).json(returnbody)


}

//5. resolve audits (send via email)
//only if all the non compliances are resolved
const resolveAudits = async (req,res)=>{
    //insert into past audits 
    //delete from new audits 
    const staff_id = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])[0].staff_id
    const {rows} = await pool.query('INSERT INTO past_audits(audit_id,aud_score,tenant_id,audit_date,staff_id, resolved_audit_date) values ($1,$2,$3,$4,$5,$6) returning * ',[req.body.audit_id,req.body.tenant_id,req.body.audit_date,staff_id,req.body.resolved_aud_date])
    const dbResponse = rows[0]
    if(!dbResponse){
        return res.status(stats.status.notfound).send("Did not manage to resolve audit")
    }
    return res.status(stats.status.success).send(stats.successMessage)
}

//only if all noncompliances are resolved
//delete all resolved audits
const delNewAudits = async(req,res)=>{
    const getStaff = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])
    const getTenant = await pool.query('select tenant_id from tenant where email = $1',[req.body.tenant_email])
    const removeAudit = await pool.query('delete from new_audit where tenant_id = $1 and staff_id = $2 returning * ',[getStaff[0].staff_id, getTenant[0].tenant_id])
    if(!removeAudit[0]){
        return res.status(stats.status.nocontent).send("cannot resolve the audit")
    }
    return res.status(stats.status.success).send(stats.successMessage)
}

//tenant details 
//name 
//audit score previous audit date 
const getTenantDeets = async(req,res)=>{
    const getaudit1 = await pool.query('select * from past_audits as getaud where institution_id = $1',[req.body.institution_id])
    //two for loops for json 
    const countnew_aud = await pool.query('select count(*) from $1',[getaudit1])[0].count

    //json object 
    var tenantdeets = {}
    for(var i = 0; i < countnew_aud ;i++){
        //retrieve the tenant name 
        const tenantname = await pool.query('select tenant_name from tenant where tenant_id = $1',[getaudit1[i].tenant_id])[0].tenant_name
        tenantdeets[tenantname] = {
            "audit_performance_score": getaudit1[i].aud_score,
            "previous_audit_date": getaudit1[i].resolved_audit_date
        }
    }
    return res.status(stats.status.success).json(tenantdeets)
}

//dashboard


module.exports = {
    resolveAudits,
    pastAudits,
    updateAudit,
    viewtenantUpdates,
    ViewuncompletedAudits,
    createAudit,
    getTenantDeets,
    delNewAudits,
    getNonCompliance
}
