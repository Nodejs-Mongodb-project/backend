const express = require('express');


const { register, login, logout, resetPassword, forgotPassword, getAllUsers, getMe, getUserCount } = require('../controllers/auth.controller');
const { verifyTokenAdmin, verifyToken } = require('../utils/auth.util');



const router = express.Router();

router.post('/login', login);

router.post('/register', register);

router.post('/logout', logout);

router.post('/reset-password', resetPassword);

router.post('/forgot-password', forgotPassword);

router.get('/', verifyTokenAdmin, getAllUsers);

router.get('/me', verifyToken, getMe);

router.get('/count', verifyTokenAdmin, getUserCount);

module.exports = router;