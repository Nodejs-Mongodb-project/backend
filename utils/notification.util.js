const cron = require('node-cron');
const mongoose = require('mongoose');
const { sendEmail } = require('./email.util'); // Use existing email utility
const Casier = require('../schema/casier.schema.js');

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
            // Loop through each soon to be expired reservation
            for (const reservation of soonToExpireReservations) {
                try {
                    // Send an email notification to the user using existing email utility
                    const emailSubject = 'Reservation Expiration Reminder';
                    const emailText = `Dear ${reservation.userId.name},\n\nYour reservation for casier ${reservation.casierId} is about to expire in less than an hour.\nPlease take necessary actions.\n\nBest regards,\nYour Team`;
                    
                    await sendEmail(reservation.userId.email, emailSubject, emailText);
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

            // Update the status of the casiers to available
            const casierIds = expiredReservations.map(reservation => reservation.casierId);
            await Casier.updateMany(
                { _id: { $in: casierIds } },
                { status: 'available' }
            );

            console.log(`${expiredReservations.length} reservations have been marked as expired and their casiers are now available.`);
        } else {
            console.log('No expired reservations found.');
        }
        
    } catch (error) {
        console.error('Error executing cron job:', error);
    }
});

// Export the file to allow importing
module.exports = {};