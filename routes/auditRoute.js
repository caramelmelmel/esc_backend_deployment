const audit = require('../controllers/auditController')
const express = require('express');
const router = express.Router();

//import the staff verification
const verify = require('../middleware/verifyAuth').verifyStaff


//POST functions
router.post('/createaudit',verify,audit.createAudit)
router.get('/seenoncomp',verify,audit.getNonCompliance)
router.get('/ongoingaudits',verify,audit.ViewuncompletedAudits)
router.get('/pastaudits',verify,audit.pastAudits)
router.post('/resolveAudits',verify,audit.resolveAudits)
router.delete('/deleteResAud',verify,audit.delNewAudits)
router.get('/viewtenantDeets',verify,audit.getTenantDeets)
router.put('/update',verify,audit.updateAudit)


module.exports = router