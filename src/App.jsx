import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Booth from './components/Booth';
import FrameManager from './components/FrameManager';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'booth' | 'manage-frames'
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    // Check URL parameters for admin=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminMode(true);
    }
  }, []);

  const handleAdminAccess = () => {
    if (isAdminMode) {
      setCurrentView('manage-frames');
    } else {
      setShowPinModal(true);
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === '1234') { // Default Admin PIN
      setIsAdminMode(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setCurrentView('manage-frames');
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
      setPinInput('');
    }
  };

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
          
          {/* Admin link only visible if already authenticated or using admin URL parameter */}
          {isAdminMode && (
            <button 
              className={`nav-button-primary ${currentView === 'manage-frames' ? 'active' : ''}`}
              onClick={() => setCurrentView('manage-frames')}
            >
              Kelola Frame
            </button>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'landing' && (
          <LandingPage 
            onStartBooth={() => setCurrentView('booth')} 
            onManageFrames={handleAdminAccess}
          />
        )}
        {currentView === 'booth' && (
          <Booth onBack={() => setCurrentView('landing')} />
        )}
        {currentView === 'manage-frames' && (
          <FrameManager onBack={() => setCurrentView('landing')} />
        )}
      </main>

      {/* Footer with a subtle admin link */}
      <footer style={{ 
        padding: '1.5rem', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border-glass)', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        background: 'rgba(8,5,16,0.2)' 
      }}>
        <p>© 2026 PicGlow Booth. All rights reserved.</p>
        <span 
          onClick={handleAdminAccess} 
          style={{ cursor: 'pointer', marginTop: '0.5rem', display: 'inline-block', textDecoration: 'underline' }}
        >
          {isAdminMode ? 'Keluar Mode Admin' : 'Portal Admin'}
        </span>
      </footer>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ padding: '2rem', maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Masukkan PIN Admin</h3>
              <p className="modal-subtitle">Gunakan PIN default "1234" untuk login</p>
            </div>
            
            <form onSubmit={handleVerifyPin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                maxLength="4"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '10px'
                }}
                autoFocus
              />

              {pinError && <p style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>{pinError}</p>}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px' }}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="nav-button-primary"
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px' }}
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
