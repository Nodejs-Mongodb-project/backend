const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const userModel = require('../schema/user.schema');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;

const verifyToken = (req, res, next) => {
    const token = req.headers['Authorization']?.split(' ')[1] || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        
        // Verify the token with the user's token in the database
        userModel.findById(req.userId).then((user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (user.token !== token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            next();
        });
    });
}

const verifyTokenAdmin = (req, res, next) => {
    const token = req.headers['Authorization']?.split(' ')[1] || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        
        // Verify the token with the user's token in the database
        userModel.findById(req.userId).then((user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (user.token !== token || !user.isAdmin) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            next();
        });
    });
}

const verifyTokenString = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
}

const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    return bcrypt.hashSync(password, salt);
}

const comparePassword = (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
}

const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

module.exports = {
    verifyToken,
    verifyTokenAdmin,
    verifyTokenString,
    hashPassword,
    comparePassword,
    generateToken,
};