import React, { useState, useEffect } from 'react';
import { Settings, Phone, Image, HelpCircle } from 'lucide-react';
import api from '../../../utils/api';

const SettingsTab = ({ activeTab }) => {
  const [settings, setSettings] = useState({});
  const [contact, setContact] = useState({});
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [newSliderImg, setNewSliderImg] = useState('');
  const [sliderOrder, setSliderOrder] = useState('1');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, slRes] = await Promise.all([
        api.get('/admin/settings').catch(() => null),
        api.get('/admin/contact-settings').catch(() => null),
        api.get('/admin/slider-images').catch(() => null)
      ]);

      if (sRes?.data?.success === '1') setSettings(sRes.data.data || {});
      if (cRes?.data?.success === '1') setContact(cRes.data.data || {});
      if (slRes?.data?.success === '1') setSliders(slRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await api.post('/admin/settings', settings);
      if (res.data.success === '1') {
        setMsg('General settings saved successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await api.post('/admin/contact-settings', contact);
      if (res.data.success === '1') {
        setMsg('Contact details updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlider = async (e) => {
    e.preventDefault();
    if (!newSliderImg) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/add-slider-image', {
        slider_image: newSliderImg,
        display_order: sliderOrder
      });
      if (res.data.success === '1') {
        setNewSliderImg('');
        loadSettings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlider = async (id, status) => {
    const newStatus = String(status) === '1' ? '0' : '1';
    try {
      const res = await api.post('/admin/toggle-slider-status', { id, status: newStatus });
      if (res.data.success === '1') {
        loadSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlider = async (id) => {
    if (!window.confirm('Delete this slider image?')) return;
    try {
      const res = await api.post('/admin/delete-slider-image', { id });
      if (res.data.success === '1') {
        loadSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (activeTab === 'contact_settings') {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', maxWidth: '540px' }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={20} /> Contact Details & Social Links
        </h5>
        {msg && <div style={{ color: '#10b981', padding: '10px', backgroundColor: '#d1fae5', borderRadius: '6px', marginBottom: '16px' }}>{msg}</div>}

        <form onSubmit={handleSaveContact}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>WhatsApp Number</label>
            <input
              type="text"
              value={contact.whatsapp || ''}
              onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Calling Phone Number</label>
            <input
              type="text"
              value={contact.phone || ''}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Telegram Channel / Link</label>
            <input
              type="text"
              value={contact.telegram || ''}
              onChange={(e) => setContact({ ...contact, telegram: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Support Email Address</label>
            <input
              type="email"
              value={contact.email || ''}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: '6px', border: 'none', backgroundColor: '#556ee6', color: '#fff', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Saving...' : 'Save Contact Details'}
          </button>
        </form>
      </div>
    );
  }

  if (activeTab === 'sliders') {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image size={20} /> Home Page Banner Sliders
        </h5>

        {/* Add New Slider */}
        <form onSubmit={handleAddSlider} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Image URL or Path (e.g. /uploads/banner.jpg)"
            value={newSliderImg}
            onChange={(e) => setNewSliderImg(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem' }}
          />
          <input
            type="number"
            placeholder="Order"
            value={sliderOrder}
            onChange={(e) => setSliderOrder(e.target.value)}
            style={{ width: '90px', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
          >
            Add Slider Image
          </button>
        </form>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {sliders.map(s => (
            <div key={s.id} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '12px' }}>
              <img
                src={s.slider_image.startsWith('/') ? s.slider_image : `/uploads/${s.slider_image}`}
                alt="Slider"
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
                onError={(e) => { e.target.src = '/img/banner.jpg'; }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleToggleSlider(s.id, s.status)}
                  style={{ padding: '4px 10px', borderRadius: '12px', border: 'none', backgroundColor: String(s.status) === '1' ? '#d1fae5' : '#fee2e2', color: String(s.status) === '1' ? '#065f46' : '#991b1b', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {String(s.status) === '1' ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSlider(s.id)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7', maxWidth: '600px' }}>
      <h5 style={{ margin: '0 0 16px 0', color: '#556ee6', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={20} /> System Settings Configuration
      </h5>
      {msg && <div style={{ color: '#10b981', padding: '10px', backgroundColor: '#d1fae5', borderRadius: '6px', marginBottom: '16px' }}>{msg}</div>}

      <form onSubmit={handleSaveSettings}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>4-Digit M-PIN Status</label>
          <select
            value={settings.mpin_status ?? '1'}
            onChange={(e) => setSettings({ ...settings, mpin_status: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem' }}
          >
            <option value="1">Active (Require M-PIN & Show Change Option)</option>
            <option value="0">Inactive (Disable M-PIN completely)</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Slider Images Status</label>
          <select
            value={settings.slider_status ?? '1'}
            onChange={(e) => setSettings({ ...settings, slider_status: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem' }}
          >
            <option value="1">Active (Show Sliders on Home Screen)</option>
            <option value="0">Inactive (Hide Sliders)</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Home Marquee Notice Message</label>
          <textarea
            rows={3}
            value={settings.alert_message || ''}
            onChange={(e) => setSettings({ ...settings, alert_message: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Min Deposit (₹)</label>
            <input
              type="number"
              value={settings.min_deposit || ''}
              onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', color: '#495057', marginBottom: '6px' }}>Min Withdraw (₹)</label>
            <input
              type="number"
              value={settings.min_withdraw || ''}
              onChange={(e) => setSettings({ ...settings, min_withdraw: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '11px', borderRadius: '6px', border: 'none', backgroundColor: '#556ee6', color: '#fff', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default SettingsTab;
