import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PlaceList from './components/PlaceList';
import PhotoAlbum from './components/PhotoAlbum';
import UploadModal from './components/UploadModal';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Hero />;
      case 'places':
        return <PlaceList onAddPhoto={setSelectedPlace} />;
      case 'album':
        return <PhotoAlbum />;
      default:
        return <Hero />;
    }
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main>
        {renderContent()}
      </main>

      {selectedPlace && (
        <UploadModal 
          place={selectedPlace} 
          onClose={() => setSelectedPlace(null)}
          onUploadSuccess={() => {
            // Logic to refresh if needed, but PhotoAlbum fetches on mount
            setActiveTab('album');
          }}
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
