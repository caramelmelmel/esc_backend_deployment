//import the pool module and query directly from the pool 
const Pool = require('pg').Pool
const pool = new Pool(
    {
    connectionString: process.env.HEROKU_POSTGRESQL_MAROON_URL,
    ssl: {
    rejectUnauthorized: false
  }
    }
)

const checkStaffTenant = (req,res) =>{
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
}
module.exports = checkStaffTenant