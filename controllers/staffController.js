const moment = require('moment');

//const dbQuery = require('../database/dev/dbQuery')

const validate = require('../helpers/validations');
const stats = require('../helpers/status')
const jwt = require('jsonwebtoken')
const cookieparser = require('cookie-parser');

require('dotenv').config();


//use the pg pool library 
const pool = require('../config/database')

//create query function here

const createStaff = async (req,res)=>{

    console.log("inside createTenant");
    res.send("welcome to staff sign up")

    //get from front end
    console.log(req.body);
    //     tenant_name,category,store_des,email,expiry_date,password,store_name,institution_name
    // } = req.body;

    const created_on = moment(new Date());

    if (validate.isEmpty(req.body.email) || validate.isEmpty(req.body.staff_name) || validate.isEmpty(req.body.password) || validate.isEmpty(req.body.institution_name)) {
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
      const createStaffQuery = 'insert into staff (staff_name, email,institution_id,password) values($1, $2, $3, $4) returning *'
      
      // need to return category ID

    const result = await pool.query('select institution_id from singhealth_institutions where institution_name = $1', [req.body.institution_name]);

    const instid= result.rows[0].institution_id

      //need to return the s
      const values = [
        req.body.staff_name,
        req.body.email,
        instid,
        hashedPassword
      ]
      console.log('query selected successfully')
      console.log('before try') 

      try {
        console.log('inserting values')
        const { rows } = await pool.query(createStaffQuery, values)
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
const signinStaff = async (req, res) => {
  const { email, password } = req.body;
  res.send('welcome to staff login')
    
  if (validate.isEmpty(email) || validate.isEmpty(password)) {
    stats.errorMessage.error = 'Email or Password detail is missing';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }
  if (!validate.isValidEmail(email) || !validate.validatePassword(password)) {
    stats.errorMessage.error = 'Please enter a valid Email or Password';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }

  const signinStaffQuery = 'SELECT * FROM staff WHERE email = $1';
  try {
    const { rows } = await pool.query(signinStaffQuery, [req.body.email]);
    const dbResponse = rows[0];

    if (!dbResponse) {
      stats.errorMessage.error = 'User with this email does not exist';
      return res.status(stats.status.notfound).send(stats.errorMessage);
    }

    if (!validate.comparePassword(dbResponse.password, password)) {
      stats.errorMessage.error = 'The password you provided is incorrect';
      return res.status(status.bad).send(stats.errorMessage);
    }
    delete dbResponse.password;
    const body = {
      staff:{
      staff_id: dbResponse.staff_id,
      email: dbResponse.email,
      instid:dbResponse.institution_id
      }
    }
    const token =  jwt.sign({ dbResponse}, process.env.STAFF_TOKEN_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    //pool.query('update staff set token = $1 where staff_name = $1',[token,dbResponse.staff_name])

    delete dbResponse.password;
    stats.successMessage.data = dbResponse;
    stats.successMessage.data.token = token;
    return res.send(token);
  } catch (error) {
    errorMessage.error = 'Operation was not successful';
    return res.status(stats.status.error).send(stats.errorMessage);
  }

  }
  
  module.exports = {
      createStaff,
      signinStaff
  }