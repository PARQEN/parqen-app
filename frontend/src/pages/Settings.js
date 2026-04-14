import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Lock, Mail, Phone, CreditCard, Bell, 
  Shield, Globe, Save, Eye, EyeOff, CheckCircle,
  AlertCircle, Smartphone, Banknote, LogOut
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const PRAQEN = {
  primary: '#2D5F4F',
  secondary: '#FFD700',
  darkBg: '#1a3a2a',
  lightBg: '#f0f8f5',
};

export default function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    username: '',
    fullName: '',
    email: '',
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState({
    bankAccount: '',
    mobileMoney: '',
    mobileMoneyNumber: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [user]);

  const loadUserData = () => {
    setProfileForm({
      username: user?.username || '',
      fullName: user?.full_name || '',
      email: user?.email || '',
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/users/profile`, {
        username: profileForm.username,
        fullName: profileForm.fullName,
      });
      toast.success('Profile updated successfully!');
      // Update user context
      if (setUser) {
        setUser({ ...user, username: profileForm.username, full_name: profileForm.fullName });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password error:', error);
      toast.error(error?.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/users/payment-methods`, paymentMethods);
      toast.success('Payment methods updated!');
    } catch (error) {
      console.error('Payment update error:', error);
      toast.error('Failed to update payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: PRAQEN.lightBg }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: PRAQEN.primary }}>Settings</h1>
          <p style={{ color: PRAQEN.primary }} className="opacity-70 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2" style={{ borderColor: PRAQEN.gray?.[200] || '#e5e7eb' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition ${
                  isActive ? 'text-white' : 'hover:bg-gray-100'
                }`}
                style={{ backgroundColor: isActive ? PRAQEN.primary : 'transparent', color: isActive ? 'white' : PRAQEN.gray?.[600] || '#4b5563' }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-black mb-6" style={{ color: PRAQEN.primary }}>Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-4 py-2 border-2 rounded-lg bg-gray-100 cursor-not-allowed"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[600] || '#4b5563' }}
                />
                <p className="text-xs mt-1" style={{ color: PRAQEN.gray?.[500] || '#6b7280' }}>Email cannot be changed</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold transition hover:opacity-80"
                style={{ backgroundColor: PRAQEN.primary }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-black mb-6" style={{ color: PRAQEN.primary }}>Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none pr-10"
                    style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none pr-10"
                    style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold transition hover:opacity-80"
                style={{ backgroundColor: PRAQEN.primary }}
              >
                <Lock size={18} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: PRAQEN.gray?.[200] || '#e5e7eb' }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold transition hover:opacity-80"
                style={{ backgroundColor: '#ef4444' }}
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-black mb-6" style={{ color: PRAQEN.primary }}>Payment Methods</h2>
            
            <form onSubmit={handlePaymentUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  <Banknote size={16} className="inline mr-1" />
                  Bank Account
                </label>
                <input
                  type="text"
                  value={paymentMethods.bankAccount}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, bankAccount: e.target.value })}
                  placeholder="Bank Name - Account Number"
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  <Smartphone size={16} className="inline mr-1" />
                  Mobile Money Provider
                </label>
                <select
                  value={paymentMethods.mobileMoney}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, mobileMoney: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                >
                  <option value="">Select Provider</option>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="vodafone">Vodafone Cash</option>
                  <option value="airteltigo">AirtelTigo Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: PRAQEN.gray?.[700] || '#374151' }}>
                  Mobile Money Number
                </label>
                <input
                  type="tel"
                  value={paymentMethods.mobileMoneyNumber}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, mobileMoneyNumber: e.target.value })}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db', color: PRAQEN.gray?.[900] || '#111827' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold transition hover:opacity-80"
                style={{ backgroundColor: PRAQEN.primary }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Payment Methods'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-black mb-6" style={{ color: PRAQEN.primary }}>Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive trade updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Push Notifications</p>
                  <p className="text-sm text-gray-500">Get real-time trade alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Marketing Emails</p>
                  <p className="text-sm text-gray-500">Receive promotions and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}