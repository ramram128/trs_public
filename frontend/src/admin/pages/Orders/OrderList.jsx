import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../../services';
import DataTable from '../../components/DataTable';
import { Eye, Truck } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_COLORS = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const perPage = 20;

  const fetchOrders = async (p = page, search = '', status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (status) params.order_status = status;
      const res = await adminService.getOrders(params);
      setOrders(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, [statusFilter]);

  const columns = [
    { header: 'Order #', accessor: 'order_number', cell: (row) => (
      <span className="font-semibold text-[#1a3c2e]">{row.order_number}</span>
    )},
    { header: 'Customer', accessor: 'customer_name', cell: (row) => (
      <div>
        <div className="font-medium text-gray-900">{row.customer_name}</div>
        <div className="text-xs text-gray-500">{row.email}</div>
      </div>
    )},
    { header: 'Items', accessor: 'item_count' },
    { header: 'Total', accessor: 'total', cell: (row) => (
      <span className="font-semibold">Rs. {row.total?.toLocaleString()}</span>
    )},
    { header: 'Payment', accessor: 'payment_method', cell: (row) => (
      <div>
        <span className="text-xs uppercase font-medium">{row.payment_method}</span>
        <div className={`text-[10px] font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${PAYMENT_COLORS[row.payment_status] || 'bg-gray-100 text-gray-600'}`}>
          {row.payment_status}
        </div>
      </div>
    )},
    { header: 'Tracking ID', accessor: 'tracking_id', cell: (row) => (
      row.tracking_id ? (
        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
          {row.tracking_id}
        </span>
      ) : (
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
          Not Assigned
        </span>
      )
    )},
    { header: 'Status', accessor: 'order_status', cell: (row) => (
      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full inline-block ${STATUS_COLORS[row.order_status] || 'bg-gray-100 text-gray-600'}`}>
        {row.order_status?.replace(/_/g, ' ')}
      </span>
    )},
    { header: 'Date', accessor: 'created_at', cell: (row) => (
      <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span>
    )},
    { header: 'Actions', accessor: 'actions', cell: (row) => (
      <Link to={`/admin/orders/${row.id}`} className="p-2 hover:bg-gray-100 rounded-lg inline-flex transition-colors">
        <Eye className="w-4 h-4 text-gray-600" />
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">Manage all customer orders</p>
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
      <DataTable columns={columns} data={orders} total={total} page={page} perPage={perPage}
        onPageChange={(p) => { setPage(p); fetchOrders(p); }}
        onSearch={(s) => { setPage(1); fetchOrders(1, s); }}
        searchPlaceholder="Search orders..." isLoading={loading} />
    </div>
  );
};

export default AdminOrders;
