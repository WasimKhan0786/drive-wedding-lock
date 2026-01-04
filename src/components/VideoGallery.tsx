"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { deleteVideoAction, updateVideoPasswordAction, toggleVideoVisibilityAction } from "@/app/actions";
import { loadScript } from "@/lib/utils";
import { Play, X, ChevronLeft, ChevronRight, Pause, Volume2, VolumeX, Maximize, Trash2, Loader2, Lock, RefreshCw, Heart, Eye, EyeOff, Download, CreditCard, Key, Share2 } from "lucide-react";

interface VideoResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  duration?: number;
  youtubeId?: string;
  title?: string;
  password?: string;
  hidden?: boolean;
}

export default function VideoGallery({ videos }: { videos: VideoResource[] }) {
  const router = useRouter();  
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  // Purchase Logic
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [processingProvider, setProcessingProvider] = useState<'razorpay' | 'phonepe' | null>(null);

  // Password Logic
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isUnlocked, setIsUnlockedFn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Master Password Removed
  const ADMIN_CODE = "7004636112";

  // Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, startPasswordTransition] = useTransition();

  const selectedVideo = selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  useEffect(() => {
     if (selectedVideo) {
         // Reset state and Require Password for ALL videos
         setIsUnlockedFn(false);
         setIsAdminMode(false); // Reset Admin Mode
         setPasswordInput("");
         setPasswordError(false);
         setIsPasswordModalOpen(true);
         setIsPlaying(false);
         setPurchaseModalOpen(false); // Reset purchase modal
     } else {
         setIsPasswordModalOpen(false);
         setPurchaseModalOpen(false);
         setIsChangePasswordModalOpen(false);
     }
  }, [selectedVideoIndex]);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => setToastMessage(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // Payment Validation (PhonePe Redirect)
  useEffect(() => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
           showNotification('success', "Payment Verified! Downloading...");
           
           const pendingId = localStorage.getItem('pendingDownloadId');
           const pendingCustomer = localStorage.getItem('pendingCustomer');
           
           if (pendingId) {
                const vid = videos.find(v => v.public_id === pendingId);
                if (vid) {
                     // Trigger Email
                     if (pendingCustomer) {
                        const customer = JSON.parse(pendingCustomer);
                        fetch('/api/send-email', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: customer.email,
                                name: customer.name,
                                videoTitle: vid.title || 'Memory',
                                amount: 400,
                                paymentId: 'PhonePe-Redirect',
                                provider: 'PhonePe'
                            })
                        });
                     }

                     if (vid.format === 'youtube') {
                        window.open(`https://www.youtube.com/watch?v=${vid.youtubeId}`, '_blank');
                     } else {
                         const link = document.createElement('a');
                         link.href = vid.secure_url;
                         link.download = (vid.title || 'memory') + ".mp4";
                         document.body.appendChild(link);
                         link.click();
                         document.body.removeChild(link);
                     }
                }
                localStorage.removeItem('pendingDownloadId');
                localStorage.removeItem('pendingCustomer');
           }
           router.replace('/gallery');
      }
  }, [videos, router]);

  const showNotification = (type: 'success' | 'error', text: string) => {
      setToastMessage({ type, text });
  };
  
  const handleSync = async () => {
      try {
          setIsSyncing(true);
          const res = await fetch('/api/sync/youtube', { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
              showNotification('success', data.message);
              router.refresh();
          } else {
              showNotification('error', "Sync Failed: " + data.error);
          }
      } catch (error) {
          showNotification('error', "Sync Failed: Network Error");
      } finally {
          setIsSyncing(false);
      }
  };
  
  // Customer Form State
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '' });

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
          showNotification('success', "Link copied to clipboard");
      }).catch(err => {
          console.error("Failed to copy link: ", err);
          showNotification('error', "Failed to copy link");
      });
  };

