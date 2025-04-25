const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const userModel = require('../schema/user.schema');

const { verifyToken, hashPassword, verifyTokenAdmin, generateToken } = require('../utils/auth.util');

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const router = express.Router();

router.post('/login', (req, res) => {
    console.log('Login endpoint hit');
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    userModel.findOne({ email }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user);
        user.token = token;
        user.save();

        res.status(200).json({ message: 'User logged in successfully', token });
    });
    res.status(200).json({ message: 'User logged in successfully', user: { email } });
});

router.post('/register', (req, res) => {
    console.log('Register endpoint hit');
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    userModel.findOne({ email }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
    });

    // Hash password

    const hashedPassword = hashPassword(password);
    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        token: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    newUser.save((err) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    res.status(201).json({ message: 'User registered successfully', user: { name, email } });
});

router.post('/logout', (req, res) => {
    console.log('Logout endpoint hit');

    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        // Find user and remove token
        userModel.findById(decoded.id, (err, user) => {
            if (err || !user) {
                return res.status(404).json({ message: 'User not found' });
            }
            user.token = null;
            user.save();
        });
    });

    userModel.findOneAndUpdate(
        { token },
        { token: null },
        { new: true },
        (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        }
    );
    
    res.status(200).json({ message: 'User logged out successfully' });
});

router.post('/reset-password', (req, res) => {
    console.log('Reset password endpoint hit');
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    verifyToken(token, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    });
    
    // Find user and update password
    userModel.findById(decoded.id, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);
        user.password = hashedPassword;
        user.token = null;
        user.save();
    });

    res.status(200).json({ message: 'Password reset successfully' });
});

router.post('/forgot-password', (req, res) => {
    console.log('Forgot password endpoint hit');
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    // Check if user exists
    userModel.findOne({ email }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    });

    // Generate password reset token
    const resetToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    // Send email with reset link (pseudo code)
    // sendEmail(email, `Click here to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    // Save reset token to user
    userModel
        .findByIdAndUpdate(user._id
            , { token: resetToken }, { new: true })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Send email with reset link (pseudo code)
            // sendEmail(email, `Click here to reset your password: ${FRONTEND_URL}/reset-password?token=${resetToken}`);
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Internal server error' });
        });

    res.status(200).json({ message: 'Password reset link sent to email', email });
});

router.get('/', verifyTokenAdmin, (req, res) => {
    console.log('get all user endpoint hit');
    userModel.find({}, (err, users) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!users) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.status(200).json({ message: 'Users retrieved successfully', users });
    });
});

module.exports = router;