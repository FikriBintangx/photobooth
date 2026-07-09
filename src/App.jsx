import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Booth from './components/Booth';
import FrameManager from './components/FrameManager';
import logoImg from './assets/logo.jpg';

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
    if (pinInput === 'rara bau') { // Updated Admin Password
      setIsAdminMode(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setCurrentView('manage-frames');
    } else {
      setPinError('Password salah! Silakan coba lagi.');
      setPinInput('');
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo" onClick={() => setCurrentView('landing')} style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', cursor: 'pointer' }}>
          <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.6rem', letterSpacing: '-1.5px', fontFamily: 'Outfit, sans-serif' }}>POT</span>
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            background: 'var(--primary)',
            borderRadius: '50%',
            margin: '0 1px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#111',
                borderRadius: '50%',
                border: '1px solid #666',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '1px',
                  left: '1px',
                  width: '2px',
                  height: '2px',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '50%'
                }} />
              </div>
            </div>
          </div>
          <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.6rem', letterSpacing: '-1.5px', fontFamily: 'Outfit, sans-serif' }}>BUTH</span>
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

      {/* Password Verification Modal */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ padding: '2rem', maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Masukkan Password Admin</h3>
              <p className="modal-subtitle">Gunakan password Anda untuk masuk</p>
            </div>
            
            <form onSubmit={handleVerifyPin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                placeholder="Masukkan password..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'white',
                  fontSize: '1.05rem',
                  textAlign: 'center'
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
