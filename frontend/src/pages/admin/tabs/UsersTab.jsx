import React, { useState, useEffect } from 'react';
import { Eye, Edit, CheckCircle, XCircle, ShieldAlert, ArrowLeft, RefreshCw, KeyRound, Wallet } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const UsersTab = ({ setSelectedUserId, selectedUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all' or 'unapproved'

  // User details view state
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [walletAdjAmount, setWalletAdjAmount] = useState('');
  const [walletAdjType, setWalletAdjType] = useState('add');
  const [walletAdjRemark, setWalletAdjRemark] = useState('');
  const [walletMsg, setWalletMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page,
          limit: pageSize,
          search: searchTerm
        }
      });

      if (res.data.success === '1') {
        let list = res.data.data || [];
        if (userFilter === 'unapproved') {
          list = list.filter(u => String(u.status) === '0');
        }
        setUsers(list);
        if (res.data.pagination) {
          setTotalItems(res.data.pagination.total);
        } else {
          setTotalItems(res.data.total || list.length);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, searchTerm, userFilter]);

  const loadUserDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/user-details/${id}`);
      if (res.data.success === '1') {
        setUserDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  const handleToggleField = async (userId, field, currentVal) => {
    const newVal = String(currentVal) === '1' ? '0' : '1';
    try {
      const res = await api.post('/admin/toggle-user-field', {
        userId,
        field,
        val: newVal
      });
      if (res.data.success === '1') {
        loadUsers();
        if (selectedUserId === userId) {
          loadUserDetails(userId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPass || !selectedUserId) return;
    setPassMsg('');
    try {
      const res = await api.post('/admin/update-user-password', {
        userId: selectedUserId,
        password: newPass
      });
      if (res.data.success === '1') {
        setPassMsg('Password updated successfully!');
        setNewPass('');
        loadUserDetails(selectedUserId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!walletAdjAmount || !selectedUserId) return;
    setWalletMsg('');
    try {
      const res = await api.post('/admin/adjust-user-wallet', {
        userId: selectedUserId,
        amount: walletAdjAmount,
        type: walletAdjType,
        remark: walletAdjRemark
      });
      if (res.data.success === '1') {
        setWalletMsg('Wallet adjusted successfully!');
        setWalletAdjAmount('');
        setWalletAdjRemark('');
        loadUserDetails(selectedUserId);
        loadUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '#', key: 'id', render: (_, idx) => idx },
    { title: 'User Name', key: 'name', render: (row) => <strong>{row.name || '—'}</strong> },
    { title: 'Mobile No.', key: 'phone' },
    { title: 'Password', key: 'password' },
    { title: 'M-PIN', key: 'm_pin', render: (row) => row.m_pin || '—' },
    { title: 'Wallet Balance', key: 'wallet', render: (row) => <strong style={{ color: '#10b981' }}>₹ {row.wallet || '0'}</strong> },
    {
      title: 'Status',
      key: 'status',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleField(row.id, 'status', row.status)}
          style={badgeBtnStyle(String(row.status) === '1' ? '#10b981' : '#ef4444')}
        >
          {String(row.status) === '1' ? 'Active' : 'Inactive'}
        </button>
      )
    },
    {
      title: 'Betting Status',
      key: 'betting_status',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleField(row.id, 'betting_status', row.betting_status)}
          style={badgeBtnStyle(String(row.betting_status) === '1' ? '#10b981' : '#f59e0b')}
        >
          {String(row.betting_status) === '1' ? 'Enabled' : 'Disabled'}
        </button>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedUserId(row.id);
            localStorage.setItem('admin_selected_user_id', row.id);
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#556ee6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Eye size={14} /> View Details
        </button>
      )
    }
  ];

  // If a user is selected, render Detailed User View
  if (selectedUserId) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedUserId(null);
              localStorage.removeItem('admin_selected_user_id');
            }}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Users List
          </button>
          <h5 style={{ margin: 0, fontWeight: '700', color: '#2d3748' }}>User Detailed Console</h5>
        </div>

        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading User Details...</div>
        ) : userDetails ? (
          <div>
            {/* Account Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={infoBoxStyle}>
                <span style={infoLabelStyle}>Name</span>
                <strong>{userDetails.user?.name || '—'}</strong>
              </div>
              <div style={infoBoxStyle}>
                <span style={infoLabelStyle}>Phone / Mobile</span>
                <strong>{userDetails.user?.phone || '—'}</strong>
              </div>
              <div style={infoBoxStyle}>
                <span style={infoLabelStyle}>Wallet Balance</span>
                <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>₹ {userDetails.user?.wallet || '0'}</strong>
              </div>
              <div style={infoBoxStyle}>
                <span style={infoLabelStyle}>Security M-PIN</span>
                <strong>{userDetails.user?.m_pin || '—'}</strong>
              </div>
            </div>

            {/* Password Update & Wallet Adjustment Forms */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Password Form */}
              <div style={formCardStyle}>
                <h6 style={{ margin: '0 0 14px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} /> Update User Password
                </h6>
                {passMsg && <div style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '10px' }}>{passMsg}</div>}
                <form onSubmit={handleUpdatePassword}>
                  <input
                    type="text"
                    placeholder="Enter New Password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.88rem', marginBottom: '12px', boxSizing: 'border-box' }}
                  />
                  <button type="submit" style={submitBtnStyle}>Update Password</button>
                </form>
              </div>

              {/* Wallet Adjust Form */}
              <div style={formCardStyle}>
                <h6 style={{ margin: '0 0 14px 0', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} /> Adjust Wallet Points
                </h6>
                {walletMsg && <div style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '10px' }}>{walletMsg}</div>}
                <form onSubmit={handleAdjustWallet}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select
                      value={walletAdjType}
                      onChange={(e) => setWalletAdjType(e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    >
                      <option value="add">Add Points (+)</option>
                      <option value="subtract">Deduct Points (-)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={walletAdjAmount}
                      onChange={(e) => setWalletAdjAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.88rem' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Remark / Note"
                    value={walletAdjRemark}
                    onChange={(e) => setWalletAdjRemark(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.88rem', marginBottom: '12px', boxSizing: 'border-box' }}
                  />
                  <button type="submit" style={{ ...submitBtnStyle, backgroundColor: '#10b981' }}>Submit Wallet Adjustment</button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div>User details not found</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setUserFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: userFilter === 'all' ? '#556ee6' : '#e2e8f0',
              color: userFilter === 'all' ? '#ffffff' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            All Users
          </button>
          <button
            type="button"
            onClick={() => setUserFilter('unapproved')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: userFilter === 'unapproved' ? '#f59e0b' : '#e2e8f0',
              color: userFilter === 'unapproved' ? '#ffffff' : '#4a5568',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Unapproved Users
          </button>
        </div>
      </div>

      <DataTable
        headerTitle="Registered Users Directory"
        columns={columns}
        data={users}
        loading={loading}
        serverSide={true}
        totalItems={totalItems}
        currentPage={page}
        defaultPageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onSearchChange={(query) => { setSearchTerm(query); setPage(1); }}
        searchPlaceholder="Search by Name, Mobile, Email..."
      />
    </div>
  );
};

const badgeBtnStyle = (color) => ({
  padding: '4px 10px',
  borderRadius: '20px',
  border: 'none',
  backgroundColor: color,
  color: '#ffffff',
  fontSize: '0.78rem',
  fontWeight: '700',
  cursor: 'pointer'
});

const infoBoxStyle = {
  backgroundColor: '#f8fafc',
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const infoLabelStyle = {
  fontSize: '0.78rem',
  color: '#718096',
  textTransform: 'uppercase'
};

const formCardStyle = {
  backgroundColor: '#f8fafc',
  padding: '18px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0'
};

const submitBtnStyle = {
  width: '100%',
  padding: '9px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#556ee6',
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '0.86rem',
  cursor: 'pointer'
};

export default UsersTab;
