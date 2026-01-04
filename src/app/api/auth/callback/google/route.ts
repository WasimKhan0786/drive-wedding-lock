import { NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // IMPORTANT: This is what we need. The user must save this to .env.local
    if (tokens.refresh_token) {
        console.log("!!! GOOGLE REFRESH TOKEN GENERATED !!!");
        console.log("Add this to your .env.local as GOOGLE_REFRESH_TOKEN=");
        console.log(tokens.refresh_token);
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        
        return NextResponse.json({ 
            success: true, 
            message: "Refresh Token generated! Check your VS Code Terminal and copy it to .env.local",
            refresh_token: tokens.refresh_token 
        });
    } else {
        return NextResponse.json({ 
            success: false, 
            message: "No refresh token returned. Did you already authorize? Try revoking access in Google Account Settings or use prompt=consent." 
        });
    }

  } catch (error: any) {
    console.error('Error retrieving access token', error);
    return NextResponse.json({ error: 'Failed to retrieve tokens', details: error.message });
  }
}
