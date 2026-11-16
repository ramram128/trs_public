import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs({ page: p, per_page: perPage });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const columns = [
    { header: 'Admin', accessor: 'admin_name', cell: (row) => (
      <div>
        <div className="font-medium text-gray-900">{row.admin_name}</div>
        <div className="text-xs text-gray-500">{row.admin_email}</div>
      </div>
    )},
    { header: 'Action', accessor: 'action', cell: (row) => (
      <span className="text-sm font-medium">{row.action}</span>
    )},
    { header: 'Description', accessor: 'description', cell: (row) => (
      <span className="text-sm text-gray-600">{row.description}</span>
    )},
    { header: 'IP Address', accessor: 'ip_address', cell: (row) => (
      <span className="text-sm text-gray-500">{row.ip_address || '-'}</span>
    )},
    { header: 'Date', accessor: 'created_at', cell: (row) => (
      <span className="text-sm text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500">Track admin actions and system events</p>
      </div>
      <DataTable columns={columns} data={logs} total={total} page={page} perPage={perPage}
        onPageChange={(p) => { setPage(p); fetchLogs(p); }}
        isLoading={loading} />
    </div>
  );
};

export default AdminActivityLogs;
