import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const WithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending-withdrawals', {
        params: {
          page,
          limit: pageSize,
          search
        }
      });
      if (res.data.success === '1') {
        setWithdrawals(res.data.data || []);
        if (res.data.pagination) {
          setTotalItems(res.data.pagination.total);
        } else {
          setTotalItems((res.data.data || []).length);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [page, pageSize, search]);

  const handleApprove = async (id) => {
    try {
      const res = await api.post('/admin/approve-withdrawal', { withdrawId: id });
      if (res.data.success === '1') {
        loadWithdrawals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.post('/admin/reject-withdrawal', { withdrawId: id });
      if (res.data.success === '1') {
        loadWithdrawals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '#', key: 'id', render: (_, idx) => idx },
    { title: 'User / Mobile', key: 'user_name', render: (row) => <strong>{row.user_name || row.mobile}</strong> },
    { title: 'Amount', key: 'amount', render: (row) => <strong style={{ color: '#ef4444' }}>₹ {row.amount}</strong> },
    { title: 'Method', key: 'payment_method', render: (row) => row.payment_method || 'Bank Transfer' },
    { title: 'Account Details', key: 'account_no', render: (row) => row.account_no ? `${row.bank_name || ''} - ${row.account_no}` : (row.ifsc || '—') },
    { title: 'Date & Time', key: 'created_at', render: (row) => row.created_at || row.date || '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleApprove(row.id)}
            style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <CheckCircle2 size={14} /> Approve
          </button>
          <button
            type="button"
            onClick={() => handleReject(row.id)}
            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <DataTable
        headerTitle="Pending Withdrawal Requests"
        columns={columns}
        data={withdrawals}
        loading={loading}
        serverSide={true}
        totalItems={totalItems}
        currentPage={page}
        defaultPageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search by Name, Mobile, Account..."
      />
    </div>
  );
};

export default WithdrawalsTab;
