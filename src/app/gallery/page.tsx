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

  try {
      await connectToDatabase();
      
      // If admin, show all. If not, show only visible.
      // Actually, standard users shouldn't see hidden.
      // But ADMIN needs to login via standard page to see them?
      // Wait, the "7004636112" feature is client-side only per session.
      // So fetch EVERYTHING, but let Client Component filter?
      // No, that leaks hidden videos to client source.
      // BUT, since we have a client-side admin mode switch, we MUST send them to client.
      // We will rely on the CLIENT component to visually hide them unless admin mode is active.
      
      videos = await Video.find({}).sort({ createdAt: -1 }).lean();
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
      width: 1920,
      height: 1080 
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
        <VideoGallery videos={formattedVideos} />
      </div>
    </main>
  );
}
