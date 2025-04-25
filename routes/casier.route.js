const express = require('express');

const { getAllCasiers, getCasierById, getCasiersByStatus, createCasier, updateCasier, deleteCasier } = require('../controller/casier.controller.js');

const router = express.Router();

router.get('/', getAllCasiers);

router.get('/:id', getCasierById);

router.get('/status/:status', getCasiersByStatus);

router.post('/', createCasier);

router.put('/:id', updateCasier);

router.delete('/:id', deleteCasier);

module.exports = router;