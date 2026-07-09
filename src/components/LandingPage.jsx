import React from 'react';

export default function LandingPage({ onStartBooth, onManageFrames }) {
  return (
    <div className="hero" style={{ position: 'relative', width: '100%', minHeight: '85vh', overflow: 'hidden' }}>
      
      {/* Background Decorators from Mockup */}
      <div className="grid-decorator-top" />
      <div className="circle-decorator-left" />
      <div className="circle-decorator-right" />
      <div className="dots-decorator-right" />

      {/* Abstract curved grid lines (bottom mesh) */}
      <svg className="mesh-decorator-bottom" viewBox="0 0 1440 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 300 C300 200, 500 400, 1540 100" stroke="#1e1e1e" strokeWidth="2.5" />
        <path d="M-100 200 C400 350, 700 150, 1540 280" stroke="#1e1e1e" strokeWidth="2" />
        <path d="M-100 100 C350 50, 800 300, 1540 180" stroke="#1e1e1e" strokeWidth="1.5" />
        <path d="M100 -50 C200 150, 50 350, 150 450" stroke="#1e1e1e" strokeWidth="2" />
        <path d="M500 -50 C600 200, 450 350, 550 450" stroke="#1e1e1e" strokeWidth="1.8" />
        <path d="M900 -50 C1000 150, 850 350, 950 450" stroke="#1e1e1e" strokeWidth="1.5" />
        <path d="M1200 -50 C1300 200, 1150 350, 1250 450" stroke="#1e1e1e" strokeWidth="1.8" />
      </svg>

      {/* Title POTOBUTH with camera lens inside O */}
      <div className="mockup-title-wrapper" style={{ zIndex: 10 }}>
        <span className="mockup-title">POT</span>
        <div className="lens-o">
          <div className="lens-inner">
            <div className="lens-core" />
          </div>
        </div>
        <span className="mockup-title">BUTH</span>
      </div>

      {/* Subtitle */}
      <h2 className="mockup-subtitle" style={{ zIndex: 10 }}>
        <span>DOKUMENTASIKAN KENANGAN</span>
        <span className="accent-word">ANDA</span>
      </h2>

      {/* Features card horizontal */}
      <div className="features-card-horizontal glass" style={{ zIndex: 10, maxWidth: '960px' }}>
        <div className="feature-item-col">
          <div className="feature-col-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <h4 className="feature-col-title">Mudah Digunakan</h4>
          <p className="feature-col-desc">Ambil foto dengan mudah</p>
        </div>

        <div className="feature-item-col">
          <div className="feature-col-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="15" y1="3" x2="15" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
          </div>
          <h4 className="feature-col-title">Banyak Frame</h4>
          <p className="feature-col-desc">Pilih frame favoritmu</p>
        </div>

        <div className="feature-item-col">
          <div className="feature-col-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h4 className="feature-col-title">Download HD</h4>
          <p className="feature-col-desc">Hasil foto berkualitas tinggi</p>
        </div>

        <div className="feature-item-col">
          <div className="feature-col-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
          <h4 className="feature-col-title">Bagikan Momen</h4>
          <p className="feature-col-desc">Bagikan ke media sosial</p>
        </div>
      </div>

      {/* CTA Button */}
      <button onClick={onStartBooth} className="btn-cta-pill" style={{ zIndex: 10 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span>MULAI FOTO</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>

      {/* Subtext below CTA */}
      <p className="sub-cta-text" style={{ zIndex: 10 }}>
        Buat momenmu jadi lebih berkesan! <span style={{ color: 'red' }}>❤️</span>
      </p>

    </div>
  );
}
