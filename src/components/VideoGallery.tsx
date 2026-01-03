"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Play, X, ChevronLeft, ChevronRight, Pause, Volume2, VolumeX, Maximize, Download, Settings, Trash2, Loader2 } from "lucide-react";
import { deleteVideoAction } from "@/app/actions";
import { CldImage } from "next-cloudinary";

interface VideoResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  duration?: number;
}

export default function VideoGallery({ videos }: { videos: VideoResource[] }) {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<string>("auto");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedVideo = selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex < videos.length - 1) {
      setSelectedVideoIndex(selectedVideoIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
      setSelectedVideoIndex(selectedVideoIndex - 1);
      setIsPlaying(true);
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
             if (!result.success) {
                 alert("Failed to delete video.");
             }
             setVideoToDelete(null);
          });
      }
  };

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart) return;
      const touchEnd = e.changedTouches[0].clientX;
      const distance = touchStart - touchEnd;
      const minSwipeDistance = 50;

      if (distance > minSwipeDistance) {
          // Swiped Left -> Next
          handleNext();
      } else if (distance < -minSwipeDistance) {
          // Swiped Right -> Prev
          handlePrev();
      }
      setTouchStart(null);
  };

  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value);
      setVolume(newVol);
      if (newVol > 0) setIsMuted(false);
  };
  
  const getDownloadUrl = (url: string) => {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
          return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
      return url;
  };

  const getQualityUrl = (url: string, qualityMode: string) => {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;
      
      let transformation = "";
      switch(qualityMode) {
          case '4k': transformation = "c_limit,h_2160,w_3840/q_auto"; break;
          case '2k': transformation = "c_limit,h_1440,w_2560/q_auto"; break;
          case '1080p': transformation = "c_limit,h_1080,w_1920/q_auto"; break;
          case '720p': transformation = "c_limit,h_720,w_1280/q_auto"; break;
          case '480p': transformation = "c_limit,h_480,w_854/q_auto"; break;
          case '360p': transformation = "c_limit,h_360,w_640/q_auto"; break;
          default: return url; // Auto/Default
      }
      
      return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  };

  const handleQualityChange = (newQuality: string) => {
      if (quality === newQuality) return;
      
      const currentTime = videoRef.current?.currentTime || 0;
      const wasPlaying = !videoRef.current?.paused;
      
      setQuality(newQuality);
      setShowQualityMenu(false);
      
      // We need to restore time after the new source loads.
      // We'll use a one-time event listener logic or effect, but effect is cleaner
      // For simplicity, we assume fast switch, but robustly we should capture valid time
      setTimeout(() => {
          if (videoRef.current) {
              videoRef.current.currentTime = currentTime;
              if (wasPlaying) videoRef.current.play().catch(()=>{});
          }
      }, 100);
  };

  const handleTimeUpdate = () => {
      if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
      }
  };

  const handleLoadedMetadata = () => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
      }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      setCurrentTime(time);
      if (videoRef.current) {
          videoRef.current.currentTime = time;
      }
  };

  const formatTime = (time: number) => {
      if (!time) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (videoRef.current) {
        if (isPlaying) {
            videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
        } else {
            videoRef.current.pause();
        }
    }
  }, [selectedVideoIndex, isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, selectedVideoIndex]);


  if (videos.length === 0) {
      return (
          <div className="text-center text-gray-400 py-20">
              <p>No videos found. Upload some memories!</p>
          </div>
      )
  }

  return (
    <>
      <div className="animate-fade-in" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '2rem' 
        }}>
          {videos.map((video, index) => (
            <div 
              key={video.public_id} 
              className="glass-panel gallery-card" 
              style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              onClick={() => {
                  setSelectedVideoIndex(index);
                  setIsPlaying(true);
              }}
            >
              <div style={{ height: '240px', background: '#000', position: 'relative' }} className="video-thumbnail">
                 {/* Cloudinary automatically generates thumbnails for videos */}
                 <img
                    src={video.secure_url.replace(/\.[^/.]+$/, ".jpg")}
                    alt="Video thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 />
                 
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
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#fff',
                    fontWeight: 600
                 }}>
                    {video.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : 'VIDEO'}
                 </div>

                 <button 
                    onClick={(e) => handleDeleteClick(e, video.public_id)}
                    disabled={isDeleting}
                    className="delete-btn"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(244, 66, 53, 0.8)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#fff',
                        zIndex: 2,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: videoToDelete === video.public_id ? 'scale(0)' : 'scale(1)'
                    }}
                 >
                    <Trash2 size={16} />
                 </button>
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
      `}</style>

      {/* Custom Delete Confirmation Modal */}
      {videoToDelete && (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}
        onClick={() => setVideoToDelete(null)}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    animation: 'modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: '1px solid rgba(244, 66, 53, 0.3)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{
                    width: '60px', height: '60px',
                    background: 'rgba(244, 66, 53, 0.1)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto',
                    color: '#f44336'
                }}>
                    <Trash2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Delete Memory?</h3>
                <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                    Are you sure you want to delete this video? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button 
                        onClick={() => setVideoToDelete(null)}
                        style={{
                            background: 'transparent',
                            border: '1px solid #444',
                            color: '#fff',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '99px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        style={{
                            background: '#f44336',
                            border: 'none',
                            color: '#fff',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '99px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 14px rgba(244, 66, 53, 0.4)',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {isDeleting && <Loader2 size={16} className="animate-spin" />}
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Custom Video Player Modal */}
      {selectedVideo && selectedVideoIndex !== null && (
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
            {/* Main Player Container */}
            <div 
                style={{ position: 'relative', width: '90%', maxWidth: '1200px', aspectRatio: '16/9', background: '#000', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <video 
                    ref={videoRef}
                    src={getQualityUrl(selectedVideo.secure_url, quality)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    onEnded={() => handleNext()}
                    controls={false} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata} 
                />
                
                {/* Custom Controls Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: '2rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    borderRadius: '0 0 12px 12px',
                    opacity: 1, 
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        {isPlaying ? <Pause size={32} fill="#fff" /> : <Play size={32} fill="#fff" />}
                    </button>
                    
                    {/* Volume Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                            {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            style={{ width: '80px', accentColor: 'var(--primary-gold)', cursor: 'pointer' }}
                        />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#fff', fontSize: '0.8rem', minWidth: '35px', textAlign: 'right' }}>
                            {formatTime(currentTime)}
                        </span>
                        <input 
                            type="range" 
                            min="0" 
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            style={{ flex: 1, accentColor: 'var(--primary-gold)', cursor: 'pointer', height: '4px' }}
                        />
                        <span style={{ color: '#fff', fontSize: '0.8rem', minWidth: '35px' }}>
                            {formatTime(duration)}
                        </span>
                    </div>

                    <button onClick={handlePrev} disabled={selectedVideoIndex === 0} style={{ background: 'none', border: 'none', color: selectedVideoIndex === 0 ? '#555' : '#fff', cursor: 'pointer' }}>
                        <ChevronLeft size={32} />
                    </button>
                    <button onClick={handleNext} disabled={selectedVideoIndex === videos.length - 1} style={{ background: 'none', border: 'none', color: selectedVideoIndex === videos.length - 1 ? '#555' : '#fff', cursor: 'pointer' }}>
                        <ChevronRight size={32} />
                    </button>

                    {/* Download Button */}
                    <a 
                        href={getDownloadUrl(selectedVideo.secure_url)} 
                        download // This attribute often ignored by browsers for cross-origin, so transformation is key
                        style={{ color: '#fff', marginLeft: 'auto' }}
                        title="Download Video"
                    >
                        <Download size={24} />
                    </a>

                    {/* Quality Selector */}
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Quality"
                        >
                            <Settings size={24} />
                        </button>
                        
                        {showQualityMenu && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                marginBottom: '10px',
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                minWidth: '100px',
                                zIndex: 200
                            }}>
                                {['auto', '4k', '2k', '1080p', '720p', '480p', '360p'].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => handleQualityChange(q)}
                                        style={{
                                            background: quality === q ? 'var(--primary-gold)' : 'transparent',
                                            color: quality === q ? '#000' : '#fff',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '0.9rem',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {q === 'auto' ? 'Auto' : q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={() => { setSelectedVideoIndex(null); setIsPlaying(false); }}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '10px',
                        cursor: 'pointer',
                        color: '#fff',
                        zIndex: 10
                    }}
                >
                    <X size={24} />
                </button>
            </div>
            
            <h2 style={{ marginTop: '1rem', color: '#fff', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                Wedding Memory #{selectedVideoIndex + 1}
            </h2>
        </div>
      )}
    </>
  );
}
