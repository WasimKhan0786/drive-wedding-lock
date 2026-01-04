import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        // Credentials from .env.local
        const MERCHANT_ID = process.env.PHONEPE_CLIENT_ID; // Assuming Client ID variable holds Merchant ID
        const SALT_KEY = process.env.PHONEPE_CLIENT_SECRET;
        const SALT_INDEX = 1; // Default usually 1

        if (!MERCHANT_ID || !SALT_KEY) {
            console.error("Missing PhonePe Credentials");
            return NextResponse.json({ error: 'PhonePe Credentials Validation Failed' }, { status: 500 });
        }

        const transactionId = "MT" + Date.now();
        const origin = request.headers.get('origin') || "http://localhost:3000";

        
        // PhonePe Payload
        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: 'MUID' + Date.now(),
            amount: 400 * 100, // 400 INR in paise (Hardcoded as per previous logic)
            redirectUrl: `${origin}/api/payment/phonepe/callback?id=${transactionId}`,
            redirectMode: "REDIRECT",
            callbackUrl: `${origin}/api/payment/phonepe/callback?id=${transactionId}`,
            mobileNumber: "9999999999", // Dummy for now, or take from user
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const payloadString = JSON.stringify(payload);
        const base64Payload = Buffer.from(payloadString).toString('base64');
        
        // Checksum Calculation: SHA256(base64Payload + "/pg/v1/pay" + saltKey) + ### + saltIndex
        const stringToSign = base64Payload + '/pg/v1/pay' + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + SALT_INDEX;

        // Dynamic API URL Selection
        const isSandbox = MERCHANT_ID.toUpperCase().includes('TEST') || MERCHANT_ID === 'PGTESTPAYUAT';
        const PHONEPE_API_URL = isSandbox 
            ? "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay" 
            : "https://api.phonepe.com/apis/hermes/pg/v1/pay";

        console.log("PhonePe Processing:", { merchantId: MERCHANT_ID, isSandbox, url: PHONEPE_API_URL });

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({
                request: base64Payload
            })
        };

        const response = await fetch(PHONEPE_API_URL, options);
        const textResponse = await response.text();
        
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            console.error("PhonePe Raw Response:", textResponse);
            return NextResponse.json({ success: false, error: "Invalid JSON from PhonePe: " + textResponse });
        }

        if (data.success) {
            return NextResponse.json({ 
                success: true, 
                url: data.data.instrumentResponse.redirectInfo.url,
                transactionId: transactionId 
            });
        } else {
            console.error("PhonePe Error Response:", data);
            return NextResponse.json({ success: false, error: data.message || data.code || "PhonePe Init Failed" });
        }

    } catch (error: any) {
        console.error("PhonePe Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
