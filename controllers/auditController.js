//CORE functionalities 
// THIS FILE IS FOR STAFF ONLY 

const stats = require('../helpers/status')
const pool = require('../config/database')
//import the staff and tenant check 
//const checkStaffTenant = require('../helpers/checkstaffTenant')


// for the staff route only

//1. create audit 
//THIS WORKS debugged 
const createAudit = async(req,res)=>{
    //console.log(`${req.staff}`)
    console.log('inside create audit')
    const signinStaffQuery = 'SELECT * FROM staff WHERE email = $1';
    const signinTenantQuery = 'SELECT * FROM tenant WHERE store_name = $1';
    const categoryQuery = 'SELECT category_id from category where category_name = $1'
    //verify the staff accessing the login 
    const {rows} = await pool.query(signinStaffQuery,[req.body.staff_email])
    const tenantIn = await pool.query(signinTenantQuery,[req.body.store_name])
    //get the category 
    const categoryRetrieve = await pool.query(categoryQuery,[req.body.category])
    console.log('hello0')
    console.log(`${categoryRetrieve.rows[0]}`)
    const cat_id = categoryRetrieve.rows[0].category_id
    //if tenant and staff are in
    if (!rows[0] && !tenantIn.rows[0]){
        console.log('hello1')
        return res.status(stats.status.notfound).send('Unable to create as tenant and staff are not found')
    }

    //check for both tenant and staff to be under the same institute 
    else if(!(rows[0].institution_id === tenantIn.rows[0].institution_id)){
        console.log('hello2')
        return res.status(stats.status.conflict).send("Both staff and tenant are not in the same institute")
    }

    //check if the tenant category also agrees with the category that is passed
    else if(!(tenantIn.rows[0].category_id === categoryRetrieve.rows[0].category_id)){
        console.log('hello3')
        return res.status(stats.status.bad).send("tenant is not in the correct category")
    }
    console.log(`${req.body.non_compliances}`)
    //new audit insert 
    const crNewAuditQuery = 'INSERT INTO new_audit (aud_score,date_record,institution_id,category_ID,tenant_id,staff_id,noncompliances) values ($1,$2,$3,$4,$5,$6,$7) RETURNING *'
    try{
    const crAudit = await pool.query(crNewAuditQuery,[req.body.performancescore,req.body.date,rows[0].institution_id,cat_id,tenantIn.rows[0].tenant_id,rows[0].staff_id,req.body.non_compliances])
    const dbResponse = crAudit.rows[0]
    console.log(`${dbResponse.category_id}`)
    console.log(`${dbResponse.noncompliances}`)

    //insert properly check 
    return res.status(stats.status.success).send('created new audit successfully!')
    }
    catch(error){
        console.log(error)
        stats.errorMessage.error = 'Operation was not successful'
        return res.status(stats.status.error).send(stats.errorMessage)
    }
}
//get non-comp when pressing button to view audit itself, front end to save
//WORKS
const getNonCompliance = async(req,res)=>{
    //console.log(`${req.body.store_name}`)
    const tenant_tbl = await pool.query('select tenant_id from tenant where store_name = $1',[req.body.store_name])
    const tenant_id = tenant_tbl.rows[0].tenant_id
    //console.log(`${tenant_id}`)
    const staff_tbl = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])
    const staff_id = staff_tbl.rows[0].staff_id
    //console.log(`${staff_id}`)
    const noncomp = await pool.query('select noncompliances from new_audit where tenant_id = $1 and staff_id = $2',[tenant_id,staff_id])
    const non_comp = noncomp.rows[0].noncompliances
    if(!tenant_id||!staff_id){
        return res.status(stats.status.bad).send("Tenant or staff not in the database");
    }
    return res.status(stats.status.success).json(non_comp)
}

