const express = require('express');

const router = express.Router();

// Import routes
const authRoute = require('./auth.route');
const casierRoute = require('./casier.route');
const reservationRoute = require('./reservation.route');

router.use('/auth', authRoute);
router.use('/casier', casierRoute);
router.use('/reservation', reservationRoute);

module.exports = router;