// ... (skipping unchanged parts) ...

  const triggerDownload = () => {
       if (selectedVideo) {
           if (selectedVideo.format === 'youtube') {
              window.open(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`, '_blank');
           } else {
               const link = document.createElement('a');
               link.href = selectedVideo.secure_url;
               link.download = (selectedVideo.title || 'memory') + ".mp4";
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
           }
       }
  };

  const handlePhonePePayment = async () => {
       if (!customerDetails.name || !customerDetails.email) {
           showNotification('error', "Please fill in your details first.");
           return;
       }
       setProcessingProvider('phonepe');
       if (selectedVideo) {
           localStorage.setItem('pendingDownloadId', selectedVideo.public_id);
           localStorage.setItem('pendingCustomer', JSON.stringify(customerDetails));
       }
       
       try {
           // Clear any previous razorpay script if needed, though they shouldn't conflict if not active
           const res = await fetch('/api/payment/phonepe', { method: 'POST', body: JSON.stringify({ amount: 400 }) });
           
           const data = await res.json();
           if (data.success && data.url) {
               window.location.href = data.url; 
           } else {
               showNotification('error', "PhonePe Init Failed: " + (data.error || "Unknown"));
               setProcessingProvider(null);
           }
       } catch (e) {
           showNotification('error', "Network Error");
           setProcessingProvider(null);
       }
  };

  const completePurchaseRazorpay = async () => {
      if (!customerDetails.name || !customerDetails.email) {
           showNotification('error', "Please fill in your details first.");
           return;
      }
      setProcessingProvider('razorpay');
      if (selectedVideo) {
           localStorage.setItem('pendingDownloadId', selectedVideo.public_id);
      }

      try {
          // ... load script logic ...
          const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
          if (!res) { showNotification('error', "Razorpay SDK failed"); setProcessingProvider(null); return; }

          const orderRes = await fetch('/api/payment/create-order', { method: 'POST' });
          const orderData = await orderRes.json();
          if (orderData.error) { showNotification('error', "Order Creation Failed"); setProcessingProvider(null); return; }

          const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

          const options = {
              key: keyId, 
              amount: orderData.amount,
              currency: orderData.currency,
              name: "Video Portal",
              description: "Download Premium Memory",
              order_id: orderData.id,
              prefill: {
                  name: customerDetails.name,
                  email: customerDetails.email,
                  contact: '' 
              },
              handler: async function (response: any) {
                  const verifyRes = await fetch('/api/payment/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature
                      })
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                      showNotification('success', "Payment Verified! Sending Email...");
                      // Send Email
                      await fetch('/api/send-email', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: customerDetails.email,
                                name: customerDetails.name,
                                videoTitle: selectedVideo?.title || 'Memory',
                                amount: 400,
                                paymentId: response.razorpay_payment_id,
                                provider: 'Razorpay'
                            })
                       });

                      setPurchaseModalOpen(false);
                      setTimeout(() => triggerDownload(), 500); 
                  } else {
                      showNotification('error', "Payment Verification Failed");
                  }
                  setProcessingProvider(null);
              },
              theme: { color: "#d4af37" }
          };

          const paymentObject = new (window as any).Razorpay(options);
          paymentObject.open();
          setProcessingProvider(null); 

      } catch (error) {
          console.error(error);
          showNotification('error', "Payment Process Failed");
          setProcessingProvider(null);
      }
  };

  // ... (JSX for Modal) ...


  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Admin Check
      if (passwordInput === ADMIN_CODE) {
          setIsUnlockedFn(true);
          setIsAdminMode(true);
          setIsPasswordModalOpen(false);
          setIsPlaying(true);
          showNotification('success', "Admin Mode Activated");
          setPasswordError(false);
          return;
      }

      if (selectedVideo?.password && passwordInput === selectedVideo.password) {
          setIsUnlockedFn(true);
          setIsPasswordModalOpen(false);
          setIsPlaying(true);
          setPasswordError(false);
      } else {
          setPasswordError(true);
      }
  };

  const handleChangePassword = () => {
      if (!selectedVideo) return;
      
      startPasswordTransition(async () => {
          const result = await updateVideoPasswordAction(selectedVideo.public_id, newPassword);
          if (result.success) {
              showNotification('success', "Password updated successfully");
              setIsChangePasswordModalOpen(false);
              setNewPassword("");
              router.refresh();
          } else {
              showNotification('error', "Failed to update password");
          }
      });
  };

  const initiatePurchase = () => {
      setPurchaseModalOpen(true);
  };
  
  // Handlers
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex < videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent, publicId: string) => {
      e.stopPropagation();
      setVideoToDelete(publicId);
  };

  const confirmDelete = () => {
      if (videoToDelete) {
          startTransition(async () => {
             const result = await deleteVideoAction(videoToDelete);
             if(!result){
                 showNotification('error', "Failed to delete video.");
             } else if (!result.success) {
                 showNotification('error', "Failed to delete video.");
             } else {
                 showNotification('success', "Memory deleted successfully.");
             }
             setVideoToDelete(null);
          });
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart) return;
      const touchEnd = e.changedTouches[0].clientX;
      const distance = touchStart - touchEnd;
      const minSwipeDistance = 50;

      if (distance > minSwipeDistance) {
          handleNext();
      } else if (distance < -minSwipeDistance) {
          handlePrev();
      }
      setTouchStart(null);
  };

  const SyncButton = () => (
      <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="glass-panel"
          style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '0.6rem 1.2rem', 
              color: 'var(--primary-gold)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
          }}
      >
           {isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
          ) : (
              <Heart size={16} fill="var(--primary-gold)" className="heart-beat" />
          )}
          {isSyncing ? "Syncing..." : "Sync your memories!"}
      </button>
  );

  if (videos.length === 0) {
      return (
          <div className="text-center text-gray-400 py-20">
              <p style={{ marginBottom: '1rem' }}>No videos found. Upload some memories!</p>
              
               <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', fontSize: '0.9rem', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)' }}
              >
                  {isSyncing ? (
                      <RefreshCw size={16} className="animate-spin" />
                  ) : (
                      <Heart size={16} fill="var(--primary-gold)" className="heart-beat" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync your memories!"}
              </button>

              {toastMessage && (
                  <div style={{
                      position: 'fixed',
                      top: '20px',
                      right: '20px',
                      background: toastMessage.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(244, 66, 53, 0.1)',
                      border: toastMessage.type === 'success' ? '1px solid #4ade80' : '1px solid #f44336',
                      padding: '1rem 1.5rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      zIndex: 9999,
                      backdropFilter: 'blur(10px)',
                      animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                      {toastMessage.type === 'success' ? (
                          <div style={{ background: '#4ade80', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                               <Heart size={16} color="#000" fill="#000" />
                          </div>
                      ) : (
                          <div style={{ background: '#f44336', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                               <X size={16} color="#fff" />
                          </div>
                      )}
                      <div style={{ textAlign: 'left' }}>
                          <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{toastMessage.type === 'success' ? 'Success' : 'Attention'}</h4>
                          <p style={{ margin: '4px 0 0 0', color: '#ccc', fontSize: '0.85rem' }}>{toastMessage.text}</p>
                      </div>
                      <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginLeft: '10px' }}>
                          <X size={14} />
                      </button>
                  </div>
              )}
          </div>
      )
  }

   const visibleVideos = videos.filter(v => !v.hidden || isAdminMode);
   
   // If we are NOT in admin mode, but the user is logged in as "admin" via specific video code,
   // we don't have a global "admin" switch yet visible on screen to unhide things.
   // BUT, the user asked to hide/unhide. 
   // Currently, if a video is hidden, it disappears.
   // To see it, the user must be "Admin".
   // I'll add a check: if any video is hidden, and user enters "Admin Code" in *any* video, global Admin Mode should persist?
   // Currently Admin Mode is reset on video close.
   // For now, let's keep it simple: Hidden videos are hidden.
   // To restore them, the user needs a way to "See All".
   // I will add a small "Admin Login" footer or rely on the "Unlock" mechanism?
   // Actually, let's just show them but DIMMED if hidden and let the admin code unlock specific functions.
   // No, "Hide" implies visual removal.
   // Let's filter them out for now.
   
   return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <SyncButton />
      </div>

      {toastMessage && (
          <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: toastMessage.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(244, 66, 53, 0.1)',
              border: toastMessage.type === 'success' ? '1px solid #4ade80' : '1px solid #f44336',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              zIndex: 9999,
              backdropFilter: 'blur(10px)',
              animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
              {toastMessage.type === 'success' ? (
                  <div style={{ background: '#4ade80', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                       <Heart size={16} color="#000" fill="#000" />
                  </div>
              ) : (
                  <div style={{ background: '#f44336', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                       <X size={16} color="#fff" />
                  </div>
              )}
              <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{toastMessage.type === 'success' ? 'Success' : 'Attention'}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#ccc', fontSize: '0.85rem' }}>{toastMessage.text}</p>
              </div>
              <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginLeft: '10px' }}>
                  <X size={14} />
              </button>
          </div>
      )}

      <div className="animate-fade-in" style={{ 
           display: 'grid', 
           gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
           gap: '1.5rem',
           padding: '0 1rem'
        }}>
           <style jsx>{`
               @media (max-width: 640px) {
                   .gallery-card {
                       min-height: auto;
                   }
                   div[style*="display: grid"] {
                       grid-template-columns: 1fr !important;
                       gap: 1.5rem !important;
                   }
               }
           `}</style>
           {visibleVideos.map((video, index) => (
             <div 
               key={video.public_id} 
               className="glass-panel gallery-card" 
               style={{ 
                   overflow: 'hidden', 
                   cursor: 'pointer', 
                   position: 'relative',
                   border: video.hidden ? '1px dashed #a855f7' : undefined,
                   opacity: video.hidden ? 0.6 : 1
               }}
               onClick={() => {
                   setSelectedVideoIndex(index);
               }}
             >
               <div style={{ height: '240px', background: '#000', position: 'relative' }} className="video-thumbnail">
                  {video.format === 'youtube' && video.youtubeId ? (
                     <img 
                         src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                         alt={video.title || "Video"}
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     />
                  ) : video.secure_url.includes('cloudinary') ? (
                     <img
                         src={video.secure_url.replace(/\.[^/.]+$/, ".jpg")}
                         alt="Video thumbnail"
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     />
                  ) : (
                     <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                          Dropbox/Other
                     </div>
                  )}
                  
                  <div className="play-overlay" style={{
                     position: 'absolute',
                     top: 0, left: 0, width: '100%', height: '100%',
                     background: 'rgba(0,0,0,0.4)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     opacity: 0,
                     transition: 'opacity 0.3s ease'
                  }}>
                     <div style={{
                         width: '60px', height: '60px',
                         borderRadius: '50%',
                         background: 'rgba(212, 175, 55, 0.9)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
                     }}>
                         <Play size={24} fill="#000" color="#000" style={{ marginLeft: '4px' }} />
                     </div>
                  </div>
 
                  <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid var(--primary-gold)',
                      borderRadius: '50%',
                      padding: '8px',
                      color: 'var(--primary-gold)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                   }}>
                      <Lock size={14} />
                   </div>
               </div>
               <div style={{ padding: '1rem' }}>
                   <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       {video.title || `Memory #${index + 1}`}
                   </h3>
               </div>
             </div>
           ))}
       </div>
 
       <style jsx global>{`
         .delete-btn:hover {
             transform: scale(1.1) rotate(15deg) !important;
             background: rgba(244, 66, 53, 1) !important;
             box-shadow: 0 5px 15px rgba(244, 66, 53, 0.4);
         }
         @keyframes modalPop {
             0% { transform: scale(0.9); opacity: 0; }
             100% { transform: scale(1); opacity: 1; }
         }
         @keyframes heartbeat {
            0% { transform: scale(1); }
            14% { transform: scale(1.3); }
            28% { transform: scale(1); }
            42% { transform: scale(1.3); }
            70% { transform: scale(1); }
        }
        .heart-beat {
            animation: heartbeat 1.5s ease-in-out infinite;
            display: inline-block;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
       `}</style>
       
       
       {/* Admin Change Password Modal */}
       {isChangePasswordModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setIsChangePasswordModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #3b82f6' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                       <Key size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Update Password</h3>
                   <p style={{ color: '#aaa', marginBottom: '2rem' }}>Set a new password for this memory.</p>
                   
                   <input 
                       type="text"
                       autoFocus
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)}
                       placeholder="Enter new password"
                       style={{
                           width: '100%',
                           padding: '12px',
                           borderRadius: '8px',
                           border: '1px solid #444',
                           background: 'rgba(0,0,0,0.3)',
                           color: '#fff',
                           fontSize: '1.1rem',
                           textAlign: 'center',
                           marginBottom: '1.5rem'
                       }}
                   />
                   
                   <button 
                       onClick={handleChangePassword}
                       disabled={isUpdatingPassword || !newPassword}
                       className="btn-primary" 
                       style={{ width: '100%', background: '#3b82f6', borderColor: '#3b82f6' }}
                   >
                       {isUpdatingPassword ? <Loader2 className="animate-spin" /> : "Update Password"}
                   </button>
               </div>
           </div>
       )}

       {/* Purchase Modal */}
       {purchaseModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setPurchaseModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--primary-gold)', boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '70px', height: '70px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                       <CreditCard size={32} />
                   </div>
                   <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>Unlock Download</h3>
                   <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                       To download this premium memory in 4K resolution, a small fee is required.
                   </p>
                   
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                       <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-gold)' }}>₹400</p>
                       <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>One-time payment</p>
                   </div>
                   
                   <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                       <label style={{ display: 'block', color: '#ddd', fontSize: '0.9rem', marginBottom: '8px' }}>Name</label>
                       <input 
                           type="text" 
                           placeholder="Your Full Name"
                           value={customerDetails.name}
                           onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                           style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1rem' }}
                       />
                       
                       <label style={{ display: 'block', color: '#ddd', fontSize: '0.9rem', marginBottom: '8px' }}>Email (Gmail)</label>
                       <input 
                           type="email" 
                           placeholder="example@gmail.com"
                           value={customerDetails.email}
                           onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                           style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                       />
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                       <button 
                           onClick={completePurchaseRazorpay} 
                           disabled={processingProvider !== null}
                           className="btn-primary" 
                           style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#3399cc' }} 
                       >
                           {processingProvider === 'razorpay' ? <Loader2 size={20} className="animate-spin" /> : "Pay via Razorpay"}
                       </button>

                       <button 
                           onClick={handlePhonePePayment} 
                           disabled={processingProvider !== null}
                           className="btn-primary" 
                           style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#5f259f' }} 
                       >
                           {processingProvider === 'phonepe' ? <Loader2 size={20} className="animate-spin" /> : "Pay via PhonePe"}
                       </button>
                   </div>
               </div>
           </div>
       )}
 
       {/* Password Modal */}
       {isPasswordModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 3000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setSelectedVideoIndex(null)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', isolation: 'isolate', border: '1px solid var(--primary-gold)' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                       <Lock size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Enter Password</h3>
                   <p style={{ color: '#aaa', marginBottom: '2rem' }}>This memory is protected. Enter password to view.</p>
                   
                   <form onSubmit={handlePasswordSubmit}>
                       <div style={{ position: 'relative', width: '100%', marginBottom: passwordError ? '0.5rem' : '1.5rem' }}>
                           <input 
                               type={showPassword ? "text" : "password"}
                               autoFocus
                               value={passwordInput}
                               onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                               placeholder="Enter Password"
                               style={{
                                   width: '100%',
                                   padding: '12px 40px 12px 12px',
                                   borderRadius: '8px',
                                   border: passwordError ? '1px solid #f44336' : '1px solid #444',
                                   background: 'rgba(0,0,0,0.3)',
                                   color: '#fff',
                                   outline: 'none',
                                   fontSize: '1.1rem',
                                   textAlign: 'center'
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
                                    zIndex: 10
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                       </div>
                       
                       {passwordError && <p style={{ color: '#f44336', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Incorrect password</p>}
                       
                       <button type="submit" className="btn-primary" style={{ width: '100%' }}>Unlock Memory</button>
                   </form>
               </div>
           </div>
       )}
 
       {/* Main Video Player (Only shows if Unlocked) */}
       {selectedVideo && isUnlocked && (
         <div style={{
             position: 'fixed',
             top: 0, left: 0, width: '100%', height: '100%',
             background: 'rgba(0,0,0,0.95)',
             zIndex: 1000,
             display: 'flex',
             flexDirection: 'column',
             justifyContent: 'center',
             alignItems: 'center',
             backdropFilter: 'blur(10px)'
         }}>
             <div 
                 style={{ position: 'relative', width: '90%', maxWidth: '1200px', aspectRatio: '16/9', background: '#000', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}
             >
                 {selectedVideo.format === 'youtube' && selectedVideo.youtubeId ? (
                     <iframe 
                         width="100%" 
                         height="100%" 
                         src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`} 
                         title="YouTube video player" 
                         frameBorder="0" 
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                         allowFullScreen
                     ></iframe>
                 ) : (
                     <video 
                         src={selectedVideo.secure_url}
                         style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                         controls
                         autoPlay
                     />
                 )}
                 
                 <button 
                     onClick={() => { setSelectedVideoIndex(null); setIsPlaying(false); setIsUnlockedFn(false); }}
                     style={{
                         position: 'absolute',
                         top: '-50px',
                         right: '-50px', 
                         width: '100px',
                         height: '100px',
                         background: 'none',
                         border: 'none',
                         cursor: 'default',
                     }}
                 />
             </div>
             
              <button 
                 onClick={() => { setSelectedVideoIndex(null); setIsPlaying(false); setIsUnlockedFn(false); }}
                 style={{
                     position: 'absolute',
                     top: '20px',
                     right: '20px',
                     background: 'rgba(255,255,255,0.1)',
                     border: '1px solid rgba(255,255,255,0.2)',
                     borderRadius: '50%',
                     padding: '12px',
                     cursor: 'pointer',
                     color: '#fff',
                     zIndex: 2000,
                     backdropFilter: 'blur(5px)'
                 }}
             >
                 <X size={28} />
             </button>

              <button 
                 onClick={(e) => { e.stopPropagation(); initiatePurchase(); }}
                 style={{
                     position: 'absolute',
                     top: '20px',
                     right: '80px', // Next to Close button
                     background: 'rgba(212, 175, 55, 0.2)',
                     border: '1px solid var(--primary-gold)',
                     borderRadius: '50%',
                     padding: '12px',
                     cursor: 'pointer',
                     color: 'var(--primary-gold)',
                     zIndex: 2000,
                     backdropFilter: 'blur(5px)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}
                 title="Download (Purchase required)"
             >
                 <Download size={24} />
             </button>
         {isAdminMode && (
              <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  display: 'flex',
                  gap: '15px',
                  zIndex: 2000,
                  flexWrap: 'wrap'
              }}>
                   <button 
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          if (selectedVideo.format === 'youtube') copyToClipboard(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`);
                          else copyToClipboard(selectedVideo.secure_url);
                          showNotification('success', "Link Copied!");
                      }}
                      className="glass-panel"
                      style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid #fff',
                          borderRadius: '8px',
                          padding: '10px 15px',
                          color: '#fff',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer'
                      }}
                   >
                       <Share2 size={18} />
                       Link
                   </button>
                   <button 
                      onClick={(e) => { e.stopPropagation(); setIsChangePasswordModalOpen(true); }}
                      className="glass-panel"
                      style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #3b82f6',
                          borderRadius: '8px',
                          padding: '10px 15px',
                          color: '#3b82f6',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer'
                      }}
                   >
                       <Key size={18} />
                       Change Password
                   </button>
                   
                   <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, selectedVideo.public_id); confirmDelete(); }}
                      className="glass-panel"
                      style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          padding: '10px 15px',
                          color: '#ef4444',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer'
                      }}
                   >
                       <Trash2 size={18} />
                       Delete Video
                   </button>
                   
                   <button 
                      onClick={async (e) => { 
                          e.stopPropagation(); 
                          await toggleVideoVisibilityAction(selectedVideo.public_id, !selectedVideo.hidden);
                          showNotification('success', selectedVideo.hidden ? "Video Unhidden" : "Video Hidden");
                          router.refresh(); // Refresh to update list
                      }}
                      className="glass-panel"
                      style={{
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid #a855f7',
                          borderRadius: '8px',
                          padding: '10px 15px',
                          color: '#a855f7',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer'
                      }}
                   >
                       {selectedVideo.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                       {selectedVideo.hidden ? "Unhide" : "Hide"}
                   </button>
              </div>
         )}
         </div>
       )}
    </>
  );
}
