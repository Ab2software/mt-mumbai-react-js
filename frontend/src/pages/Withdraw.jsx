import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Edit3, CheckCircle2, AlertCircle, ArrowRight, X, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

const Withdraw = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [amount, setAmount] = useState('2000');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // UPI update modal state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [phonepe, setPhonepe] = useState('');
  const [paytm, setPaytm] = useState('');
  const [gpay, setGpay] = useState('');
  const [upiUpdating, setUpiUpdating] = useState(false);
  const [upiMsg, setUpiMsg] = useState('');
  const [upiErr, setUpiErr] = useState('');

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [walletRes, profileRes] = await Promise.all([
        api.get('/wallet/info'),
        api.get('/profile')
      ]);

      if (walletRes.data.success === '1') {
        setWalletInfo(walletRes.data.data);
      }
      if (profileRes.data.success === '1') {
        const u = profileRes.data.data;
        setProfile(u);
        setPhonepe(u.phonepay || '');
        setPaytm(u.paytm || '');
        setGpay(u.googlepay || '');
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

  const handleUpdateUpi = async (e) => {
    e.preventDefault();
    setUpiUpdating(true);
    setUpiMsg('');
    setUpiErr('');
    try {
      const res = await api.post('/profile/update', {
        phonpe: phonepe,
        paytm: paytm,
        gpay: gpay
      });
      if (res.data.success === '1') {
        setUpiMsg('UPI details updated successfully!');
        setTimeout(() => {
          setShowUpiModal(false);
          setUpiMsg('');
          loadData();
        }, 1500);
      } else {
        setUpiErr(res.data.msg || 'Failed to update UPI details.');
      }
    } catch (err) {
      setUpiErr('Error updating UPI details.');
    } finally {
      setUpiUpdating(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    const amt = parseFloat(amount);
    const minWithdraw = parseFloat(walletInfo?.min_withdrawal || 1000);
    const maxWithdraw = parseFloat(walletInfo?.max_withdrawal || 50000);

    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    if (isNaN(amt) || amt < minWithdraw) {
      setError(`Please enter a minimum of ₹${minWithdraw}`);
      return;
    }

    if (amt > maxWithdraw) {
      setError(`Maximum allowed withdrawal per request is ₹${maxWithdraw}`);
      return;
    }

    const currentBal = parseFloat(walletInfo?.wallet || 0);
    if (amt > currentBal) {
      setError('Insufficient wallet balance!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/wallet/withdraw-request', {
        amount: amount,
        payment_method: paymentMethod,
        remark: `Withdrawal via ${paymentMethod}`
      });

      if (res.data.success === '1') {
        setMsg(res.data.msg || 'Withdrawal request submitted successfully!');
        setAmount('');
        loadData();
      } else {
        setError(res.data.msg || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      console.error(err);
      setError('Error submitting withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <span style={{ fontWeight: '800', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Withdraw Points</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '0.95rem' }}>
          <Wallet size={18} />
          <span>₹ {walletInfo?.wallet || '0'}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="card-glass-v2" style={{ marginBottom: '20px' }}>
        {/* Saved UPI IDs Card */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-gold, #d6be66)' }} /> Saved Payment Methods
            </span>
            <button
              type="button"
              onClick={() => setShowUpiModal(true)}
              className="btn-gold"
              style={{
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Edit3 size={14} /> Update UPI IDs
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <div onClick={() => setShowUpiModal(true)} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              PhonePe: <strong style={{ color: 'var(--color-gold, #d6be66)' }}>{profile?.phonepay || 'Add ID'}</strong>
            </div>
            <div onClick={() => setShowUpiModal(true)} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              Paytm: <strong style={{ color: 'var(--color-gold, #d6be66)' }}>{profile?.paytm || 'Add ID'}</strong>
            </div>
            <div onClick={() => setShowUpiModal(true)} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 10px', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              GPay: <strong style={{ color: 'var(--color-gold, #d6be66)' }}>{profile?.googlepay || 'Add ID'}</strong>
            </div>
          </div>
        </div>

        {msg && <div className="badge badge-success" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>✓ {msg}</div>}
        {error && <div className="badge badge-danger" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>⚠️ {error}</div>}

        <form onSubmit={handleWithdraw}>
          {/* Payment Method Select */}
          <div className="form-group">
            <label className="form-label">Select Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-input"
              style={{ background: 'rgba(0,0,0,0.5)', height: '46px', borderRadius: '10px' }}
              required
            >
              <option value="">-- Choose Payment Method --</option>
              <option value="Paytm">Paytm {profile?.paytm ? `(${profile.paytm})` : ''}</option>
              <option value="PhonePe">PhonePe {profile?.phonepay ? `(${profile.phonepay})` : ''}</option>
              <option value="Gpay">Google Pay {profile?.googlepay ? `(${profile.googlepay})` : ''}</option>
              <option value="Bank">Bank Transfer {profile?.account_number ? `(A/C: ${profile.account_number})` : ''}</option>
            </select>
          </div>

          {/* Quick Amount Chips */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Withdrawal Amount (₹)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {['1000', '2000', '5000', '10000'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: amount === val ? '2px solid var(--color-gold, #d6be66)' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: amount === val ? 'rgba(214, 190, 102, 0.2)' : 'rgba(0,0,0,0.3)',
                    color: amount === val ? 'var(--color-gold, #d6be66)' : '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="form-input"
              placeholder="Enter custom withdrawal amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
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
            {submitting ? 'SUBMITTING...' : `PROCEED TO WITHDRAW ₹${amount || '0'}`}
          </button>
        </form>

        <div style={{ marginTop: '18px', textAlign: 'center' }}>
          <Link to="/withdraw-history" style={{ color: 'var(--color-gold, #d6be66)', fontSize: '0.88rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>View Withdraw History</span> <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Note Card */}
      <div className="card-glass-v2" style={{ padding: '14px 18px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.82rem' }}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-gold, #d6be66)', flexShrink: 0 }} />
          <span>Withdrawal requests are processed within official market timings. Ensure payment details are accurate.</span>
        </p>
      </div>

      {/* Modal for updating UPI details */}
      {showUpiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="card-glass-v2" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <h5 style={{ margin: 0, color: '#ffffff', fontWeight: '800', fontSize: '1.1rem' }}>Update UPI Payment IDs</h5>
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.6)' }}
              >
                <X size={18} />
              </button>
            </div>

            {upiMsg && <div className="badge badge-success" style={{ display: 'block', padding: '10px', marginBottom: '14px', textAlign: 'center' }}>✓ {upiMsg}</div>}
            {upiErr && <div className="badge badge-danger" style={{ display: 'block', padding: '10px', marginBottom: '14px', textAlign: 'center' }}>⚠️ {upiErr}</div>}

            <form onSubmit={handleUpdateUpi}>
              <div className="form-group">
                <label className="form-label">PhonePe UPI ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210@ybl"
                  value={phonepe}
                  onChange={(e) => setPhonepe(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Paytm UPI ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210@paytm"
                  value={paytm}
                  onChange={(e) => setPaytm(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Google Pay UPI ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210@okaxis"
                  value={gpay}
                  onChange={(e) => setGpay(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUpiModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upiUpdating}
                  className="btn-gold"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                >
                  {upiUpdating ? 'Updating...' : 'SAVE DETAILS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
