"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadSection() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  // You would typically get these from env vars
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"; 

  useEffect(() => {
    if (showToast) {
        const timer = setTimeout(() => setShowToast(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '3rem', 
      textAlign: 'center',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      border: '1px solid var(--glass-border)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {!uploadedUrl ? (
        <CldUploadWidget 
          uploadPreset={uploadPreset}
          onSuccess={(result: CloudinaryUploadWidgetResults) => {
            document.body.style.overflow = "auto";
            if (typeof result.info === 'object' && result.info?.secure_url) {
                setUploadedUrl(result.info.secure_url);
                setShowToast(true);
                // Refresh to show storage stats
                router.refresh(); 
            }
          }}
          onQueuesEnd={(result, { widget }) => {
              widget.close();
              document.body.style.overflow = "auto";
          }}
          options={{
            sources: ['local', 'url', 'google_drive', 'dropbox'],
            maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB conceptual limit
            clientAllowedFormats: ['video'], // Strictly allow only videos
            resourceType: 'video', // Force widget into video mode
            singleUploadAutoClose: false,
            text: {
                en: {
                    menu: {
                        files: "My Videos",
                    },
                    local: {
                        browse: "Browse Videos",
                        dd_title_single: "Drag and Drop your Video here",
                    },
                    queue: {
                        title: "Video Queue",
                        title_uploading_with_counter: "Uploading {{num}} Video(s)",
                    }
                }
            },
            styles: {
                palette: {
                    window: "#0a0a0a",
                    windowBorder: "#D4AF37",
                    tabIcon: "#D4AF37",
                    menuIcons: "#D4AF37",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#D4AF37",
                    action: "#D4AF37",
                    inactiveTabIcon: "#555555",
                    error: "#F44235",
                    inProgress: "#D4AF37",
                    complete: "#20B832",
                    sourceBg: "#1a1a1a"
                },
                fonts: {
                    default: null,
                    "'Inter', sans-serif": {
                        url: "https://fonts.googleapis.com/css?family=Inter",
                        active: true
                    }
                }
            }
          }}
        >
          {({ open }) => (
            <div 
              onClick={() => open()} 
              style={{ 
                cursor: 'pointer', 
                width: '100%', 
                height: '100%', 
                minHeight: '400px',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '1.5rem',
                border: '2px dashed var(--glass-border)',
                borderRadius: '12px',
                padding: '3rem',
                transition: 'all 0.3s ease',
                background: 'rgba(255,255,255,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-gold)';
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(0,0,0,0))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-gold)',
                marginBottom: '1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <UploadCloud size={48} />
              </div>
              <div>
                <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Drop Wedding Videos Here</h3>
                <p style={{ color: '#888', fontSize: '1.1rem' }}>Support for 4K (MP4, MOV, MKV)</p>
                <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem' }}>Up to 50 GB per file</p>
              </div>
              <button className="btn-primary" style={{ marginTop: '1rem' }}>
                Select Video Files
              </button>
            </div>
          )}
        </CldUploadWidget>
      ) : (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ 
             width: '100px', 
             height: '100px', 
             borderRadius: '50%',
             background: 'rgba(74, 222, 128, 0.1)', 
             display: 'flex',
             alignItems: 'center', 
             justifyContent: 'center',
             margin: '0 auto 2rem auto'
          }}>
            <CheckCircle size={50} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Upload Successful!</h2>
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#ccc', fontSize: '1.2rem' }}>Your memory has been safely stored in the cloud.</p>
            <p style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle size={16}/> Permanent Lifetime Storage
            </p>
          </div>
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '1rem', 
            borderRadius: '8px', 
            border: '1px solid var(--glass-border)',
            marginBottom: '2rem',
            wordBreak: 'break-all',
            color: 'var(--primary-gold)',
            fontFamily: 'monospace'
          }}>
            {uploadedUrl}
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setUploadedUrl(null)}
          >
            Upload Another Memory
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(244, 66, 53, 0.1)', borderRadius: '8px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
          <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: '#0a0a0a',
              border: '1px solid var(--primary-gold)',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              zIndex: 9999
          }}>
              <CheckCircle size={24} color="var(--primary-gold)" />
              <div>
                  <h4 style={{ margin: 0, color: '#fff' }}>Upload Complete</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.85rem' }}>Video has been added to gallery.</p>
              </div>
              <button onClick={() => setShowToast(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginLeft: '10px' }}>
                  <X size={16} />
              </button>
          </div>
      )}
      <style jsx global>{`
          @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
          }
      `}</style>
    </div>
  );
}
