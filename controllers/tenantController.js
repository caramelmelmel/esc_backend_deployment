const moment = require('moment');

//import dbQuery from '../db/dev/dbQuery';
const dbQuery = require('../database/dev/dbQuery')

const validate = require('../helpers/validations');
const stats = require('../helpers/status')
const jwt = require('jsonwebtoken')

require('dotenv').config();

//use the pg pool library 
const pool = require('../config/database').pool

//create query function here

const createTenant = async (req,res)=>{

    console.log("inside createTenant");

    //get from front end
    console.log(req.body);
    //     tenant_name,category,store_des,email,expiry_date,password,store_name,institution_name
    // } = req.body;
    
    const created_on = moment(new Date()).format("YYYY-MM-DD");
    console.log(`${created_on}`)

    //THIS PART WORKS
    if (validate.isEmpty(req.body.email) || validate.isEmpty(req.body.tenant_name) || validate.isEmpty(req.body.category_name) || validate.isEmpty(req.body.password) || validate.isEmpty(req.body.store_des)|| validate.isEmpty(req.body.expiry_date)||validate.isEmpty(req.body.store_name)||validate.isEmpty(req.body.institution_name)) {
        stats.errorMessage.error = 'All the fields must be filled in';
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      if (!validate.isValidEmail(req.body.email)) {
        stats.errorMessage.error = 'Please enter a valid Email';
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      if (!validate.validatePassword(req.body.password)) {
        stats.errorMessage.error = 'Password must be more than 8 characters';
        return res.status(stats.status.bad).send(stats.errorMessage);
      }
      const hashedPassword = validate.hashPassword(req.body.password);
      //query to insert tenant on success
      const createTenantQuery = `INSERT INTO tenant(tenant_name,category_ID, store_des,email, expiry_date,password,institution_id)
                                values($1, $2, $3, $4, $5, $6, $7) returning *`
      
      // need to return category ID

    const result = await pool.query('select institution_id from singhealth_institutions where institution_name = $1', [req.body.institution_name]);

    const instid= result.rows[0].institution_id

    //console.log(`${req.body.category_name}`)
    const result2 = await pool.query('select category_id from category where category_name = $1', [req.body.category_name]);

    const categoryID = result2.rows[0].category_id

    console.log(`${categoryID}`)

      //need to return the s
      const values = [
        req.body.tenant_name,
        categoryID, 
        req.body.store_des,
        req.body.email,
        req.body.expiry_date,
        hashedPassword,
        instid
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
        const { rows } = await dbQuery.query(createTenantQuery, values)
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
      id: dbResponse.tenant_id,
      email: dbResponse.email,
      category_id: dbResponse.category_ID,
      institution_id: dbResponse.institution_id
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