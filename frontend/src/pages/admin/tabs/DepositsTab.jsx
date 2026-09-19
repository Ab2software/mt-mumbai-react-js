import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const DepositsTab = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pending-deposits', {
        params: {
          page,
          limit: pageSize,
          search
        }
      });
      if (res.data.success === '1') {
        setDeposits(res.data.data || []);
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
    loadDeposits();
  }, [page, pageSize, search]);

  const handleApprove = async (id) => {
    try {
      const res = await api.post('/admin/approve-deposit', { depositId: id });
      if (res.data.success === '1') {
        loadDeposits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.post('/admin/reject-deposit', { depositId: id });
      if (res.data.success === '1') {
        loadDeposits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '#', key: 'id', render: (_, idx) => idx },
    { title: 'User / Phone', key: 'username', render: (row) => <strong>{row.username || '—'}</strong> },
    { title: 'Amount', key: 'amount', render: (row) => <strong style={{ color: '#10b981' }}>₹ {row.amount}</strong> },
    { title: 'Txn / UTR ID', key: 'txn_id', render: (row) => row.txn_id || row.utr_id || '—' },
    { title: 'Payment Method', key: 'mode', render: (row) => row.mode || 'UPI / QR' },
    { title: 'Date & Time', key: 'txt_date', render: (row) => row.txt_date || row.date || '—' },
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
        headerTitle="Pending Auto Deposit Requests"
        columns={columns}
        data={deposits}
        loading={loading}
        serverSide={true}
        totalItems={totalItems}
        currentPage={page}
        defaultPageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search by Phone, Txn ID, UTR..."
      />
    </div>
  );
};

export default DepositsTab;
