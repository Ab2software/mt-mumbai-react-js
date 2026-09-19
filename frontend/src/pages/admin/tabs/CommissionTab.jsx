import React, { useState, useEffect } from 'react';
import { Percent, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const CommissionTab = ({ activeTab }) => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const loadCommission = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'user_commission_pay_list'
        ? '/admin/commission-pay-list'
        : '/admin/commission-report';

      const res = await api.get(endpoint, {
        params: { from_date: fromDate, to_date: toDate }
      });

      if (res.data.success === '1') {
        setDataList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommission();
  }, [activeTab, fromDate, toDate]);

  const handleApprove = async (id) => {
    try {
      const res = await api.post('/admin/approve-commission', { id });
      if (res.data.success === '1') {
        loadCommission();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '#', key: 'id', render: (_, idx) => idx },
    { title: 'User / Phone', key: 'username', render: (row) => <strong>{row.username || row.phone}</strong> },
    { title: 'Referred User', key: 'referred_user', render: (row) => row.referred_user || row.referred_phone || '—' },
    { title: 'Commission Amount', key: 'amount', render: (row) => <strong style={{ color: '#10b981' }}>₹ {row.amount || row.commission}</strong> },
    { title: 'Date', key: 'date', render: (row) => row.date || row.created_at || '—' },
    {
      title: 'Status / Actions',
      key: 'actions',
      render: (row) => (
        String(row.status) === '1' ? (
          <span style={{ color: '#10b981', fontWeight: '700' }}>Paid</span>
        ) : (
          <button
            type="button"
            onClick={() => handleApprove(row.id)}
            style={{ padding: '6px 12px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <CheckCircle2 size={14} /> Approve & Pay
          </button>
        )
      )
    }
  ];

  return (
    <div>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>From Date:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>To Date:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          />
        </div>
        <button
          type="button"
          onClick={loadCommission}
          style={{ padding: '7px 16px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Filter Commission
        </button>
      </div>

      <DataTable
        headerTitle={activeTab === 'user_commission_pay_list' ? 'Commission Pay History' : 'Pending Referral Commissions'}
        columns={columns}
        data={dataList}
        loading={loading}
        searchPlaceholder="Search by username or referred user..."
      />
    </div>
  );
};

export default CommissionTab;
