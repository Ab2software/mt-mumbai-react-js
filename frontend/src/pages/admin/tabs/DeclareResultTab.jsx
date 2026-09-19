import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';
import { ALL_PANAS_220 } from '../../../utils/gameNumbersData';

const DeclareResultTab = ({ games = [] }) => {
  const [selectedGame, setSelectedGame] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState('open');
  const [openPana, setOpenPana] = useState('');
  const [openResult, setOpenResult] = useState('');
  const [closePana, setClosePana] = useState('');
  const [closeResult, setCloseResult] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [showOpenDropdown, setShowOpenDropdown] = useState(false);
  const [showCloseDropdown, setShowCloseDropdown] = useState(false);

  const getPanaSingleDigit = (panaStr) => {
    if (!panaStr || panaStr.length !== 3) return '';
    const d1 = parseInt(panaStr[0], 10) || 0;
    const d2 = parseInt(panaStr[1], 10) || 0;
    const d3 = parseInt(panaStr[2], 10) || 0;
    return ((d1 + d2 + d3) % 10).toString();
  };

  const handleOpenPanaChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 3);
    setOpenPana(digits);
    if (digits.length === 3) {
      setOpenResult(getPanaSingleDigit(digits));
    }
  };

  const handleClosePanaChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 3);
    setClosePana(digits);
    if (digits.length === 3) {
      setCloseResult(getPanaSingleDigit(digits));
    }
  };

  const handleDeclare = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (!selectedGame) {
      setError('Please select a Game Name.');
      return;
    }

    if (session === 'open' && (!openPana || !openResult)) {
      setError('Please enter Open Pana and Open Result.');
      return;
    }

    if (session === 'close' && (!closePana || !closeResult)) {
      setError('Please enter Close Pana and Close Result.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/declare-result', {
        game_name: selectedGame,
        date,
        session,
        open_pana: openPana,
        open_result: openResult,
        close_pana: closePana,
        close_result: closeResult
      });

      if (res.data.success === '1') {
        setMsg(res.data.msg || 'Result declared successfully & payouts processed!');
        if (session === 'open') {
          setOpenPana('');
          setOpenResult('');
        } else {
          setClosePana('');
          setCloseResult('');
        }
      } else {
        setError(res.data.msg || 'Failed to declare result.');
      }
    } catch (err) {
      console.error(err);
      setError('Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', maxWidth: '650px' }}>
      <h5 style={{ margin: '0 0 20px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy size={22} style={{ color: '#f59e0b' }} /> Declare Game Result & Distribute Payouts
      </h5>

      {msg && (
        <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {msg}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleDeclare}>
        {/* Game Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Select Game Market</label>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="">-- Select Game Market --</option>
            {games.map(g => (
              <option key={g.id || g.game_name} value={g.game_name}>{g.game_name}</option>
            ))}
          </select>
        </div>

        {/* Date & Session */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Result Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '600', color: '#4a5568', marginBottom: '6px' }}>Market Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="open">Open Session</option>
              <option value="close">Close Session</option>
            </select>
          </div>
        </div>

        {/* Pana & Result Input Fields */}
        {session === 'open' ? (
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h6 style={{ margin: '0 0 12px 0', color: '#556ee6', fontWeight: '700' }}>Open Session Result</h6>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#718096', marginBottom: '4px' }}>Open Pana (3 Digits)</label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. 123"
                  value={openPana}
                  onChange={(e) => handleOpenPanaChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#718096', marginBottom: '4px' }}>Open Digit</label>
                <input
                  type="text"
                  readOnly
                  value={openResult}
                  placeholder="Digit"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', fontWeight: '800', backgroundColor: '#edf2f7', color: '#556ee6', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h6 style={{ margin: '0 0 12px 0', color: '#ef4444', fontWeight: '700' }}>Close Session Result</h6>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#718096', marginBottom: '4px' }}>Close Pana (3 Digits)</label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="e.g. 456"
                  value={closePana}
                  onChange={(e) => handleClosePanaChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#718096', marginBottom: '4px' }}>Close Digit</label>
                <input
                  type="text"
                  readOnly
                  value={closeResult}
                  placeholder="Digit"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', fontWeight: '800', backgroundColor: '#edf2f7', color: '#ef4444', textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#556ee6',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(85, 110, 230, 0.3)'
          }}
        >
          {loading ? 'Processing & Distributing Payouts...' : 'Declare Result Now'}
        </button>
      </form>
    </div>
  );
};

export default DeclareResultTab;
