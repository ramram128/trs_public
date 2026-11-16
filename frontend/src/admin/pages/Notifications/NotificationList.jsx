import { useState, useEffect } from 'react';
import { notificationService } from '../../../services';
import { Bell, Check, ShoppingBag, MessageSquare, Info, AlertCircle, Circle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch (err) {}
    }
    
    if (notif.type === 'order' && notif.related_id) {
      navigate(`/admin/orders/${notif.related_id}`);
    } else if (notif.type === 'contact') {
      navigate('/admin/dashboard'); // Or contact page if it exists
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <ShoppingBag size={20} className="text-emerald-600" />;
      case 'contact': return <MessageSquare size={20} className="text-blue-600" />;
      default: return <Info size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="text-[#072d1e]" /> Notifications
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your alerts and updates</p>
          </div>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Check size={16} /> Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-green-50/30' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                    {getIcon(notif.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${!notif.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="flex-shrink-0 flex items-center">
                    <Circle size={10} className="fill-[#072d1e] text-[#072d1e]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
