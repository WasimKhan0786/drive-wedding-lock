"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { deleteVideoAction, updateVideoPasswordAction, toggleVideoVisibilityAction, createFolderAction, moveVideoToFolderAction, renameFolderAction, updateFolderPasswordAction, logoutAction, deleteFolderAction } from "@/app/actions";
import { loadScript } from "@/lib/utils";
import { Play, X, ChevronLeft, ChevronRight, Pause, Volume2, VolumeX, Maximize, Trash2, Loader2, Lock, RefreshCw, Heart, Eye, EyeOff, Download, CreditCard, Key, Share2, Folder as FolderIcon, FolderPlus, ArrowLeft, Move, Edit2, LogOut } from "lucide-react";

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
  folderId?: string | null;
}

interface FolderResource {
    _id: string;
    name: string;
    password?: string;
}

export default function VideoGallery({ videos, folders = [] }: { videos: VideoResource[], folders?: FolderResource[] }) {
  const router = useRouter();  
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Folder State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPassword, setNewFolderPassword] = useState("");
  const [isCreatingFolder, startFolderTransition] = useTransition();
  
  // Rename Folder State
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<FolderResource | null>(null);
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [isRenaming, startRenameTransition] = useTransition();
  
  // Change Folder Password State
  const [changeFolderPassModalOpen, setChangeFolderPassModalOpen] = useState(false);
  const [folderToUpdatePass, setFolderToUpdatePass] = useState<FolderResource | null>(null);
  const [newFolderPassInput, setNewFolderPassInput] = useState("");
  const [isUpdatingFolderPass, startFolderPassTransition] = useTransition();
  
  const [folderPasswordModalOpen, setFolderPasswordModalOpen] = useState(false);
  const [selectedFolderTarget, setSelectedFolderTarget] = useState<FolderResource | null>(null);
  const [folderPasswordInput, setFolderPasswordInput] = useState("");
  
  const [moveVideoModalOpen, setMoveVideoModalOpen] = useState(false);
  const [videoToMove, setVideoToMove] = useState<VideoResource | null>(null);
  const [isMovingVideo, startMoveTransition] = useTransition();

  // Password Logic
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // CONSTANTS
  const ADMIN_AUTHOR_CODE = "7004636112";
  const ADMIN_REGULAR_CODE = "admin";
  const DOWNLOAD_PRICE = 200;
  const SHARE_PRICE = 100;
  
  // Admin Mode State
  const [adminRole, setAdminRole] = useState<'none' | 'admin' | 'author'>('none');
  const isAdminMode = adminRole !== 'none';
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, startPasswordTransition] = useTransition();

  // Selected Video State
  const [isUnlocked, setIsUnlockedFn] = useState(false); 
  
  // Payment State
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [processingProvider, setProcessingProvider] = useState<'razorpay' | 'phonepe' | null>(null);
  const [purchaseType, setPurchaseType] = useState<'download' | 'share'>('download');
  
  
  // Filter Logic (Hoisted)
  const visibleVideos = videos.filter(v => {
      const isHiddenVisible = !v.hidden || isAdminMode;
      const isFolderMatch = currentFolderId ? v.folderId === currentFolderId : !v.folderId;
      return isHiddenVisible && isFolderMatch;
  });

  const selectedVideo = selectedVideoIndex !== null ? visibleVideos[selectedVideoIndex] : null;

  useEffect(() => {
     if (selectedVideo) {
         // Reset UI state (but persist adminRole)
         setPasswordInput("");
         setPasswordError(false);
         setPurchaseModalOpen(false);

         // Helper: Check if unlocked
         // If Admin -> Unlocked
         // If video is in a folder -> Unlocked
         // If video has no password -> Unlocked
         const shouldUnlock = !!(adminRole !== 'none' || selectedVideo.folderId || !selectedVideo.password);

         if (shouldUnlock) {
             setIsUnlockedFn(true);
             setIsPasswordModalOpen(false);
             setIsPlaying(true);
         } else {
             setIsUnlockedFn(false);
             setIsPasswordModalOpen(true);
             setIsPlaying(false);
         }
     } else {
         setIsPasswordModalOpen(false);
         setPurchaseModalOpen(false);
         setIsChangePasswordModalOpen(false);
     }
  }, [selectedVideoIndex, videos, adminRole]);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => setToastMessage(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // Deep Linking Check
  useEffect(() => {
     if (typeof window === "undefined") return;
     const params = new URLSearchParams(window.location.search);
     const videoParam = params.get('video');
     if (videoParam) {
         const index = videos.findIndex(v => v.public_id === videoParam);
         if (index !== -1) {
             setSelectedVideoIndex(index);
             // Clear param to keep URL clean? Maybe keep it for refresh persistence?
             // Let's keep it clean or else back button gets weird.
             // window.history.replaceState({}, '', window.location.pathname);
         }
     }
  }, [videos]);

  // Payment Validation (PhonePe Redirect)
  useEffect(() => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
           showNotification('success', "Payment Verified! Downloading...");
           
           const pendingId = localStorage.getItem('pendingDownloadId');
           const pendingCustomer = localStorage.getItem('pendingCustomer');
           const pendingType = localStorage.getItem('pendingPurchaseType') || 'download';
           
           if (pendingId) {
                const vid = videos.find(v => v.public_id === pendingId);
                if (vid) {
                     // Trigger Email
                     if (pendingCustomer) {
                        const customer = JSON.parse(pendingCustomer);
                        const amountPaid = pendingType === 'share' ? SHARE_PRICE : DOWNLOAD_PRICE;
                        fetch('/api/send-email', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: customer.email,
                                name: customer.name,
                                videoTitle: vid.title || 'Memory',
                                amount: amountPaid,
                                type: pendingType
                            })
                        });
                     }

                     // Action based on type
                     if (pendingType === 'share') {
                         showNotification('success', "Payment Successful! Link is ready to share.");
                         // Generate Portal Link instead of Raw Source Link
                         const portalLink = `${window.location.origin}${window.location.pathname}?video=${vid.public_id}`;
                         copyToClipboard(portalLink);
                     } else {
                         // Default to download
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
                }
                // Cleanup
                localStorage.removeItem('pendingDownloadId');
                localStorage.removeItem('pendingCustomer');
                localStorage.removeItem('pendingPurchaseType');
           }
           // Clean URL
           window.history.replaceState({}, '', window.location.pathname);
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


  const handleVideoClick = (index: number) => {
      const video = videos[index];
      setSelectedVideoIndex(index);
      
      // If Admin Mode is active, or if the video is inside a folder (since folder is already locked)
      // or if it has no password, unlock immediately.
      if (isAdminMode || video.folderId || !video.password) {
        setIsUnlockedFn(true);
        setIsPlaying(true);
      } else {
        setIsUnlockedFn(false);
        setIsPlaying(false);
        // Additional Logic: Check if we have a stored unlock for this video
        // For now, simple password check
      }
  };        
  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Admin Check
      if (passwordInput === ADMIN_AUTHOR_CODE) {
          setIsUnlockedFn(true);
          setAdminRole('author');
          setIsPasswordModalOpen(false);
          // Only play if a video was selected
          if (selectedVideo) setIsPlaying(true);
          showNotification('success', "Author Admin Mode Activated");
          setPasswordError(false);
          return;
      }
      
      if (passwordInput === ADMIN_REGULAR_CODE) {
          setIsUnlockedFn(true);
          setAdminRole('author'); // Grant Full Access
          setIsPasswordModalOpen(false);
          if (selectedVideo) setIsPlaying(true);
          showNotification('success', "Full Admin Control Activated");
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
  
  // Folder Handlers
  const handleCreateFolder = () => {
      if(!newFolderName || !newFolderPassword) return;
      
      startFolderTransition(async () => {
         const res = await createFolderAction(newFolderName, newFolderPassword);
         if(res.success){
             showNotification('success', "Folder Created");
             setCreateFolderModalOpen(false);
             setNewFolderName("");
             setNewFolderPassword("");
             router.refresh();
         } else {
             showNotification('error', "Failed to create folder");
         }
      });
  };

  const handleRenameFolder = () => {
      if(!folderToRename || !newFolderNameInput) return;
      
      startRenameTransition(async () => {
          const res = await renameFolderAction(folderToRename._id, newFolderNameInput);
           if(res.success){
             showNotification('success', "Folder Renamed");
             setRenameFolderModalOpen(false);
             setFolderToRename(null);
             router.refresh();
         } else {
             showNotification('error', "Failed to rename folder");
         }
      });
  };

  const handleChangeFolderPassword = () => {
      if(!folderToUpdatePass || !newFolderPassInput) return;
      
      startFolderPassTransition(async () => {
          const res = await updateFolderPasswordAction(folderToUpdatePass._id, newFolderPassInput);
           if(res.success){
             showNotification('success', "Folder Password Updated");
             setChangeFolderPassModalOpen(false);
             setFolderToUpdatePass(null);
             setNewFolderPassInput("");
             router.refresh();
         } else {
             showNotification('error', "Failed to update folder password");
         }
      });
  };
  
  const handleFolderClick = (folder: FolderResource) => {
       // Admin Bypass
       if (isAdminMode) {
           setCurrentFolderId(folder._id);
           showNotification('success', `Opened ${folder.name}`);
           return;
       }

       setSelectedFolderTarget(folder);
       setFolderPasswordInput("");
       setFolderPasswordModalOpen(true);
  };
  
  const handleFolderPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedFolderTarget) return;
      
      if(folderPasswordInput === selectedFolderTarget.password || folderPasswordInput === ADMIN_AUTHOR_CODE) { // Backdoor for admin
          setCurrentFolderId(selectedFolderTarget._id);
          setFolderPasswordModalOpen(false);
          setSelectedFolderTarget(null);
          showNotification('success', `Opened ${selectedFolderTarget.name}`);
      } else {
          showNotification('error', "Incorrect Password");
      }
  };
  
  const handleMoveVideo = (folderId: string | null) => {
      if(!videoToMove) return;
      
      startMoveTransition(async () => {
          const res = await moveVideoToFolderAction(videoToMove.public_id, folderId);
          if(res.success){
              showNotification('success', "Video Moved");
              setMoveVideoModalOpen(false);
              setVideoToMove(null);
              router.refresh();
          } else {
              showNotification('error', "Failed to move video");
          }
      });
  };
  
  // Handlers
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex < visibleVideos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };
  
  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to delete this folder? Videos will be moved to Main Gallery.")){
          startFolderTransition(async () => {
               const res = await deleteFolderAction(folderId);
               if (res.success) {
                   showNotification('success', "Folder Deleted");
               } else {
                   showNotification('error', "Failed to delete folder");
               }
          });
      }
  };

  const handleDeleteVideoCard = (e: React.MouseEvent, publicId: string) => {
      e.stopPropagation();
       if(window.confirm("Are you sure you want to delete this video?")){
          startTransition(async () => {
               const res = await deleteVideoAction(publicId);
               if(res && res.success){
                   showNotification('success', "Video Deleted");
               } else {
                   showNotification('error', "Failed to delete video");
               }
          });
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

  const SyncButton = () => {
      // If NOT admin, show Login Button
      if (!isAdminMode) {
          return (
              <button 
                  onClick={() => { setSelectedVideoIndex(null); setIsPasswordModalOpen(true); }}
                  className="glass-panel"
                  style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '0.4rem 0.8rem', 
                      color: 'var(--primary-gold)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      borderRadius: '50px',
                      background: 'rgba(0,0,0,0.5)',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(10px)',
                      fontSize: '0.9rem'
                  }}
              >
                  <Lock size={14} fill="var(--primary-gold)" />
                  <span className="hidden sm:inline">Admin</span>
              </button>
          );
      }

      return (
      <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="glass-panel"
          style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0.4rem 0.8rem', 
              color: 'var(--primary-gold)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              borderRadius: '50px',
              background: 'rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
              fontSize: '0.9rem'
          }}
      >
           {isSyncing ? (
              <RefreshCw size={14} className="animate-spin" />
          ) : (
              <Heart size={14} fill="var(--primary-gold)" className="heart-beat" />
          )}
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Memories"}</span>
      </button>
  );
  };

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


   
   const currentFolderName = currentFolderId ? folders.find(f => f._id === currentFolderId)?.name : null;

   return (
    <>
      <div className="sync-btn-container">
          <SyncButton />
      </div>
      
      {/* Folder Navigation Header */}
      <div style={{ padding: '0 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {currentFolderId && (
              <button 
                  onClick={() => setCurrentFolderId(null)}
                  className="glass-panel"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', color: '#fff' }}
              >
                  <ArrowLeft size={18} />
                  Back to All Memories
              </button>
          )}
          
          {currentFolderId && (
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  <FolderIcon size={24} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle', color: 'var(--primary-gold)' }} />
                  {currentFolderName}
              </h2>
          )}

          {/* Floating Action Buttons */}
          {!currentFolderId && (
              <>
                  {isAdminMode && (
                      <button
                          onClick={() => setCreateFolderModalOpen(true)}
                          className="glass-panel"
                          style={{ 
                              position: 'fixed',
                              bottom: '30px',
                              right: '30px',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              padding: '12px 20px', 
                              color: '#000', 
                              background: 'var(--primary-gold)',
                              border: 'none',
                              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
                              borderRadius: '50px',
                              zIndex: 2500,
                              fontWeight: 600,
                              cursor: 'pointer'
                          }}
                      >
                          <FolderPlus size={20} />
                          New Folder
                      </button>
                  )}
                  
                  <button
                      onClick={async () => {
                          await logoutAction();
                          setAdminRole('none');
                          showNotification('success', "Logged Out Successfully");
                          router.push('/');
                      }}
                      className="glass-panel"
                      style={{ 
                          position: 'fixed',
                          top: '30px',
                          right: '30px',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '10px 20px', 
                          color: '#fff', 
                          background: 'rgba(239, 68, 68, 0.8)', // Red
                          border: '1px solid #ef4444',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                          borderRadius: '50px',
                          zIndex: 3500,
                          fontWeight: 600,
                          cursor: 'pointer'
                      }}
                  >
                      <LogOut size={18} />
                      Logout
                  </button>
              </>
          )}
      </div>
      
      <style jsx global>{`
        .sync-btn-container {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3000;
        }
      `}</style>

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
           <style dangerouslySetInnerHTML={{__html: `
               @media (max-width: 640px) {
                   .gallery-card {
                       min-height: auto;
                   }
                   .animate-fade-in[style*="display: grid"] {
                       grid-template-columns: 1fr !important;
                       gap: 1.5rem !important;
                   }
               }
           `}} />
           
           {/* Render Folders if at Root */}
           {!currentFolderId && folders.map((folder) => (
               <div 
                   key={folder._id}
                   className="glass-panel gallery-card"
                   style={{
                       padding: '2rem',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       justifyContent: 'center',
                       cursor: 'pointer',
                       background: 'rgba(212, 175, 55, 0.05)',
                       border: '1px solid rgba(212, 175, 55, 0.2)',
                       transition: 'all 0.3s ease'
                   }}
                   onClick={() => handleFolderClick(folder)}
               >
                   <div style={{ position: 'relative' }}>
                        <FolderIcon size={80} fill="rgba(212, 175, 55, 0.2)" color="var(--primary-gold)" />
                        {folder.password && (
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                padding: '6px',
                                border: '1px solid var(--primary-gold)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                            }}>
                                <Lock size={16} color="#fff" />
                            </div>
                        )}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                       <h3 style={{ color: 'var(--primary-gold)', fontSize: '1.2rem', textAlign: 'center', margin: 0 }}>
                           {folder.name}
                       </h3>
                       {isAdminMode && (
                           <>
                           <button
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setFolderToRename(folder);
                                   setNewFolderNameInput(folder.name);
                                   setRenameFolderModalOpen(true);
                               }}
                               style={{
                                   background: 'none',
                                   border: 'none',
                                   cursor: 'pointer',
                                   padding: '4px',
                                   color: '#fff',
                                   opacity: 0.7,
                                   transition: 'opacity 0.2s'
                               }}
                               title="Rename Folder"
                           >
                               <Edit2 size={16} />
                           </button>
                           <button
                               onClick={(e) => {
                                   e.stopPropagation();
                                   setFolderToUpdatePass(folder);
                                   setNewFolderPassInput(""); 
                                   setChangeFolderPassModalOpen(true);
                               }}
                               style={{
                                   background: 'none',
                                   border: 'none',
                                   cursor: 'pointer',
                                   padding: '4px',
                                   color: '#fff',
                                   opacity: 0.7,
                                   transition: 'opacity 0.2s'
                               }}
                               title="Change Password"
                           >
                                <Key size={16} />
                            </button>
                            {adminRole === 'author' && (
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder._id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#ef4444',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                    title="Delete Folder"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            </>
                       )}
                   </div>
                   <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Password Protected</p>
               </div>
           ))}
           
           {/* Render Videos */}
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
                  
                   {isAdminMode && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            zIndex: 10,
                            display: 'flex',
                            gap: '8px'
                        }}>
                             <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await toggleVideoVisibilityAction(video.public_id, !video.hidden);
                                    router.refresh();
                                }}
                                style={{
                                    background: 'rgba(0,0,0,0.6)',
                                    border: '1px solid #a855f7',
                                    borderRadius: '50%',
                                    padding: '6px',
                                    color: '#a855f7',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title={video.hidden ? "Unhide" : "Hide"}
                             >
                                 {video.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                             </button>
                             
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setVideoToMove(video);
                                    setMoveVideoModalOpen(true);
                                }}
                                style={{
                                    background: 'rgba(0,0,0,0.6)',
                                    border: '1px solid #38bdf8',
                                    borderRadius: '50%',
                                    padding: '6px',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Move to Folder"
                             >
                                 <Move size={14} />
                             </button>
                             
                             {adminRole === 'author' && (
                                <button
                                    onClick={(e) => handleDeleteVideoCard(e, video.public_id)}
                                    style={{
                                        background: 'rgba(0,0,0,0.6)',
                                        border: '1px solid #ef4444',
                                        borderRadius: '50%',
                                        padding: '6px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Delete Video"
                                >
                                    <Trash2 size={14} />
                                </button>
                             )}
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
 
                  {/* Only show Lock if not in a folder and has password */}
                  {!video.folderId && video.password && (
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
                  )}
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
        
        .admin-controls {
            position: absolute;
            top: 20px;
            left: 20px;
            display: flex;
            gap: 15px;
            z-index: 2000;
            flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
            .admin-controls {
                top: auto;
                bottom: 90px;
                left: 50%;
                transform: translateX(-50%);
                width: 100%;
                justify-content: center;
                gap: 8px;
            }
            .admin-controls button {
                font-size: 0.75rem !important;
                padding: 8px 10px !important;
            }
            .admin-controls svg {
                width: 14px !important;
                height: 14px !important;
            }
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
                   <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
                       {purchaseType === 'share' ? 'Unlock Share' : 'Unlock Download'}
                   </h3>
                   <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                       {purchaseType === 'share' 
                           ? "To share this premium memory with friends and family, a small fee is required." 
                           : "To download this premium memory in 4K resolution, a small fee is required."}
                   </p>
                   
                   <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                       <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-gold)' }}>₹{purchaseType === 'share' ? SHARE_PRICE : DOWNLOAD_PRICE}</p>
                       <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>One-time payment to {purchaseType === 'share' ? 'Share Link' : 'Download Video'}</p>
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
                 className="video-container"
                 style={{ position: 'relative', width: '90%', maxWidth: '1200px', aspectRatio: '16/9', background: '#000', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}
             >
                 {selectedVideo.format === 'youtube' && selectedVideo.youtubeId ? (
                     <>
                      <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&fs=0`} 
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          style={{ pointerEvents: 'auto' }}
                      ></iframe>
                      {/* Blocker to hide Share/Title/Watch Later from YouTube Player */}
                      <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '25%', // Increased to cover typical mobile UI top bar
                          minHeight: '80px',
                          zIndex: 10,
                          background: 'transparent', 
                          // debug: 'rgba(255,0,0,0.2)' 
                      }} />
                      
                      {/* Extra blocker for top-right "Watch Later" / "Share" specifically */}
                      <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '30%', // Cover the right side more aggressively
                          height: '35%',
                          zIndex: 11,
                          background: 'transparent'
                      }} />
                       
                       {/* Custom Fullscreen Button */}
                       <div style={{
                           position: 'absolute',
                           bottom: '1px',
                           right: '10px',
                           zIndex: 20
                       }}>
                         <button 
                             onClick={() => {
                                 const elem = document.querySelector('.video-container');
                                 if (!elem) return;
                                 if (!document.fullscreenElement) {
                                     elem.requestFullscreen().catch(err => {
                                         console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                                     });
                                 } else {
                                     document.exitFullscreen();
                                 }
                             }}
                             style={{
                                 background: 'transparent',
                                 border: 'none',
                                 cursor: 'pointer',
                                 padding: '10px'
                             }}
                         >
                             <Maximize size={24} color="rgba(255,255,255, 0.7)" />
                         </button>
                       </div>
                     </>
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
                 onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isAdminMode) {
                        triggerDownload(); 
                    } else {
                        setPurchaseType('download'); // Set type
                        setPurchaseModalOpen(true);
                    }
                 }}
                 style={{
                     position: 'absolute',
                     top: '20px',
                     right: '80px', // Next to Close button
                     background: isAdminMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(212, 175, 55, 0.2)',
                     border: isAdminMode ? '1px solid #3b82f6' : '1px solid var(--primary-gold)',
                     borderRadius: '50%',
                     padding: '12px',
                     cursor: 'pointer',
                     color: isAdminMode ? '#fff' : 'var(--primary-gold)',
                     zIndex: 2000,
                     backdropFilter: 'blur(5px)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}
                 title={isAdminMode ? "Admin Download" : "Download (Purchase required)"}
             >
                 <Download size={24} />
             </button>
             
             {/* Share Button (Paid Feature for Non-Admins) */}
             <button 
                 onClick={(e) => { 
                    e.stopPropagation(); 
                    if (isAdminMode) {
                         const portalLink = `${window.location.origin}${window.location.pathname}?video=${selectedVideo.public_id}`;
                         copyToClipboard(portalLink);
                         showNotification('success', "Portal Link Copied!");
                    } else {
                        setPurchaseType('share'); // Set type
                        setPurchaseModalOpen(true);
                    }
                 }}
                 style={{
                     position: 'absolute',
                     top: '20px',
                     right: '140px', // Next to Download button
                     background: 'rgba(168, 85, 247, 0.2)',
                     border: '1px solid #a855f7',
                     borderRadius: '50%',
                     padding: '12px',
                     cursor: 'pointer',
                     color: '#a855f7',
                     zIndex: 2000,
                     backdropFilter: 'blur(5px)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}
                 title="Share Video (Purchase required)"
             >
                 <Share2 size={24} />
             </button>

         {isAdminMode && (
               <div className="admin-controls">
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
                   
                   {adminRole === 'author' && (
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
                   )}
                   
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
                   
                   {/* New Admin Buttons */}
                   <button 
                       onClick={(e) => { 
                           e.stopPropagation(); 
                           const portalLink = `${window.location.origin}${window.location.pathname}?video=${selectedVideo.public_id}`;
                           copyToClipboard(portalLink);
                           showNotification('success', "Link Copied!");
                       }}
                       className="glass-panel"
                       style={{
                            background: 'rgba(251, 191, 36, 0.2)',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            color: '#fbbf24',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer'
                       }}
                   >
                       <Share2 size={18} />
                       Share
                   </button>

                   <button 
                       onClick={(e) => { e.stopPropagation(); triggerDownload(); }}
                       className="glass-panel"
                       style={{
                            background: 'rgba(52, 211, 153, 0.2)',
                            border: '1px solid #34d399',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            color: '#34d399',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer'
                       }}
                   >
                       <Download size={18} />
                       Download
                   </button>

                   <button 
                       onClick={(e) => { e.stopPropagation(); setVideoToMove(selectedVideo); setMoveVideoModalOpen(true); }}
                       className="glass-panel"
                       style={{
                            background: 'rgba(56, 189, 248, 0.2)',
                            border: '1px solid #38bdf8',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            color: '#38bdf8',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer'
                       }}
                   >
                       <Move size={18} />
                       Move to Folder
                   </button>

                   <button 
                       onClick={async (e) => { 
                           e.stopPropagation(); 
                           await logoutAction();
                           setAdminRole('none');
                           setIsPlaying(false);
                           showNotification('success', "Logged Out Successfully");
                           router.push('/');
                       }}
                       className="glass-panel"
                       style={{
                            background: 'rgba(239, 68, 68, 0.2)', // Red
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            color: '#ef4444',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer'
                       }}
                   >
                       <LogOut size={18} />
                       Logout
                   </button>
                   
                   <button 
                       onClick={(e) => { e.stopPropagation(); setSelectedVideoIndex(null); setIsPlaying(false); setIsUnlockedFn(false); }}
                       className="glass-panel"
                       style={{
                            background: 'rgba(156, 163, 175, 0.2)',
                            border: '1px solid #9ca3af',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            color: '#e5e7eb',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer'
                       }}
                   >
                       <X size={18} />
                       Cancel
                   </button>
              </div>
         )}
         </div>
       )}
       
       {/* Create Folder Modal */}
       {createFolderModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setCreateFolderModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--primary-gold)' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-gold)' }}>
                       <FolderPlus size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>New Folder</h3>
                   <input 
                       type="text"
                       value={newFolderName}
                       onChange={e => setNewFolderName(e.target.value)}
                       placeholder="Folder Name"
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1rem' }}
                   />
                   <input 
                       type="text"
                       value={newFolderPassword}
                       onChange={e => setNewFolderPassword(e.target.value)}
                       placeholder="Set Password"
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1.5rem' }}
                   />
                   <button 
                       onClick={handleCreateFolder}
                       disabled={isCreatingFolder || !newFolderName || !newFolderPassword}
                       className="btn-primary" 
                       style={{ width: '100%' }}
                   >
                       {isCreatingFolder ? <Loader2 className="animate-spin" /> : "Create Folder"}
                   </button>
               </div>
           </div>
       )}
       
       {/* Folder Password Modal */}
       {folderPasswordModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setFolderPasswordModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--primary-gold)' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-gold)' }}>
                       <Lock size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Locked Folder</h3>
                   <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Enter password to access {selectedFolderTarget?.name}</p>
                   
                   <form onSubmit={handleFolderPasswordSubmit}>
                       <input 
                           type="text"
                           autoFocus
                           value={folderPasswordInput}
                           onChange={e => setFolderPasswordInput(e.target.value)}
                           placeholder="Enter Password"
                           style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}
                       />
                       <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                           Access Memories
                       </button>
                   </form>
               </div>
           </div>
       )}
       
       {/* Move Video Modal */}
       {moveVideoModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setMoveVideoModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px', border: '1px solid #38bdf8' }}>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: '#fff' }}>Move to Folder</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                       <button 
                           onClick={() => handleMoveVideo(null)}
                           style={{ padding: '15px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                       >
                            <FolderPlus size={18} />
                            Main Gallery (Root)
                        </button>
                       {folders.map(folder => (
                           <button 
                               key={folder._id}
                               onClick={() => handleMoveVideo(folder._id)}
                               style={{ padding: '15px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                           >
                               <FolderIcon size={18} fill="var(--primary-gold)" color="var(--primary-gold)" />
                               {folder.name}
                           </button>
                       ))}
                   </div>
               </div>
           </div>
       )}
       
       {/* Rename Folder Modal */}
       {renameFolderModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setRenameFolderModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #38bdf8' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                       <Edit2 size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Rename Folder</h3>
                   <input 
                       type="text"
                       value={newFolderNameInput}
                       onChange={e => setNewFolderNameInput(e.target.value)}
                       placeholder="New Folder Name"
                       autoFocus
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1.5rem' }}
                   />
                   <button 
                       onClick={handleRenameFolder}
                       disabled={isRenaming || !newFolderNameInput}
                       className="btn-primary" 
                       style={{ width: '100%', background: '#38bdf8', borderColor: '#38bdf8' }}
                   >
                       {isRenaming ? <Loader2 className="animate-spin" /> : "Save Changes"}
                   </button>
               </div>
           </div>
       )}
       
       {/* Change Folder Password Modal */}
       {changeFolderPassModalOpen && (
           <div style={{
               position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
               zIndex: 4450, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
           }} onClick={() => setChangeFolderPassModalOpen(false)}>
               <div onClick={e => e.stopPropagation()} className="glass-panel" style={{ padding: '2.5rem', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #a855f7' }}>
                   <div style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                       <Key size={30} />
                   </div>
                   <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Update Folder Password</h3>
                   <input 
                       type="text"
                       value={newFolderPassInput}
                       onChange={e => setNewFolderPassInput(e.target.value)}
                       placeholder="New Password"
                       autoFocus
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '1.5rem' }}
                   />
                   <button 
                       onClick={handleChangeFolderPassword}
                       disabled={isUpdatingFolderPass || !newFolderPassInput}
                       className="btn-primary" 
                       style={{ width: '100%', background: '#a855f7', borderColor: '#a855f7' }}
                   >
                       {isUpdatingFolderPass ? <Loader2 className="animate-spin" /> : "Update Password"}
                   </button>
               </div>
           </div>
       )}
       
    </>
  );
}
