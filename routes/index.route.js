const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.route'));
router.use('/casier', require('./casier.route'));

module.exports = router;