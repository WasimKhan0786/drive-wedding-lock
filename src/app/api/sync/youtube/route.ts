import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/youtube';
import connectToDatabase from '@/lib/db';
import Video from '@/models/Video';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // 1. Auth check (Get fresh access token)
        const { token } = await oauth2Client.getAccessToken();
        if (!token) {
            return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 401 });
        }

        // Set credentials for this request
        oauth2Client.setCredentials({ access_token: token });
        
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // 2. Get the "Uploads" Playlist ID from the authenticated user's channel
        const channelsRes = await youtube.channels.list({
            part: ['contentDetails'],
            mine: true
        });

        const uploadsPlaylistId = channelsRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        
        if (!uploadsPlaylistId) {
            return NextResponse.json({ error: 'No channel or uploads playlist found' }, { status: 404 });
        }

        // 3. List the most recent 50 videos from the uploads playlist
        const playlistItemsRes = await youtube.playlistItems.list({
            part: ['snippet', 'contentDetails', 'status'], // Added 'status' to check privacy
            playlistId: uploadsPlaylistId,
            maxResults: 50
        });

        const rawItems = playlistItemsRes.data.items || [];
        const videoIds = rawItems.map(item => item.contentDetails?.videoId).filter(Boolean) as string[];

        if (videoIds.length === 0) {
            return NextResponse.json({ success: true, message: "No videos found to sync.", added: 0 });
        }

        // 4. Double check status using videos.list (More accurate than playlistItems)
        const videosRes = await youtube.videos.list({
            part: ['snippet', 'status'],
            id: videoIds
        });

        const detailedVideos = videosRes.data.items || [];

        await connectToDatabase();

        // Fetch Blacklist (Videos user deleted previously)
        const { default: DeletedVideo } = await import("@/models/DeletedVideo");
        const blacklistedDocs = await DeletedVideo.find({}, { youtubeId: 1 });
        const blacklistedIds = new Set(blacklistedDocs.map(doc => doc.youtubeId));

        let addedCount = 0;

        for (const video of detailedVideos) {
            // SKIP if video is in blacklist
            if (video.id && blacklistedIds.has(video.id)) {
                continue;
            }

            const privacyStatus = video.status?.privacyStatus;
            
            // STRICT CHECK: Only allow 'unlisted'
            if (privacyStatus === 'unlisted') {
                const videoId = video.id;
                const title = video.snippet?.title;
                const publishedAt = video.snippet?.publishedAt;

                if (videoId) {
                    const exists = await Video.findOne({ 
                        $or: [{ videoId: videoId }, { youtubeId: videoId }] 
                    });
    
                    if (!exists) {
                        await Video.create({
                            videoId: videoId,
                            youtubeId: videoId,
                            title: title || 'Synced Video',
                            password: "wasim0786",
                            format: 'youtube',
                            createdAt: publishedAt ? new Date(publishedAt) : new Date()
                        });
                        addedCount++;
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sync Complete. Checked ${detailedVideos.length} videos, added ${addedCount} new unlisted memories.`,
            added: addedCount 
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
