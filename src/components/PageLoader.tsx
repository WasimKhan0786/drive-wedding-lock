"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function PageLoader() {
  const [mounted, setMounted] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate initial loading for effect
    const timer = setTimeout(() => {
      setShouldHide(true);
    }, 1500); // 1.5 seconds splash (Reduced from 2s)

    return () => clearTimeout(timer);
  }, []);

  // Use opacity/visibility transition instead of unmounting to prevent flash
  return (
    <div className={`loader-container ${shouldHide ? 'hidden' : ''}`}>
      <div className="loader-content">
        <div className="heart-wrapper">
          <Heart size={64} fill="#D4AF37" color="#D4AF37" />
        </div>
        <h1 className="loader-title">Forever & Always</h1>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>

      <style jsx>{`
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
          opacity: 1;
          visibility: visible;
        }

        .loader-container.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .loader-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .heart-wrapper {
          animation: pulse 1s ease-in-out infinite;
          filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.5));
        }

        .loader-title {
          font-family: var(--font-playfair);
          color: var(--primary-gold);
          font-size: 2rem;
          margin: 0;
          opacity: 0;
          animation: slideUp 0.8s ease-out 0.2s forwards;
        }

        .loading-bar {
          width: 200px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          opacity: 0;
          animation: fadeIn 0.5s ease-out 0.8s forwards;
        }

        .loading-progress {
          width: 0%;
          height: 100%;
          background: var(--primary-gold);
          animation: progress 1.2s ease-in-out forwards;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
