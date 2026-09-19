import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Copy, Check, QrCode, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

const AddFund = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const res = await api.get('/wallet/info');
      if (res.data.success === '1') {
        setWalletInfo(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setScreenshotBase64(compressed);
    }
  };

  const handleCopyUpi = () => {
    const upi = walletInfo?.payment_upi_id || walletInfo?.upi_payment_id || '';
    if (upi) {
      navigator.clipboard.writeText(upi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    setError('');

    const amt = parseFloat(amount);
    const minAmt = parseFloat(walletInfo?.min_deposite || 100);
    if (isNaN(amt) || amt < minAmt) {
      setError(`Minimum deposit amount is ₹${minAmt}`);
      setSubmitting(false);
      return;
    }

    const cleanUtr = utrNo.trim();
    if (!cleanUtr) {
      setError('Please enter the 12-digit UTR / Ref No.');
      setSubmitting(false);
      return;
    }

    if (!/^\d{12}$/.test(cleanUtr)) {
      setError('UTR / Ref No. must be exactly 12 digits (e.g. 423456789012)');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/wallet/fund-request', {
        amount,
        utr_no: cleanUtr,
        image: screenshotBase64,
        name: localStorage.getItem('name') || ''
      });

      if (res.data.success === '1') {
        setMsg('Deposit Request Submitted Successfully! Admin approval pending.');
        setAmount('');
        setUtrNo('');
        setScreenshotBase64('');
      } else {
        setError(res.data.msg || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.msg || err.response?.data?.error;
      setError(serverMsg || 'Error submitting deposit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const showUpi = walletInfo?.show_upi === 1 || walletInfo?.show_upi === '1' || walletInfo?.show_upi === true;
  const showQr = walletInfo?.show_qr === 1 || walletInfo?.show_qr === '1' || walletInfo?.show_qr === true;

  const upiId = walletInfo?.payment_upi_id || walletInfo?.upi_payment_id || '';
  const rawQrImage = walletInfo?.payment_barcode_image || '';

  const getQrSrc = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    if (src.startsWith('/')) {
      return src;
    }
    return `/uploads/${src}`;
  };

  const qrSrc = getQrSrc(rawQrImage);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 32px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--app-gradient-primary, linear-gradient(135deg, #d6be66 0%, #10b981 100%))',
        padding: '12px 18px',
        borderRadius: '14px',
        marginBottom: '20px',
        color: '#0b1a30',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0b1a30' }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Deposit Request</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '0.95rem' }}>
          <Wallet size={18} />
          <span>₹ {walletInfo?.wallet || '0'}</span>
        </div>
      </div>

      {/* QR Code & UPI Payment Details Box */}
      {(showQr || showUpi) && (
        <div className="card-glass-v2" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h5 style={{ color: 'var(--color-gold, #d6be66)', fontWeight: '800', marginBottom: '14px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <QrCode size={20} /> SCAN & PAY VIA ANY UPI APP
          </h5>

          {showQr && qrSrc && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '14px',
              borderRadius: '16px',
              display: 'inline-block',
              marginBottom: '16px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
              border: '2px solid var(--color-gold, #d6be66)'
            }}>
              <img
                src={qrSrc}
                alt="Payment QR Code"
                style={{ width: '210px', height: '210px', objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {showUpi && upiId && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              maxWidth: '100%'
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-gold, #d6be66)', marginRight: '12px', wordBreak: 'break-all' }}>
                {upiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="btn-gold"
                style={{
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'COPIED!' : 'COPY UPI'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Deposit Request Form */}
      <div className="card-glass-v2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <h5 style={{ color: '#ffffff', fontWeight: '800', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} style={{ color: 'var(--color-gold, #d6be66)' }} /> Submit Deposit Request
          </h5>
          <Link
            to="/deposit-request-status"
            style={{ color: 'var(--color-gold, #d6be66)', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Check Status</span> <ArrowRight size={14} />
          </Link>
        </div>

        {msg && (
          <div className="badge badge-success" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>
            ✓ {msg}
          </div>
        )}
        {error && (
          <div className="badge badge-danger" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Deposit Amount (₹) *</label>
            <input
              type="number"
              className="form-input"
              min={walletInfo?.min_deposite || 100}
              placeholder={`Minimum deposit ₹${walletInfo?.min_deposite || 100}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Transaction / UTR Number (12 Digits) *</label>
              <span style={{ fontSize: '0.78rem', color: utrNo.length === 12 ? '#10b981' : 'rgba(255, 255, 255, 0.5)', fontWeight: '700' }}>
                {utrNo.length}/12
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              maxLength={12}
              placeholder="Enter 12-digit UTR (e.g. 423456789012)"
              value={utrNo}
              onChange={(e) => setUtrNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
              required
            />
            <small style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Enter 12-digit UTR/Ref ID from your PhonePe / GPay / Paytm payment receipt.
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label">Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="submit"
            className="btn-gold"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              letterSpacing: '0.04em'
            }}
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT DEPOSIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFund;
