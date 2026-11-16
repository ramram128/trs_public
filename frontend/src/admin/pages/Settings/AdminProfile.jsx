import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services';
import toast from 'react-hot-toast';
import api, { getApiError } from '../../../services/api';
import { User, Lock, Save, Loader2 } from 'lucide-react';

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authService.updateProfile(profile);
      await updateUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password.new_password !== password.confirm_password) { toast.error('Passwords do not match'); return; }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { current_password: password.current_password, new_password: password.new_password });
      toast.success('Password changed successfully');
      setPassword({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally { setSavingPassword(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Profile</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <User size={20} className="text-green-700" />
            <h2 className="font-bold text-lg">Profile Information</h2>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user?.email || ''} disabled
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition disabled:opacity-50 flex items-center gap-2">
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={20} className="text-green-700" />
            <h2 className="font-bold text-lg">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={password.current_password} onChange={e => setPassword({...password, current_password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={password.new_password} onChange={e => setPassword({...password, new_password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={password.confirm_password} onChange={e => setPassword({...password, confirm_password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-900" required minLength={8} />
            </div>
            <button type="submit" disabled={savingPassword}
              className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition disabled:opacity-50 flex items-center gap-2">
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
