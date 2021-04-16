const express = require('express');
const router = express.Router();

const tenantctrller = require('../controllers/tenantController');
const vAuth = require('../middleware/verifyAuth').verifyStaff;
const tenantAudCont = require('../controllers/tenantAuditController')

//tenantctrller.createTenant();
console.log("success");
router.post('/signup',tenantctrller.createTenant);
router.post('/signin',tenantctrller.signinTenant);
//router.post('',vAuth.verifyTenant,)

//protected routes
router.get('/getnoncomp',vAuth,tenantAudCont.getAllNonCompliances)
router.put('/tenantupdatingcomp',vAuth,tenantAudCont.UpdateNoncompfromtenant)

module.exports = router;