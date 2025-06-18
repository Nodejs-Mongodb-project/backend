const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const sendEmail = async (to, subject, text) => {
    try {
        // Handle object parameter style
        if (typeof to === 'object' && to.to) {
            const emailData = to;
            to = emailData.to;
            subject = emailData.subject;
            text = emailData.text;
        }

        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            text,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendEmail,
};