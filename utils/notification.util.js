const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Schedule a cron job to run every day at 00:01
cron.schedule('1 0 * * *', () => {
    console.log('Cron job running everyday at 00:01');
    
});

// Export the file to allow importing
module.exports = {};