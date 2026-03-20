// mailer.js
// Sends email via Resend SDK but NEVER throws — if email fails the
// app keeps working. This is correct behaviour for a free-tier setup
// where Resend restricts unverified domains.
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html }) {
    const from = 'onboarding@resend.dev';
    try {
        const { error } = await resend.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });
        if (error) {
            // Log but don't throw — email is best-effort, not blocking
            console.error('Resend error (non-fatal):', error.message);
        }
    } catch (err) {
        console.error('Resend exception (non-fatal):', err.message);
    }
}

module.exports = { sendMail };