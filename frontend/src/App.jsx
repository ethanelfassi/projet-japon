import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Hero from './components/Hero';
import PlaceList from './components/PlaceList';
import PhotoAlbum from './components/PhotoAlbum';
import UploadModal from './components/UploadModal';
import MapView from './components/MapView';
import Auth from './components/Auth';
import GroupsManager from './components/GroupsManager';
import AdminPanel from './components/AdminPanel';
import Schedule from './components/Schedule';
import ChangePasswordModal from './components/ChangePasswordModal';
import './App.css';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Set up axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [activeTab, setActiveTab] = useState('places');
  const [uploadPlace, setUploadPlace] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showChangePwd, setShowChangePwd] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.user);
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoadingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('places'); // Go back to public view
  };

  const handlePlaceClickFromMap = (place) => {
    setSelectedPlaceDetails(place);
    setActiveTab('places');
  };

  const guardAuth = (component) => {
    if (!user) return <Auth setUser={setUser} onAuthSuccess={() => {}} />;
    return component;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'places':
        return guardAuth(<PlaceList onAddPhoto={setUploadPlace} selectedPlaceDetails={selectedPlaceDetails} setSelectedPlaceDetails={setSelectedPlaceDetails} user={user} />);
      case 'album':
        return guardAuth(<PhotoAlbum user={user} />);
      case 'map':
        return guardAuth(<MapView onPlaceClick={handlePlaceClickFromMap} onAddPhoto={setUploadPlace} user={user} />);
      case 'auth':
        return <Auth setUser={setUser} onAuthSuccess={() => setActiveTab('places')} />;
      case 'groups':
        return guardAuth(<GroupsManager user={user} />);
      case 'schedule':
        return (user?.role === 'editeur' || user?.role === 'admin') ? <Schedule user={user} /> : guardAuth(<></>);
      case 'admin':
        return user?.role === 'admin' ? <AdminPanel currentUser={user} /> : guardAuth(<></>);
      default:
        return guardAuth(<PlaceList onAddPhoto={setUploadPlace} selectedPlaceDetails={selectedPlaceDetails} setSelectedPlaceDetails={setSelectedPlaceDetails} user={user} />);
    }
  };

  if (loadingAuth) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Chargement...</div>;
  }

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      
      {user && (
        <div className="glass profile-widget">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff7f' }} />
            {user.username}
          </span>
          <button 
            onClick={() => setShowChangePwd(true)}
            className="btn-glass"
            style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Mdp
          </button>
        </div>
      )}

      <main>
        {renderContent()}
      </main>

      {uploadPlace && (
        <UploadModal 
          place={uploadPlace} 
          onClose={() => setUploadPlace(null)}
          onUploadSuccess={() => {
            setActiveTab('album');
          }}
        />
      )}

      {showChangePwd && (
        <ChangePasswordModal 
          onClose={() => setShowChangePwd(false)} 
        />
      )}

      <footer style={{ 
        padding: '60px 20px', 
        textAlign: 'center', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--glass-border)',
        marginTop: '100px'
      }}>
        <p>© 2026 Projet Japon - Créé pour des souvenirs inoubliables 🇯🇵</p>
      </footer>
    </div>
  );
}

export default App;
