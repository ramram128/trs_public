import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  X,
  CreditCard,
  Tags,
  AlertTriangle,
  Activity,
  BarChart3,
  Star,
  Percent,
  Image,
  UserCog,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ onClose }) => {
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Inquiries & RFQs', path: '/admin/inquiries', icon: Building2 },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Inventory', path: '/admin/inventory', icon: AlertTriangle },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Coupons', path: '/admin/coupons', icon: Percent },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Homepage', path: '/admin/homepage', icon: Image },
    { name: 'Activity Logs', path: '/admin/activity-log', icon: Activity },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'My Profile', path: '/admin/profile', icon: UserCog },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1a3c2e] border-r border-[#1a3c2e]/20">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 text-xl font-bold tracking-wider text-white">
          <img
            src="/logo.png"
            alt="TRS Products"
            className="w-8 h-8 object-contain rounded-full bg-white p-0.5 border border-gold-400/30"
          />
          <span>TRS<span className="text-[#c9a227]">PRODUCTS</span></span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-gray-300 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
          Management
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-[#c9a227] text-white shadow-md shadow-[#c9a227]/20' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
