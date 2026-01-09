import Navbar from "@/components/Navbar";
import VideoGallery from "@/components/VideoGallery";
import connectToDatabase from '@/lib/db';
import Video from '@/models/Video';

export const dynamic = 'force-dynamic';

// This is a Server Component
export default async function GalleryPage() {
  // Check for Admin Cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("auth_token")?.value === "unlocked";
  let videos: any[] = [];
  let folders: any[] = [];

  try {
      await connectToDatabase();
      const { default: Folder } = await import("@/models/Folder"); // Import Folder model
      
      videos = await Video.find({}).sort({ createdAt: -1 }).lean();
      folders = await Folder.find({}).sort({ createdAt: -1 }).lean();
  } catch (e) {
      console.error("Failed to fetch videos from DB", e);
  }

  const formattedVideos = videos.map((v: any) => ({
      public_id: v.videoId || v.id,
      youtubeId: v.youtubeId,
      secure_url: `https://www.youtube.com/embed/${v.youtubeId}`,
      format: v.format || 'youtube',
      title: v.title,
      password: v.password,
      hidden: v.hidden || false,
      folderId: v.folderId ? v.folderId.toString() : null,
      width: 1920,
      height: 1080 
  }));

  const formattedFolders = folders.map((f: any) => ({
      _id: f._id.toString(),
      name: f.name,
      password: f.password
  }));

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <div className="container-custom" style={{ paddingTop: '150px', paddingBottom: '40px' }}>
         <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
            marginBottom: '1rem',
            color: 'var(--foreground)'
          }}>
            Wedding <span className="text-gold">Gallery</span>
          </h1>
          <p style={{ color: 'var(--secondary-silver)', fontSize: '1.2rem' }}>
            A curated collection of your most beautiful moments.
          </p>
        </div>
        
        {/* Pass the data to the Client Component */}
        <VideoGallery videos={formattedVideos} folders={formattedFolders} />
      </div>
    </main>
  );
}
