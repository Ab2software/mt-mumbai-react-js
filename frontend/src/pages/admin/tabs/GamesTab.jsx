import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const GamesTab = ({ activeTab }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Add Game Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGame, setNewGame] = useState({ game_name: '', open_time: '', close_time: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Game Rates State
  const [gameRates, setGameRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesMsg, setRatesMsg] = useState('');

  const loadGames = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/admin-games-list');
      if (res.data.success === '1') {
        setGames(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRates = async () => {
    setRatesLoading(true);
    try {
      const res = await api.get('/admin/game-rates');
      if (res.data.success === '1') {
        setGameRates(res.data.data || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rates') {
      loadRates();
    } else {
      loadGames();
    }
  }, [activeTab]);

  const handleAddGame = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/admin/add-game', newGame);
      if (res.data.success === '1') {
        setShowAddModal(false);
        setNewGame({ game_name: '', open_time: '', close_time: '' });
        loadGames();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      const res = await api.post('/admin/delete-game', { id });
      if (res.data.success === '1') {
        loadGames();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    setRatesLoading(true);
    setRatesMsg('');
    try {
      const res = await api.post('/admin/update-game-rates', gameRates);
      if (res.data.success === '1') {
        setRatesMsg('Game rates updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRatesLoading(false);
    }
  };

  if (activeTab === 'rates') {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700' }}>Game Rates Configuration (Payout Multiple)</h5>
        {ratesMsg && <div style={{ color: '#10b981', padding: '10px', backgroundColor: '#d1fae5', borderRadius: '6px', marginBottom: '16px' }}>{ratesMsg}</div>}

        <form onSubmit={handleSaveRates}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {['single_digit', 'jodi_digit', 'single_pana', 'double_pana', 'triple_pana', 'half_sangam', 'full_sangam'].map(key => (
              <div key={key} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#4a5568', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {key.replace('_', ' ')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: '#718096' }}>1 :</span>
                  <input
                    type="number"
                    step="any"
                    value={gameRates[key] || ''}
                    onChange={(e) => setGameRates({ ...gameRates, [key]: e.target.value })}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={ratesLoading}
            style={{ padding: '10px 24px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: ratesLoading ? 'not-allowed' : 'pointer' }}
          >
            {ratesLoading ? 'Saving Rates...' : 'Save Game Rates'}
          </button>
        </form>
      </div>
    );
  }

  const columns = [
    { title: '#', key: 'id', render: (_, idx) => idx },
    { title: 'Game Name', key: 'game_name', render: (row) => <strong>{row.game_name}</strong> },
    { title: 'Open Time', key: 'open_time', render: (row) => <span style={{ color: '#556ee6', fontWeight: '600' }}>{row.open_time}</span> },
    { title: 'Close Time', key: 'close_time', render: (row) => <span style={{ color: '#ef4444', fontWeight: '600' }}>{row.close_time}</span> },
    {
      title: 'Status',
      key: 'status',
      render: (row) => (
        <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: String(row.status) === '1' ? '#d1fae5' : '#fee2e2', color: String(row.status) === '1' ? '#065f46' : '#991b1b', fontSize: '0.78rem', fontWeight: '700' }}>
          {String(row.status) === '1' ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDeleteGame(row.id)}
          style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Trash2 size={14} /> Delete
        </button>
      )
    }
  ];

  return (
    <div>
      <DataTable
        headerTitle="All Game Markets Directory"
        columns={columns}
        data={games}
        loading={loading}
        searchPlaceholder="Search game name..."
        actions={(
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '8px 16px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add New Game Market
          </button>
        )}
      />

      {/* Add Game Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700' }}>Create New Game Market</h5>
            <form onSubmit={handleAddGame}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Game Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KALYAN NIGHT"
                  value={newGame.game_name}
                  onChange={(e) => setNewGame({ ...newGame, game_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Open Time (e.g. 09:30 pm)</label>
                <input
                  type="text"
                  required
                  placeholder="09:30 pm"
                  value={newGame.open_time}
                  onChange={(e) => setNewGame({ ...newGame, open_time: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Close Time (e.g. 11:40 pm)</label>
                <input
                  type="text"
                  required
                  placeholder="11:40 pm"
                  value={newGame.close_time}
                  onChange={(e) => setNewGame({ ...newGame, close_time: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={addLoading} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#556ee6', color: '#fff', fontWeight: '600', cursor: addLoading ? 'not-allowed' : 'pointer' }}>
                  {addLoading ? 'Saving...' : 'Add Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesTab;
