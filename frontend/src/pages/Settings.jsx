import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, User, Lock, Mail, Save } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setFormData(prev => ({ ...prev, email: res.data.email }));
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result;
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:5000/api/auth/photo', 
          { profilePicture: base64String },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setMessage('Profile photo updated successfully!');
        // Refresh the whole page to update avatar in layout/sidebar immediately
        window.location.reload(); 
      } catch (err) {
        setError(err.response?.data?.message || 'Error uploading photo');
        setTimeout(() => setError(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/auth/profile', {
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('Profile updated successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      // Optionally reload to reflect email/name changes globally
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Settings</h1>

      {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-lg font-medium">{message}</div>}
      {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Photo Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden bg-indigo-100 border-4 border-white shadow-lg flex items-center justify-center">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-indigo-400" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h2 className="text-lg font-bold text-slate-800">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            Change Photo
          </button>
        </div>

        {/* Update Details Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Account Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-slate-400" size={20} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password (required to save changes)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-slate-400" size={20} />
                    </div>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
