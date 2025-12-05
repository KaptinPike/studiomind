// Cloudflare Pages Function to send waitlist confirmation emails via SMTP2go
// Environment variable: SMTP2GO_API_KEY (set in Cloudflare Pages dashboard)

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: 'Invalid email format' }),
                { status: 400, headers }
            );
        }

        // Check if API key is configured
        if (!env.SMTP2GO_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Email service not configured. SMTP2GO_API_KEY environment variable is missing.' }),
                { status: 500, headers }
            );
        }

        const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2D2A26; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #2D2A26; }
        .content { background: #FDF8F4; padding: 30px; border-radius: 12px; }
        h1 { color: #D4536D; font-size: 24px; margin-bottom: 16px; }
        .highlight { background: #E8F5EC; color: #7B9E87; padding: 12px 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #5C574F; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">StudioMind</div>
        </div>
        <div class="content">
            <h1>Welcome to the Waitlist!</h1>
            <p>Hi there,</p>
            <p>Thank you for joining the StudioMind waitlist! We're thrilled to have you on board.</p>
            <div class="highlight">
                <strong>You're officially on the list!</strong>
            </div>
            <p>StudioMind is being built to help dance studio owners like you reclaim your time. No more drowning in WhatsApp messages at midnight, awkward payment conversations, or enrollment chaos.</p>
            <p>As a founding member, you'll get:</p>
            <ul>
                <li>Early access before public launch</li>
                <li>Special founding member pricing</li>
                <li>Direct input on features we build</li>
            </ul>
            <p>We'll be in touch soon with updates on our progress.</p>
            <p>In the meantime, if you have any questions, just reply to this email!</p>
            <p>Best,<br>The StudioMind Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 StudioMind. All rights reserved.</p>
            <p>Built by Pappabee</p>
        </div>
    </div>
</body>
</html>`;

        const response = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: env.SMTP2GO_API_KEY,
                to: [email],
                sender: `StudioMind <${env.FROM_EMAIL || 'hello@studiomind.io'}>`,
                subject: "Welcome to StudioMind! You're on the waitlist",
                html_body: emailContent,
                text_body: `Welcome to the StudioMind Waitlist!\n\nThank you for joining! We're thrilled to have you on board.\n\nAs a founding member, you'll get:\n- Early access before public launch\n- Special founding member pricing\n- Direct input on features we build\n\nWe'll be in touch soon with updates.\n\nBest,\nThe StudioMind Team`
            })
        });

        const data = await response.json();

        if (data.data && data.data.succeeded > 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'Email sent successfully' }),
                { status: 200, headers }
            );
        } else {
            console.error('SMTP2go error:', data);
            // Return more detailed error info for debugging
            const errorDetail = data.data?.failures?.[0]?.error
                || data.data?.error
                || data.error
                || (data.data?.error_code ? `Error code: ${data.data.error_code}` : null)
                || 'Failed to send email - check SMTP2GO API key and sender verification';
            return new Response(
                JSON.stringify({ error: errorDetail, debug: { succeeded: data.data?.succeeded, failed: data.data?.failed } }),
                { status: 500, headers }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: `Internal server error: ${error.message}` }),
            { status: 500, headers }
        );
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
