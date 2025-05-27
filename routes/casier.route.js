const express = require('express');

const { getAllCasiers, getCasierById, getCasiersByStatus, createCasier, updateCasier, deleteCasier } = require('../controllers/casier.controller.js');
const { verifyTokenAdmin } = require('../utils/auth.util.js');

const router = express.Router();

router.get('/', getAllCasiers);

router.get('/:id', getCasierById);

router.get('/status/:status', getCasiersByStatus);

router.post('/', verifyTokenAdmin, createCasier);

router.put('/:id', verifyTokenAdmin, updateCasier);

router.delete('/:id', verifyTokenAdmin, deleteCasier);

module.exports = router;