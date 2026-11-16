import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../../services';

const AdminNavbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.data.unread_count);
      
      const listRes = await notificationService.getAll({ limit: 5 });
      setNotifications(listRes.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    setDropdownOpen(false);
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        fetchNotifications();
      } catch (err) {}
    }
    if (notif.type === 'order' && notif.related_id) {
      navigate(`/admin/orders/${notif.related_id}`);
    } else {
      navigate('/admin/notifications');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sm:px-6">
      <div className="flex items-center flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 mr-4 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Search */}
        <div className="hidden sm:flex items-center max-w-md w-full bg-gray-100 rounded-xl px-3 py-2">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search orders, products..." 
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <Bell className="w-6 h-6" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-down">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      await notificationService.markAllAsRead();
                      fetchNotifications();
                    }}
                    className="text-xs text-[#072d1e] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-green-50/20' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-xs ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{notif.title}</h4>
                        </div>
                        <p className={`text-xs ${!notif.is_read ? 'text-gray-800' : 'text-gray-500'} line-clamp-2`}>{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-100">
                <Link 
                  to="/admin/notifications" 
                  onClick={() => setDropdownOpen(false)}
                  className="block w-full text-center py-2 text-sm font-semibold text-[#072d1e] hover:bg-green-50 rounded-xl transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          </div>
          <button className="w-10 h-10 rounded-full bg-[#1a3c2e]/10 flex items-center justify-center border border-[#1a3c2e]/20 text-[#1a3c2e]">
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
