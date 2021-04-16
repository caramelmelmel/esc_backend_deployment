const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check} = require('express-validator')
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const dotenv = require('dotenv')
const port = 3000;

const app = express()
dotenv.config();

//const passport = require('passport')
//const JWTstrategy = require("passport-jwt").Strategy;
//const ExtractJWT = require("passport-jwt").ExtractJwt;
//const babelpfill = require('babel-polyfill')

//import the routes here 
//const tenantroute = require('./routes/tenantRoute')(app)
//const staffroute = require('./routes/staffRoute')(app)

const tenant = require('./routes/tenantRoute')

const staff = require('./routes/staffRoute')

const audit = require('./routes/auditRoute')

const isProduction = process.env.NODE_ENV === 'production'
const origin = {
  origin: isProduction ? 'https://www.example.com' : '*',
}

//8081 is to listen
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors(origin))
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // 5 requests,
  })
  
  app.use(limiter)


// parse requests of content-type - application/x-www-form-urlencoded
// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
//tenant routes
//console.log(`${tenantctrller.createTenant}`)
app.use('/tenant',tenant);
app.use('/staff',staff);
app.use('/audit',audit);

app.use(compression())
app.use(helmet())

/*
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
  */


require('./startup/prod')(app)