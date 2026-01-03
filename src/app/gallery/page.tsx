import Navbar from "@/components/Navbar";
import VideoGallery from "@/components/VideoGallery";
import { getVideos } from "@/lib/cloudinary";

// This is a Server Component
export default async function GalleryPage() {
  // Fetch videos from Cloudinary on the server
  const videos = await getVideos();

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
        <VideoGallery videos={videos} />
      </div>
    </main>
  );
}
