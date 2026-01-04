import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
    try {
        const { email, name, videoTitle, amount, paymentId, provider } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            console.error("Resend API Key missing");
            return NextResponse.json({ success: false, error: "Server Email Config Missing" });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send Email to Customer
        await resend.emails.send({
            from: 'Video Portal <onboarding@resend.dev>', // Use verified domain or default test domain
            to: email, 
            subject: `Payment Successful - ${videoTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d4af37;">Thank you for your purchase, ${name}!</h2>
                    <p>Your payment for the video memory <strong>"${videoTitle}"</strong> was successful.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Amount Paid:</strong> ₹${amount}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                        <p><strong>Provider:</strong> ${provider}</p>
                    </div>

                    <p>You can now download your video directly from the portal.</p>
                    <hr />
                    <p style="font-size: 0.9em; color: #777;">Video Portal Team</p>
                </div>
            `
        });

        // Send Email to Admin (Yourself)
        // Ideally, put your email in ADMIN_EMAIL env, for now using the same 'to' for demo or fixed email
        // Note: Resend Free Tier only sends to your verified email or verified domain addresses.
        // Assuming 'email' (customer) might NOT be verified, Resend might block it unless you have a domain properly set up.
        // For testing, sending to YOURSELF is safer.
        
        // Let's assume you want a copy:
        await resend.emails.send({
            from: 'Video Portal System <onboarding@resend.dev>',
            to: 'wasim786.wk@gmail.com', // Replace with your actual verified email if needed, or use Env
            subject: `New Sale: ${name}`,
            html: `
                 <h2>New Purchase Received</h2>
                 <p><strong>Customer:</strong> ${name} (${email})</p>
                 <p><strong>Video:</strong> ${videoTitle}</p>
                 <p><strong>Amount:</strong> ₹${amount}</p>
                 <p><strong>Payment ID:</strong> ${paymentId} (${provider})</p>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Resend Error:", error);
        return NextResponse.json({ success: false, error: error.message });
    }
}
