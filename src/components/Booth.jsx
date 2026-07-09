import React, { useState, useEffect, useRef } from 'react';
import { getAllFrames } from '../utils/db';

// Base64 Default Frames
const DEFAULT_FRAMES = [
  {
    id: 'default-polaroid',
    name: 'Classic Polaroid',
    isDefault: true,
    // Classic white border frame with transparent center
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect x="0" y="0" width="300" height="400" fill="none" stroke="white" stroke-width="24"/><rect x="12" y="12" width="276" height="376" fill="none" stroke="%23f3f4f6" stroke-width="2"/><text x="150" y="375" font-family="Outfit, sans-serif" font-weight="bold" font-size="16" fill="%23110d24" text-anchor="middle">MEMORIES</text></svg>'
  },
  {
    id: 'default-neon',
    name: 'Neon Cyber',
    isDefault: true,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect x="0" y="0" width="300" height="400" fill="none" stroke="%23ff007f" stroke-width="12"/><rect x="6" y="6" width="288" height="388" fill="none" stroke="%2300f0ff" stroke-width="4"/><circle cx="30" cy="30" r="8" fill="%23ff007f"/><circle cx="270" cy="30" r="8" fill="%2300f0ff"/><circle cx="30" cy="370" r="8" fill="%2300f0ff"/><circle cx="270" cy="370" r="8" fill="%23ff007f"/></svg>'
  },
  {
    id: 'default-retro',
    name: 'Retro Y2K',
    isDefault: true,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect x="0" y="0" width="300" height="400" fill="none" stroke="%238a2be2" stroke-width="16"/><path d="M 0 0 L 50 0 L 0 50 Z" fill="%23ff007f"/><path d="M 300 0 L 250 0 L 300 50 Z" fill="%2300f0ff"/><path d="M 0 400 L 50 400 L 0 350 Z" fill="%2300f0ff"/><path d="M 300 400 L 250 400 L 300 350 Z" fill="%23ff007f"/><text x="150" y="385" font-family="Outfit, sans-serif" font-weight="900" font-size="14" fill="white" text-anchor="middle" letter-spacing="2">PHOTO BOOTH</text></svg>'
  }
];

