"use client";

import { MapPin, User } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--glass-border)',
      padding: '3rem 2rem',
      background: 'rgba(0,0,0,0.8)',
      marginTop: 'auto',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="container-custom" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        
        <style jsx>{`
          @keyframes shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .text-shimmer {
            background: linear-gradient(
              to right, 
              var(--primary-gold) 20%, 
              #fff 50%, 
              var(--primary-gold) 80%
            );
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: shine 3s linear infinite;
            display: inline-block;
          }
          @keyframes glow-pulse {
            0% { text-shadow: 0 0 5px rgba(212, 175, 55, 0.2); }
            50% { text-shadow: 0 0 20px rgba(212, 175, 55, 0.6); }
            100% { text-shadow: 0 0 5px rgba(212, 175, 55, 0.2); }
          }
          .location-glow {
            animation: glow-pulse 2s ease-in-out infinite;
          }
        `}</style>

        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <p style={{ 
            color: 'var(--secondary-silver)', 
            fontSize: '0.9rem', 
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Developed By
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontWeight: 700,
            fontSize: '1.2rem'
          }}>
            <User size={20} className="text-gold" />
            <span className="text-shimmer">Wasim Khan</span>
          </div>
        </div>

        <div style={{ width: '40px', height: '1px', background: 'var(--glass-border)' }} />

        <div className="location-glow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
          <MapPin size={16} color="var(--secondary-silver)" />
          <span style={{ fontSize: '0.95rem' }}>Siwan, Bihar</span>
        </div>

        <p style={{ 
          marginTop: '2rem', 
          color: '#444', 
          fontSize: '0.8rem' 
        }}>
          &copy; {new Date().getFullYear()} Forever & Always. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
