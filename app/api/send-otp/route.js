// In a production app, the OTP should be stored server-side
// (e.g. in a database or cache with expiry) and verified server-side too,
// not sent back to the client. Returning it here is temporary until a
// proper database/cache layer is added.

import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { email } = await request.json();
        if (!email) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Watch Your Show" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Watch Your Show OTP Code',
            html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #C21807;">Watch Your Show</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>`,
        });

        return Response.json({ success: true, otp });
    } catch (error) {
        console.error('Email send error:', error);
        return Response.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }
}