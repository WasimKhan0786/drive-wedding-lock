import { NextResponse } from 'next/server';
import { youtube, oauth2Client } from '@/lib/youtube';
import connectToDatabase from '@/lib/db';
import Video from '@/models/Video';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // --- ACTION: SAVE (Metadata after upload) ---
    if (action === 'save') {
        const body = await request.json();
        const { id, title, password } = body;

        if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

        await connectToDatabase();

        const newVideo = await Video.create({
            videoId: id,
            youtubeId: id,
            title: title || 'Untitled Video',
            password: password || "wasim0786",
            format: 'youtube',
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, video: newVideo });
    }

    // --- ACTION: INIT (Get Resumable URL) ---
    if (action === 'init') {
        const body = await request.json();
        const { title } = body;

        // 1. Get Fresh Access Token
        const { token } = await oauth2Client.getAccessToken();
        if (!token) throw new Error("Failed to get access token");

        // 2. Start Resumable Session
        const metadata = {
            snippet: {
                title: title || 'Wedding Video',
                description: 'Uploaded via Wedding Video Portal',
            },
            status: {
                privacyStatus: 'unlisted',
                selfDeclaredMadeForKids: false
            }
        };

        const res = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': 'video/*', // Approximate
            },
            body: JSON.stringify(metadata)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Google Init Failed: ${res.status} ${errText}`);
        }

        const uploadUrl = res.headers.get('location');
        if (!uploadUrl) throw new Error("No upload URL returned from Google");

        return NextResponse.json({ uploadUrl });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: 'Operation failed', details: error.message }, { status: 500 });
  }
}
