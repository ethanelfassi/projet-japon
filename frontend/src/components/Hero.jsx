import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Image with Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop")', // Tokyo street
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: -1
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(11, 9, 10, 0.4), rgba(11, 9, 10, 0.9))'
        }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ padding: '0 20px' }}
      >
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', marginBottom: '10px', textTransform: 'uppercase' }}>
          Projet <span style={{ color: 'var(--primary)' }}>Japon</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 30px' }}>
          Aventure, Gastronomie et Souvenirs. <br />
          Notre voyage inoubliable au pays du soleil levant.
        </p>
        <button className="btn-primary" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
          Découvrir le Voyage
        </button>
      </motion.div>
    </section>
  );
};

export default Hero;
