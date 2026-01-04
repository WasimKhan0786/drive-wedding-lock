"use client";

import { UploadCloud, CheckCircle, AlertCircle, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadSection() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // Progress is not easily available with simple fetch, but we can fake it or use XHR
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showToast) {
        const timer = setTimeout(() => setShowToast(false), 5000);
        return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

    const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
        setError("Please upload a video file.");
        return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
        // --- PHASE 1: INIT ---
        const initRes = await fetch('/api/upload/youtube?action=init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: file.name })
        });

        if (!initRes.ok) {
            const err = await initRes.json();
            throw new Error(err.details || 'Failed to initialize upload');
        }

        const { uploadUrl } = await initRes.json();

        // --- PHASE 2: DIRECT UPLOAD (Frontend -> YouTube) ---
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', 'video/*');
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setProgress(Math.round(percentComplete));
            }
        };

        xhr.onload = async () => {
             if (xhr.status === 200 || xhr.status === 201) {
                const videoData = JSON.parse(xhr.responseText);
                
                // --- PHASE 3: SAVE METADATA (Frontend -> Backend) ---
                const saveRes = await fetch('/api/upload/youtube?action=save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: videoData.id,
                        title: videoData.snippet?.title || file.name,
                        password: password // State variable
                    })
                });
                
                if(saveRes.ok) {
                    setUploadedUrl("Uploaded ID: " + videoData.id);
                    setShowToast(true);
                    setUploading(false);
                    setPassword(""); // Clear password after success
                    router.refresh(); // Refresh gallery
                } else {
                    setError("Upload successful, but failed to save to gallery.");
                    setUploading(false);
                }

             } else {
                console.error("Direct Upload Error:", xhr.responseText);
                setError(`Upload failed. Status: ${xhr.status}`);
                setUploading(false);
             }
        };

        xhr.onerror = () => {
             setError("Network error during direct upload.");
             setUploading(false);
        };

        xhr.send(file);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred during upload.");
        setUploading(false);
    }
  };

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
      
      {!uploadedUrl && !uploading ? (
        <div 
            style={{ 
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
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="video/*" 
                style={{ display: 'none' }} 
            />
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
            <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem' }}>Max ~2 GB per file</p>
            </div>
            


            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', marginBottom: '1.5rem' }}>
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create Password for this Video"
                    id="video-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      paddingRight: '40px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      width: '100%',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        zIndex: 10
                    }}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            
            {/* Show button only if password is entered */}
            {password.trim().length > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                        Select Video to Upload
                    </button>
                </div>
            ) : (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#888', fontSize: '0.9rem' }}>
                    Enter password to unlock file upload.
                </div>
            )}



            <div style={{ 
                borderTop: '1px solid var(--glass-border)', 
                paddingTop: '1.5rem',
                marginTop: '1rem',
                textAlign: 'left',
                width: '100%',
                maxWidth: '600px'
            }}>
                <h4 style={{ color: 'var(--primary-gold)', marginBottom: '0.8rem', fontSize: '1.1rem' }}>⚠️ Important Upload Instructions & Limits:</h4>
                <ul style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.2rem', margin: 0 }}>
                    <li><strong>Daily Upload Quota:</strong> We use the YouTube Free API which gives 10,000 Credits/day.</li>
                    <li><strong>Upload Cost:</strong> 1 Video Upload = 1,600 Credits (Approx ~6 videos per day limit).</li>
                    <li><strong>Deletion Warning:</strong> Deleting via API costs 50 credits. <b>Warning:</b> Videos deleted via API are permanently removed and cannot be recovered.</li>
                    <li><strong>Privacy:</strong> All videos are uploaded as "Unlisted" (Safe & Hidden).</li>
                    <li><strong>Do Not Close:</strong> Keep this tab open until upload hits 100%.</li>
                </ul>
            </div>
        </div>
      ) : uploading ? (
        <div style={{ width: '100%' }}>
             <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 2rem auto',
                color: 'var(--primary-gold)'
             }} className="animate-spin">
                 <Loader2 size={80} />
             </div>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Uploading Memory... {Math.round(progress)}%</h3>
             <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
                Please wait, do not close this tab.
             </div>
             <div style={{ 
                 width: '100%', 
                 height: '10px', 
                 background: 'rgba(255,255,255,0.1)', 
                 borderRadius: '5px',
                 overflow: 'hidden',
                 boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
             }}>
                 <div style={{ 
                     width: `${progress}%`, 
                     height: '100%', 
                     background: 'linear-gradient(90deg, var(--primary-gold), #ffd700)',
                     transition: 'width 0.2s ease',
                     boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                 }} />
             </div>
             <p style={{ marginTop: '1rem', color: '#888' }}>Please do not close this tab.</p>
        </div>
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
            <p style={{ margin: '0 0 0.5rem 0', color: '#ccc', fontSize: '1.2rem' }}>Your memory has been safely stored.</p>
            <p style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle size={16}/> Permanent Storage
            </p>
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
