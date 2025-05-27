const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Schedule a cron job to run every hour to check for expired reservations
cron.schedule('0 * * * *', async () => {
    try {
        // Connect to the MongoDB database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const Reservation = require('../schema/reservation.schema.js');

        // Get the current date
        const currentDate = new Date();

        // Find soo to be expired reservations (1h before expiration)
        const soonToExpireReservations = await Reservation.find({
            dateExpiration: {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 60 * 60 * 1000), // 1 hour from now
            },
            statut: 'active',
        });

        // If there are soon to be expired reservations, send notifications
        if (soonToExpireReservations.length > 0) {
            // Create a transporter for sending emails
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // Loop through each soon to be expired reservation
            for (const reservation of soonToExpireReservations) {
                // Send an email notification to the user
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: reservation.userId.email, // Assuming userId is populated with user details
                    subject: 'Reservation Expiration Reminder',
                    text: `Dear User,\n\nYour reservation for casier ${reservation.casierId} is about to expire in less than an hour.\nPlease take necessary actions.\n\nBest regards,\nYour Team`,
                };

                await transporter.sendMail(mailOptions);
            }
        }

        // Find and update expired reservations
        const expiredReservations = await Reservation.updateMany(
            {
                dateExpiration: { $lt: currentDate },
                statut: 'active',
            },
            { statut: 'expired' }
        );
        if (expiredReservations.nModified > 0) {
            console.log(`${expiredReservations.nModified} reservations have been marked as expired.`);
        } else {
            console.log('No expired reservations found.');
        }
        
        console.log('Cron job executed successfully: Checked for soon to be expired reservations.');
    } catch (error) {
        console.error('Error executing cron job:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
    }
});

// Export the file to allow importing
module.exports = {};