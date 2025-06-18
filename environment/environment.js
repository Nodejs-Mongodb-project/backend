/**
 * Environment configuration file
 * This module exports configuration settings based on the current environment
 */

import dotenv from 'dotenv';

dotenv.config();

// Determine the current environment
const env = process.env.NODE_ENV || 'development';

// Define configurations for different environments
const environments = {
    // Development environment
    development: {
        port: process.env.PORT || 5000,
        mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/myapp_dev',
        jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
        logLevel: 'debug',
    },
    
    // Test environment
    test: {
        port: process.env.PORT || 5000,
        mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/myapp_test',
        jwtSecret: process.env.JWT_SECRET || 'test_secret_key',
        logLevel: 'info',
    },
    
    // Production environment
    production: {
        port: process.env.PORT || 5000,
        mongoUri: process.env.MONGO_URI,
        jwtSecret: process.env.JWT_SECRET,
        logLevel: 'error',
    }
};

// Export the configuration for the current environment
module.exports = environments[env] || environments.development;