const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.route'));
router.use('/casier', require('./casier.route'));
const reservationRoutes = require('./reservation.route');

module.exports = router;