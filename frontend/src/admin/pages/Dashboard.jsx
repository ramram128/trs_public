import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await adminService.getDashboard();
        setData(response.data);
      } catch (err) {
        // Handled by interceptor, but we catch to avoid unhandled promise
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  // Format revenue data for AreaChart
  const revenueData = data.monthly_revenue.map(item => ({
    name: new Date(item.month + '-01').toLocaleDateString('default', { month: 'short' }),
    revenue: item.revenue
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Welcome back, here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`Rs. ${data.stats.total_revenue.toLocaleString()}`}
          icon={DollarSign}
          trend={12.5}
          colorClass="bg-[#1a3c2e]"
        />
        <StatCard 
          title="Total Orders" 
          value={data.stats.total_orders.toString()}
          icon={ShoppingBag}
          trend={8.2}
          colorClass="bg-blue-600"
        />
        <StatCard 
          title="Total Customers" 
          value={data.stats.total_customers.toString()}
          icon={Users}
          trend={5.1}
          colorClass="bg-purple-600"
        />
        <StatCard 
          title="Products Sold" 
          value={data.stats.total_products.toString()}
          icon={Package}
          colorClass="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3c2e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1a3c2e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} tickFormatter={(val) => `Rs.${val/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1a3c2e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-[#1a3c2e] hover:underline font-medium flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="flex-1 p-0 overflow-auto">
            <div className="divide-y divide-gray-100">
              {data.recent_orders.map(order => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-500 mt-1">{order.customer_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-[#1a3c2e]">Rs. {order.total.toLocaleString()}</div>
                    <div className={`text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
              {data.recent_orders.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">No recent orders</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
