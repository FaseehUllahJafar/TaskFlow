import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    };

    return await transporter.sendMail(mailOptions);
};

/** Sends an email but never throws: a mail outage must not break sign-up or password reset. */
export const trySendEmail = async (options: Parameters<typeof sendEmail>[0]): Promise<boolean> => {
    try {
        await sendEmail(options);
        return true;
    } catch (error) {
        logger.error('Failed to send email', { to: options.to, subject: options.subject, error });
        return false;
    }
};

export const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default transporter;
