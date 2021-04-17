const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check} = require('express-validator')
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const dotenv = require('dotenv')
const port = 3000;
const PORT = process.env.PORT || 5000

const app = express()
//const pool = require('../.config/database')

console.log('initialised express app')
//process.env.PORT
pool = require('./config/database')
dotenv.config();
console.log('environment is imported properly')

//const passport = require('passport')
//const JWTstrategy = require("passport-jwt").Strategy;
//const ExtractJWT = require("passport-jwt").ExtractJwt;
//const babelpfill = require('babel-polyfill')

//import the routes here 
//const tenantroute = require('./routes/tenantRoute')(app)
//const staffroute = require('./routes/staffRoute')(app)

const tenant = require('./routes/tenantRoute')
console.log('imported tenant route successfully')

const staff = require('./routes/staffRoute')

const audit = require('./routes/auditRoute')

console.log('imported routes')
//8081 is to listen
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// parse requests of content-type - application/x-www-form-urlencoded
// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
//tenant routes
app.use('/tenant',tenant);
app.use('/staff',staff);
app.use('/audit',audit);
console.log('successfully imported routes')

app.use(compression())
app.use(helmet())


if(process.env.NODE_ENV==="production"){
app.listen(PORT, () => {
    console.log(`Example app listening at ${port}`)
  })
}
  

