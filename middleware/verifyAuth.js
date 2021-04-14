const jwt = require('jsonwebtoken');

const stats = require('../helpers/status');

const dotenv = require('dotenv')

dotenv.config();

/**
   * Verify Token
   * @param {object} req 
   * @param {object} res 
   * @param {object} next
   * @returns {object|void} response object 
   */

async function validateToken(token,secret){
    try {
        const result  = jwt.verify(token, secret);
      
        return result;
    }
    catch(ex){
        return null;
    }
}

//for staff
const verifyStaff = async (req, res, next) => {
  const token  = req.header('x-auth-token');

  if (!token) {
    stats.errorMessage.error = 'Token not provided';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }

  try {
    jwt.verify(token, process.env.STAFF_TOKEN_SECRET)
    next();
  } catch (error) {
      //auth failed sending message now
    stats.errorMessage.error = 'Authentication Failed';
    return res.status(stats.status.unauthorized).send(errorMessage);
  }
};

//for tenant 
const verifyTenant = async (req, res, next) => {
  const token  = req.header('x-auth-token');

  if (!token) {
    stats.errorMessage.error = 'Token not provided';
    return res.status(stats.status.bad).send(stats.errorMessage);
  }

  try {
    jwt.verify(token, process.env.TENANT_TOKEN_SECRET);
    next();

  } catch (error) {
      //auth failed sending message now
    stats.errorMessage.error = 'Authentication Failed';
    return res.status(stats.status.unauthorized).send(errorMessage);
  }
};


module.exports =  {verifyStaff,verifyTenant};