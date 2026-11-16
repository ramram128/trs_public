import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

const COLORS = ['#1a3c2e', '#d4af37', '#2563eb', '#f59e0b', '#10b981', '#ef4444'];

export default function ReportsPage() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => { fetchReport(); }, [dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString().split('T')[0];
      const res = await adminService.getSalesReport({ start_date: startDate, end_date: endDate });
      setSalesData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Sales', value: `Rs. ${(salesData?.total_sales || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Total Orders', value: salesData?.total_orders || 0, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700' },
    { label: 'Items Sold', value: salesData?.items_sold || 0, icon: Package, color: 'bg-purple-100 text-purple-700' },
    { label: 'Avg. Order Value', value: `Rs. ${(salesData?.average_order_value || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
  ];

  // Mock chart data from monthly revenue
  const chartData = salesData?.monthly_revenue || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue</h3>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No revenue data available for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val) => [`Rs. ${val.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#1a3c2e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
