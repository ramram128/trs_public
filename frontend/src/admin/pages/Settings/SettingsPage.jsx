import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Save, Truck, Phone, Globe, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'contact', label: 'Contact', icon: Phone },
  { key: 'social', label: 'Social Media', icon: Globe },
  { key: 'store', label: 'Store', icon: Store },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('delivery');

  useEffect(() => {
    adminService.getSettings()
      .then((res) => setSettings(res.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => setSettings({ ...settings, [key]: value });

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Settings updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const renderField = (key, label, type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'toggle' ? (
        <button onClick={() => handleChange(key, settings[key] === 'true' ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] === 'true' ? 'bg-[#1a3c2e]' : 'bg-gray-300'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      ) : (
        <input type={type} value={settings[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c2e]" />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Configure your store settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#1a3c2e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3c2e]/90 flex items-center gap-2 disabled:opacity-50">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === key ? 'text-[#1a3c2e] border-b-2 border-[#1a3c2e]' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'delivery' && (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-gray-700">Enable Delivery</label>
                {renderField('delivery_enabled', '', 'toggle')}
              </div>
              {renderField('delivery_charge', 'Delivery Charge (Rs.)', 'number')}
              {renderField('free_delivery_above', 'Free Delivery Above (Rs.)', 'number')}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4 max-w-lg">
              {renderField('support_phone', 'Phone Number')}
              {renderField('support_email', 'Support Email')}
              {renderField('whatsapp_number', 'WhatsApp Number')}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4 max-w-lg">
              {renderField('facebook_url', 'Facebook URL')}
              {renderField('instagram_url', 'Instagram URL')}
              {renderField('youtube_url', 'YouTube URL')}
              {renderField('twitter_url', 'Twitter/X URL')}
              {renderField('linkedin_url', 'LinkedIn URL')}
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-4 max-w-lg">
              {renderField('store_name', 'Store Name')}
              {renderField('store_tagline', 'Store Tagline')}
              {renderField('store_address', 'Store Address')}
              {renderField('currency', 'Currency Code')}
              {renderField('currency_symbol', 'Currency Symbol')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
