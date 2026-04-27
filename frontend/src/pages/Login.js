import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import { supabase } from '../lib/supabaseClient';
import {
  Mail, Lock, Eye, EyeOff, Shield, ArrowRight,
  AlertCircle, RefreshCw, Smartphone, AtSign, Bitcoin,
  Home, Wallet, Gift, LogIn,
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6',
};

const PHONE_CODES = [
  { flag:'🇬🇭', code:'+233', name:'Ghana' },
  { flag:'🇳🇬', code:'+234', name:'Nigeria' },
  { flag:'🇰🇪', code:'+254', name:'Kenya' },
  { flag:'🇿🇦', code:'+27',  name:'South Africa' },
  { flag:'🇺🇬', code:'+256', name:'Uganda' },
  { flag:'🇺🇸', code:'+1',   name:'United States' },
  { flag:'🇬🇧', code:'+44',  name:'United Kingdom' },
  { flag:'🇪🇺', code:'+32',  name:'Europe' },
  { flag:'🇨🇲', code:'+237', name:'Cameroon' },
  { flag:'🇸🇳', code:'+221', name:'Senegal' },
];

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectMessage = searchParams.get('message');

  const [method, setMethod]         = useState('email'); // 'email' | 'phone'
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [phoneCode, setPhoneCode]   = useState(PHONE_CODES[0]);
  const [showCodes, setShowCodes]   = useState(false);
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);

  const contact = method === 'email' ? email : `${phoneCode.code}${phone}`;

  const resendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: method === 'email' ? email : undefined,
      });
      if (error) {
        setError(error.message);
      } else {
        setError('Verification email sent! Please check your inbox.');
        setShowResend(false);
      }
    } catch (err) {
      setError('Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: contact,
      });
      if (error) {
        setError(error.message);
      } else {
        setOtpSent(true);
        setError('OTP sent to your phone! Please enter the code.');
      }
    } catch (err) {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: contact,
        token: otp,
        type: 'sms',
      });
      if (error) {
        setError(error.message);
      } else {
        // OTP verified, now get user data from backend
        const response = await axios.post(`${API_URL}/auth/login`, {
          phone: contact,
          method: 'phone',
        });
        if (response.data.success) {
          if (rememberMe) localStorage.setItem('remember_contact', contact);
          onLogin(response.data.user, response.data.token);
          navigate('/buy-bitcoin');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (method === 'email') {
      if (!email) { setError('Email is required'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return false; }
      if (!password) { setError('Password is required'); return false; }
    } else {
      if (!phone) { setError('Phone number is required'); return false; }
      if (phone.length < 6) { setError('Enter a valid phone number'); return false; }
    }
    return true;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password,
      });
      if (response.data.success) {
        if (rememberMe) localStorage.setItem('remember_contact', email);
        onLogin(response.data.user, response.data.token);
        navigate('/buy-bitcoin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-16 md:pb-0"
      style={{ 
        background:`linear-gradient(135deg, ${C.mist} 0%, rgba(64,145,108,0.08) 100%)`, 
        fontFamily:"'DM Sans',sans-serif" 
      }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse-soft{0%,100%{opacity:1}50%{opacity:0.7}}
        @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-8px)}}
        @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .slide{animation:slideUp .25s ease}
        .fade-in{animation:fadeIn .4s ease}
        .pulse-soft{animation:pulse-soft 3s ease-in-out infinite}
        .float{animation:float 6s ease-in-out infinite}
        .shimmer-grad{background-size:200% 200%;animation:shimmer 3s ease infinite}
      `}</style>

      {/* ── Left branding panel (desktop only) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background:`linear-gradient(140deg,${C.forest} 0%,${C.green} 50%,${C.mint} 100%)` }}>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize:'28px 28px' }}/>
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none float"
          style={{ backgroundColor: C.gold }}/>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ backgroundColor: C.white }}/>

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl animate-pulse-soft"
              style={{ backgroundColor: C.gold, color: C.forest }}>P</div>
            <span className="text-white font-black text-xl" style={{ fontFamily:"'Syne',sans-serif" }}>PRAQEN</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-3" style={{ fontFamily:"'Syne',sans-serif" }}>
            Welcome Back<br/>to P2P Trading
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-10">
            Log in to access your offers, active trades, wallet, and trade history.
          </p>
          <div className="space-y-3">
            {[
              { icon:'🔒', label:'Escrow on every trade',    sub:'Your funds are always protected' },
              { icon:'⚡', label:'Instant trade matching',   sub:'Thousands of live offers waiting' },
              { icon:'💸', label:'0.5% flat fee only',       sub:'No surprise charges. Ever.' },
              { icon:'🌍', label:'180+ countries',           sub:'GHS, NGN, KES, EUR, USD and more' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl transform hover:scale-105 transition-transform"
                style={{ backgroundColor:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-white text-xs font-bold">{label}</p>
                  <p className="text-white/60 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-white/50 text-xs">
          <Shield size={12}/> 256-bit SSL encrypted · ISO 27001 standards
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 pt-6 md:py-10 relative">
        {/* Decorative elements - visible on all screens */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: C.green }}/>
        <div className="absolute bottom-20 left-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ backgroundColor: C.gold }}/>

        <div className="w-full max-w-md slide relative z-10">

          {/* Mobile header graphic */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-pulse-soft"
                style={{ backgroundColor:`linear-gradient(135deg, ${C.gold}, ${C.amber})` }}>
                🔐
              </div>
            </div>
            <h1 className="font-black text-2xl mb-1" style={{ color: C.forest, fontFamily:"'Syne',sans-serif" }}>
              Welcome Back
            </h1>
            <p className="text-xs" style={{ color: C.g500 }}>
              Secure login to your PRAQEN account
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden backdrop-blur-xl" 
            style={{ borderColor: C.g100 }}>

            {/* Header */}
            <div className="px-5 md:px-7 py-6 md:py-7 border-b bg-gradient-to-r from-white to-gray-50" 
              style={{ borderColor: C.g100 }}>
              <div className="hidden md:block">
                <h1 className="font-black text-2xl" style={{ color: C.forest, fontFamily:"'Syne',sans-serif" }}>
                  Sign In
                </h1>
                <p className="text-xs mt-1" style={{ color: C.g500 }}>
                  Use your email or phone number to continue
                </p>
              </div>
              <div className="md:hidden">
                <p className="text-xs" style={{ color: C.g500 }}>
                  Step into your account
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 md:px-7 py-6 md:py-7 space-y-4">

              {/* Redirect message (e.g. from marketplace) */}
              {redirectMessage && !error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl text-xs animate-fade-in transform"
                  style={{ backgroundColor:'#FFFBEB', color:'#92400E', border:`1.5px solid #FDE68A` }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>{redirectMessage}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl text-xs animate-fade-in transform"
                  style={{ backgroundColor:'#FEF2F2', color: C.danger, border:`1.5px solid #FECACA` }}>
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>{error}
                </div>
              )}

              {/* Resend verification */}
              {showResend && (
                <button onClick={resendVerification} disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 transform hover:scale-105"
                  style={{ background:`linear-gradient(135deg, ${C.green}, ${C.mint})` }}>
                  {loading ? <RefreshCw size={12} className="animate-spin"/> : <Mail size={12}/>}
                  Resend Verification Email
                </button>
              )}

              {/* Method toggle */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl" style={{ backgroundColor: C.g100 }}>
                {[
                  { val:'email', Icon:AtSign,     label:'Email' },
                  { val:'phone', Icon:Smartphone, label:'Phone' },
                ].map(({ val, Icon, label }) => (
                  <button key={val} onClick={() => { setMethod(val); setError(''); setOtpSent(false); setOtp(''); }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition transform"
                    style={{
                      backgroundColor: method === val ? C.white : 'transparent',
                      color: method === val ? C.green : C.g500,
                      boxShadow: method === val ? '0 2px 8px rgba(45,106,79,0.15)' : 'none',
                    }}>
                    <Icon size={14}/>{label}
                  </button>
                ))}
              </div>

              {/* Contact input */}
              {method === 'email' ? (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: C.g700 }}>Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.g400 }}/>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3.5 text-sm border-2 rounded-xl focus:outline-none transition focus:shadow-lg"
                      style={{
                        borderColor: error && !email ? C.danger : email ? C.green : C.g200,
                        color: C.g800,
                        fontSize:'15px',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: C.g700 }}>Phone Number</label>
                  <div className="flex gap-2">
                    {/* Country code */}
                    <div className="relative flex-shrink-0">
                      <button onClick={() => setShowCodes(!showCodes)}
                        className="flex items-center gap-1.5 px-3.5 py-3.5 border-2 rounded-xl text-xs font-bold transition transform hover:scale-105"
                        style={{ borderColor: C.g200, color: C.g700 }}>
                        <span className="text-sm">{phoneCode.flag}</span>
                        <span className="text-xs">{phoneCode.code}</span>
                        <span className="text-xs" style={{ color: C.g400 }}>▼</span>
                      </button>
                      {showCodes && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl z-50 border max-h-48 overflow-y-auto transform"
                          style={{ borderColor: C.g100 }}>
                          {PHONE_CODES.map(pc => (
                            <button key={pc.code} onClick={() => { setPhoneCode(pc); setShowCodes(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-xs border-b last:border-0 transition"
                              style={{ borderColor: C.g50 }}>
                              <span className="text-base">{pc.flag}</span>
                              <span className="font-bold flex-1" style={{ color: C.g700 }}>{pc.name}</span>
                              <span className="text-xs" style={{ color: C.g400 }}>{pc.code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.g400 }}/>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value.replace(/\D/g,'')); setError(''); }}
                        placeholder="24 XXX XXXX"
                        className="w-full pl-10 pr-4 py-3.5 text-sm border-2 rounded-xl focus:outline-none transition focus:shadow-lg"
                        style={{
                          borderColor: error && !phone ? C.danger : phone ? C.green : C.g200,
                          color: C.g800,
                          fontSize:'15px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email: Password */}
              {method === 'email' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold" style={{ color: C.g700 }}>Password</label>
                      <Link to="/forgot-password"
                        className="text-xs font-bold hover:underline transition"
                        style={{ color: C.green }}>
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.g400 }}/>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3.5 text-sm border-2 rounded-xl focus:outline-none transition focus:shadow-lg"
                        style={{
                          borderColor: error && !password ? C.danger : password ? C.green : C.g200,
                          color: C.g800,
                          fontSize:'15px',
                        }}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-75 transition"
                        style={{ color: C.g400 }}>
                        {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div onClick={() => setRememberMe(!rememberMe)}
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition transform group-hover:scale-110"
                      style={{
                        borderColor: rememberMe ? C.green : C.g300,
                        backgroundColor: rememberMe ? C.green : 'transparent',
                      }}>
                      {rememberMe && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: C.g600 }}>Remember me on this device</span>
                  </label>

                  {/* Submit Email */}
                  <button onClick={handleEmailLogin} disabled={loading}
                    className="w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    {loading
                      ? <><RefreshCw size={15} className="animate-spin"/>Signing in…</>
                      : <>Sign In <ArrowRight size={16}/></>}
                  </button>
                </>
              )}

              {/* Phone: OTP */}
              {method === 'phone' && (
                <>
                  {!otpSent ? (
                    <button onClick={sendOtp} disabled={loading}
                      className="w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg"
                      style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                      {loading
                        ? <><RefreshCw size={15} className="animate-spin"/>Sending OTP…</>
                        : <>Send OTP <ArrowRight size={16}/></>}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-2" style={{ color: C.g700 }}>Enter 6-digit OTP</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
                          placeholder="123456"
                          className="w-full px-4 py-3.5 text-sm border-2 rounded-xl focus:outline-none transition focus:shadow-lg text-center font-mono text-xl tracking-widest"
                          style={{
                            borderColor: error && otp.length !== 6 ? C.danger : otp.length === 6 ? C.green : C.g200,
                            color: C.g800,
                            fontSize:'18px',
                          }}
                        />
                      </div>

                      {/* Verify OTP */}
                      <button onClick={verifyOtp} disabled={loading || otp.length !== 6}
                        className="w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2.5 transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg"
                        style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                        {loading
                          ? <><RefreshCw size={15} className="animate-spin"/>Verifying…</>
                          : <>Verify OTP <ArrowRight size={16}/></>}
                      </button>

                      <button onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                        style={{ color: C.green }}>
                        Resend OTP
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ backgroundColor: C.g200 }}/>
                <span className="text-xs font-semibold px-1" style={{ color: C.g400 }}>OR</span>
                <div className="flex-1 h-px" style={{ backgroundColor: C.g200 }}/>
              </div>

              {/* Register link */}
              <button onClick={() => navigate('/register')}
                className="w-full py-3.5 rounded-xl text-sm font-bold border-2 hover:bg-gray-50 transition transform hover:scale-105"
                style={{ borderColor: C.green, color: C.green }}>
                Create a Free Account
              </button>

              {/* Trust badges - mobile */}
              <div className="lg:hidden grid grid-cols-3 gap-2 pt-2">
                {[
                  { icon:'🔒', label:'Secure' },
                  { icon:'⚡', label:'Fast' },
                  { icon:'🌍', label:'Global' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2.5 rounded-lg" 
                    style={{ backgroundColor: C.g50 }}>
                    <span className="text-lg">{icon}</span>
                    <span className="text-xs font-bold" style={{ color: C.g600 }}>{label}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Card footer */}
            <div className="px-5 md:px-7 py-3.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: C.g100, backgroundColor: C.g50 }}>
              <div className="flex items-center gap-1.5" style={{ color: C.g400 }}>
                <Shield size={12}/> Encrypted
              </div>
              <div style={{ color: C.g400 }}>© 2025 PRAQEN</div>
            </div>
          </div>

          {/* Bottom sign-up link */}
          <div className="text-center text-xs mt-5" style={{ color: C.g500 }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-black hover:underline transition" style={{ color: C.green }}>Sign Up Free</Link>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden shadow-2xl"
        style={{borderColor:C.g100, paddingBottom:'env(safe-area-inset-bottom)'}}>
        <div className="flex items-center justify-around px-2 py-2">
          {[
            {icon:Home,    label:'Home',       path:'/'},
            {icon:Bitcoin, label:'P2P',        path:'/buy-bitcoin'},
            {icon:Gift,    label:'Gifts',      path:'/gift-cards'},
            {icon:Wallet,  label:'Wallet',     path:'/login'},
            {icon:LogIn,   label:'Login',      path:'/login'},
          ].map(({icon:Icon,label,path})=>(
            <button key={label} onClick={()=>navigate(path)}
              className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition transform hover:scale-110 active:scale-95"
              style={{color: label==='Login' ? C.forest : C.g400}}>
              <Icon size={21} strokeWidth={label==='Login'?2.5:1.8}/>
              <span className="text-xs font-bold">{label}</span>
              {label==='Login' && <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:C.forest}}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
