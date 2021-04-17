console.log('imported successfully')
const express = require('express');
const router = express.Router();
console.log('imported router successfully')

const tenantctrller = require('../controllers/tenantController');
console.log('tenantcontroller has been imported successfully')
const vAuth = require('../middleware/verifyAuth').verifyStaff;
console.log('vAuth is imported successfully')
const tenantAudCont = require('../controllers/tenantAuditController')
console.log('Imported everything successfully')
//tenantctrller.createTenant();
console.log("success");
router.post('/signup',tenantctrller.createTenant);
router.post('/signin',tenantctrller.signinTenant);
//router.post('',vAuth.verifyTenant,)

//protected routes
router.get('/getnoncomp',vAuth,tenantAudCont.getAllNonCompliances)
router.put('/tenantupdatingcomp',vAuth,tenantAudCont.UpdateNoncompfromtenant)

module.exports = router;