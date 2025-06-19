const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Schedule a cron job to run every minute to check for expired reservations
cron.schedule('* * * * *', async () => {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected, skipping cron job execution');
            return;
        }

        const Reservation = require('../schema/reservation.schema.js');
        const Casier = require('../schema/casier.schema.js');

        // Get the current date
        const currentDate = new Date();

        // Find soon to be expired reservations (between 59 minutes and 1 hour before expiration)
        const soonToExpireReservations = await Reservation.find({
            dateExpiration: {
                $gte: new Date(currentDate.getTime() + 59 * 60 * 1000), // 59 minutes from now
                $lt: new Date(currentDate.getTime() + 60 * 60 * 1000), // 1 hour from now
            },
            statut: 'active',
        }).populate('userId');

        console.log(`Found ${soonToExpireReservations.length} soon to be expired reservations.`);

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
                try {
                    // Send an email notification to the user
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: reservation.userId.email,
                        subject: 'Reservation Expiration Reminder',
                        text: `Dear ${reservation.userId.name},\n\nYour reservation for casier ${reservation.casierId} is about to expire in less than an hour.\nPlease take necessary actions.\n\nBest regards,\nYour Team`,
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Notification sent to ${reservation.userId.email}`);
                } catch (emailError) {
                    console.error('Error sending email notification:', emailError);
                }
            }
        }

        // Find and update expired reservations
        const expiredReservations = await Reservation.find({
            dateExpiration: { $lt: currentDate },
            statut: 'active',
        });

        if (expiredReservations.length > 0) {
            // Update reservation status to expired
            await Reservation.updateMany(
                {
                    dateExpiration: { $lt: currentDate },
                    statut: 'active',
                },
                { statut: 'expired' }
            );

            // Update casier status to available for expired reservations
            const casierIds = expiredReservations.map(reservation => reservation.casierId);
            await Casier.updateMany(
                { _id: { $in: casierIds } },
                { statut: 'available' }
            );

            console.log(`${expiredReservations.length} reservations have been marked as expired and their casiers are now available.`);
        } else {
            console.log('No expired reservations found.');
        }
        
        console.log('Cron job executed successfully: Checked for soon to be expired reservations.');
    } catch (error) {
        console.error('Error executing cron job:', error);
        // Don't throw the error to prevent crashing the application
    }
});

// Export the file to allow importing
module.exports = {};