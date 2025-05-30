const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const userModel = require('../schema/user.schema');

const { hashPassword, generateToken, verifyTokenString } = require('../utils/auth.util');
const { sendEmail } = require('../utils/email.util');

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const register = async (req, res) => {
    console.log('Register endpoint hit');
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    userModel.findOne({ email })
        .then((user) => {
            if (user) {
                return res.status(409).json({ message: 'User already exists' });
            }
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

            newUser.save().then((user) => {
                if (!user) {
                    return res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
                }

                // Send welcome email
                sendEmail(email, 'Welcome to our service', `Hello ${name}, welcome to our service!`);
                res.status(201).json({ message: 'User registered successfully', user: { name, email } });
            }).catch((err) => {
                return res.status(500).json({ message: 'Erreur interne du serveur why' });
            });
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Erreur interne du serveur' });
        });
};

const login = async (req, res) => {
    console.log('Login endpoint hit');
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    userModel.findOne({ email })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
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
        })
        .catch((err) => {
            console.log(err)
            return res.status(500).json({ message: 'Internal server error' });
        });
};

const logout = async (req, res) => {
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
        userModel.findById(decoded.id)
            .then((user) => {
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                user.token = null;
                user.save();

                res.status(200).json({ message: 'User logged out successfully' });
            }).then(() => {

            }).catch((err) => {
                return res.status(500).json({ message: 'Internal server error ' + err });
            });
    });
};

const resetPassword = async (req, res) => {
    console.log('Reset password endpoint hit');
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    let decoded;
    try {
        decoded = await verifyTokenString(token);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Find user and update password
    userModel.findById(decoded.id)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const hashedPassword = hashPassword(newPassword);
            user.password = hashedPassword;
            user.token = null;
            user.save();
        }).catch((err) => {
            return res.status(500).json({ message: 'Internal server error ' + err });
        });

    res.status(200).json({ message: 'Password reset successfully' });
};

const forgotPassword = async (req, res) => {
    console.log('Forgot password endpoint hit');
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    // Check if user exists
    userModel.findOne({ email })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Generate password reset token
            const resetToken = generateToken(user);
            console.log('Reset token:', resetToken);
            
            // Save reset token to user
            userModel
                .findByIdAndUpdate(user._id
                    , { token: resetToken }, { new: true })
                .then((user) => {
                    if (!user) {
                        return res.status(404).json({ message: 'User not found' });
                    }
                    // Send email with reset link
                    sendEmail(email, 'Password reset procedure', `Click here to reset your password: ${FRONTEND_URL}/reset-password?token=${resetToken}`);
                    res.status(200).json({ message: 'Password reset link sent to email', email });
                })
                .catch((err) => {
                    return res.status(500).json({ message: 'Internal server error ' + err });
                });
        }).catch((err) => {
            return res.status(500).json({ message: 'Internal server error ' + err });
        });
};

const getAllUsers = async (req, res) => {
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
};

const getMe = async (req, res) => {
    console.log('Get me endpoint hit');
    const token = req.headers['authorization'].split(' ')[1];
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        // Find user
        userModel.findById(decoded.id)
            .then((user) => {
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                
                res.status(200).json({
                    message: 'User retrieved successfully',
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                    }
                });
            }).catch((err) => {
                return res.status(500).json({ message: 'Internal server error ' + err });
            });
    });
};

module.exports = {
    register,
    login,
    logout,
    resetPassword,
    forgotPassword,
    getAllUsers,
    getMe,
};
