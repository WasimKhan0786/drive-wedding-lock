import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    return NextResponse.json({ error: 'Dropbox upload is disabled' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Disabled', details: 'Dropbox integration removed' }, { status: 500 });
  }
}
