import Navbar from "@/components/Navbar";
import UploadSection from "@/components/UploadSection";
import StorageStatus from "@/components/StorageStatus";

export default function UploadPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <div className="container-custom" style={{ paddingTop: '150px', paddingBottom: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            marginBottom: '1rem',
            background: 'linear-gradient(to right, #fff, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Upload Wedding Memories
          </h1>
          <p style={{ color: 'var(--secondary-silver)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Securely preserve your high-definition videos (up to 4K). 
            Our platform handles large files to ensure quality is never compromised.
          </p>
        </div>
        
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <StorageStatus />
            <UploadSection />
        </div>
      </div>
    </main>
  );
}
