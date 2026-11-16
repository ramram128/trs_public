import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import DataTable from '../../components/DataTable';
import { AlertTriangle, Check, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Products' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STATUS_COLORS = {
  in_stock: 'bg-emerald-100 text-emerald-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
};

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [tempStock, setTempStock] = useState(0);
  const [savingId, setSavingId] = useState(null);
  const perPage = 20;

  const fetchInventory = async (p = page, search = '', status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: perPage };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminService.getInventory(params);
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(1); }, [statusFilter]);

  const handleSaveStock = async (row) => {
    setSavingId(row.id);
    try {
      await adminService.updateQuickStock(row.id, Number(tempStock));
      toast.success(`Stock updated for ${row.name}`);
      setItems((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, stock: Number(tempStock) } : item))
      );
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { header: 'Product', accessor: 'name', cell: (row) => (
      <div>
        <div className="font-medium text-gray-900">{row.name}</div>
        <div className="text-xs text-gray-500">SKU: {row.sku || '-'}</div>
      </div>
    )},
    { header: 'Category', accessor: 'category_name', cell: (row) => <span className="text-sm">{row.category_name || '-'}</span> },
    { header: 'Stock Units', accessor: 'stock', cell: (row) => {
      const isEditing = editingId === row.id;
      return isEditing ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={tempStock}
            onChange={(e) => setTempStock(e.target.value)}
            className="w-20 border border-emerald-500 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => handleSaveStock(row)}
            disabled={savingId === row.id}
            className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            title="Save Stock"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="p-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <span className={`font-bold text-base ${row.stock === 0 ? 'text-red-600' : row.stock <= row.low_stock_threshold ? 'text-amber-600' : 'text-gray-900'}`}>
            {row.stock}
          </span>
          {row.stock <= row.low_stock_threshold && row.stock > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <button
            onClick={() => { setEditingId(row.id); setTempStock(row.stock); }}
            className="p-1 text-gray-400 hover:text-emerald-700 rounded transition opacity-60 hover:opacity-100 flex items-center gap-0.5 text-xs font-semibold"
            title="Quick edit stock"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>
      );
    }},
    { header: 'Alert Threshold', accessor: 'low_stock_threshold', cell: (row) => <span className="text-sm text-gray-500">{row.low_stock_threshold}</span> },
    { header: 'Status', accessor: 'status', cell: (row) => (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>
        {row.status?.replace(/_/g, ' ')}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500">Monitor stock levels, set low stock thresholds, and update stock counts inline</p>
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
      <DataTable columns={columns} data={items} total={total} page={page} perPage={perPage}
        onPageChange={(p) => { setPage(p); fetchInventory(p); }}
        onSearch={(s) => { setPage(1); fetchInventory(1, s); }}
        searchPlaceholder="Search products..." isLoading={loading} />
    </div>
  );
};

export default AdminInventory;
