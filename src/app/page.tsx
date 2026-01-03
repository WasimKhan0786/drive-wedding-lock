import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Play, ShieldCheck, Film, Heart, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 80%)',
        padding: '80px 20px 40px',
        position: 'relative'
      }}>
        <div className="animate-fade-in" style={{ maxWidth: '900px', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(212, 175, 55, 0.1)',
            padding: '8px 16px',
            borderRadius: '99px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}>
            <Sparkles size={16} className="text-gold" />
            <span style={{ color: 'var(--primary-gold)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              The Wedding Collection
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', 
            marginBottom: '1rem', 
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))'
          }}>
            Relive Every <br/> Precious Moment
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: 'var(--secondary-silver)', 
            marginBottom: '3rem', 
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto 3rem auto'
          }}>
            The exclusive video sanctuary for your wedding. Unlimited uploads, cinematic playback, and memories preserved forever.
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/upload">
              <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Upload Video
              </button>
            </Link>
            <Link href="/gallery">
              <button className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={20} fill="currentColor" />
                Go to Gallery
              </button>
            </Link>
          </div>
        </div>
        
        {/* Decorative Ambience */}
        <div style={{
          position: 'absolute',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0) 70%)',
          top: '-20%',
          right: '-10%',
          zIndex: 1,
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'pulse 10s infinite alternate'
        }} />
         <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(0,0,0,0) 70%)',
          bottom: '-10%',
          left: '-10%',
          zIndex: 1,
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', background: '#0a0a0a', position: 'relative' }}>
        <div className="container-custom">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
          }}>
            {[
              { icon: Film, title: "Cinematic Quality", desc: "Experience your special day in stunning 4K definition with crystal clear audio." },
              { icon: ShieldCheck, title: "Secure Storage", desc: "Your memories are encrypted and safely archived, ensuring they last a lifetime." },
              { icon: Heart, title: "Made with Love", desc: "A beautiful, ad-free interface designed specifically for your love story." }
            ].map((feature, i) => (
              <div key={i} className="glass-panel feature-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ 
                  margin: '0 auto 1.5rem', 
                  width: '60px', 
                  height: '60px', 
                  background: 'rgba(212, 175, 55, 0.1)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-gold)'
                }}>
                  <feature.icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>{feature.title}</h3>
                <p style={{ color: 'var(--secondary-silver)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section style={{ 
        padding: '8rem 2rem', 
        textAlign: 'center', 
        background: 'linear-gradient(to bottom, #0a0a0a, #000)',
        position: 'relative' 
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03, pointerEvents: 'none' }}>
           <Heart size={400} />
        </div>
        <div className="container-custom" style={{ position: 'relative', zIndex: 10 }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            marginBottom: '2rem',
            fontStyle: 'italic',
            color: '#fff'
          }}>
            "Together is a beautiful place to be."
          </h2>
          <div style={{ width: '100px', height: '3px', background: 'var(--primary-gold)', margin: '0 auto' }} />
        </div>
      </section>

    </main>
  );
}
