import React from 'react';

export default function LandingPage({ onStartBooth, onManageFrames }) {
  return (
    <div className="hero">
      <div className="hero-tag">Aesthetic & Modern Photo Booth</div>
      <h1 className="hero-title text-gradient">
        Abadikan Momen Serumu Secara Instan.
      </h1>
      <p className="hero-desc">
        Nikmati pengalaman photobooth interaktif langsung dari browsermu. Pilih frame aesthetic, terapkan filter premium, dan bagikan hasilnya dengan mudah.
      </p>

      <div className="hero-cta">
        <button 
          onClick={onStartBooth} 
          className="nav-button-primary btn-lg glow-primary"
        >
          Mulai Photo Booth
        </button>
        <button 
          onClick={onManageFrames} 
          className="btn-secondary btn-lg"
        >
          Kelola Frame
        </button>
      </div>

      <div className="features-grid">
        <div className="feature-card glass">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <h3 className="feature-title">Real-time Camera</h3>
          <p className="feature-desc">Pratinjau tangkapan kamera langsung dengan filter vintage, cyberpunk, dan cinematic secara real-time.</p>
        </div>

        <div className="feature-card glass">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Frame Kustom</h3>
          <p className="feature-desc">Gunakan koleksi frame trendi kami atau unggah file PNG transparan buatanmu sendiri untuk acara khusus.</p>
        </div>

        <div className="feature-card glass">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3 className="feature-title">Ekspor HD & QR</h3>
          <p className="feature-desc">Unduh hasil gabungan kolase foto beresolusi tinggi secara langsung atau pindai QR Code untuk simpan di HP.</p>
        </div>
      </div>
    </div>
  );
}
