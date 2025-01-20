import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { email, movieTitle, theaterName, theaterAddress, showTime, seats, totalAmount, bookingId } = await request.json();

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
            subject: `Your Ticket for ${movieTitle} — Booking Confirmed`,
            html: `<div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
        <h2 style="color: #C21807;">Watch Your Show</h2>
        <h3>Booking Confirmed!</h3>
        <p><strong>${movieTitle}</strong></p>
        <p>${theaterName}<br/>${theaterAddress}</p>
        <p>Show Time: ${showTime}</p>
        <p>Seats: ${seats}</p>
        <p>Total Paid: ₹${totalAmount}</p>
        <p>Booking ID: ${bookingId}</p>
        <p style="margin-top: 20px; color: #666;">Please arrive 15 minutes before showtime. Show this email or your PDF ticket at the counter.</p>
      </div>`,
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Ticket email error:', error);
        return Response.json({ error: 'Failed to send ticket email' }, { status: 500 });
    }
}