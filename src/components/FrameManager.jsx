import React, { useState, useEffect } from 'react';
import { addFrame, getAllFrames, deleteFrame } from '../utils/db';

export default function FrameManager({ onBack }) {
  const [frames, setFrames] = useState([]);
  const [frameName, setFrameName] = useState('');
  const [frameFile, setFrameFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFrames();
  }, []);

  const loadFrames = async () => {
    try {
      const data = await getAllFrames();
      setFrames(data);
    } catch (err) {
      console.error('Failed to load frames:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        setError('Hanya file PNG transparan yang didukung.');
        return;
      }
      setError('');
      setFrameFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        setError('Hanya file PNG transparan yang didukung.');
        return;
      }
      setError('');
      setFrameFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frameFile || !frameName) {
      setError('Mohon lengkapi nama frame dan file gambar.');
      return;
    }

    setLoading(true);
    try {
      // Custom frame data: name, dataUrl (base64 string of PNG)
      await addFrame({
        name: frameName,
        dataUrl: previewUrl,
        aspectRatio: '3:4', // default ratio for photo grids
        createdAt: new Date().toISOString()
      });
      
      setFrameName('');
      setFrameFile(null);
      setPreviewUrl('');
      loadFrames();
    } catch (err) {
      setError('Gagal mengunggah frame.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus frame ini?')) {
      try {
        await deleteFrame(id);
        loadFrames();
      } catch (err) {
        console.error('Gagal menghapus frame:', err);
      }
    }
  };

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Kelola Frame Kustom</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Tambahkan frame PNG transparan baru (Rekomendasi rasio 3:4 atau 1080x1440 piksel).
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
          Kembali
        </button>
      </div>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
              Nama Frame
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Frame Ulang Tahun, Summer Vibes" 
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontFamily: 'inherit',
                fontSize: '1rem'
              }}
            />
          </div>

          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              accept="image/png" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <div style={{ position: 'relative', width: '120px', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <img src={previewUrl} alt="Preview Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            )}
            <div>
              <p style={{ fontWeight: 600 }}>Tarik & Lepaskan File PNG Anda di sini</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                atau klik untuk memilih file dari komputer Anda (PNG saja)
              </p>
            </div>
          </div>

          {error && <p style={{ color: '#ff4444', fontSize: '0.9rem', fontWeight: 500 }}>{error}</p>}

          <button 
            type="submit" 
            disabled={loading || !frameFile || !frameName}
            className="nav-button-primary" 
            style={{ padding: '0.8rem', borderRadius: '8px', width: '100%' }}
          >
            {loading ? 'Mengunggah...' : 'Tambahkan Frame'}
          </button>
        </form>
      </div>

      <h3 className="section-title">Koleksi Frame Saat Ini</h3>
      
      {frames.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>Belum ada frame kustom yang diunggah. Gunakan form di atas untuk menambahkan frame pertamamu!</p>
        </div>
      ) : (
        <div className="uploaded-list">
          {frames.map((frame) => (
            <div key={frame.id} className="uploaded-card glass">
              <button onClick={() => handleDelete(frame.id)} className="delete-btn" title="Hapus Frame">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <img src={frame.dataUrl} alt={frame.name} />
              <div className="frame-info">
                <p style={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {frame.name}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Kustom Frame
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
