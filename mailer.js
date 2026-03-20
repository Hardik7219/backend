const { Resend } = require('resend');
 
const resend = new Resend(process.env.RESEND_API_KEY);
 
async function sendMail({ from, to, subject, html }) {
    if(!from)
    {
            const from ='onboarding@resend.dev';
    } 
            
 
    const { error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
    });
 
    if (error) throw new Error(`Resend error: ${error.message}`);
}
 
module.exports = { sendMail };