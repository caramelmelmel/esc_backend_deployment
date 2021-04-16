
//const passport = require('passport')
//const JWTstrategy = require("passport-jwt").Strategy;
//const ExtractJWT = require("passport-jwt").ExtractJwt;
const express = require('express');
const app = express()
//const babelpfill = require('babel-polyfill')
const bodyParser = require("body-parser");
const cors = require('cors');
const dotenv = require('dotenv')
const port = 3000;
//import the routes here 
//const tenantroute = require('./routes/tenantRoute')(app)
//const staffroute = require('./routes/staffRoute')(app)
dotenv.config();

const tenant = require('./routes/tenantRoute')

const staff = require('./routes/staffRoute')

const audit = require('./routes/auditRoute')



//8081 is to listen
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())



// parse requests of content-type - application/x-www-form-urlencoded
// Add middleware for parsing URL encoded bodies (which are usually sent by browser)
//tenant routes
//console.log(`${tenantctrller.createTenant}`)
app.use('/tenant',tenant);
app.use('/staff',staff);
app.use('/audit',audit);


/*
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
  */
