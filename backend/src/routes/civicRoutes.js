const express = require('express');
const router = express.Router();
const civicController = require('../controllers/civicController');
const piiSanitizer = require('../middleware/piiSanitizer');

router.post('/civic/analyze', piiSanitizer, civicController.analyzeCivicQuery);
router.get('/services', civicController.getVerifiedServices);

module.exports = router;
