import React, { useState } from 'react';
import { LogOut, Key, UserCheck, Shield } from 'lucide-react';
import api from '../../../utils/api';

const AdminHeader = ({
  adminName,
  adminCoins,
  onLogout,
  showPasswordModal,
  setShowPasswordModal
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [retypePass, setRetypePass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');

    if (newPass !== retypePass) {
      setPassError('New Password and Retype Password do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.post('/admin/change-password', {
        old_pass: oldPass,
        new_pass: newPass
      });

      if (res.data.success === '1') {
        setPassMsg('Password changed successfully!');
        setOldPass('');
        setNewPass('');
        setRetypePass('');
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPassError(res.data.msg || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setPassError('Server error while changing password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <>
      <header style={{
        height: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #edf2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/img/logo.png"
            alt="Logo"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.target.src = '/assets/images/logo1.png'; }}
          />
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#556ee6', letterSpacing: '0.5px' }}>
            ADMIN CONSOLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Admin Wallet Coins Badge */}
          <div style={{
            backgroundColor: 'rgba(85, 110, 230, 0.1)',
            border: '1px solid rgba(85, 110, 230, 0.25)',
            padding: '7px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: '#556ee6'
          }}>
            <Shield size={16} />
            <span>Coins: {adminCoins}</span>
          </div>

          {/* Profile Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#556ee6',
                color: '#ffffff',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem'
              }}>
                {adminName ? adminName[0].toUpperCase() : 'A'}
              </div>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#495057' }}>{adminName}</span>
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '200px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                border: '1px solid #edf2f7',
                padding: '8px 0',
                zIndex: 110
              }}>
                <button
                  type="button"
                  onClick={() => { setShowProfileDropdown(false); setShowPasswordModal(true); }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    color: '#495057',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Key size={16} style={{ color: '#556ee6' }} />
                  Change Password
                </button>
                <div style={{ height: '1px', backgroundColor: '#edf2f7', margin: '4px 0' }}></div>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700' }}>Change Admin Password</h5>

            {passMsg && (
              <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {passMsg}
              </div>
            )}
            {passError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Old Password</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Retype New Password</label>
                <input
                  type="password"
                  required
                  value={retypePass}
                  onChange={(e) => setRetypePass(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#495057', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#556ee6', color: '#fff', fontWeight: '600', cursor: passLoading ? 'not-allowed' : 'pointer' }}
                >
                  {passLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
