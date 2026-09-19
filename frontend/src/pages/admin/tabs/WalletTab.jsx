import React, { useState, useEffect } from 'react';
import { Wallet, RotateCcw } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const WalletTab = ({ activeTab }) => {
  // Add Fund Form State
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('add');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Bid Revert State
  const [revertList, setRevertList] = useState([]);
  const [revertLoading, setRevertLoading] = useState(false);

  const loadRevertList = async () => {
    setRevertLoading(true);
    try {
      const res = await api.get('/admin/bid-revert-list');
      if (res.data.success === '1') {
        setRevertList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevertLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bid_revert') {
      loadRevertList();
    }
  }, [activeTab]);

  const handleAddFund = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await api.post('/admin/add-fund-user-wallet', {
        phone,
        amount,
        type,
        remark
      });
      if (res.data.success === '1') {
        setMsg('Wallet points updated successfully!');
        setPhone('');
        setAmount('');
        setRemark('');
      } else {
        setMsg(res.data.msg || 'Failed to update wallet');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRevert = async (gameName, date) => {
    if (!window.confirm(`Are you sure you want to REVERT all bids for ${gameName} on ${date}?`)) return;
    try {
      const res = await api.post('/admin/execute-bid-revert', { game_name: gameName, date });
      if (res.data.success === '1') {
        loadRevertList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (activeTab === 'bid_revert') {
    const revertColumns = [
      { title: '#', key: 'id', render: (_, idx) => idx },
      { title: 'Game Name', key: 'game_name', render: (row) => <strong>{row.game_name}</strong> },
      { title: 'Date', key: 'date' },
      { title: 'Total Bids', key: 'total_bids' },
      { title: 'Total Amount', key: 'total_amount', render: (row) => <strong style={{ color: '#556ee6' }}>₹ {row.total_amount}</strong> },
      {
        title: 'Actions',
        key: 'actions',
        render: (row) => (
          <button
            type="button"
            onClick={() => handleExecuteRevert(row.game_name, row.date)}
            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={14} /> Revert All Bids
          </button>
        )
      }
    ];

    return (
      <DataTable
        headerTitle="Bid Revert Console"
        columns={revertColumns}
        data={revertList}
        loading={revertLoading}
        searchPlaceholder="Search by game name or date..."
      />
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', maxWidth: '540px' }}>
      <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Wallet size={20} /> Direct Add / Deduct User Wallet Points
      </h5>
      {msg && <div style={{ color: '#10b981', padding: '10px', backgroundColor: '#d1fae5', borderRadius: '6px', marginBottom: '16px' }}>{msg}</div>}

      <form onSubmit={handleAddFund}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>User Phone / Mobile</label>
          <input
            type="text"
            required
            placeholder="Enter user mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Action Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
          >
            <option value="add">Add Points (+)</option>
            <option value="subtract">Deduct Points (-)</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Points / Amount</label>
          <input
            type="number"
            required
            placeholder="Enter points amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Remark / Note</label>
          <input
            type="text"
            placeholder="Reason for adjustment"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '11px', borderRadius: '6px', border: 'none', backgroundColor: '#556ee6', color: '#fff', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Processing...' : 'Submit Wallet Adjustment'}
        </button>
      </form>
    </div>
  );
};

export default WalletTab;
