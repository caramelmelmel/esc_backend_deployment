const moment = require('moment');
const pool = require('../config/database')
console.log('imported pool successfully')
//const dbQuery = require('../database/dev/dbQuery')
//console.log('dbQuery has no import errors')
const validate = require('../helpers/validations');
const stats = require('../helpers/status')
const jwt = require('jsonwebtoken')
console.log('imported everything in tenant cont successfully')
require('dotenv').config();

//use the pg pool library 

//create query function here

const createTenant = async (req,res)=>{

    console.log("inside createTenant");

    //get from front end
    console.log(req.body);
    console.log(`${req.body.email}`)
    console.log(`${req.body.tenant_name}`)
    console.log(`${req.body.email}`)
    console.log(`${req.body.email}`)
    console.log(`${req.body.email}`)
    console.log(`${req.body.email}`)
    
    //     tenant_name,category,store_des,email,expiry_date,password,store_name,institution_name
    // } = req.body;
    
    const created_on = moment(new Date()).format("YYYY-MM-DD");
    console.log(`${created_on}`)
    console.log("6hello0")  
      
    //THIS PART WORKS
    if (validate.isEmpty(req.body.email) || 
    validate.isEmpty(req.body.tenant_name) || 
    validate.isEmpty(req.body.category) || 
    validate.isEmpty(req.body.password) || 
    validate.isEmpty(req.body.store_des)|| 
    validate.isEmpty(req.body.expiry_date)||
    validate.isEmpty(req.body.store_name)||
    validate.isEmpty(req.body.institution_name)) {
      console.log("hello1")  
      stats.errorMessage.error = 'All the fields must be filled in';
      console.log("hello2")  
      
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      console.log("hello3")  
      
      if (!validate.isValidEmail(req.body.email)) {
        console.log("hello4")  
      
        stats.errorMessage.error = 'Please enter a valid Email';
        console.log("hello5")  
      
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      console.log("hello6")  
      
      if (!validate.validatePassword(req.body.password)) {
        console.log("hello7")  
      
        stats.errorMessage.error = 'Password must be more than 8 characters';
        console.log("hello8")  
      
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      console.log("hello9")  
      
      const hashedPassword = validate.hashPassword(req.body.password);
      console.log("hello10")  
      
      //query to insert tenant on success
      const createTenantQuery = `INSERT INTO tenant(tenant_name,category_ID, store_des,email, exp_date,password,institution_id,store_name)
                                values($1, $2, $3, $4, $5, $6, $7,$8) returning *`
      
      // need to return category ID
      console.log("hello11")  
      
    const result = await pool.query('select institution_id from singhealth_institutions where institution_name = $1', [req.body.institution_name]);
    console.log("hello12")  
      
    const instid= result.rows[0].institution_id
    console.log("hello13")  
      
    //console.log(`${req.body.category_name}`)
    const result2 = await pool.query('select category_id from category where category_name = $1', [req.body.category]);
    console.log("hello14")  
      
    const categoryID = result2.rows[0].category_id
    console.log("hello15")  
      
    console.log(`${categoryID}`)
    console.log("hello16")  
      
      //need to return the s
      const values = [
        req.body.tenant_name,
        categoryID, 
        req.body.store_des,
        req.body.email,
        req.body.expiry_date,
        hashedPassword,
        instid,
        req.body.store_name
      ]

      console.log('query selected successfully')
      console.log('before try') 

      try {
        //check for tenant expiry date 
        const exp_date = req.body.expiry_date;
        if(moment(created_on).isAfter(exp_date)){
          return res.status(400).send('You are unable to register as your expiry date is long ago')
        }

        console.log('inserting values')
        const { rows } = await pool.query(createTenantQuery, values)
        console.log('There is db response')

        const dbResponse = rows[0];
        delete dbResponse.password;
        //const token = generateUserToken(dbResponse.tenant_name,dbResponse.tenant_email,dbResponse.institution_id,dbResponse.password);
        stats.successMessage.data = dbResponse;
        //stats.successMessage.data.token = token;

        return res.status(stats.status.created).send(stats.successMessage);

      } catch (error) {
  
        if (error.routine === '_bt_check_unique') {
          stats.errorMessage.error = 'User with that EMAIL already exist';
          return res.status(stats.status.conflict).send(stats.errorMessage);
        }
        console.log(error)
        stats.errorMessage.error = 'Operation was not successful';
        return res.status(stats.status.error).send(stats.errorMessage);
      }
    };


    /**
   * Signin
   * @param {object} req
   * @param {object} res
   * @returns {object} user object
   */
const signinTenant = async (req, res) => {
  const { email, password } = req.body;
  const signedin_on = moment(new Date()).format("YYYY-MM-DD");
  console.log(`${signedin_on}`)
    
  if (validate.isEmpty(email) || validate.isEmpty(password)) {
    stats.errorMessage.error = 'Email or Password detail is missing';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }
  if (!validate.isValidEmail(email) || !validate.validatePassword(password)) {
    stats.errorMessage.error = 'Please enter a valid Email or Password';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }

  const signinTenantQuery = 'SELECT * FROM tenant WHERE email = $1';
  try {
    const { rows } = await pool.query(signinTenantQuery, [req.body.email]);
    const dbResponse = rows[0];

    if (!dbResponse) {
      stats.errorMessage.error = 'User with this email does not exist';
      return res.status(stats.status.notfound).send(stats.errorMessage);
    }

    if (!validate.comparePassword(dbResponse.password, password)) {
      stats.errorMessage.error = 'The password you provided is incorrect';
      return res.status(stats.status.bad).send(stats.errorMessage);
    }
    console.log(`${dbResponse.expiry_date}`)

    if(moment(signedin_on).isAfter(dbResponse.expiry_date)){
      const query2 = 'delete from tenant where email = $1'
      const {rows} = await pool.query(query2,[req.body.email])
      return res.status(stats.status.bad).send('Expiry date is before sign in date  ')
    }

    const body = {
      tenant:{
      id: dbResponse.tenant_id,
      email: dbResponse.email,
      category_id: dbResponse.category_ID,
      institution_id: dbResponse.institution_id
      }
    }

    const token =  jwt.sign(body, process.env.TENANT_TOKEN_SECRET, {
      expiresIn: 86400 // 24 hours
    });
    delete dbResponse.password;
    stats.successMessage.data = dbResponse;
    stats.successMessage.data.token = token;
    return res.send(token);
    
  } catch (error) {
    stats.errorMessage.error = 'Operation was not successful';
    return res.status(stats.status.error).send(stats.errorMessage);
  }
  }

  
  module.exports = {
      createTenant,
      signinTenant
  }