import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Booth from './components/Booth';
import FrameManager from './components/FrameManager';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'booth' | 'manage-frames'

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo text-gradient-neon" onClick={() => setCurrentView('landing')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(-10deg)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          PicGlow Booth
        </div>
        <div className="nav-links">
          <button 
            className={`nav-button ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => setCurrentView('landing')}
          >
            Beranda
          </button>
          <button 
            className={`nav-button ${currentView === 'booth' ? 'active' : ''}`}
            onClick={() => setCurrentView('booth')}
          >
            Studio Foto
          </button>
          <button 
            className="nav-button-primary"
            onClick={() => setCurrentView('manage-frames')}
          >
            Kelola Frame
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'landing' && (
          <LandingPage 
            onStartBooth={() => setCurrentView('booth')} 
            onManageFrames={() => setCurrentView('manage-frames')}
          />
        )}
        {currentView === 'booth' && (
          <Booth onBack={() => setCurrentView('landing')} />
        )}
        {currentView === 'manage-frames' && (
          <FrameManager onBack={() => setCurrentView('landing')} />
        )}
      </main>
    </div>
  );
}

export default App;
