const express = require('express');
const router = express.Router();

const { reserverCasier } = require('../controllers/reservation.controller');
const { verifyToken } = require('../utils/auth.util');

router.post('/reserver', verifyToken, reserverCasier); 

module.exports = router;
