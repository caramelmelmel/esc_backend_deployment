const audit = require('../controllers/auditController')
const express = require('express');
const router = express.Router();

//import the staff verification
const verify = require('../middleware/verifyAuth')


//POST functions
router.post('/createaudit',verify.verifyStaff,audit.createAudit)
router.get('/seenoncomp',verify.verifyStaff,audit.getNonCompliance)
router.get('/ongoingaudits',verify.verifyStaff,audit.ViewuncompletedAudits)
router.get('/pastaudits',verify.verifyStaff,audit.pastAudits)
router.post('/resolveAudits',verify.verifyStaff,audit.resolveAudits)
router.delete('/deleteResAud',verify.verifyStaff,audit.delNewAudits)
router.get('/viewtenantDeets',verify.verifyStaff,audit.getTenantDeets)
router.put('/update',verify.verifyStaff,audit.updateAudit)


module.exports = router