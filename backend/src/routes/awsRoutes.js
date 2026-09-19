const express = require('express');
const router = express.Router();
const awsController = require('../controllers/awsController');

router.get('/aws/vault-status', awsController.getVaultStatus);
router.post('/aws/sync', awsController.syncVault);
router.get('/aws/document/:key(*)', awsController.getDocument);

module.exports = router;
