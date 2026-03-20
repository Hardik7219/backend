async function sendMail({ from, to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not set in environment variables');
 
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify({
            from:    from    || process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to:      Array.isArray(to) ? to : [to],
            subject: subject,
            html:    html,
        }),
    });
 
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Resend API error ${response.status}: ${error.message || JSON.stringify(error)}`);
    }
 
    return response.json();
}
 
module.exports = { sendMail };