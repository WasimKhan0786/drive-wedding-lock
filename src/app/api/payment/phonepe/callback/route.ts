import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        // PhonePe sends server-to-server callback
        const { response } = await request.json(); // base64 encoded response
        
        // decoding logic can be added here for secure verification
        // For now, we rely on the redirect method
        
        return NextResponse.json({ status: 'ok' });
    } catch (e) {
        return NextResponse.json({ status: 'error' });
    }
}

export async function GET(request: Request) {
    // User is redirected back here
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Here you should verify payment status from PhonePe server using /pg/v1/status API
    // For simplicity in this demo, we assume success if they are redirected back
    // In production: CALL PHONEPE STATUS API HERE

    // Redirect user back to gallery with success flag
    return NextResponse.redirect(new URL('/gallery?payment=success&provider=phonepe', request.url));
}
