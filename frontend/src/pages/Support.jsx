import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PhoneCall, MessageSquare, Headphones } from 'lucide-react';
import api from '../utils/api';

const Support = () => {
  const [contact, setContact] = useState({
    mobile: '7309010423',
    whatsapp: '917309010423'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await api.get('/wallet/info');
        if (res.data.success === '1' && res.data.data) {
          const d = res.data.data;
          setContact({
            mobile: d.admin_mobile || '7309010423',
            whatsapp: d.admin_wp || '917309010423'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  const cleanPhone = contact.mobile.replace(/\D/g, '');
  const cleanWp = contact.whatsapp.replace(/\D/g, '');
  const callLink = cleanPhone ? `tel:${cleanPhone}` : '#';
  const wpLink = cleanWp ? `https://wa.me/${cleanWp}?text=${encodeURIComponent('Hello Support')}` : '#';

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '16px 14px' }}>
      {/* Top Header */}
      <div className="card-glass-v2" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        marginBottom: '24px',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Headphones size={20} style={{ color: 'var(--color-gold)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>Customer Support</span>
          </div>
        </div>
      </div>

      {/* Support Card */}
      <div className="card-glass-v2" style={{
        borderRadius: '20px',
        padding: '32px 22px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(214, 190, 102, 0.15)',
          border: '1px solid rgba(214, 190, 102, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--color-gold)'
        }}>
          <Headphones size={32} />
        </div>

        <h4 style={{ color: '#fff', fontWeight: '800', marginBottom: '8px', fontSize: '1.3rem' }}>
          Need Help? Contact Us
        </h4>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px auto' }}>
          24x7 Dedicated support line for deposit, withdrawal, or game queries.
        </p>

        {/* Call Button */}
        <a
          href={callLink}
          className="btn-gradient"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '16px 20px',
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: '700',
            textDecoration: 'none',
            marginBottom: '16px',
            boxSizing: 'border-box'
          }}
        >
          <PhoneCall size={22} />
          <span>Call: {contact.mobile || '—'}</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={wpLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '16px 20px',
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: '700',
            textDecoration: 'none',
            backgroundColor: '#25D366',
            color: '#ffffff',
            boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
            transition: 'transform 0.2s'
          }}
        >
          <MessageSquare size={22} />
          <span>WhatsApp Support</span>
        </a>
      </div>
    </div>
  );
};

export default Support;