const FILTERS = [
  { id: 'none', name: 'Normal', class: '' },
  { id: 'grayscale', name: 'B&W', filter: 'grayscale(100%)' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(120%) brightness(95%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', filter: 'hue-rotate(90deg) saturate(180%) contrast(120%)' },
  { id: 'cinematic', name: 'Cinematic', filter: 'contrast(130%) saturate(80%) brightness(90%)' }
];

export default function Booth({ onBack }) {
  const [frames, setFrames] = useState(DEFAULT_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState(DEFAULT_FRAMES[0]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  
  const [boothMode, setBoothMode] = useState('4-grid'); // '1-shot' or '4-grid'
  const [countdown, setCountdown] = useState(0);
  const [countdownSetting, setCountdownSetting] = useState(3);
  
  const [isMirrored, setIsMirrored] = useState(true);
  const [stream, setStream] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]); // array of blobs or dataURLs
  
  const [currentPoseIndex, setCurrentPoseIndex] = useState(-1); // -1 means idle
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  
  // Custom Preview & Retake Modal States
  const [pendingPhoto, setPendingPhoto] = useState(null); // the photo taken that needs confirmation
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Final Collage Output State
  const [finalResultUrl, setFinalResultUrl] = useState('');
  const [showFinalModal, setShowFinalModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadAllFrames();
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadAllFrames = async () => {
    try {
      const custom = await getAllFrames();
      setFrames([...DEFAULT_FRAMES, ...custom]);
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert('Gagal mengakses kamera. Mohon izinkan akses kamera di browsermu.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startPhotoSession = () => {
    setCapturedPhotos([]);
    setFinalResultUrl('');
    triggerNextCapture(0, []);
  };

  const triggerNextCapture = (index, currentPhotos) => {
    setCurrentPoseIndex(index);
    setCountdown(countdownSetting);
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          captureSinglePhoto(index, currentPhotos);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureSinglePhoto = (index, currentPhotos) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Play shutter flash
    setFlashScreen(true);
    setTimeout(() => setFlashScreen(false), 200);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas width/height to camera feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Apply Filter on canvas
    if (selectedFilter.id !== 'none') {
      ctx.filter = selectedFilter.filter;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPendingPhoto({ index, dataUrl, existingList: currentPhotos });
    setShowPreviewModal(true);
  };

  const handleKeepPhoto = () => {
    const { index, dataUrl, existingList } = pendingPhoto;
    const updatedPhotos = [...existingList, dataUrl];
    setCapturedPhotos(updatedPhotos);
    setShowPreviewModal(false);
    setPendingPhoto(null);

    const totalNeeded = boothMode === '4-grid' ? 4 : 1;
    
    if (updatedPhotos.length < totalNeeded) {
      // Continue to next pose
      triggerNextCapture(index + 1, updatedPhotos);
    } else {
      // Done capturing all poses, compile final collage
      generateFinalCollage(updatedPhotos);
    }
  };

  const handleRetakePhoto = () => {
    const { index, existingList } = pendingPhoto;
    setShowPreviewModal(false);
    setPendingPhoto(null);
    // Restart countdown for same pose index
    triggerNextCapture(index, existingList);
  };

  const generateFinalCollage = (photos) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.src = selectedFrame.dataUrl;

    frameImg.onload = () => {
      if (boothMode === '1-shot') {
        // Single shot collage
        canvas.width = 1200;
        canvas.height = 1600;

        const photoImg = new Image();
        photoImg.src = photos[0];
        photoImg.onload = () => {
          // Draw single photo centered, padding for polaroid frame
          const paddingLeft = 60;
          const paddingTop = 60;
          const width = 1080;
          const height = 1440;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(photoImg, paddingLeft, paddingTop, width, height);
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

          setFinalResultUrl(canvas.toDataURL('image/png'));
          setShowFinalModal(true);
          setCurrentPoseIndex(-1);
        };
      } else {
        // 4-grid collage (2x2 grid or Vertical Strip)
        // Let's build a vertical strip: 4 photos stacked vertically
        canvas.width = 600;
        canvas.height = 1800; // tall strip

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let loadedCount = 0;
        const photoImgs = [];

        photos.forEach((src, idx) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            photoImgs[idx] = img;
            loadedCount++;
            if (loadedCount === 4) {
              const photoWidth = 520;
              const photoHeight = 390;
              const startX = 40;
              const gap = 30;
              const startY = 40;

              for (let i = 0; i < 4; i++) {
                const yPos = startY + i * (photoHeight + gap);
                ctx.drawImage(photoImgs[i], startX, yPos, photoWidth, photoHeight);
              }

              // Draw Frame on top if it has design
              ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

              setFinalResultUrl(canvas.toDataURL('image/png'));
              setShowFinalModal(true);
              setCurrentPoseIndex(-1);
            }
          };
        });
      }
    };
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.png`;
    link.href = finalResultUrl;
    link.click();
  };

  const isCapturing = currentPoseIndex !== -1;
  const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://versatiles.vercel.app/download-success')}`;

  return (
    <div className="booth-container">
      <div className="booth-main">
        {/* Flash overlay */}
        {flashScreen && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 150 }} />
        )}

        <div className="camera-wrapper">
          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`camera-stream ${isMirrored ? 'mirrored' : ''}`}
            style={{ filter: selectedFilter.id !== 'none' ? selectedFilter.filter : 'none' }}
          />

          {/* Real-time frame overlay */}
          <div className="frame-overlay">
            <img src={selectedFrame.dataUrl} className="frame-overlay-img" alt="Selected Frame" />
          </div>

          {/* Countdown timer */}
          {countdown > 0 && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}
        </div>

        {/* Pose / Grid status tracker */}
        {boothMode === '4-grid' && (
          <div className="pose-slots">
            {[0, 1, 2, 3].map((idx) => {
              let slotClass = 'pose-slot';
              if (capturedPhotos.length > idx) slotClass += ' captured';
              else if (currentPoseIndex === idx) slotClass += ' active';
              return (
                <div key={idx} className={slotClass}>
                  {idx + 1}
                </div>
              );
            })}
          </div>
        )}

        {/* Capture Action button */}
        <div className="camera-controls">
          <button 
            onClick={() => setIsMirrored(!isMirrored)} 
            className={`btn-round ${isMirrored ? 'active' : ''}`}
            title="Mirror Camera"
            disabled={isCapturing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </button>

          <button 
            onClick={startPhotoSession} 
            disabled={isCapturing} 
            className="btn-capture glow-primary"
            title="Start Booth"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>

          <button 
            onClick={() => setCountdownSetting(countdownSetting === 3 ? 5 : 3)}
            className="btn-round"
            title="Set Countdown"
            disabled={isCapturing}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{countdownSetting}s</span>
          </button>
        </div>
      </div>

      <div className="sidebar">
        {/* Section Mode */}
        <div className="panel-section glass">
          <h3 className="section-title">Mode Kolase</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setBoothMode('4-grid')}
              className={`filter-btn ${boothMode === '4-grid' ? 'active' : ''}`}
              style={{ flex: 1 }}
              disabled={isCapturing}
            >
              4-Grid Strip
            </button>
            <button
              onClick={() => setBoothMode('1-shot')}
              className={`filter-btn ${boothMode === '1-shot' ? 'active' : ''}`}
              style={{ flex: 1 }}
              disabled={isCapturing}
            >
              1-Shot Polaroid
            </button>
          </div>
        </div>

        {/* Filter List */}
        <div className="panel-section glass">
          <h3 className="section-title">Filter Foto</h3>
          <div className="filter-list">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f)}
                className={`filter-btn ${selectedFilter.id === f.id ? 'active' : ''}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Frame list selector */}
        <div className="panel-section glass" style={{ flex: 1 }}>
          <h3 className="section-title">Pilih Frame</h3>
          <div className="frame-grid">
            {frames.map((frame) => (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`frame-item ${selectedFrame.id === frame.id ? 'active' : ''}`}
              >
                <img src={frame.dataUrl} className="frame-thumb" alt={frame.name} />
                <span className="frame-item-name">{frame.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.75rem', borderRadius: '10px', width: '100%' }}>
          Kembali ke Menu Utama
        </button>
      </div>

      {/* Hidden Capturing Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Preview & Retake Modal */}
      {showPreviewModal && pendingPhoto && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ padding: '1.5rem' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pratinjau Pose {pendingPhoto.index + 1}</h3>
              <p className="modal-subtitle">Apakah posenya sudah oke atau ingin diulang?</p>
            </div>
            
            <div className="preview-container">
              <img src={pendingPhoto.dataUrl} className="preview-image" alt="Captured pose" />
            </div>

            <div className="preview-actions">
              <button onClick={handleRetakePhoto} className="btn-secondary btn-block">
                Retake
              </button>
              <button onClick={handleKeepPhoto} className="btn-primary btn-block">
                Simpan & Lanjut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Result Modal */}
      {showFinalModal && finalResultUrl && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ padding: '1.5rem', maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title text-gradient">Hasil Akhir</h3>
              <p className="modal-subtitle">Kolase fotomu siap diunduh!</p>
            </div>

            <div className="preview-container" style={{ aspectRatio: boothMode === '1-shot' ? '3/4' : '6/18' }}>
              <img src={finalResultUrl} className="preview-image" alt="Final Collage" />
            </div>

            <button onClick={handleDownload} className="btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Unduh Hasil Foto
            </button>

            <div className="share-panel">
              <div className="qr-code-wrapper">
                <img src={mockQrUrl} className="qr-code" alt="Scan QR Code" />
              </div>
              <div className="share-info">
                <p className="share-title">Pindai QR Code</p>
                <p className="share-desc">Pindai kode ini menggunakan kamera HP Anda untuk menyalin foto langsung ke galeri.</p>
              </div>
            </div>

            <button 
              onClick={() => { setShowFinalModal(false); setFinalResultUrl(''); }} 
              className="btn-secondary btn-block" 
              style={{ marginTop: '1rem' }}
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
