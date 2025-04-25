const express = require('express');


const { register, login, logout, resetPassword, forgotPassword, getAllUsers } = require('../controller/auth.controller');
const { verifyTokenAdmin } = require('../utils/auth.util');



const router = express.Router();

router.post('/login', login);

router.post('/register', register);

router.post('/logout', logout);

router.post('/reset-password', resetPassword);

router.post('/forgot-password', forgotPassword);

router.get('/', verifyTokenAdmin, getAllUsers);

module.exports = router;