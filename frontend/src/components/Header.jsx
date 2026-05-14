import React from 'react';
import { Camera, MapPin, Home } from 'lucide-react';

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="glass" style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '600px',
      zIndex: 1000,
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'center',
      gap: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      <NavButton 
        active={activeTab === 'home'} 
        onClick={() => setActiveTab('home')}
        icon={<Home size={20} />}
        label="Accueil"
      />
      <NavButton 
        active={activeTab === 'places'} 
        onClick={() => setActiveTab('places')}
        icon={<MapPin size={20} />}
        label="Endroits"
      />
      <NavButton 
        active={activeTab === 'album'} 
        onClick={() => setActiveTab('album')}
        icon={<Camera size={20} />}
        label="Album"
      />
    </header>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
  >
    {icon}
    <span style={{ fontWeight: 600 }}>{label}</span>
  </button>
);

export default Header;
