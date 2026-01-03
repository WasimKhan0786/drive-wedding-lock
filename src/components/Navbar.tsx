"use client";

import Link from "next/link";
import { Camera, Heart } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '1200px',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      borderRadius: '50px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Heart className="text-gold" size={24} fill="currentColor" />
        <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
          Forever<span className="text-gold">&</span>Always
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
          Home
        </Link>
        <Link href="/gallery" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
          Gallery
        </Link>
        <Link href="/upload">
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} />
            <span>Upload Memory</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
