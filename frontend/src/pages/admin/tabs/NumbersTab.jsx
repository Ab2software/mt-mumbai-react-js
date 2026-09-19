import React, { useState } from 'react';
import {
  SINGLE_DIGITS,
  JODI_DIGITS,
  SINGLE_PANAS_BY_ANK,
  DOUBLE_PANAS_BY_ANK,
  TRIPLE_PANAS,
  ALL_PANAS_220
} from '../../../utils/gameNumbersData';

const NumbersTab = ({ activeTab }) => {
  const [search, setSearch] = useState('');

  const getNumbersList = () => {
    if (activeTab === 'num_single_digit') return SINGLE_DIGITS;
    if (activeTab === 'num_jodi_digit') return JODI_DIGITS;
    if (activeTab === 'num_triple_pana') return TRIPLE_PANAS;
    if (activeTab === 'num_single_pana') {
      return Object.values(SINGLE_PANAS_BY_ANK).flat();
    }
    if (activeTab === 'num_double_pana') {
      return Object.values(DOUBLE_PANAS_BY_ANK).flat();
    }
    return ALL_PANAS_220;
  };

  const list = getNumbersList().filter(n => String(n).includes(search.trim()));

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', border: '1px solid #edf2f7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h5 style={{ margin: 0, color: '#556ee6', fontWeight: '700', textTransform: 'uppercase' }}>
          {activeTab.replace('num_', '').replace('_', ' ')} Directory ({list.length})
        </h5>
        <input
          type="text"
          placeholder="Filter number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.86rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {list.map((num, idx) => (
          <div key={idx} style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 4px',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '0.92rem',
            color: '#2d3748'
          }}>
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NumbersTab;
