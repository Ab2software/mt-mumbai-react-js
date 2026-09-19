import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Coins, TrendingUp, Sparkles, ShieldAlert, CheckCircle2, Wallet, Layers } from 'lucide-react';
import api from '../utils/api';
import MaterialDialog from '../components/common/MaterialDialog';

const PlayGame = () => {
  const [searchParams] = useSearchParams();
  const rawGameName = searchParams.get('game') || searchParams.get('name') || '';
  const gameName = rawGameName.trim();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState('0');
  const [minBid, setMinBid] = useState(10);
  const [maxBid, setMaxBid] = useState(50000);
  const [rates, setRates] = useState([]);
  const [selectedType, setSelectedType] = useState('Single Digit');
  const [session, setSession] = useState('Open');
  const [points, setPoints] = useState('');
  
  // Game inputs
  const [singleDigit, setSingleDigit] = useState('');
  const [jodiDigit, setJodiDigit] = useState('');
  const [openPana, setOpenPana] = useState('');
  const [closePana, setClosePana] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canBid, setCanBid] = useState(true);
  const [gameInfo, setGameInfo] = useState(null);

  // Material UI Dialog State
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    showCancel: false,
    onConfirm: null
  });

  const showMaterialDialog = (type, title, message, options = {}) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText: options.confirmText || '',
      cancelText: options.cancelText || '',
      showCancel: options.showCancel || false,
      onConfirm: options.onConfirm || null
    });
  };

  const closeMaterialDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };
  const [marketStatus, setMarketStatus] = useState({
    isOpen: true,
    isOpenSession: true,
    isClosed: false
  });

  const cleanTimeToToday = (timeStr) => {
    if (!timeStr) return null;
    const clean = String(timeStr).trim().toLowerCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[4];
    if (modifier === 'pm' && hours < 12) hours += 12;
    else if (modifier === 'am' && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const evaluateMarket = (g) => {
    const oTime = g?.open_time || searchParams.get('openTime');
    const cTime = g?.close_time || searchParams.get('closeTime');

    const now = new Date();
    const fixedStartTime = cleanTimeToToday('05:00 am');
    const openTimeObj = cleanTimeToToday(oTime);
    const closeTimeObj = cleanTimeToToday(cTime);

    let isRunning = true;
    if (g && g.is_running !== undefined) {
      isRunning = !!g.is_running;
    } else {
      const isGameEnabled = g?.game_status === undefined || String(g.game_status) !== '0';
      const isAfterStart = fixedStartTime ? now >= fixedStartTime : true;
      const isBeforeClose = closeTimeObj ? now <= closeTimeObj : true;
      isRunning = isGameEnabled && isAfterStart && isBeforeClose;
    }

    const isOpenActive = openTimeObj ? now < openTimeObj : true;

    setMarketStatus({
      isOpen: isRunning,
      isOpenSession: isOpenActive,
      isClosed: !isRunning
    });

    if (!isOpenActive) {
      setSession('Close');
    }
  };

  const loadData = async () => {
    try {
      const [walletRes, ratesRes, gamesRes] = await Promise.all([
        api.get('/wallet/info'),
        api.get('/games/rates'),
        api.get('/games')
      ]);

      if (walletRes.data.success === '1' && walletRes.data.data) {
        setWallet(walletRes.data.data.wallet || '0');
        const minL = parseInt(walletRes.data.data.min_limit, 10);
        const maxL = parseInt(walletRes.data.data.max_limit, 10);
        setMinBid(!isNaN(minL) && minL > 0 ? minL : 10);
        setMaxBid(!isNaN(maxL) && maxL > 0 ? maxL : 50000);
        if (walletRes.data.data.can_bid !== undefined) {
          setCanBid(walletRes.data.data.can_bid);
        }
      }

      if (ratesRes.data.success === '1') {
        setRates(ratesRes.data.data || []);
      }

      const allGames = gamesRes.data.result || [];
      const currentG = allGames.find(g => 
        (g.games_name && g.games_name.trim().toLowerCase() === gameName.toLowerCase()) ||
        (g.game && g.game.trim().toLowerCase() === gameName.toLowerCase())
      );

      if (currentG) {
        setGameInfo(currentG);
        evaluateMarket(currentG);
      } else {
        evaluateMarket(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!gameName) {
      navigate('/');
      return;
    }
    loadData();
  }, [gameName]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameInfo) {
        evaluateMarket(gameInfo);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [gameInfo]);

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (marketStatus.isClosed) {
      const msg = `Bidding is closed for ${gameName} today.`;
      setError(msg);
      showMaterialDialog('error', 'Market Closed', msg);
      return;
    }

    const effectiveSession = (!marketStatus.isOpenSession || selectedType === 'Jodi Digit' || selectedType === 'Full Sangam')
      ? 'Close'
      : session;

    if (effectiveSession === 'Open' && !marketStatus.isOpenSession) {
      const msg = 'Open market session is closed. You can only place bids on the Close session.';
      setError(msg);
      showMaterialDialog('warning', 'Session Closed', msg);
      return;
    }

    const bidPoints = parseInt(points, 10);
    if (isNaN(bidPoints) || bidPoints < minBid || bidPoints > maxBid) {
      const msg = `Bid points must be between ₹${minBid} and ₹${maxBid}.`;
      setError(msg);
      showMaterialDialog('warning', 'Invalid Bid Amount', msg);
      return;
    }

    const currentWalletBal = parseFloat(wallet || '0');
    if (bidPoints > currentWalletBal) {
      const msg = `Your current wallet balance is ₹${currentWalletBal.toLocaleString('en-IN')}, which is insufficient for this ₹${bidPoints.toLocaleString('en-IN')} bid. Please add points to your wallet to continue.`;
      setError('Insufficient funds in wallet!');
      showMaterialDialog('insufficient_funds', 'Insufficient Wallet Balance', msg, {
        confirmText: 'ADD FUNDS',
        showCancel: true
      });
      return;
    }

    const bidData = {
      game_name: gameInfo?.games_name || gameName,
      game_type: selectedType,
      session: effectiveSession,
      points_action: bidPoints
    };

    if (selectedType === 'Single Digit') {
      if (!/^\d$/.test(singleDigit)) {
        const msg = 'Please enter a valid single digit (0-9).';
        setError(msg);
        showMaterialDialog('warning', 'Invalid Input', msg);
        return;
      }
      if (effectiveSession === 'Open') {
        bidData.open_digit = singleDigit;
        bidData.close_digit = 'NA';
      } else {
        bidData.close_digit = singleDigit;
        bidData.open_digit = 'NA';
      }
    } else if (selectedType === 'Jodi Digit') {
      if (!/^\d{2}$/.test(jodiDigit)) {
        const msg = 'Please enter a valid 2-digit number (00-99).';
        setError(msg);
        showMaterialDialog('warning', 'Invalid Input', msg);
        return;
      }
      bidData.open_digit = jodiDigit.charAt(0);
      bidData.close_digit = jodiDigit.charAt(1);
    } else if (selectedType === 'Single Pana' || selectedType === 'Double Pana' || selectedType === 'Triple Pana') {
      const panaVal = effectiveSession === 'Open' ? openPana : closePana;
      if (!/^\d{3}$/.test(panaVal)) {
        const msg = 'Please enter a valid 3-digit Pana.';
        setError(msg);
        showMaterialDialog('warning', 'Invalid Input', msg);
        return;
      }
      if (effectiveSession === 'Open') {
        bidData.open_pana = panaVal;
        bidData.close_pana = 'NA';
      } else {
        bidData.close_pana = panaVal;
        bidData.open_pana = 'NA';
      }
    } else if (selectedType === 'Half Sangam') {
      if (!/^\d$/.test(singleDigit) || !/^\d{3}$/.test(closePana)) {
        const msg = 'Please enter a valid single digit and 3-digit Pana.';
        setError(msg);
        showMaterialDialog('warning', 'Invalid Input', msg);
        return;
      }
      bidData.open_digit = singleDigit;
      bidData.close_pana = closePana;
      bidData.open_pana = 'NA';
      bidData.close_digit = 'NA';
    } else if (selectedType === 'Full Sangam') {
      if (!/^\d{3}$/.test(openPana) || !/^\d{3}$/.test(closePana)) {
        const msg = 'Please enter valid 3-digit open & close Panas.';
        setError(msg);
        showMaterialDialog('warning', 'Invalid Input', msg);
        return;
      }
      bidData.open_pana = openPana;
      bidData.close_pana = closePana;
      bidData.open_digit = 'NA';
      bidData.close_digit = 'NA';
    }

    setLoading(true);
    try {
      const response = await api.post('/games/bid', bidData);
      if (response.data.success === '1') {
        const successMsg = `Your bid of ₹${bidPoints} on ${gameName} (${selectedType}) was placed successfully!`;
        setSuccess('Bid placed successfully!');
        setWallet(response.data.balance);
        setPoints('');
        setSingleDigit('');
        setJodiDigit('');
        setOpenPana('');
        setClosePana('');
        showMaterialDialog('success', 'Bid Placed Successfully! 🎉', successMsg);
      } else {
        const serverMsg = response.data.msg || 'Failed to place bid';
        setError(serverMsg);
        if (serverMsg.toLowerCase().includes('insufficient') || serverMsg.toLowerCase().includes('balance') || serverMsg.toLowerCase().includes('fund')) {
          showMaterialDialog('insufficient_funds', 'Insufficient Wallet Balance', serverMsg, {
            confirmText: 'ADD FUNDS',
            showCancel: true
          });
        } else {
          showMaterialDialog('error', 'Bid Error', serverMsg);
        }
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.msg || err.response?.data?.error || 'Error placing bid. Please try again.';
      setError(serverMsg);
      if (serverMsg.toLowerCase().includes('insufficient') || serverMsg.toLowerCase().includes('balance') || serverMsg.toLowerCase().includes('fund')) {
        showMaterialDialog('insufficient_funds', 'Insufficient Wallet Balance', serverMsg, {
          confirmText: 'ADD FUNDS',
          showCancel: true
        });
      } else {
        showMaterialDialog('error', 'Bid Error', serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRateValue = (type) => {
    const rate = rates.find(r => r.type === type);
    return rate ? `${rate.min_value}:${rate.max_value}` : 'N/A';
  };

  const allGameTypes = [
    'Single Digit', 'Jodi Digit', 'Single Pana', 'Double Pana', 'Triple Pana', 'Half Sangam', 'Full Sangam'
  ];
  const closeOnlyGameTypes = [
    'Single Digit', 'Single Pana', 'Double Pana', 'Triple Pana'
  ];
  const gameTypes = marketStatus.isOpenSession ? allGameTypes : closeOnlyGameTypes;

  useEffect(() => {
    if (!marketStatus.isOpenSession && (selectedType === 'Jodi Digit' || selectedType === 'Half Sangam' || selectedType === 'Full Sangam')) {
      setSelectedType('Single Digit');
    }
  }, [marketStatus.isOpenSession, selectedType]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px 16px 32px' }}>
      <div style={{ marginBottom: '18px' }}>
        <Link 
          to="/" 
          style={{ 
            color: 'var(--color-gold, #d6be66)', 
            textDecoration: 'none', 
            fontWeight: '700', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '0.9rem' 
          }}
        >
          <ArrowLeft size={18} /> BACK TO MARKETS
        </Link>
      </div>

      <div className="grid-cols-2" style={{ gap: '20px' }}>
        {/* Play game form */}
        <div className="card-glass-v2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={22} style={{ color: 'var(--color-gold, #d6be66)' }} />
            <h2 style={{ color: 'var(--color-gold, #d6be66)', fontSize: '1.5rem', textTransform: 'uppercase', margin: 0, fontWeight: '800' }}>
              PLAY {gameName}
            </h2>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', fontSize: '0.88rem' }}>
            Select game type, enter digits & points to place your bid
          </p>

          {error && <div className="badge badge-danger" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>{error}</div>}
          {success && <div className="badge badge-success" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>{success}</div>}

          {marketStatus.isClosed && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              color: '#f87171',
              fontSize: '0.88rem',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldAlert size={20} />
              <span>Market Closed: Bidding has ended for {gameName} today.</span>
            </div>
          )}

          {!marketStatus.isClosed && !marketStatus.isOpenSession && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={18} />
              <span>Open market closed. Only Close session bidding is active.</span>
            </div>
          )}

          <form onSubmit={handleSubmitBid}>
            {/* Game Type Selector */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Game Type
              </label>
              <select 
                className="form-input" 
                value={selectedType} 
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '10px', height: '46px' }}
              >
                {gameTypes.map(t => (
                  <option key={t} value={t}>{t} (Rate {getRateValue(t)})</option>
                ))}
              </select>
            </div>

            {/* Session Selector (Only for non-Jodi/Full Sangam) */}
            {selectedType !== 'Jodi Digit' && selectedType !== 'Full Sangam' && (
              <div className="form-group">
                <label className="form-label">Session</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => marketStatus.isOpenSession && setSession('Open')}
                    className={session === 'Open' ? 'btn-gold' : 'btn-outline'} 
                    style={{ 
                      flex: 1, 
                      padding: '10px',
                      borderRadius: '10px',
                      opacity: !marketStatus.isOpenSession ? 0.4 : 1,
                      cursor: !marketStatus.isOpenSession ? 'not-allowed' : 'pointer'
                    }}
                    disabled={!marketStatus.isOpenSession}
                  >
                    OPEN {!marketStatus.isOpenSession && '(CLOSED)'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSession('Close')}
                    className={session === 'Close' ? 'btn-gold' : 'btn-outline'} 
                    style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Inputs */}
            {selectedType === 'Single Digit' && (
              <div className="form-group">
                <label className="form-label">Single Digit (0-9)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  maxLength="1"
                  placeholder="Enter single number" 
                  value={singleDigit} 
                  onChange={(e) => setSingleDigit(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            )}

            {selectedType === 'Jodi Digit' && (
              <div className="form-group">
                <label className="form-label">Jodi Digit (00-99)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  maxLength="2"
                  placeholder="Enter 2 digit number" 
                  value={jodiDigit} 
                  onChange={(e) => setJodiDigit(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            )}

            {(selectedType === 'Single Pana' || selectedType === 'Double Pana' || selectedType === 'Triple Pana') && (
              <div className="form-group">
                <label className="form-label">{session} Pana (3 Digits)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  maxLength="3"
                  placeholder="Enter 3 digit pana" 
                  value={session === 'Open' ? openPana : closePana}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (session === 'Open') setOpenPana(val);
                    else setClosePana(val);
                  }}
                  required
                />
              </div>
            )}

            {selectedType === 'Half Sangam' && (
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Open Digit</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    maxLength="1"
                    placeholder="Digit" 
                    value={singleDigit} 
                    onChange={(e) => setSingleDigit(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Close Pana</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    maxLength="3"
                    placeholder="Pana" 
                    value={closePana} 
                    onChange={(e) => setClosePana(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
            )}

            {selectedType === 'Full Sangam' && (
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Open Pana</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    maxLength="3"
                    placeholder="Open Pana" 
                    value={openPana} 
                    onChange={(e) => setOpenPana(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Close Pana</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    maxLength="3"
                    placeholder="Close Pana" 
                    value={closePana} 
                    onChange={(e) => setClosePana(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
            )}

            {/* Bid points */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} /> Bid Points (₹ {minBid} - ₹ {maxBid})
              </label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter points to bid"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-gold" 
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '1rem',
                opacity: marketStatus.isClosed ? 0.6 : 1,
                cursor: marketStatus.isClosed ? 'not-allowed' : 'pointer'
              }} 
              disabled={loading || marketStatus.isClosed}
            >
              {marketStatus.isClosed 
                ? 'MARKET CLOSED' 
                : loading 
                ? 'SUBMITTING BID...' 
                : 'SUBMIT BID NOW'}
            </button>
          </form>
        </div>

        {/* User wallet panel & rates list */}
        <div>
          <div className="card-glass-v2" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(214, 190, 102, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Wallet size={20} style={{ color: 'var(--color-gold, #d6be66)' }} />
              <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem', margin: 0, fontWeight: '600' }}>Available Wallet Balance</h3>
            </div>
            <h2 style={{ color: 'var(--color-gold, #d6be66)', fontSize: '2.2rem', margin: 0, fontWeight: '800' }}>₹{wallet}</h2>
          </div>

          <div className="card-glass-v2">
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-gold, #d6be66)' }} /> Payout Game Rates
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rates.map(r => (
                <div key={r.id} className="flex-between" style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem' }}>{r.type}</span>
                  <strong style={{ color: 'var(--color-gold, #d6be66)', fontSize: '0.95rem' }}>{r.min_value} : {r.max_value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Material UI Dialog Popup */}
      <MaterialDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
        onConfirm={dialog.onConfirm}
        onClose={closeMaterialDialog}
      />
    </div>
  );
};

export default PlayGame;
