import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Download } from 'lucide-react';
import api from '../../../utils/api';
import DataTable from '../../../components/common/DataTable';

const ReportsTab = ({ activeTab, games }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [gameFilter, setGameFilter] = useState('all');

  const loadReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/admin/bid-history-report';
      if (activeTab === 'customer_sell_report') endpoint = '/admin/customer-sell-report';
      else if (activeTab === 'winning_report') endpoint = '/admin/winning-report';
      else if (activeTab === 'transfer_report') endpoint = '/admin/transfer-report';
      else if (activeTab === 'withdraw_report') endpoint = '/admin/withdrawal-report';
      else if (activeTab === 'add_fund_report') endpoint = '/admin/add-fund-report';
      else if (activeTab === 'report_auto_deposit') endpoint = '/admin/auto-deposits';

      const res = await api.get(endpoint, {
        params: {
          date: dateFilter,
          game_name: gameFilter
        }
      });

      if (res.data.success === '1') {
        setReportData(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, dateFilter, gameFilter]);

  const getColumns = () => {
    if (activeTab === 'winning_report') {
      return [
        { title: '#', key: 'id', render: (_, idx) => idx },
        { title: 'User / Mobile', key: 'username', render: (row) => <strong>{row.username}</strong> },
        { title: 'Game Name', key: 'game_name' },
        { title: 'Game Type', key: 'game_type' },
        { title: 'Bid Number', key: 'digits', render: (row) => <strong style={{ color: '#556ee6' }}>{row.digits}</strong> },
        { title: 'Points Bidded', key: 'points' },
        { title: 'Winning Amount', key: 'win_amount', render: (row) => <strong style={{ color: '#10b981' }}>₹ {row.win_amount || row.winning_amount}</strong> },
        { title: 'Date', key: 'date' }
      ];
    }

    return [
      { title: '#', key: 'id', render: (_, idx) => idx },
      { title: 'User / Mobile', key: 'username', render: (row) => <strong>{row.username}</strong> },
      { title: 'Game Name', key: 'game_name', render: (row) => row.game_name || '—' },
      { title: 'Type / Session', key: 'game_type', render: (row) => row.game_type || row.session || '—' },
      { title: 'Number / Digit', key: 'digits', render: (row) => <strong style={{ color: '#556ee6' }}>{row.digits || row.points || '—'}</strong> },
      { title: 'Points / Amount', key: 'points', render: (row) => <strong>₹ {row.points || row.amount || '0'}</strong> },
      { title: 'Status', key: 'status', render: (row) => <span style={{ color: String(row.status) === '1' ? '#10b981' : '#f59e0b', fontWeight: '700' }}>{String(row.status) === '1' ? 'Win / Success' : 'Pending'}</span> },
      { title: 'Date & Time', key: 'date', render: (row) => row.date || row.created_at || '—' }
    ];
  };

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: '#556ee6' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
          />
        </div>

        {['bid_history_report', 'customer_sell_report', 'winning_report'].includes(activeTab) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#556ee6' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' }}>Game:</span>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
            >
              <option value="all">All Games</option>
              {games.map(g => (
                <option key={g.id || g.game_name} value={g.game_name}>{g.game_name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={loadReport}
          style={{ padding: '7px 16px', backgroundColor: '#556ee6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Generate Report
        </button>
      </div>

      <DataTable
        headerTitle={`${activeTab.replace(/_/g, ' ').toUpperCase()} Console`}
        columns={getColumns()}
        data={reportData}
        loading={loading}
        searchPlaceholder="Filter report records..."
      />
    </div>
  );
};

export default ReportsTab;
