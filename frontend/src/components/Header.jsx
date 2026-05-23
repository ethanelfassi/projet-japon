import React from 'react';
import { Camera, MapPin, Home, Compass, Users, User, LogOut, Shield } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, user, onLogout }) => {
  return (
    <header className="glass" style={{
      position: 'fixed',
      top: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: '500px',
      zIndex: 1000,
      padding: '8px 15px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      borderRadius: '20px'
    }}>
      <NavButton 
        active={activeTab === 'places'} 
        onClick={() => setActiveTab('places')}
        icon={<MapPin size={20} />}
        label="Liste"
      />
      <NavButton 
        active={activeTab === 'album'} 
        onClick={() => setActiveTab('album')}
        icon={<Camera size={20} />}
        label="Album"
      />
      <NavButton 
        active={activeTab === 'map'} 
        onClick={() => setActiveTab('map')}
        icon={<Compass size={20} />}
        label="Carte"
      />
      
      {/* Auth / Groups */}
      {user ? (
        <>
          <NavButton
            active={activeTab === 'groups'}
            onClick={() => setActiveTab('groups')}
            icon={<Users size={20} />}
            label="Groupes"
          />
          {user.role === 'admin' && (
            <NavButton
              active={activeTab === 'admin'}
              onClick={() => setActiveTab('admin')}
              icon={<Shield size={20} />}
              label="Admin"
            />
          )}
          <NavButton
            active={false}
            onClick={onLogout}
            icon={<LogOut size={20} />}
            label="Quitter"
          />
        </>
      ) : (
        <NavButton 
          active={activeTab === 'auth'} 
          onClick={() => setActiveTab('auth')}
          icon={<User size={20} />}
          label="Connexion"
        />
      )}
    </header>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={active ? 'nav-btn-active' : ''}
    style={{
      background: 'none',
      border: 'none',
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      minWidth: '60px'
    }}
  >
    {icon}
    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
  </button>
);

export default Header;
