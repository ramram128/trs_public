import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_COLORS = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const perPage = 20;

  const fetchPayments = async (p = page, search = '', status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminService.getPayments(params);
      setPayments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(1); }, [statusFilter]);

  const columns = [
    { header: 'Order #', accessor: 'order_number', cell: (row) => (
      <span className="font-semibold text-[#1a3c2e]">{row.order_number}</span>
    )},
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Transaction ID', accessor: 'transaction_id', cell: (row) => (
      <span className="text-sm text-gray-500">{row.transaction_id || '-'}</span>
    )},
    { header: 'Amount', accessor: 'amount', cell: (row) => (
      <span className="font-semibold">Rs. {row.amount?.toLocaleString()}</span>
    )},
    { header: 'Gateway', accessor: 'gateway', cell: (row) => (
      <span className="text-sm uppercase font-medium">{row.gateway}</span>
    )},
    { header: 'Status', accessor: 'status', cell: (row) => (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>
        {row.status}
      </span>
    )},
    { header: 'Date', accessor: 'created_at', cell: (row) => (
      <span className="text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500">View all payment transactions</p>
      </div>
      <div className="flex gap-3">
        {STATUS_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              statusFilter === opt.value ? 'bg-[#1a3c2e] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1a3c2e]'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
      <DataTable columns={columns} data={payments} total={total} page={page} perPage={perPage}
        onPageChange={(p) => { setPage(p); fetchPayments(p); }}
        onSearch={(s) => { setPage(1); fetchPayments(1, s); }}
        searchPlaceholder="Search transactions..." isLoading={loading} />
    </div>
  );
};

export default AdminPayments;
