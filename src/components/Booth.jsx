import React, { useState, useEffect, useRef } from 'react';
import { getAllFrames } from '../utils/db';

const DEFAULT_FRAMES = [
  {
    id: 'default-polaroid',
    name: 'Classic Polaroid',
    isDefault: true,
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

const PACKAGES = [
  {
    id: '1-shot',
    name: 'Polaroid Classic',
    price: 15000,
    desc: '1 pose foto dengan format polaroid klasik berkualitas tinggi.',
    grid: '1-shot'
  },
  {
    id: '4-grid',
    name: 'Cyber Neon Strip',
    price: 25000,
    desc: '4 pose foto kolase beruntun bergaya Korean Photobooth.',
    grid: '4-grid'
  }
];

export default function Booth({ onBack }) {
  // Payment States
  const [paymentStatus, setPaymentStatus] = useState('unpaid'); // 'unpaid' | 'pending' | 'paid'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [uniqueAmount, setUniqueAmount] = useState(0);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Booth States
  const [frames, setFrames] = useState(DEFAULT_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState(DEFAULT_FRAMES[0]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  
  const [countdown, setCountdown] = useState(0);
  const [countdownSetting, setCountdownSetting] = useState(3);
  
  const [isMirrored, setIsMirrored] = useState(true);
  const [stream, setStream] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  
  const [currentPoseIndex, setCurrentPoseIndex] = useState(-1);
  const [flashScreen, setFlashScreen] = useState(false);
  
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [finalResultUrl, setFinalResultUrl] = useState('');
  const [showFinalModal, setShowFinalModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadAllFrames();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Trigger camera start only after payment is paid
  useEffect(() => {
    if (paymentStatus === 'paid') {
      startCamera();
    }
  }, [paymentStatus]);

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

  // Payment checkout initiator
  const handleSelectPackage = async (pkg) => {
    setSelectedPackage(pkg);
    const newOrderId = `GLOW-${Date.now().toString().slice(-6)}`;
    const randomCent = Math.floor(Math.random() * 99) + 1; // 1-99 cents for uniqueness
    const finalAmount = pkg.price + randomCent;

    setOrderId(newOrderId);
    setUniqueAmount(finalAmount);
    setPaymentStatus('pending');

    // Register check-out to Hugging Face Backend if online
    try {
      await fetch('https://87nvlion-jurnalku-backend.hf.space/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: newOrderId,
          amount: finalAmount,
          user_email: 'customer@photobooth.local',
          description: `PhotoBooth Paket ${pkg.name}`
        })
      });
    } catch (e) {
      console.log('Skipping backend registration (using offline mode / sandbox simulation).');
    }

    // Start polling payment status from Hugging Face Space
    startPaymentPolling(finalAmount);
  };

  const startPaymentPolling = (amount) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        setCheckingPayment(true);
        const response = await fetch('https://87nvlion-jurnalku-backend.hf.space/api/payment/phone-status');
        if (response.ok) {
          const data = await response.json();
          // Check if any matching verified notifications in history
          const history = data.history || [];
          const match = history.find(n => n.amount === amount && n.matched === true);
          if (match) {
            handlePaymentSuccess();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        setCheckingPayment(false);
      }
    }, 4000);
  };

  const handlePaymentSuccess = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPaymentStatus('paid');
  };

  // Manual payment trigger for offline/sandbox testing
  const simulatePaymentSuccess = async () => {
    try {
      // Hit backend manual-verify endpoint
      await fetch('https://87nvlion-jurnalku-backend.hf.space/api/payment/manual-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: uniqueAmount })
      });
    } catch (e) {
      console.log('Backend manual verify failed, bypassing for simulation.');
    }
    handlePaymentSuccess();
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
    
    setFlashScreen(true);
    setTimeout(() => setFlashScreen(false), 200);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

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

    const totalNeeded = selectedPackage.grid === '4-grid' ? 4 : 1;
    
    if (updatedPhotos.length < totalNeeded) {
      triggerNextCapture(index + 1, updatedPhotos);
    } else {
      generateFinalCollage(updatedPhotos);
    }
  };

  const handleRetakePhoto = () => {
    const { index, existingList } = pendingPhoto;
    setShowPreviewModal(false);
    setPendingPhoto(null);
    triggerNextCapture(index, existingList);
  };

  const generateFinalCollage = (photos) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.src = selectedFrame.dataUrl;

    frameImg.onload = () => {
      if (selectedPackage.grid === '1-shot') {
        canvas.width = 1200;
        canvas.height = 1600;

        const photoImg = new Image();
        photoImg.src = photos[0];
        photoImg.onload = () => {
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
        canvas.width = 600;
        canvas.height = 1800;

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

  const handleCancelSession = () => {
    stopCamera();
    setPaymentStatus('unpaid');
    setSelectedPackage(null);
    setCapturedPhotos([]);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const isCapturing = currentPoseIndex !== -1;
  const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `00020101021226570011ID.DANA.WWW011893600915000000208302090000020830303UMI51440014ID.CO.QRIS.WWW0215ID10265163834230303UMI5204654053033605405500005802ID5912TOKO BINTANG60040204610515710621960150011ID.DANA.WWW63047E69`
  )}`;

  // RENDER STEP 1: Package Selector
  if (paymentStatus === 'unpaid') {
    return (
      <div className="admin-container" style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 className="text-gradient-neon" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pilih Paket Photobooth
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Silakan pilih paket foto Anda untuk memulai sesi otomatis.
        </p>

        <div className="features-grid" style={{ marginBottom: '2.5rem' }}>
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id} 
              className="feature-card glass" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}
              onClick={() => handleSelectPackage(pkg)}
            >
              <div>
                <div className="feature-icon" style={{ margin: '0 auto 1.25rem auto' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <h3 className="feature-title" style={{ textAlign: 'center' }}>{pkg.name}</h3>
                <p className="feature-desc" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{pkg.desc}</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', textAlign: 'center' }}>
                  Rp {pkg.price.toLocaleString('id-ID')}
                </p>
                <button className="nav-button-primary" style={{ width: '100%', marginTop: '1rem', borderRadius: '8px' }}>
                  Pilih Paket
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px' }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // RENDER STEP 2: QRIS Payment Portal
  if (paymentStatus === 'pending') {
    return (
      <div className="admin-container" style={{ maxWidth: '460px', marginTop: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h3 className="text-gradient-neon" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Pembayaran QRIS
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Pindai kode QRIS di bawah ini untuk mengaktifkan kamera.
          </p>

          <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
            <img src={mockQrUrl} alt="QRIS Code" style={{ width: '220px', height: '220px' }} />
          </div>

          <div style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL TRANSFER (HARUS PAS)</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '0.5px', marginTop: '0.25rem' }}>
              Rp {uniqueAmount.toLocaleString('id-ID')}
            </p>
            <p style={{ fontSize: '0.7rem', color: '#ff4444', marginTop: '0.2rem', fontWeight: 600 }}>
              *3 digit terakhir adalah kode acak verifikasi transaksi Anda.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div className="loader-ring" style={{ width: '16px', height: '16px', border: '2.5px solid var(--text-muted)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {checkingPayment ? 'Memverifikasi transaksi...' : 'Menunggu transfer...'}
            </p>
          </div>

          {/* Simulated buttons for client presentation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <button onClick={simulatePaymentSuccess} className="nav-button-primary glow-primary" style={{ padding: '0.75rem', borderRadius: '8px' }}>
              Simulasi Bayar Sukses
            </button>
            <button onClick={handleCancelSession} className="btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px' }}>
              Batal
            </button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // RENDER STEP 3: The Camera PhotoBooth Workspace (Paid Mode)
  return (
    <div className="booth-container">
      <div className="booth-main">
        {flashScreen && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 150 }} />
        )}

        <div className="camera-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`camera-stream ${isMirrored ? 'mirrored' : ''}`}
            style={{ filter: selectedFilter.id !== 'none' ? selectedFilter.filter : 'none' }}
          />

          <div className="frame-overlay">
            <img src={selectedFrame.dataUrl} className="frame-overlay-img" alt="Selected Frame" />
          </div>

          {countdown > 0 && (
            <div className="countdown-overlay">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}
        </div>

        {selectedPackage?.grid === '4-grid' && (
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
        <div className="panel-section glass">
          <h3 className="section-title">Paket Aktif</h3>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
            {selectedPackage?.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            ID: {orderId}
          </p>
        </div>

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

        <button onClick={handleCancelSession} className="btn-secondary" style={{ padding: '0.75rem', borderRadius: '10px', width: '100%' }}>
          Keluar Sesi
        </button>
      </div>

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

            <div className="preview-container" style={{ aspectRatio: selectedPackage?.grid === '1-shot' ? '3/4' : '6/18' }}>
              <img src={finalResultUrl} className="preview-image" alt="Final Collage" />
            </div>

            <button onClick={handleDownload} className="btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Unduh Hasil Foto
            </button>

            <div className="share-panel">
              <div className="qr-code-wrapper">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://versatiles.vercel.app/download-success')}`} 
                  className="qr-code" 
                  alt="Scan QR Code" 
                />
              </div>
              <div className="share-info">
                <p className="share-title">Pindai QR Code</p>
                <p className="share-desc">Pindai kode ini menggunakan kamera HP Anda untuk menyalin foto langsung ke galeri.</p>
              </div>
            </div>

            <button 
              onClick={() => { setShowFinalModal(false); setFinalResultUrl(''); handleCancelSession(); }} 
              className="btn-secondary btn-block" 
              style={{ marginTop: '1rem' }}
            >
              Selesai (Kembali)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
