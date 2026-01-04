import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Video from '@/models/Video';

export async function GET() {
  try {
    await connectToDatabase();
    await Video.deleteMany({});
    
    return NextResponse.json({ 
        success: true, 
        message: "All videos have been deleted from the database." 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