//get state
const ViewuncompletedAudits = async(req,res)=>{
    const signinStaffQuery = 'SELECT * FROM staff WHERE email = $1';
    const signinTenantQuery = 'SELECT * FROM tenant WHERE store_name = $1';
    //const categoryQuery = 'SELECT category_ID from category where category_name = $1'
    //verify the staff accessing the login 
    const {rows} = await pool.query(signinStaffQuery,[req.body.staff_email])
    const tenantIn = await pool.query(signinTenantQuery,[req.body.store_name]).rows[0]
    //get the category 

    //check for both tenant and staff to be under the same institute 
    if(!(rows[0].institution_id === tenantIn.institution_id)){
        return res.status(stats.status.conflict).send("Both staff and tenant are not in the same institute")
    }

    const queryStaffID = 'select * from staff where email = $1'
    const queryGetAud = 'SELECT * from new_audit where staff_id = $1'
    //json object
    var allAudits = {}
    
    //retrieve all audits with respect to the staff id
    try{
        const getstaff = await (await pool.query(queryStaffID,[req.body.Staffemail]));
        const getaud = await (await pool.query(queryGetAud,[getstaff.rows[0].staff_id]))
        //get length of the table queried
        const countaud = await pool.query('select count(*) from $1',[getaud])

        //send the audit to front end in json for rendering 
        for(var i = 0;i<countaud.rows[0].count;i++){
            var audit = "audit" + i;
            const tenant_name = await (await pool.query('SELECT store_name from tenant where tenant_id = $1',[getaud.rows[i].tenant_id])).rows[0].store_name
            const category_name = await (await pool.query('SELECT category_name from category where category_id = $1',[getaud.rows[i].category_id])).rows[0].category_name
            const inst_name = await pool.query('SELECT institution_name from singhealth_institutions where institution_id = $1',[getaud.rows[i].institution_id]).rows[0].institution_name

            allAudits[audit] =  {
                "tenant_name": tenant_name,
                "category": category_name,
                "institution_name": inst_name,
                "noncompliances":getaud.rows[i].noncompliances,
                "performance_score ": getaud.rows[i].aud_score
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
//IT WORKS
const updateAudit = async(req,res)=>{
    //update the table with the new json
    const dbResponse = await pool.query('update new_audit set noncompliances = $1, update_date = $2 returning *',[req.body.noncompliances,req.body.update_date]);
    if(!dbResponse){
        return res.status(stats.status.bad).send('Update failure')
    }
    return res.status(stats.status.success).send('Update successfully')

}

//4. past audits (look at staff view)
//retrieve 
//TEST THIS
const pastAudits = async (req,res)=>{
    //tenant name 
    //staff email -> id 
    //performance score
    //resolved audit date
    const staff_tbl = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])
    const staff_id = staff_tbl.rows[0].staff_id
    console.log('hello1')
    //const startaud_date = await pool.query('select date_record from new_audit where staff_id = $1',[staff_id])[0]
    const getPastAud = await pool.query('select * from past_audits where staff_id = $1',[staff_id])
    console.log('Hello2')
    var returnbody = {
        "staff_name": staff_id.staff_name,

    }
    console.log('Hello3')
    //get length of the table
    const count_past_aud = await pool.query('select count(*) from past_audits where staff_id = $1',staff_id)
    console.log('hello 4')
    const countpaud = count_past_aud.rows[0].count
    console.log('hello 5')

    //add objects to the json
    for(var i = 0; i<countpaud;i++){
        //get tenant
        const getTenant = await pool.query('select * from tenant where tenant_id = $1',[getPastAud[i].tenant_id])  
        returnbody[staff_name] = {
            "tenant_name": getTenant.rows[0].tenant_name,
            "performance_score": getPastAud.rows[i].aud_score,
            "resolved_aud_date": getPastAud.rows[i].resolved_audit_date,
            "start_audit_date": getPastAud.rows[i].audit_date            
        }
    }
    console.log('it got past the for loop TEEHEE')
    return res.status(stats.status.success).json(returnbody)


}

//5. resolve audits (send via email)
//only if all the non compliances are resolved
//
const resolveAudits = async (req,res)=>{
    //insert into past audits 
    //delete from new audits 
    console.log('inside the function')
    const staff_tbl = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])
    const staff_id = staff_tbl.rows[0].staff_id
    const tenant_tbl = await pool.query('select tenant_id from tenant where store_name = $1',[req.body.store_name])
    const tenant_id = tenant_tbl.rows[0].tenant_id

    const audit = await pool.query('select * from new_audit where tenant_id = $1 and staff_id = $2',[tenant_id,staff_id])
    console.log(`${audit.rows[0].audit_id}`)
    const {rows} = await pool.query('INSERT INTO past_audits(audit_id,aud_score,tenant_id,audit_date,staff_id, resolved_audit_date,institution_id) values ($1,$2,$3,$4,$5,$6,$7) returning * ',[audit.rows[0].Audit_ID,audit.aud_score,tenant_id,audit.rows[0].audit_date,staff_id,req.body.resolved_aud_date])
    const dbResponse = rows[0]
    console.log(`${dbResponse.Audit_ID}`)
    if(!dbResponse){
        return res.status(stats.status.notfound).send("Did not manage to resolve audit")
    }
    return res.status(stats.status.success).send(stats.successMessage)
}

//only if all noncompliances are resolved
//delete all resolved audits
//
const delNewAudits = async(req,res)=>{
    const getStaff = await pool.query('select staff_id from staff where email = $1',[req.body.staff_email])
    const getTenant = await pool.query('select tenant_id from tenant where store_name = $1',[req.body.store_name])
    const removeAudit = await pool.query('delete from new_audit where tenant_id = $1 and staff_id = $2 returning * ',[getStaff.rows[0].staff_id, getTenant.rows[0].tenant_id])
    if(!removeAudit.rows[0]){
        return res.status(stats.status.nocontent).send("cannot resolve the audit")
    }
    return res.status(stats.status.success).send(stats.successMessage)
}

//tenant details 
//name 
//audit score previous audit date 
const getTenantDeets = async(req,res)=>{
    const inst_id = await pool.query('select institution_id from singhealth_institutions where institution_name = $1',[req.body.institution_name]).rows[0].institution_id
    const getaudit1 = await pool.query('select * from past_audits as getaud where institution_id = $1',[inst_id])
    //two for loops for json 
    const countnew_aud = await pool.query('select count(*) from $1',[getaudit1]).rows[0].count

    //json object 
    var tenantdeets = {}
    for(var i = 0; i < countnew_aud ;i++){
        //retrieve the tenant name 
        const tenantname = await pool.query('select store_name from tenant where tenant_id = $1',[getaudit1.rows[i].tenant_id])[0].store_name
        tenantdeets[tenantname] = {
            "audit_performance_score": getaudit1.rows[i].aud_score,
            "previous_audit_date": getaudit1.rows[i].resolved_audit_date
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
