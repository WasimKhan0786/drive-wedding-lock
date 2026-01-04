import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Video from '@/models/Video';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const DB_PATH = path.join(process.cwd(), 'src', 'data', 'videos.json');
    
    if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json({ message: "No local JSON file found." });
    }

    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    const localVideos = JSON.parse(fileContent);

    if (localVideos.length === 0) {
        return NextResponse.json({ message: "Local JSON is empty." });
    }

    await connectToDatabase();

    let migratedCount = 0;
    
    for (const v of localVideos) {
        // Check if exists
        const exists = await Video.findOne({ 
            $or: [{ videoId: v.id }, { youtubeId: v.youtubeId }] 
        });

        if (!exists) {
            await Video.create({
                videoId: v.id,
                youtubeId: v.youtubeId,
                title: v.title,
                password: v.password || "wasim0786", // Apply default password rule if missing
                format: v.format || 'youtube',
                createdAt: v.createdAt ? new Date(v.createdAt) : new Date()
            });
            migratedCount++;
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Migration Complete. Migrated ${migratedCount} videos.`,
        totalScanned: localVideos.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
