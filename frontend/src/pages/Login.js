import React, { useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import {
  Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft,
  AlertCircle, RefreshCw, Smartphone, CheckCircle, ChevronDown,
  Home, Gift, LogIn,
} from 'lucide-react';

const C = {
  forest: '#1B4332', green: '#2D6A4F', mint: '#40916C',
  gold: '#F4A422', white: '#FFFFFF', mist: '#F0F9F4',
  g50: '#F8FAFC', g100: '#F1F5F9', g200: '#E2E8F0',
  g300: '#CBD5E1', g400: '#94A3B8', g500: '#64748B',
  g600: '#475569', g700: '#334155', g800: '#1E293B',
  success: '#10B981', danger: '#EF4444',
  blue: '#3B82F6', indigo: '#6366F1',
};

const COUNTRIES = [
  { flag: '🇬🇭', name: 'Ghana',         code: '+233', min: 9,  max: 9  },
  { flag: '🇳🇬', name: 'Nigeria',       code: '+234', min: 10, max: 10 },
  { flag: '🇰🇪', name: 'Kenya',         code: '+254', min: 9,  max: 9  },
  { flag: '🇿🇦', name: 'South Africa',  code: '+27',  min: 9,  max: 9  },
  { flag: '🇹🇿', name: 'Tanzania',      code: '+255', min: 9,  max: 9  },
  { flag: '🇺🇬', name: 'Uganda',        code: '+256', min: 9,  max: 9  },
  { flag: '🇷🇼', name: 'Rwanda',        code: '+250', min: 9,  max: 9  },
  { flag: '🇿🇲', name: 'Zambia',        code: '+260', min: 9,  max: 9  },
  { flag: '🇪🇬', name: 'Egypt',         code: '+20',  min: 10, max: 10 },
  { flag: '🇲🇦', name: 'Morocco',       code: '+212', min: 9,  max: 9  },
  { flag: '🇺🇸', name: 'United States', code: '+1',   min: 10, max: 10 },
  { flag: '🇨🇦', name: 'Canada',        code: '+1',   min: 10, max: 10 },
  { flag: '🇬🇧', name: 'United Kingdom',code: '+44',  min: 10, max: 10 },
  { flag: '🇩🇪', name: 'Germany',       code: '+49',  min: 10, max: 11 },
  { flag: '🇫🇷', name: 'France',        code: '+33',  min: 9,  max: 9  },
  { flag: '🇸🇦', name: 'Saudi Arabia',  code: '+966', min: 9,  max: 9  },
  { flag: '🇦🇪', name: 'UAE',           code: '+971', min: 9,  max: 9  },
  { flag: '🇮🇳', name: 'India',         code: '+91',  min: 10, max: 10 },
  { flag: '🇵🇰', name: 'Pakistan',      code: '+92',  min: 10, max: 10 },
  { flag: '🇦🇺', name: 'Australia',     code: '+61',  min: 9,  max: 9  },
  { flag: '🇧🇷', name: 'Brazil',        code: '+55',  min: 10, max: 11 },
  { flag: '🇨🇳', name: 'China',         code: '+86',  min: 11, max: 11 },
  { flag: '🇮🇩', name: 'Indonesia',     code: '+62',  min: 9,  max: 12 },
  { flag: '🇸🇬', name: 'Singapore',     code: '+65',  min: 8,  max: 8  },
];

function OtpBoxes({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const focus = i => refs[i]?.current?.focus();

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = [...digits];
    arr[i] = d;
    onChange(arr.join(''));
    if (d && i < 5) focus(i + 1);
  };
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const arr = [...digits]; arr[i - 1] = '';
      onChange(arr.join('')); focus(i - 1);
    }
  };
  const handlePaste = e => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p); focus(Math.min(p.length, 5)); e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="pq-otp"
          style={{
            width: 38, height: 50, borderRadius: 12,
            textAlign: 'center', fontSize: 20, fontWeight: 800,
            border: `2.5px solid ${d ? C.green : C.g200}`,
            color: C.forest, background: d ? `${C.green}10` : C.white,
            outline: 'none', transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      ))}
    </div>
  );
}

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const msg = searchParams.get('message');

  const [step, setStep]       = useState('choose');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone]     = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [search, setSearch]   = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');

  const fullPhone = `${country.code}${phone.replace(/^0+/, '')}`;

  const go = newStep => {
    setStep(newStep); setError(''); setNotice('');
    setOtp(''); setOtpSent(false); setShowDrop(false); setSearch('');
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  const validatePhone = () => {
    const digits = phone.replace(/^0+/, '');
    if (!digits || digits.length < country.min) {
      setError(`Enter a valid ${country.name} number (${country.min}–${country.max} digits after country code)`);
      return false;
    }
    return true;
  };

  const handleEmailLogin = async e => {
    e?.preventDefault(); setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (data.success) {
        if (remember) localStorage.setItem('remember_contact', email);
        onLogin(data.user, data.token);
        navigate('/buy-bitcoin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details and try again.');
    } finally { setLoading(false); }
  };

  const sendSms = async () => {
    setError('');
    if (!validatePhone()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { phone: fullPhone, channel: 'sms' });
      setOtpSent(true); setNotice(`Code sent to ${fullPhone}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  };

  const verifySms = async () => {
    if (otp.length !== 6) { setError('Enter the full 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, { phone: fullPhone, code: otp });
      const { data } = await axios.post(`${API_URL}/auth/login`, { phone: fullPhone, method: 'phone' });
      if (data.success) { onLogin(data.user, data.token); navigate('/buy-bitcoin'); }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
      setOtp('');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif", background: C.mist }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        @keyframes pqUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pqIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pqSpin{ to   { transform:rotate(360deg); } }
        .pq-anim  { animation: pqUp  0.3s cubic-bezier(0.22,0.68,0,1.1) both; }
        .pq-fade  { animation: pqIn  0.25s ease both; }
        .pq-spin  { animation: pqSpin 0.7s linear infinite; }
        .pq-inp:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.12) !important; outline: none; }
        .pq-otp:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.12) !important; }
        .pq-card { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .pq-card:hover { border-color: #2D6A4F !important; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(27,67,50,0.12) !important; }
        .pq-card:active { transform: none; }
        .pq-btn { transition: opacity 0.12s, transform 0.1s; }
        .pq-btn:active { transform: scale(0.99); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        button, a { touch-action: manipulation; }
        input, select { font-size: 16px !important; }
        html, body { overscroll-behavior: none; }
      `}</style>

      {/* ── Desktop left panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-5/12 flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${C.forest} 0%, ${C.green} 58%, ${C.mint} 100%)` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '28px 28px' }}/>
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full pointer-events-none blur-3xl"
          style={{ background: C.gold, opacity: 0.10 }}/>

        <div className="relative z-10">
          {/* praqen wordmark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)', marginBottom: 36 }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 800, letterSpacing: '7px', fontFamily: "'DM Sans', sans-serif" }}>praqen</span>
          </div>

          <h2 className="font-black text-white leading-tight" style={{ fontFamily: "'Syne',sans-serif", fontSize: 38, margin: '0 0 14px' }}>
            Buy & Sell Bitcoin<br/>the Safe Way ⚡
          </h2>
          <p className="text-sm leading-relaxed mb-9" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Africa's most trusted P2P Bitcoin platform.<br/>Real escrow. Real people. Zero fraud.
          </p>

          <div className="space-y-2.5">
            {[
              { icon: '🔒', t: 'Escrow on every trade',       s: 'Bitcoin locked until both sides confirm' },
              { icon: '⚡', t: 'Settle in under 15 minutes', s: 'Mobile money, bank transfer & more' },
              { icon: '🌍', t: '180+ countries supported',   s: 'GHS, NGN, KES, USD, EUR and more' },
            ].map(({ icon, t, s }) => (
              <div key={t} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-white text-sm font-bold m-0">{t}</p>
                  <p className="text-xs m-0" style={{ color: 'rgba(255,255,255,0.45)' }}>{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
          <Shield size={12}/>256-bit encrypted · ISO 27001 certified
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center overflow-y-auto" style={{ background: C.mist, minHeight: '100vh' }}>

        {/* Mobile hero — hidden on desktop */}
        <div className="lg:hidden relative overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(150deg, ${C.forest} 0%, ${C.green} 55%, ${C.mint} 100%)`, padding: '24px 20px 52px' }}>
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px', opacity: 0.06 }}/>
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full blur-3xl pointer-events-none"
            style={{ background: C.gold, opacity: 0.20 }}/>
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl pointer-events-none"
            style={{ background: C.mint, opacity: 0.25 }}/>
          <div className="relative">
            {/* praqen wordmark */}
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)', marginBottom: 14 }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '6px', fontFamily: "'DM Sans',sans-serif" }}>praqen</span>
            </div>

            <h1 className="font-black text-white leading-tight" style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, margin: '0 0 8px' }}>
              Buy & Sell Bitcoin<br/>Safe. Fast. Easy.
            </h1>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
              Escrow-protected P2P trades — no bank needed.
            </p>

            {/* Trust pills */}
            <div className="flex gap-2 flex-wrap">
              {[['🔒','Escrow'],['⚡','Instant'],['🌍','180+ Countries']].map(([ic, lb]) => (
                <div key={lb} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)' }}>
                  <span>{ic}</span>{lb}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full sm:max-w-md sm:mx-auto lg:max-w-md px-3 sm:px-4 lg:px-0 -mt-10 lg:mt-0 pb-28 sm:pb-10 lg:py-10">
          <div className="bg-white rounded-3xl overflow-hidden pq-anim"
            style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}>

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b" style={{ borderColor: C.g100 }}>
              <div className="flex items-center gap-3">
                {step !== 'choose' && (
                  <button onClick={() => go('choose')}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:bg-gray-100"
                    style={{ border: `1.5px solid ${C.g200}`, color: C.g500, background: C.white }}>
                    <ArrowLeft size={15}/>
                  </button>
                )}
                <div>
                  <h1 className="text-lg font-black m-0 leading-tight" style={{ color: C.forest, fontFamily: "'Syne',sans-serif" }}>
                    {step === 'choose' ? 'Sign In' : step === 'email' ? 'Email Sign In' : otpSent ? 'Enter Your Code' : 'Phone Sign In'}
                  </h1>
                  <p className="text-xs mt-1 m-0" style={{ color: C.g500 }}>
                    {step === 'choose' ? 'Choose your sign-in method'
                      : step === 'email' ? 'Use your email address & password'
                      : otpSent ? `Code sent to ${fullPhone}`
                      : "We'll send a 6-digit code via SMS"}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 pq-fade" key={step + String(otpSent)}>

              {/* Alerts */}
              {msg && !error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: '#FFFBEB', color: '#92400E', border: '1.5px solid #FDE68A' }}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5"/>{msg}
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: '#FEF2F2', color: C.danger, border: `1.5px solid #FECACA` }}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5"/>{error}
                </div>
              )}
              {notice && !error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: '#F0FDF4', color: C.success, border: '1.5px solid #BBF7D0' }}>
                  <CheckCircle size={13} className="flex-shrink-0 mt-0.5"/>{notice}
                </div>
              )}

              {/* ═══ CHOOSE ═══ */}
              {step === 'choose' && (
                <>
                  <p className="text-center text-xs font-semibold m-0" style={{ color: C.g500 }}>
                    Choose how you'd like to sign in
                  </p>

                  <div className="flex flex-col gap-3">
                    <button className="pq-card flex items-center gap-4 p-4 rounded-2xl text-left w-full"
                      onClick={() => go('email')}
                      style={{ border: `2px solid ${C.g200}`, background: C.white, boxShadow: '0 2px 12px rgba(27,67,50,0.06)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${C.green}, ${C.mint})`, boxShadow: '0 4px 14px rgba(45,106,79,0.28)' }}>
                        <Mail size={22} color="white"/>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-black text-sm m-0" style={{ color: C.forest }}>Continue with Email</p>
                        <p className="text-xs mt-1 m-0 leading-relaxed" style={{ color: C.g500 }}>Sign in with your email & password</p>
                      </div>
                      <ArrowRight size={17} className="flex-shrink-0" style={{ color: C.g300 }}/>
                    </button>

                    <button className="pq-card flex items-center gap-4 p-4 rounded-2xl text-left w-full"
                      onClick={() => go('sms')}
                      style={{ border: `2px solid ${C.g200}`, background: C.white, boxShadow: '0 2px 12px rgba(27,67,50,0.06)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 14px rgba(59,130,246,0.28)' }}>
                        <Smartphone size={22} color="white"/>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-black text-sm m-0" style={{ color: C.forest }}>Continue with Phone (SMS)</p>
                        <p className="text-xs mt-1 m-0 leading-relaxed" style={{ color: C.g500 }}>Get a one-time 6-digit code via text</p>
                      </div>
                      <ArrowRight size={17} className="flex-shrink-0" style={{ color: C.g300 }}/>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-5 p-3 rounded-xl flex-wrap"
                    style={{ background: C.g50, border: `1px solid ${C.g100}` }}>
                    {[['🔒','256-bit SSL'],['✅','2.4M+ traders'],['🌍','180+ countries']].map(([ic, lb]) => (
                      <div key={lb} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.g500 }}>
                        <span>{ic}</span>{lb}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ═══ EMAIL ═══ */}
              {step === 'email' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(45,106,79,0.06)', border: '1.5px solid rgba(45,106,79,0.15)' }}>
                    <Mail size={14} style={{ color: C.green }}/>
                    <span className="text-xs font-bold" style={{ color: C.green }}>Email Sign In</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.g700 }}>Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.g400 }}/>
                      <input type="email" value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleEmailLogin(e)}
                        placeholder="you@example.com"
                        className="pq-inp w-full border-2 rounded-xl py-3.5"
                        style={{ paddingLeft: 42, paddingRight: 14, borderColor: error && !email ? C.danger : email ? C.green : C.g200, color: C.g800, background: C.white, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wide" style={{ color: C.g700 }}>Password</label>
                      <Link to="/forgot-password" className="text-xs font-bold" style={{ color: C.green, textDecoration: 'none' }}>Forgot?</Link>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.g400 }}/>
                      <input type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleEmailLogin(e)}
                        placeholder="Enter your password"
                        className="pq-inp w-full border-2 rounded-xl py-3.5"
                        style={{ paddingLeft: 42, paddingRight: 48, borderColor: error && !password ? C.danger : password ? C.green : C.g200, color: C.g800, background: C.white, outline: 'none' }}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 flex items-center"
                        style={{ color: C.g400, background: 'none', border: 'none' }}>
                        {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setRemember(!remember)}
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition"
                      style={{ border: `2px solid ${remember ? C.green : C.g200}`, background: remember ? C.green : 'transparent' }}>
                      {remember && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none" style={{ color: C.g600 }}>Remember me on this device</span>
                  </label>

                  <button onClick={handleEmailLogin} disabled={loading} className="pq-btn w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${C.green}, ${C.mint})`, boxShadow: '0 6px 24px rgba(45,106,79,0.28)', opacity: loading ? 0.65 : 1, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? <><RefreshCw size={15} className="pq-spin"/>Signing in…</> : <>Sign In <ArrowRight size={16}/></>}
                  </button>
                </>
              )}

              {/* ═══ SMS ═══ */}
              {step === 'sms' && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.07)', border: '1.5px solid rgba(99,102,241,0.20)' }}>
                    <Smartphone size={14} style={{ color: C.blue }}/>
                    <span className="text-xs font-bold" style={{ color: C.blue }}>Phone (SMS) Sign In</span>
                  </div>

                  {!otpSent ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.g700 }}>Phone Number</label>
                        <div className="flex gap-2">
                          <div className="relative flex-shrink-0">
                            <button onClick={() => { setShowDrop(!showDrop); setSearch(''); }}
                              className="flex items-center gap-2 border-2 rounded-xl px-3 py-3.5 transition"
                              style={{ borderColor: showDrop ? C.green : C.g200, background: C.white, color: C.g700, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 18 }}>{country.flag}</span>
                              <span>{country.code}</span>
                              <ChevronDown size={13} style={{ color: C.g400, transform: showDrop ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
                            </button>

                            {showDrop && (
                              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                                style={{ width: 280, maxWidth: 'calc(100vw - 32px)', border: `1px solid ${C.g100}` }}>
                                <div className="p-2.5" style={{ borderBottom: `1px solid ${C.g100}` }}>
                                  <input autoFocus value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search country…"
                                    className="w-full px-3 py-2 rounded-lg"
                                    style={{ border: `1.5px solid ${C.g200}`, fontSize: 14, color: C.g800, background: C.g50, outline: 'none' }}
                                  />
                                </div>
                                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                  {filteredCountries.length === 0
                                    ? <p className="p-4 text-center text-xs m-0" style={{ color: C.g400 }}>No results</p>
                                    : filteredCountries.map(c => (
                                      <button key={`${c.name}-${c.code}`}
                                        onClick={() => { setCountry(c); setShowDrop(false); setPhone(''); setError(''); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition"
                                        style={{ border: 'none', borderBottom: `1px solid ${C.g50}`, background: country.name === c.name ? `${C.green}08` : 'transparent', cursor: 'pointer' }}>
                                        <span style={{ fontSize: 20 }}>{c.flag}</span>
                                        <span className="flex-1 text-sm font-semibold" style={{ color: C.g700 }}>{c.name}</span>
                                        <span className="text-xs font-bold" style={{ color: country.name === c.name ? C.green : C.g400 }}>{c.code}</span>
                                      </button>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>

                          <input type="tel" value={phone}
                            onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                            placeholder={`${country.min}–${country.max} digits`}
                            className="pq-inp flex-1 border-2 rounded-xl px-4 py-3.5"
                            style={{ borderColor: error && !phone ? C.danger : phone ? C.green : C.g200, color: C.g800, background: C.white, outline: 'none' }}
                          />
                        </div>
                        <p className="text-xs mt-2 m-0" style={{ color: C.g400 }}>
                          {country.flag} {country.name} · {country.code} · Enter without leading zero
                        </p>
                      </div>

                      <button onClick={sendSms} disabled={loading} className="pq-btn w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 6px 24px rgba(59,130,246,0.26)', opacity: loading ? 0.65 : 1, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? <><RefreshCw size={15} className="pq-spin"/>Sending code…</> : <><Smartphone size={16}/>Send SMS Code</>}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ background: 'rgba(59,130,246,0.07)', border: '1.5px solid rgba(99,102,241,0.22)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
                          <Smartphone size={18} color="white"/>
                        </div>
                        <div>
                          <p className="font-bold text-sm m-0" style={{ color: '#1E40AF' }}>Code sent!</p>
                          <p className="text-xs mt-0.5 m-0" style={{ color: '#3B82F6' }}>Check messages at {fullPhone}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-3 text-center uppercase tracking-wide" style={{ color: C.g700 }}>
                          Enter 6-digit code
                        </label>
                        <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(''); }}/>
                      </div>

                      <button onClick={verifySms} disabled={loading || otp.length !== 6}
                        className="pq-btn w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 6px 24px rgba(59,130,246,0.26)', opacity: (loading || otp.length !== 6) ? 0.55 : 1, border: 'none', cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer' }}>
                        {loading ? <><RefreshCw size={15} className="pq-spin"/>Verifying…</> : <>Verify & Sign In <ArrowRight size={16}/></>}
                      </button>

                      <button onClick={() => { setOtpSent(false); setOtp(''); setError(''); setNotice(''); }}
                        className="w-full py-3 rounded-xl text-sm font-bold"
                        style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer' }}>
                        ← Resend code
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: C.g200 }}/>
                <span className="text-xs font-semibold" style={{ color: C.g400 }}>OR</span>
                <div className="flex-1 h-px" style={{ background: C.g200 }}/>
              </div>

              <button onClick={() => navigate('/register')} className="pq-btn w-full py-3.5 rounded-xl font-black text-sm"
                style={{ border: `2px solid ${C.green}`, background: 'none', color: C.green, cursor: 'pointer' }}>
                Create a Free Account
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3" style={{ borderColor: C.g100, background: C.g50 }}>
              <div className="flex items-center gap-1" style={{ color: C.g400, fontSize: 10 }}>
                <Shield size={10}/>SSL · Zero fraud
              </div>
              <Link to="/register" className="font-black whitespace-nowrap" style={{ color: C.green, textDecoration: 'none', fontSize: 12 }}>
                Sign up free →
              </Link>
            </div>
          </div>

          {/* Below-card CTA */}
          <div className="mt-4 p-4 rounded-2xl" style={{ background: `${C.green}10`, border: `1px solid ${C.green}25` }}>
            <p className="text-center text-sm font-black mb-1 m-0" style={{ color: C.forest }}>New to PRAQEN?</p>
            <p className="text-center text-xs mb-3 m-0 leading-relaxed" style={{ color: C.g500 }}>
              Join thousands of traders buying & selling Bitcoin safely — no bank needed.
            </p>
            <Link to="/register"
              className="block text-center py-3 rounded-2xl text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${C.green}, ${C.mint})`, boxShadow: '0 4px 16px rgba(45,106,79,0.28)', textDecoration: 'none' }}>
              Create a Free Account →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav — hidden on desktop ──────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t"
        style={{ borderColor: C.g200, boxShadow: '0 -4px 20px rgba(0,0,0,0.07)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Home,       label: 'Home',  path: '/',           active: false },
            { icon: Gift,       label: 'Gifts', path: '/gift-cards', active: false },
            { icon: LogIn,      label: 'Login', path: '/login',      active: true  },
          ].map(({ icon: Icon, label, path, active }) => (
            <button key={label} onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl"
              style={{ color: active ? C.forest : C.g400, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8}/>
              <span className="text-xs font-bold">{label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full block" style={{ background: C.forest }}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
