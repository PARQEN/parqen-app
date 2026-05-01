import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User, Lock, Mail, Phone, CreditCard, Bell,
  Shield, Globe, Save, Eye, EyeOff, CheckCircle,
  AlertCircle, Smartphone, LogOut, ChevronRight,
  Camera, BadgeCheck, Clock, Upload, RefreshCw,
  FileText, DollarSign, Languages, MapPin, X,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest: '#1B4332', green: '#2D6A4F', mint: '#40916C',
  gold: '#F4A422', mist: '#F0FAF5', white: '#FFFFFF',
  g50: '#F8FAFC', g100: '#F1F5F9', g200: '#E2E8F0',
  g400: '#94A3B8', g500: '#64748B', g600: '#475569', g700: '#334155', g800: '#1E293B',
  success: '#10B981', danger: '#EF4444', warn: '#F59E0B', paid: '#3B82F6',
};

const authH = () => { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const maskEmail = (email) => {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const show = Math.min(4, local.length);
  const masked = local.slice(0, show) + '•'.repeat(Math.max(3, local.length - show));
  return `${masked}@${domain}`;
};

// ─── Verification Step ────────────────────────────────────────────────────────
function VerifStep({ n, title, desc, done, active, badge }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition ${done ? 'bg-green-50 border-green-200' : active ? 'border-blue-200 bg-blue-50' : 'bg-gray-50 border-gray-100'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {done ? <CheckCircle size={18} /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-bold text-sm ${done ? 'text-green-800' : active ? 'text-blue-800' : 'text-gray-600'}`}>{title}</p>
          {badge && <span className={`text-xs font-black px-2 py-0.5 rounded-full ${done ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{badge}</span>}
        </div>
        <p className={`text-xs mt-0.5 ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>{desc}</p>
      </div>
      {done ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" /> :
        active ? <span className="text-xs font-bold text-blue-600 flex-shrink-0 mt-0.5">Required →</span> :
        <Clock size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function Settings({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);

  // Account info
  const [accountForm, setAccountForm] = useState({ username: '', fullName: '', email: '', phone: '', bio: '' });

  // Security
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Preferences
  const [prefs, setPrefs] = useState({
    nameDisplay: 'full',      // full | initial | hide
    currency: 'GHS',
    language: 'en',
    timezone: 'Africa/Accra',
  });

  // Notifications
  const [notifs, setNotifs] = useState({
    email_trades: true, email_security: true, email_marketing: false,
    push_trades: true, push_messages: true, push_disputes: true,
  });

  // Payment methods
  const [payments, setPayments] = useState({ bankName: '', accountNumber: '', mobileProvider: '', mobileNumber: '' });

  // Hide full name toggle
  const [hideFullName, setHideFullName] = useState(false);

  // Phone verification flow
  const [phoneStep,    setPhoneStep]    = useState('idle'); // idle | sending | otp | verifying | done
  const [phoneOtp,     setPhoneOtp]     = useState('');

  // Email verification flow (inline in Account tab)
  const [emailVerifyStep,   setEmailVerifyStep]   = useState('idle'); // idle | otp | verifying
  const [emailCode,         setEmailCode]         = useState('');
  const [emailCodeLoading,  setEmailCodeLoading]  = useState(false);

  // KYC upload
  const [kycFiles,     setKycFiles]     = useState({ id: null, selfie: null });
  const [kycLoading,   setKycLoading]   = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setAccountForm({ username: user.username || '', fullName: user.full_name || '', email: user.email || '', phone: user.phone || '', bio: user.bio || '' });
    setPrefs(p => ({
      ...p,
      currency: user.preferred_currency || localStorage.getItem('praqen_currency') || 'GHS',
      language: user.preferred_language || localStorage.getItem('praqen_language') || 'en',
    }));
    // Seed hideFullName from user object or localStorage
    const saved = localStorage.getItem('hide_full_name');
    if (saved !== null) {
      setHideFullName(saved === 'true');
    } else if (user.hide_full_name !== undefined) {
      setHideFullName(!!user.hide_full_name);
    }
  }, [user]);

  // Derived verification status — only true when explicitly verified, NOT just because value exists
  const emailVerified = !!(user?.is_email_verified || user?.email_verified);
  const phoneVerified = !!(user?.is_phone_verified || user?.phone_verified);
  const kycVerified   = !!(user?.kyc_verified || user?.is_id_verified);
  const verLevel = kycVerified ? 3 : phoneVerified ? 2 : emailVerified ? 1 : 0;

  const handleAccountUpdate = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await axios.put(`${API_URL}/users/profile`, { username: accountForm.username, fullName: accountForm.fullName, phone: accountForm.phone, bio: accountForm.bio }, { headers: authH() });
      if (setUser) setUser({ ...user, username: accountForm.username, full_name: accountForm.fullName, phone: accountForm.phone });
      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, username: accountForm.username, full_name: accountForm.fullName, phone: accountForm.phone }));
      window.dispatchEvent(new Event('userUpdated'));
      toast.success('Account updated!');
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed to update'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/change-password`, { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }, { headers: authH() });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.put(`${API_URL}/users/payment-methods`, payments, { headers: authH() });
      toast.success('Payment methods saved!');
    } catch { toast.error('Failed to save payment methods'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    toast.info('Logged out'); navigate('/login');
  };

  const handleSendPhoneOtp = async () => {
    const phone = accountForm.phone.trim();
    if (!phone) { toast.error('Enter your phone number first'); return; }
    setPhoneStep('sending');
    try {
      await axios.post(`${API_URL}/users/send-phone-otp`, { phone }, { headers: authH() });
      toast.success(`OTP sent to ${phone}`);
      setPhoneStep('otp');
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed to send OTP'); setPhoneStep('idle'); }
  };

  const handleSendEmailCode = async () => {
    setEmailCodeLoading(true);
    try {
      await axios.post(`${API_URL}/users/resend-verification`, {}, { headers: authH() });
      toast.success('Verification code sent to your email!');
      setEmailVerifyStep('otp');
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed to send code'); }
    finally { setEmailCodeLoading(false); }
  };

  const handleVerifyEmailCode = async () => {
    if (emailCode.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setEmailVerifyStep('verifying');
    try {
      await axios.post(`${API_URL}/users/verify-email-code`, { code: emailCode }, { headers: authH() });
      toast.success('Email verified! ✅');
      if (setUser) setUser(u => ({ ...u, is_email_verified: true, email_verified: true }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, is_email_verified: true, email_verified: true }));
      window.dispatchEvent(new Event('userUpdated'));
      setEmailVerifyStep('idle');
      setEmailCode('');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Invalid or expired code');
      setEmailVerifyStep('otp');
    }
  };

  const toggleFullName = async (hide) => {
    setHideFullName(hide);
    localStorage.setItem('hide_full_name', hide ? 'true' : 'false');
    try {
      await axios.put(`${API_URL}/users/profile`, { hide_full_name: hide }, { headers: authH() });
    } catch { /* non-critical — local state already updated */ }
  };

  const handleVerifyPhone = async () => {
    if (phoneOtp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setPhoneStep('verifying');
    try {
      await axios.post(`${API_URL}/users/verify-phone-otp`, { phone: accountForm.phone.trim(), otp: phoneOtp }, { headers: authH() });
      toast.success('Phone verified! ✅');
      setPhoneStep('done');
      if (setUser) setUser(u => ({ ...u, is_phone_verified: true, phone_verified: true, phone: accountForm.phone.trim() }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, is_phone_verified: true, phone_verified: true, phone: accountForm.phone.trim() }));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (e) { toast.error(e?.response?.data?.error || 'Invalid OTP'); setPhoneStep('otp'); }
  };

  const handleKycSubmit = async () => {
    if (!kycFiles.id || !kycFiles.selfie) { toast.error('Please upload both documents'); return; }
    setKycLoading(true);
    try {
      await axios.post(`${API_URL}/kyc/submit`,
        { idDocName: kycFiles.id.name, selfieDocName: kycFiles.selfie.name },
        { headers: authH() }
      );
      toast.success("KYC submitted! We'll review within 24 hours.");
      setKycSubmitted(true);
    } catch (e) { toast.error(e?.response?.data?.error || 'Failed to submit KYC'); }
    finally { setKycLoading(false); }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/users/preferences`, prefs, { headers: authH() });
      localStorage.setItem('praqen_currency', prefs.currency);
      localStorage.setItem('praqen_language', prefs.language);
      if (setUser) setUser(u => ({ ...u, preferred_currency: prefs.currency, preferred_language: prefs.language }));
      toast.success('Preferences saved!');
    } catch (e) { toast.error('Failed to save preferences'); }
    finally { setLoading(false); }
  };

  const TABS = [
    { id: 'account',       icon: User,     label: 'Account' },
    { id: 'verification',  icon: Shield,   label: 'Verification' },
    { id: 'security',      icon: Lock,     label: 'Security' },
    { id: 'preferences',   icon: Globe,    label: 'Preferences' },
    { id: 'payment',       icon: CreditCard, label: 'Payment' },
    { id: 'notifications', icon: Bell,     label: 'Notifications' },
  ];

  const inputCls = "w-full px-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition";
  const inputStyle = (active) => ({ borderColor: active ? C.green : C.g200, color: C.g800 });
  const labelCls = "block text-sm font-bold mb-1.5 text-gray-700";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.mist, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: C.forest, fontFamily: "'Syne',sans-serif" }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: C.g500 }}>Manage your account, security and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar tabs */}
          <div className="md:w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: C.g200 }}>
              {TABS.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b last:border-0 hover:bg-gray-50"
                  style={{ borderColor: C.g100, backgroundColor: activeTab === id ? `${C.green}10` : 'transparent', borderLeft: activeTab === id ? `3px solid ${C.green}` : '3px solid transparent' }}>
                  <Icon size={16} style={{ color: activeTab === id ? C.green : C.g400 }} />
                  <span className="text-sm font-bold" style={{ color: activeTab === id ? C.green : C.g600 }}>{label}</span>
                </button>
              ))}
              {/* Logout */}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-red-50" style={{ borderTop: `1px solid ${C.g100}` }}>
                <LogOut size={16} className="text-red-400" />
                <span className="text-sm font-bold text-red-500">Log Out</span>
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── ACCOUNT ─────────────────────────────────────────── */}
            {activeTab === 'account' && (
              <>
                {/* Account information */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-5" style={{ color: C.forest }}>Account Information</h2>
                  <form onSubmit={handleAccountUpdate} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Username — editable until changed once */}
                      <div>
                        <label className={labelCls} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Username {user?.username_changed && <Lock size={12} style={{ color: C.g400 }} />}
                        </label>
                        {user?.username_changed ? (
                          <div className="px-4 py-2.5 border-2 rounded-xl text-sm font-medium flex items-center justify-between"
                            style={{ borderColor: C.g200, backgroundColor: C.g100, color: C.g500 }}>
                            <span>{accountForm.username}</span>
                            <Lock size={13} style={{ color: C.g400 }} />
                          </div>
                        ) : (
                          <input type="text" value={accountForm.username}
                            onChange={e => setAccountForm({ ...accountForm, username: e.target.value })}
                            className={inputCls} required style={inputStyle(accountForm.username)} />
                        )}
                        {user?.username_changed
                          ? <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.g400 }}><Lock size={9} />Username is permanently locked.</p>
                          : <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#D97706' }}>⚠ You can only change your username once. Choose carefully.</p>
                        }
                      </div>
                      {/* Full Name — editable until KYC */}
                      <div>
                        <label className={labelCls} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Full Name {kycVerified && <Lock size={12} style={{ color: C.g400 }} />}
                        </label>
                        {kycVerified ? (
                          <div className="px-4 py-2.5 border-2 rounded-xl text-sm font-medium flex items-center justify-between"
                            style={{ borderColor: C.g200, backgroundColor: C.g100, color: C.g500 }}>
                            <span>{accountForm.fullName}</span>
                            <Lock size={13} style={{ color: C.g400 }} />
                          </div>
                        ) : (
                          <input type="text" value={accountForm.fullName}
                            onChange={e => setAccountForm({ ...accountForm, fullName: e.target.value })}
                            className={inputCls} style={inputStyle(accountForm.fullName)} />
                        )}
                        {kycVerified
                          ? <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.g400 }}><Lock size={9} />Locked after ID verification.</p>
                          : <p className="text-xs mt-1" style={{ color: C.g500 }}>ℹ Full name cannot be changed after ID verification.</p>
                        }
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Email — read-only (can't change), show full email + verify button if not verified */}
                      <div>
                        <label className={labelCls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          Email Address
                          {emailVerified
                            ? <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5', color: C.success }}>✓ Verified</span>
                            : <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED', color: C.warn }}>⚠ Unverified</span>}
                        </label>
                        <div className="px-4 py-2.5 border-2 rounded-xl text-sm font-medium flex items-center justify-between"
                          style={{ borderColor: emailVerified ? '#DCFCE7' : '#FDE68A', backgroundColor: C.g50, color: C.g700 }}>
                          <span className="truncate">{maskEmail(accountForm.email)}</span>
                          {emailVerified
                            ? <CheckCircle size={14} style={{ color: C.success, flexShrink: 0 }} />
                            : <AlertCircle size={14} style={{ color: C.warn, flexShrink: 0 }} />}
                        </div>
                        <p className="text-xs mt-1" style={{ color: C.g400 }}>This is the email used to register. It cannot be changed.</p>
                        {!emailVerified && (
                          <div className="mt-2 space-y-2">
                            {emailVerifyStep === 'idle' && (
                              <button type="button" onClick={handleSendEmailCode} disabled={emailCodeLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-60"
                                style={{ backgroundColor: C.paid, color: 'white' }}>
                                {emailCodeLoading ? <RefreshCw size={11} className="animate-spin" /> : <Mail size={11} />}
                                {emailCodeLoading ? 'Sending code…' : 'Verify Email →'}
                              </button>
                            )}
                            {(emailVerifyStep === 'otp' || emailVerifyStep === 'verifying') && (
                              <>
                                <p className="text-xs" style={{ color: C.g500 }}>Code sent to your email — enter it below:</p>
                                <div className="flex gap-2 flex-wrap items-center">
                                  <input type="text" inputMode="numeric" maxLength={6}
                                    placeholder="000000" value={emailCode}
                                    onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="px-3 py-2 border-2 rounded-xl text-sm font-black focus:outline-none w-36"
                                    style={{ borderColor: C.paid, letterSpacing: '0.2em', color: C.g800 }} />
                                  <button type="button" onClick={handleVerifyEmailCode}
                                    disabled={emailVerifyStep === 'verifying' || emailCode.length < 6}
                                    className="px-3 py-2 rounded-xl text-white text-xs font-black disabled:opacity-50"
                                    style={{ backgroundColor: C.success }}>
                                    {emailVerifyStep === 'verifying' ? 'Verifying…' : '✓ Confirm'}
                                  </button>
                                  <button type="button" onClick={() => { setEmailVerifyStep('idle'); setEmailCode(''); }}
                                    className="text-xs underline" style={{ color: C.g400 }}>Resend</button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Phone — editable until verified, then locked */}
                      <div>
                        <label className={labelCls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          Phone Number
                          {phoneVerified || phoneStep === 'done'
                            ? <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5', color: C.success }}>✓ Verified</span>
                            : accountForm.phone
                              ? <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED', color: C.warn }}>⚠ Unverified</span>
                              : null}
                        </label>
                        {phoneVerified || phoneStep === 'done' ? (
                          <div className="px-4 py-2.5 border-2 rounded-xl text-sm font-medium flex items-center justify-between"
                            style={{ borderColor: '#DCFCE7', backgroundColor: C.g50, color: C.g700 }}>
                            <span>{accountForm.phone}</span>
                            <CheckCircle size={14} style={{ color: C.success, flexShrink: 0 }} />
                          </div>
                        ) : (
                          <input type="tel" value={accountForm.phone}
                            onChange={e => setAccountForm({ ...accountForm, phone: e.target.value })}
                            placeholder="+233 XX XXX XXXX" className={inputCls} style={inputStyle(accountForm.phone)} />
                        )}
                        {phoneVerified || phoneStep === 'done'
                          ? <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.g400 }}><Lock size={9} />Phone number locked after verification.</p>
                          : <p className="text-xs mt-1" style={{ color: C.g400 }}>Save your number then tap Verify Phone to get an OTP.</p>}
                        {/* Inline phone OTP flow — only when phone exists and not verified */}
                        {!phoneVerified && phoneStep !== 'done' && accountForm.phone && (
                          <div className="mt-2 space-y-2">
                            {(phoneStep === 'idle' || phoneStep === 'sending') && (
                              <button type="button" onClick={handleSendPhoneOtp} disabled={phoneStep === 'sending'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-60"
                                style={{ backgroundColor: C.paid, color: 'white' }}>
                                <Smartphone size={11} />
                                {phoneStep === 'sending' ? 'Sending OTP…' : 'Verify Phone →'}
                              </button>
                            )}
                            {(phoneStep === 'otp' || phoneStep === 'verifying') && (
                              <>
                                <p className="text-xs" style={{ color: C.g500 }}>OTP sent to {accountForm.phone}:</p>
                                <div className="flex gap-2 flex-wrap items-center">
                                  <input type="text" inputMode="numeric" maxLength={6}
                                    placeholder="000000" value={phoneOtp}
                                    onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="px-3 py-2 border-2 rounded-xl text-sm font-black focus:outline-none w-36"
                                    style={{ borderColor: C.paid, letterSpacing: '0.2em', color: C.g800 }} />
                                  <button type="button" onClick={handleVerifyPhone}
                                    disabled={phoneStep === 'verifying' || phoneOtp.length < 6}
                                    className="px-3 py-2 rounded-xl text-white text-xs font-black disabled:opacity-50"
                                    style={{ backgroundColor: C.success }}>
                                    {phoneStep === 'verifying' ? 'Verifying…' : '✓ Confirm'}
                                  </button>
                                  <button type="button" onClick={() => { setPhoneStep('idle'); setPhoneOtp(''); }}
                                    className="text-xs underline" style={{ color: C.g400 }}>Resend</button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio with 100-word limit */}
                    <div>
                      <label className={labelCls}>Bio <span className="font-normal text-gray-400">(optional)</span></label>
                      <textarea
                        value={accountForm.bio}
                        onChange={e => {
                          const val = e.target.value;
                          const wc = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
                          if (wc <= 100) setAccountForm({ ...accountForm, bio: val });
                        }}
                        placeholder="Tell traders a bit about yourself… (max 100 words)"
                        rows={2}
                        className={inputCls + " resize-none"} style={inputStyle(accountForm.bio)} />
                      <p className="text-xs mt-0.5 text-right"
                        style={{ color: (accountForm.bio || '').trim() === '' ? C.g400 : (accountForm.bio || '').trim().split(/\s+/).length >= 100 ? C.danger : C.g400 }}>
                        {(accountForm.bio || '').trim() === '' ? 0 : (accountForm.bio || '').trim().split(/\s+/).length}/100 words
                      </p>
                    </div>

                    <button type="submit" disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: C.green }}>
                      {loading ? <><RefreshCw size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                    </button>
                  </form>
                </div>

                {/* Name display preferences */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-1" style={{ color: C.forest }}>Name Display</h2>
                  <p className="text-xs text-gray-400 mb-4">How your name appears to other traders on the platform</p>
                  <div className="space-y-2">
                    {[
                      { val: 'full', label: 'Show full name', desc: 'e.g. Samuel Kwame', example: accountForm.fullName || 'Samuel Kwame' },
                      { val: 'initial', label: 'Show first name and last initial', desc: 'e.g. Samuel K.', example: accountForm.fullName ? accountForm.fullName.split(' ').map((w, i) => i === 0 ? w : w[0] + '.').join(' ') : 'Samuel K.' },
                      { val: 'hide', label: 'Hide full name', desc: 'Only username is shown', example: accountForm.username || 'samuel123' },
                    ].map(({ val, label, desc, example }) => (
                      <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${prefs.nameDisplay === val ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="nameDisplay" value={val} checked={prefs.nameDisplay === val} onChange={() => { setPrefs({ ...prefs, nameDisplay: val }); toggleFullName(val === 'hide'); }} className="accent-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{example}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── VERIFICATION ────────────────────────────────────── */}
            {activeTab === 'verification' && (
              <div className="space-y-5">
                {/* Verification level banner */}
                <div className="rounded-2xl p-5 border"
                  style={{ background: `linear-gradient(135deg,${C.forest},${C.green})`, borderColor: C.green }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <Shield size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-lg">Verification Level {verLevel}/3</p>
                      <p className="text-white/70 text-xs">
                        {verLevel === 3 ? '✅ Fully verified — maximum trade limits' :
                          verLevel === 2 ? '⚡ KYC required for higher limits' :
                          verLevel === 1 ? '⚠️ Add phone to unlock more features' :
                          '🔴 Start verification to begin trading'}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-white/70 text-xs mb-1">Trade limit</p>
                      <p className="text-white font-black text-sm">
                        {verLevel >= 3 ? 'Unlimited' : verLevel >= 2 ? '$2,000' : verLevel >= 1 ? '$500' : '$100'}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-white/20">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(verLevel / 3) * 100}%`, backgroundColor: C.gold }} />
                  </div>
                </div>

                {/* Verification steps */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-5" style={{ color: C.forest }}>Verification Steps</h2>
                  <div className="space-y-3">

                    {/* Step 1 — Email */}
                    <div className={`p-4 rounded-xl border transition ${emailVerified ? 'bg-green-50 border-green-200' : 'border-blue-200 bg-blue-50'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${emailVerified ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {emailVerified ? <CheckCircle size={18}/> : 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-sm ${emailVerified ? 'text-green-800' : 'text-blue-800'}`}>Email Verification</p>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${emailVerified ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>Basic</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${emailVerified ? 'text-green-600' : 'text-blue-600'}`}>
                            {emailVerified ? `${maskEmail(accountForm.email)} is verified ✓` : 'Verify your email address to start trading'}
                          </p>
                          {!emailVerified && (
                            <div className="mt-3 space-y-2">
                              {emailVerifyStep === 'idle' && (
                                <button onClick={handleSendEmailCode} disabled={emailCodeLoading}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-60"
                                  style={{ backgroundColor: C.paid }}>
                                  <Mail size={13} />
                                  {emailCodeLoading ? 'Sending…' : 'Send Verification Code →'}
                                </button>
                              )}
                              {(emailVerifyStep === 'otp' || emailVerifyStep === 'verifying') && (
                                <>
                                  <p className="text-xs" style={{ color: '#1e40af' }}>Code sent! Check your inbox:</p>
                                  <div className="flex gap-2 flex-wrap items-center">
                                    <input type="text" inputMode="numeric" maxLength={6}
                                      placeholder="000000" value={emailCode}
                                      onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      className="px-3 py-2 border-2 rounded-xl text-sm font-black focus:outline-none w-36"
                                      style={{ borderColor: '#3b82f6', letterSpacing: '0.2em', color: C.g800 }} />
                                    <button onClick={handleVerifyEmailCode}
                                      disabled={emailVerifyStep === 'verifying' || emailCode.length < 6}
                                      className="px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-50"
                                      style={{ backgroundColor: C.success }}>
                                      {emailVerifyStep === 'verifying' ? 'Verifying…' : '✓ Verify'}
                                    </button>
                                    <button onClick={() => { setEmailVerifyStep('idle'); setEmailCode(''); }} className="text-xs underline text-gray-400">Resend</button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {emailVerified
                          ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5"/>
                          : <span className="text-xs font-bold text-blue-600 flex-shrink-0 mt-0.5">Required →</span>}
                      </div>
                    </div>

                    {/* Step 2 — Phone (interactive) */}
                    <div className={`p-4 rounded-xl border transition ${phoneVerified||phoneStep==='done' ? 'bg-green-50 border-green-200' : emailVerified ? 'border-blue-200 bg-blue-50' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${phoneVerified||phoneStep==='done' ? 'bg-green-500 text-white' : emailVerified ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {phoneVerified||phoneStep==='done' ? <CheckCircle size={18}/> : 2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-sm ${phoneVerified||phoneStep==='done' ? 'text-green-800' : emailVerified ? 'text-blue-800' : 'text-gray-600'}`}>Phone Number</p>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${phoneVerified||phoneStep==='done' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>Standard</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${phoneVerified||phoneStep==='done' ? 'text-green-600' : emailVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                            {phoneVerified||phoneStep==='done' ? `${accountForm.phone||'Phone'} verified ✓` : 'Verify your phone number to unlock $2,000 trade limit'}
                          </p>

                          {/* Phone OTP flow */}
                          {!phoneVerified && phoneStep!=='done' && emailVerified && (
                            <div className="mt-3 space-y-2">
                              {(phoneStep==='idle'||phoneStep==='sending') && (
                                <button onClick={handleSendPhoneOtp} disabled={phoneStep==='sending'}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-60"
                                  style={{backgroundColor:C.paid}}>
                                  <Smartphone size={13}/>
                                  {phoneStep==='sending' ? 'Sending OTP…' : `Send OTP to ${accountForm.phone||'your phone'}`}
                                </button>
                              )}
                              {(phoneStep==='otp'||phoneStep==='verifying') && (
                                <div className="flex gap-2 items-center flex-wrap">
                                  <input
                                    type="text" inputMode="numeric" maxLength={6}
                                    placeholder="Enter 6-digit OTP"
                                    value={phoneOtp} onChange={e=>setPhoneOtp(e.target.value.replace(/\D/g,''))}
                                    className="px-3 py-2 border-2 rounded-xl text-sm font-black tracking-widest focus:outline-none w-40"
                                    style={{borderColor:C.paid, color:C.g800, letterSpacing:'0.2em'}}/>
                                  <button onClick={handleVerifyPhone} disabled={phoneStep==='verifying'}
                                    className="px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-60"
                                    style={{backgroundColor:C.success}}>
                                    {phoneStep==='verifying' ? 'Verifying…' : '✓ Verify'}
                                  </button>
                                  <button onClick={()=>{setPhoneStep('idle');setPhoneOtp('');}} className="text-xs text-gray-400 underline">Resend</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {phoneVerified||phoneStep==='done'
                          ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5"/>
                          : emailVerified ? null
                          : <Clock size={16} className="text-gray-300 flex-shrink-0 mt-0.5"/>}
                      </div>
                    </div>

                    {/* Step 3 — KYC (interactive) */}
                    <div className={`p-4 rounded-xl border transition ${kycVerified ? 'bg-green-50 border-green-200' : phoneVerified ? 'border-blue-200 bg-blue-50' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${kycVerified ? 'bg-green-500 text-white' : phoneVerified ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {kycVerified ? <CheckCircle size={18}/> : 3}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-sm ${kycVerified ? 'text-green-800' : phoneVerified ? 'text-blue-800' : 'text-gray-600'}`}>Identity (KYC)</p>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${kycVerified ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>Advanced</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${kycVerified ? 'text-green-600' : phoneVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                            {kycVerified ? 'Identity verified — unlimited trading unlocked ✓' : 'Upload your government ID + selfie for unlimited trading'}
                          </p>

                          {/* KYC upload flow */}
                          {!kycVerified && phoneVerified && !kycSubmitted && (
                            <div className="mt-3 space-y-2">
                              {[
                                { key: 'id',     label: '🪪 National ID / Passport' },
                                { key: 'selfie', label: '🤳 Selfie holding your ID' },
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer hover:border-blue-400 transition"
                                  style={{borderColor: kycFiles[key] ? C.success : C.g200}}>
                                  <Upload size={14} style={{color: kycFiles[key] ? C.success : C.g400, flexShrink:0}}/>
                                  <span className="text-xs font-bold flex-1" style={{color: kycFiles[key] ? C.success : C.g600}}>
                                    {kycFiles[key] ? `✓ ${kycFiles[key].name}` : label}
                                  </span>
                                  <input type="file" accept="image/*,.pdf" className="hidden"
                                    onChange={e=>setKycFiles(f=>({...f,[key]:e.target.files[0]||null}))}/>
                                </label>
                              ))}
                              <button onClick={handleKycSubmit} disabled={kycLoading||!kycFiles.id||!kycFiles.selfie}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black disabled:opacity-50 mt-1"
                                style={{backgroundColor: C.green}}>
                                {kycLoading ? <><RefreshCw size={13} className="animate-spin"/> Submitting…</> : <><Upload size={13}/> Submit for Review</>}
                              </button>
                            </div>
                          )}
                          {kycSubmitted && !kycVerified && (
                            <div className="mt-2 flex items-center gap-2 text-xs font-bold" style={{color:C.warn}}>
                              <Clock size={12}/> Under review — usually within 24 hours
                            </div>
                          )}
                        </div>
                        {kycVerified
                          ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5"/>
                          : phoneVerified ? null
                          : <Clock size={16} className="text-gray-300 flex-shrink-0 mt-0.5"/>}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Benefits table */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-4" style={{ color: C.forest }}>Verification Benefits</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: C.g100 }}>
                          <th className="text-left pb-3 font-bold text-gray-500">Feature</th>
                          <th className="text-center pb-3 font-bold text-gray-500">Basic</th>
                          <th className="text-center pb-3 font-bold text-gray-500">Standard</th>
                          <th className="text-center pb-3 font-bold text-gray-500">Advanced</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        {[
                          { feat: 'Trade limit', b: '$100', s: '$2,000', a: 'Unlimited' },
                          { feat: 'Create offers', b: '✅', s: '✅', a: '✅' },
                          { feat: 'P2P Trading', b: '✅', s: '✅', a: '✅' },
                          { feat: 'Gift cards', b: '✅', s: '✅', a: '✅' },
                          { feat: 'Affiliate program', b: '❌', s: '✅', a: '✅' },
                          { feat: 'VIP badge', b: '❌', s: '❌', a: '✅' },
                        ].map(({ feat, b, s, a }) => (
                          <tr key={feat} className="border-b last:border-0" style={{ borderColor: C.g50 }}>
                            <td className="py-2.5 font-semibold text-gray-700">{feat}</td>
                            <td className="py-2.5 text-center text-gray-600">{b}</td>
                            <td className="py-2.5 text-center text-gray-600">{s}</td>
                            <td className="py-2.5 text-center font-bold" style={{ color: C.green }}>{a}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ── SECURITY ────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-5" style={{ color: C.forest }}>Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {[
                      { key: 'currentPassword', label: 'Current Password', show: showPw.current, toggle: () => setShowPw({ ...showPw, current: !showPw.current }) },
                      { key: 'newPassword',      label: 'New Password',     show: showPw.new,     toggle: () => setShowPw({ ...showPw, new: !showPw.new }) },
                      { key: 'confirmPassword',  label: 'Confirm New Password', show: showPw.confirm, toggle: () => setShowPw({ ...showPw, confirm: !showPw.confirm }) },
                    ].map(({ key, label, show, toggle }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <div className="relative">
                          <input type={show ? 'text' : 'password'} value={passwordForm[key]}
                            onChange={e => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                            className={inputCls + " pr-10"} style={inputStyle(passwordForm[key])} required />
                          <button type="button" onClick={toggle} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Password strength */}
                    {passwordForm.newPassword && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Password strength</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => {
                            const len = passwordForm.newPassword.length;
                            const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
                            const hasNum = /\d/.test(passwordForm.newPassword);
                            const hasSpec = /[^a-zA-Z0-9]/.test(passwordForm.newPassword);
                            const score = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasUpper && hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                            const color = score <= 1 ? C.danger : score === 2 ? C.warn : score === 3 ? C.paid : C.success;
                            return <div key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= score ? color : C.g200 }} />;
                          })}
                        </div>
                      </div>
                    )}
                    <button type="submit" disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: C.green }}>
                      {loading ? <><RefreshCw size={15} className="animate-spin" /> Updating…</> : <><Lock size={15} /> Update Password</>}
                    </button>
                  </form>
                </div>

                {/* Active sessions */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                  <h2 className="text-lg font-black mb-4" style={{ color: C.forest }}>Account Actions</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: C.g100 }}>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-400">Add extra security to your account</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-red-100 bg-red-50">
                      <div>
                        <p className="text-sm font-bold text-red-700">Log Out</p>
                        <p className="text-xs text-red-400">Sign out of your account on this device</p>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold" style={{ backgroundColor: C.danger }}>
                        <LogOut size={13} /> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PREFERENCES ─────────────────────────────────────── */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                <h2 className="text-lg font-black mb-5" style={{ color: C.forest }}>Account Preferences</h2>
                <div className="space-y-5">
                  {/* Currency */}
                  <div>
                    <label className={labelCls}><DollarSign size={14} className="inline mr-1" /> Preferred Currency</label>
                    <select value={prefs.currency} onChange={e => setPrefs({ ...prefs, currency: e.target.value })}
                      className={inputCls} style={inputStyle(true)}>
                      {[['GHS', 'Ghana Cedi (₵)'], ['NGN', 'Nigerian Naira (₦)'], ['KES', 'Kenyan Shilling (KSh)'], ['ZAR', 'South African Rand (R)'], ['USD', 'US Dollar ($)'], ['EUR', 'Euro (€)'], ['GBP', 'British Pound (£)']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className={labelCls}><Languages size={14} className="inline mr-1" /> Language</label>
                    <select value={prefs.language} onChange={e => setPrefs({ ...prefs, language: e.target.value })}
                      className={inputCls} style={inputStyle(true)}>
                      {[['en', 'English'], ['fr', 'French'], ['pt', 'Portuguese'], ['sw', 'Swahili'], ['ha', 'Hausa']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className={labelCls}><MapPin size={14} className="inline mr-1" /> Timezone</label>
                    <select value={prefs.timezone} onChange={e => setPrefs({ ...prefs, timezone: e.target.value })}
                      className={inputCls} style={inputStyle(true)}>
                      {[
                        ['Africa/Accra', 'Africa/Accra (GMT+0)'], ['Africa/Lagos', 'Africa/Lagos (GMT+1)'],
                        ['Africa/Nairobi', 'Africa/Nairobi (GMT+3)'], ['Africa/Johannesburg', 'Africa/Johannesburg (GMT+2)'],
                        ['Europe/London', 'Europe/London (GMT+0/+1)'], ['America/New_York', 'America/New_York (GMT-5/-4)'],
                        ['America/Los_Angeles', 'America/Los_Angeles (GMT-8/-7)'],
                      ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>

                  <button onClick={handleSavePreferences} disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: C.green }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/> Saving…</> : <><Save size={15}/> Save Preferences</>}
                  </button>
                  <p className="text-xs mt-2" style={{color:C.g400}}>Currency selection affects how values display in your wallet.</p>
                </div>
              </div>
            )}

            {/* ── PAYMENT METHODS ──────────────────────────────────── */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                <h2 className="text-lg font-black mb-2" style={{ color: C.forest }}>Payment Methods</h2>
                <p className="text-xs text-gray-400 mb-5">These details are shared with buyers/sellers during a trade</p>
                <form onSubmit={handlePaymentUpdate} className="space-y-4">
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input type="text" value={payments.bankName} onChange={e => setPayments({ ...payments, bankName: e.target.value })}
                      placeholder="e.g. GCB Bank, GTBank, Ecobank" className={inputCls} style={inputStyle(payments.bankName)} />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Account Number</label>
                    <input type="text" value={payments.accountNumber} onChange={e => setPayments({ ...payments, accountNumber: e.target.value })}
                      placeholder="Enter account number" className={inputCls} style={inputStyle(payments.accountNumber)} />
                  </div>
                  <div>
                    <label className={labelCls}>Mobile Money Provider</label>
                    <select value={payments.mobileProvider} onChange={e => setPayments({ ...payments, mobileProvider: e.target.value })}
                      className={inputCls} style={inputStyle(payments.mobileProvider)}>
                      <option value="">Select provider</option>
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="vodafone">Vodafone Cash</option>
                      <option value="airteltigo">AirtelTigo Money</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="opay">OPay</option>
                      <option value="palmpay">PalmPay</option>
                      <option value="wave">Wave</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mobile Money Number</label>
                    <input type="tel" value={payments.mobileNumber} onChange={e => setPayments({ ...payments, mobileNumber: e.target.value })}
                      placeholder="+233 XX XXX XXXX" className={inputCls} style={inputStyle(payments.mobileNumber)} />
                  </div>
                  <div className="p-3 rounded-xl text-xs font-semibold flex items-start gap-2" style={{ backgroundColor: `${C.warn}12`, color: '#92400E' }}>
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                    Your payment details are only shared with your trade partner during an active trade. Never share outside the platform.
                  </div>
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: C.green }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Payment Methods</>}
                  </button>
                </form>
              </div>
            )}

            {/* ── NOTIFICATIONS ───────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: C.g200 }}>
                <h2 className="text-lg font-black mb-5" style={{ color: C.forest }}>Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { section: '📧 Email Notifications', items: [
                      { key: 'email_trades',   label: 'Trade Updates',     desc: 'New trades, payments, releases' },
                      { key: 'email_security', label: 'Security Alerts',   desc: 'Login attempts, password changes' },
                      { key: 'email_marketing',label: 'News & Promotions', desc: 'Platform updates and offers' },
                    ]},
                    { section: '🔔 Push Notifications', items: [
                      { key: 'push_trades',   label: 'Trade Alerts',   desc: 'Real-time trade status updates' },
                      { key: 'push_messages', label: 'Chat Messages',  desc: 'New messages in trade chat' },
                      { key: 'push_disputes', label: 'Dispute Alerts', desc: 'Dispute opened or resolved' },
                    ]},
                  ].map(({ section, items }) => (
                    <div key={section}>
                      <p className="text-sm font-black text-gray-700 mb-2">{section}</p>
                      <div className="space-y-2">
                        {items.map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border" style={{ borderColor: C.g100 }}>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{label}</p>
                              <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <Toggle checked={notifs[key]} onChange={v => setNotifs({ ...notifs, [key]: v })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => toast.success('Notification preferences saved!')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                    style={{ backgroundColor: C.green }}>
                    <Save size={15} /> Save Preferences
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: C.forest }}>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <span className="text-xl font-black" style={{ fontFamily: "'Syne',sans-serif" }}>
                <span className="text-white">PRA</span><span style={{ color: C.gold }}>QEN</span>
              </span>
              <p className="text-xs leading-relaxed my-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. 0.5% fee only.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { href: 'https://x.com/praqenapp?s=21', label: '𝕏' },
                  { href: 'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr', label: '📸' },
                  { href: 'https://www.linkedin.com/in/pra-qen-045373402/', label: '💼' },
                  { href: 'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t', label: '💬' },
                  { href: 'https://discord.gg/V6zCZxfdy', label: '🎮' },
                ].map(({ href, label }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Account</p>
              <div className="space-y-2">
                {[['Profile', '/profile'], ['My Trades', '/my-trades'], ['My Listings', '/my-listings'], ['Wallet', '/wallet'], ['Dashboard', '/dashboard']].map(([l, h]) => (
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Support</p>
              <div className="space-y-2">
                {[
                  ['💬 WhatsApp', 'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
                  ['🎮 Discord', 'https://discord.gg/V6zCZxfdy'],
                  ['📧 support@praqen.com', 'mailto:support@praqen.com'],
                ].map(([l, h]) => (
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="block text-xs hover:text-white transition" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Shield size={10} /> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
