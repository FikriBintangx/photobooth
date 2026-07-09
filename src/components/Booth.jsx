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

const PHOTO_PRICES = {
  '1-shot': 15000, // Rp 15.000
  '4-grid': 20000  // Rp 20.000
};

export default function Booth({ onBack }) {
  // Payment States
  const [paymentStatus, setPaymentStatus] = useState('unpaid'); // 'unpaid' | 'pending' | 'paid'
  const [orderId, setOrderId] = useState('');
  const [uniqueAmount, setUniqueAmount] = useState(0);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Selection States
  const [frames, setFrames] = useState(DEFAULT_FRAMES);
  const [selectedFrame, setSelectedFrame] = useState(DEFAULT_FRAMES[0]);
  const [boothMode, setBoothMode] = useState('4-grid'); // '1-shot' | '4-grid'
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  
  // Camera/Webcam States
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
  const handleProceedToPayment = async () => {
    const newOrderId = `GLOW-${Date.now().toString().slice(-6)}`;
    const randomCent = Math.floor(Math.random() * 99) + 1; // 1-99 cents for uniqueness
    const finalAmount = PHOTO_PRICES[boothMode] + randomCent;

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
          description: `PhotoBooth Frame ${selectedFrame.name} (${boothMode === '1-shot' ? 'Single' : 'Grid'})`
        })
      });
    } catch (e) {
      console.log('Skipping backend registration (using offline mode / sandbox simulation).');
    }

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

    const totalNeeded = boothMode === '4-grid' ? 4 : 1;
    
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
      if (boothMode === '1-shot') {
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
    setCapturedPhotos([]);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const isCapturing = currentPoseIndex !== -1;
  const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `00020101021226570011ID.DANA.WWW011893600915000000208302090000020830303UMI51440014ID.CO.QRIS.WWW0215ID10265163834230303UMI5204654053033605405500005802ID5912TOKO BINTANG60040204610515710621960150011ID.DANA.WWW63047E69`
  )}`;

  // RENDER STEP 1: Frame & Layout Selector (Unpaid)
  if (paymentStatus === 'unpaid') {
    return (
      <div className="admin-container" style={{ marginTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="text-gradient-neon" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Pilih Frame & Format Foto
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Silakan tentukan frame favorit Anda serta layout foto sebelum melanjutkan ke pembayaran.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          {/* Frame List */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 className="section-title">Koleksi Frame</h3>
            <div className="frame-grid" style={{ maxHeight: 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  className={`frame-item ${selectedFrame.id === frame.id ? 'active' : ''}`}
                  style={{ transform: selectedFrame.id === frame.id ? 'scale(1.02)' : 'none' }}
                >
                  <img src={frame.dataUrl} className="frame-thumb" alt={frame.name} />
                  <span className="frame-item-name">{frame.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Format Settings & Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 className="section-title">Format Kolase</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setBoothMode('4-grid')}
                  className={`filter-btn ${boothMode === '4-grid' ? 'active' : ''}`}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                >
                  4-Grid Strip (4 Poses)
                </button>
                <button
                  onClick={() => setBoothMode('1-shot')}
                  className={`filter-btn ${boothMode === '1-shot' ? 'active' : ''}`}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                >
                  1-Shot Polaroid (1 Pose)
                </button>
              </div>
            </div>

            <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 className="section-title">Ringkasan Sesi</h3>
              <div style={{ margin: '1rem 0' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Harga Sesi Foto</p>
                <p style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--primary)', margin: '0.2rem 0' }}>
                  Rp {PHOTO_PRICES[boothMode].toLocaleString('id-ID')}
                </p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Frame: {selectedFrame.name}
                </p>
              </div>
              <button 
                onClick={handleProceedToPayment} 
                className="nav-button-primary glow-primary" 
                style={{ width: '100%', padding: '0.8rem', borderRadius: '30px' }}
              >
                Bayar Sekarang
              </button>
            </div>

            <button onClick={onBack} className="btn-secondary" style={{ padding: '0.75rem', borderRadius: '30px' }}>
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER STEP 2: QRIS Payment Portal (Mockup Design)
  if (paymentStatus === 'pending') {
    return (
      <div className="admin-container" style={{ maxWidth: '1100px', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Step Indicator (Breadcrumbs) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>1</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pembayaran</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(0,0,0,0.1)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>2</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verifikasi</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(0,0,0,0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>3</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pilih Frame</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(0,0,0,0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>4</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ambil Foto</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(0,0,0,0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>5</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selesai</span>
            </div>
          </div>
        </div>

        {/* 2 Column Main Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Instruction list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111', lineHeight: '1.2', marginBottom: '0.75rem' }}>
                Lakukan Pembayaran Untuk Memulai <span style={{ color: 'var(--primary)' }}>Photo Booth</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Scan QRIS di samping menggunakan aplikasi pembayaran favorit Anda untuk melanjutkan ke sesi pemotretan.
              </p>
            </div>

            <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Cara Kerja
              </h3>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(229, 26, 36, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>1. Scan QRIS</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Gunakan aplikasi dompet digital atau mobile banking Anda.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(229, 26, 36, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>2. Lakukan Pembayaran</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Selesaikan transfer pembayaran tepat sesuai nominal yang tertera.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(229, 26, 36, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>3. Sistem Memverifikasi</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Sistem akan memverifikasi transaksi secara real-time otomatis.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(229, 26, 36, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>4</div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>4. Mulai Photo Booth</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Setelah sukses diverifikasi, kamera studio akan otomatis terbuka!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: QRIS Panel */}
          <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRadius: '16px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Scan QRIS untuk Bayar
            </h3>

            {/* Nominal Box */}
            <div style={{ width: '100%', padding: '0.75rem', background: '#fff5f5', border: '1px dashed #ffcccc', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Nominal Pembayaran</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.1rem' }}>
                Rp {uniqueAmount.toLocaleString('id-ID')}
              </p>
            </div>

            {/* QR Frame */}
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
              <img src={mockQrUrl} alt="QRIS Code" style={{ width: '180px', height: '180px', display: 'block' }} />
            </div>

            {/* Wallet list row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem', width: '100%' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#E6F0FA', color: '#005CA9' }}>GoPay</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#F0E6FA', color: '#4C1F82' }}>OVO</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#E6FAFF', color: '#118EEA' }}>DANA</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#FFEFE6', color: '#EE4D2D' }}>ShopeePay</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#FFE6E6', color: '#E51A24' }}>LinkAja</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '20px', background: '#EAF6EA', color: '#2E7D32' }}>Mobile Banking</span>
            </div>

            {/* Timer Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem 0.8rem', background: '#fcfcfc', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                QR Code berlaku dalam
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>09:58</span>
            </div>

            {/* Info Message */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(0,0,0,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px', width: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Setelah pembayaran berhasil, Anda akan otomatis diarahkan ke halaman selanjutnya.
              </p>
            </div>

            {/* Actions */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button 
                onClick={simulatePaymentSuccess} 
                className="nav-button-primary glow-primary" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                Saya Sudah Bayar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button 
                onClick={handleCancelSession} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Batal
              </button>
            </div>

          </div>
        </div>
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
          <h3 className="section-title">Informasi Transaksi</h3>
          <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
            Order: {orderId}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Frame Terpilih: {selectedFrame.name}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Format: {boothMode === '1-shot' ? 'Single' : 'Grid'}
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
          <h3 className="section-title">Pilih Frame Baru</h3>
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

            <div className="preview-container" style={{ aspectRatio: boothMode === '1-shot' ? '3/4' : '6/18' }}>
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
