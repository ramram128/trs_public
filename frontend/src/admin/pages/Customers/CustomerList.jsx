import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';
import { UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  const fetchCustomers = async (p = page, search = '') => {
    setLoading(true);
    try {
      const params = { page: p, per_page: perPage };
      if (search) params.search = search;
      const res = await adminService.getCustomers(params);
      setCustomers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(1); }, []);

  const handleToggle = async (id) => {
    try {
      const res = await adminService.toggleCustomerStatus(id);
      toast.success(res.data.message);
      fetchCustomers(page);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const columns = [
    { header: 'Customer', accessor: 'name', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1a3c2e] text-white rounded-full flex items-center justify-center font-bold text-sm">
          {row.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      </div>
    )},
    { header: 'Phone', accessor: 'phone', cell: (row) => <span className="text-sm">{row.phone || '-'}</span> },
    { header: 'Orders', accessor: 'order_count', cell: (row) => <span className="font-medium">{row.order_count}</span> },
    { header: 'Total Spent', accessor: 'total_spent', cell: (row) => <span className="font-semibold">Rs. {row.total_spent?.toLocaleString()}</span> },
    { header: 'Status', accessor: 'is_active', cell: (row) => (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {row.is_active ? 'Active' : 'Disabled'}
      </span>
    )},
    { header: 'Joined', accessor: 'created_at', cell: (row) => (
      <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleDateString()}</span>
    )},
    { header: 'Actions', accessor: 'actions', cell: (row) => (
      <button onClick={() => handleToggle(row.id)} className={`p-2 rounded-lg transition-colors ${row.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
        title={row.is_active ? 'Disable' : 'Enable'}>
        {row.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">Manage customer accounts</p>
      </div>
      <DataTable columns={columns} data={customers} total={total} page={page} perPage={perPage}
        onPageChange={(p) => { setPage(p); fetchCustomers(p); }}
        onSearch={(s) => { setPage(1); fetchCustomers(1, s); }}
        searchPlaceholder="Search customers..." isLoading={loading} />
    </div>
  );
};

export default AdminCustomers;
