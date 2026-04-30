import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import {
  Mail, Lock, User, Eye, EyeOff, Shield, CheckCircle,
  ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Smartphone,
  AtSign, Check, X, Home, Gift, LogIn, Phone, ChevronDown,
} from 'lucide-react';

const C = {
  forest: '#1B4332', green: '#2D6A4F', mint: '#40916C',
  gold: '#F4A422', white: '#FFFFFF', mist: '#F0F9F4',
  g50: '#F8FAFC', g100: '#F1F5F9', g200: '#E2E8F0',
  g300: '#CBD5E1', g400: '#94A3B8', g500: '#64748B',
  g600: '#475569', g700: '#334155', g800: '#1E293B',
  success: '#10B981', danger: '#EF4444', amber: '#F59E0B',
};

const PHONE_CODES = [
  { flag: '🇬🇭', code: '+233', name: 'Ghana' },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
  { flag: '🇰🇪', code: '+254', name: 'Kenya' },
  { flag: '🇿🇦', code: '+27',  name: 'South Africa' },
  { flag: '🇺🇬', code: '+256', name: 'Uganda' },
  { flag: '🇹🇿', code: '+255', name: 'Tanzania' },
  { flag: '🇷🇼', code: '+250', name: 'Rwanda' },
  { flag: '🇺🇸', code: '+1',   name: 'United States' },
  { flag: '🇬🇧', code: '+44',  name: 'United Kingdom' },
  { flag: '🇩🇪', code: '+49',  name: 'Germany' },
  { flag: '🇫🇷', code: '+33',  name: 'France' },
  { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia' },
  { flag: '🇦🇪', code: '+971', name: 'UAE' },
  { flag: '🇮🇳', code: '+91',  name: 'India' },
  { flag: '🇦🇺', code: '+61',  name: 'Australia' },
  { flag: '🇨🇲', code: '+237', name: 'Cameroon' },
  { flag: '🇸🇳', code: '+221', name: 'Senegal' },
];

const PW_CHECKS = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)', test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',           test: p => /\d/.test(p) },
];

function PwStrength({ password }) {
  const passed = PW_CHECKS.filter(c => c.test(password)).length;
  const colors = ['', C.danger, '#F97316', C.amber, C.success, C.success];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: i <= passed ? colors[passed] : C.g200, transition: 'background 0.3s' }}/>
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: colors[passed], margin: '0 0 6px' }}>{labels[passed]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {PW_CHECKS.map(({ label, test }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {test(password)
              ? <Check size={10} style={{ color: C.success, flexShrink: 0 }}/>
              : <X size={10} style={{ color: C.g300, flexShrink: 0 }}/>}
            <span style={{ fontSize: 11, color: test(password) ? C.g600 : C.g400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OTPInput({ value, onChange, hasError }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      onChange(value.slice(0, Math.max(0, i)));
      if (i > 0) refs[i-1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const arr = (value + '      ').slice(0, 6).split('');
      arr[i] = e.key;
      onChange(arr.join('').replace(/\s/g, ''));
      if (i < 5) refs[i+1].current?.focus();
    }
    e.preventDefault();
  };

  const handlePaste = e => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(paste);
    refs[Math.min(paste.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d === ' ' ? '' : d}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onChange={() => {}}
          className="pq-otp"
          style={{
            width: 38, height: 50, borderRadius: 12,
            textAlign: 'center', fontSize: 20, fontWeight: 800,
            border: `2.5px solid ${hasError ? C.danger : (d !== ' ' && d) ? C.green : C.g200}`,
            color: C.forest,
            background: (d !== ' ' && d) ? `${C.green}10` : C.white,
            outline: 'none', transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      ))}
    </div>
  );
}

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode]               = useState('register');
  const [step, setStep]               = useState(1);
  const [method, setMethod]           = useState('email');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [otpTimer, setOtpTimer]       = useState(0);
  const [phoneCode, setPhoneCode]     = useState(PHONE_CODES[0]);
  const [showCodes, setShowCodes]     = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpError, setOtpError] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [errs, setErrs]         = useState({});

  useEffect(() => {
    if (otpTimer <= 0) return;
    const iv = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(iv);
  }, [otpTimer]);

  const contact = method === 'email' ? email : `${phoneCode.code}${phone}`;

  const validateContact = () => {
    const e = {};
    if (method === 'email') {
      if (!email) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    } else {
      if (!phone) e.phone = 'Phone number is required';
      else if (phone.length < 7) e.phone = 'Enter a valid phone number';
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const validateAll = () => {
    const e = {};
    if (method === 'email') {
      if (!email) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    } else {
      if (!phone) e.phone = 'Phone number is required';
      else if (phone.length < 7) e.phone = 'Enter a valid phone number';
    }
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!username.trim()) e.username = 'Username is required';
    else if (username.length < 3) e.username = 'At least 3 characters';
    else if (!/^[a-z0-9_.@-]+$/.test(username)) e.username = 'Letters, numbers, _ . @ - only';
    if (!password) e.password = 'Password is required';
    else if (PW_CHECKS.filter(c => c.test(password)).length < 3) e.password = 'Password is too weak';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must agree to continue';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const validateNewPassword = () => {
    const e = {};
    if (!password) e.password = 'Required';
    else if (PW_CHECKS.filter(c => c.test(password)).length < 3) e.password = 'Too weak';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const sendOTP = async () => {
    if (!validateContact()) return;
    setLoading(true); setGlobalError('');
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { method, contact, purpose: 'forgot-password' });
      setStep('f2'); setOtpTimer(60);
    } catch (err) { setGlobalError(err.response?.data?.error || 'Failed to send code. Try again.'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { setOtpError('Enter the 6-digit code'); return; }
    setLoading(true); setOtpError('');
    try {
      if (method === 'email') {
        await axios.post(`${API_URL}/auth/verify-code`, { email: contact, code: otp });
      } else {
        await axios.post(`${API_URL}/auth/verify-otp`, { contact, otp, purpose: mode === 'register' ? 'register' : 'forgot-password' });
      }
      setStep(mode === 'register' ? 3 : 'f3');
    } catch (err) { setOtpError(err.response?.data?.error || 'Incorrect code. Try again.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!validateAll()) return;
    setLoading(true); setGlobalError('');
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? contact : undefined,
        username: username.toLowerCase(),
        fullName, password,
      });
      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        onLogin(res.data.user, res.data.token);
        setStep(4);
        setTimeout(() => navigate('/buy-bitcoin'), 1800);
      }
    } catch (err) { setGlobalError(err.response?.data?.error || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!validateNewPassword()) return;
    setLoading(true); setGlobalError('');
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { contact, otp, newPassword: password });
      setStep('f4');
    } catch (err) { setGlobalError(err.response?.data?.error || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  const startForgot = () => {
    setMode('forgot'); setStep('f1');
    setEmail(''); setPhone(''); setOtp(''); setPassword(''); setConfirm('');
    setErrs({}); setGlobalError('');
  };

  const backToRegister = () => {
    setMode('register'); setStep(1);
    setOtp(''); setErrs({}); setGlobalError('');
  };

  const FEATURES = [
    { icon: '🔒', t: 'Escrow on every trade',    s: 'Bitcoin locked until both confirm' },
    { icon: '⚡', t: 'Complete in under 15 min', s: 'Mobile money & bank transfer' },
    { icon: '🌍', t: '180+ countries supported', s: 'GHS, NGN, KES, EUR & more' },
  ];

  const heroTitle = mode === 'forgot' ? 'Reset Password' : 'Create Account';
  const heroSub   = mode === 'forgot' ? "We'll help you get back in" : "Join Africa's #1 P2P Bitcoin platform";

  const inp = (filled, err) => ({
    width: '100%', padding: '13px 16px', fontSize: 16, borderRadius: 14,
    border: `2px solid ${err ? C.danger : filled ? C.green : C.g200}`,
    color: C.g800, background: C.white, outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  });

  const inpWithIcon = (filled, err) => ({ ...inp(filled, err), paddingLeft: 42 });
  const inpIconRight = (filled, err) => ({ ...inpWithIcon(filled, err), paddingRight: 48 });

  const PrimaryBtn = ({ onClick, disabled, children, style = {} }) => (
    <button onClick={onClick} disabled={disabled}
      className="pq-btn"
      style={{
        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
        background: `linear-gradient(135deg, ${C.green}, ${C.mint})`,
        color: 'white', fontSize: 14, fontWeight: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 6px 24px rgba(45,106,79,0.28)',
        opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}>
      {children}
    </button>
  );

  const ErrMsg = ({ text }) => text ? (
    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.danger, margin: '5px 0 0' }}>
      <AlertCircle size={10}/>{text}
    </p>
  ) : null;

  const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 7, color: C.g700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {children}
    </label>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif", background: C.mist }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        @keyframes pqUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pqIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pqSpin{ to   { transform:rotate(360deg); } }
        .pq-anim { animation: pqUp  0.3s cubic-bezier(0.22,0.68,0,1.1) both; }
        .pq-fade { animation: pqIn  0.25s ease both; }
        .pq-spin { animation: pqSpin 0.7s linear infinite; }
        .pq-inp:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.12) !important; }
        .pq-otp:focus { border-color: #2D6A4F !important; box-shadow: 0 0 0 3px rgba(45,106,79,0.12) !important; }
        .pq-btn { transition: opacity 0.12s, transform 0.1s; }
        .pq-btn:active { transform: scale(0.99); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        button, a { touch-action: manipulation; }
        input, select { font-size: 16px !important; }
        html, body { overscroll-behavior: none; }
      `}</style>

      {/* ── Desktop left panel ─────────────────────────────────────────────── */}
      <div style={{
        display: 'none', width: '42%', flexShrink: 0,
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(150deg, ${C.forest} 0%, ${C.green} 58%, ${C.mint} 100%)`,
      }} className="pq-left-panel">
        <style>{`.pq-left-panel { display: none; } @media(min-width:1024px){ .pq-left-panel { display: flex !important; } }`}</style>

        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '28px 28px' }}/>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: C.gold, opacity: 0.10, filter: 'blur(70px)', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* praqen wordmark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)', marginBottom: 36 }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 800, letterSpacing: '7px', fontFamily: "'DM Sans',sans-serif" }}>praqen</span>
          </div>

          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 36, fontFamily: "'Syne',sans-serif", margin: '0 0 12px', lineHeight: 1.15 }}>
            {mode === 'forgot' ? <>Reset Your<br/>Password 🔑</> : <>Start Trading<br/>Bitcoin Today ⚡</>}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14, lineHeight: 1.75, margin: '0 0 32px' }}>
            Africa's most trusted P2P Bitcoin platform.<br/>Real escrow. Real people. Zero fraud.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map(({ icon, t, s }) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{t}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.30)', fontSize: 12 }}>
          <Shield size={12}/>All data encrypted · ISO 27001 security standards
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: C.mist, minHeight: '100vh' }}>

        {/* Mobile hero — hidden on desktop via CSS */}
        <div className="pq-mob-hero" style={{ position: 'relative', overflow: 'hidden', padding: '24px 20px 52px', flexShrink: 0, background: `linear-gradient(150deg, ${C.forest} 0%, ${C.green} 55%, ${C.mint} 100%)` }}>
          <style>{`.pq-mob-hero {} @media(min-width:1024px){ .pq-mob-hero { display:none !important; } }`}</style>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}/>
          <div style={{ position: 'absolute', top: -12, right: -12, width: 200, height: 200, borderRadius: '50%', background: C.gold, opacity: 0.18, filter: 'blur(60px)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', bottom: -16, left: -16, width: 140, height: 140, borderRadius: '50%', background: C.mint, opacity: 0.22, filter: 'blur(40px)', pointerEvents: 'none' }}/>
          <div style={{ position: 'relative' }}>
            {/* praqen wordmark */}
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.22)', marginBottom: 14 }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '6px', fontFamily: "'DM Sans',sans-serif" }}>praqen</span>
            </div>

            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 27, fontFamily: "'Syne',sans-serif", margin: '0 0 8px', lineHeight: 1.2 }}>
              {mode === 'forgot' ? 'Reset Your Password 🔑' : <>Start Trading<br/>Bitcoin Today ⚡</>}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
              {mode === 'forgot' ? "We'll get you back in safely." : 'Escrow-protected P2P trades — no bank needed.'}
            </p>

            {/* Trust pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['🔒','Escrow'],['⚡','Fast'],['🌍','180+ Countries']].map(([ic, lb]) => (
                <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', fontSize: 11, fontWeight: 700, color: 'white' }}>
                  <span style={{ fontSize: 11 }}>{ic}</span>{lb}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, padding: '0 12px', paddingBottom: 112 }}>
          <div className="pq-anim pq-form-center" style={{ width: '100%', marginTop: -40 }}>
            <style>{`@media(min-width:540px){ .pq-form-center { max-width:480px; margin-left:auto; margin-right:auto; } } @media(min-width:1024px){ .pq-form-center { max-width:480px !important; margin:40px auto !important; } }`}</style>

            {/* Card */}
            <div style={{ background: C.white, borderRadius: 28, boxShadow: '0 4px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

              {/* Card header */}
              <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.g100}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  {(step === 'f2' || step === 'f3') && (
                    <button onClick={() => { if (step === 'f2') setStep('f1'); else if (step === 'f3') setStep('f2'); }}
                      style={{ width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${C.g200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: C.g500 }}>
                      <ArrowLeft size={15}/>
                    </button>
                  )}
                  <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.forest, fontFamily: "'Syne',sans-serif", lineHeight: 1.2 }}>
                      {mode === 'register'
                        ? (step === 4 ? 'Welcome!' : 'Create Account')
                        : ({ f1:'Forgot Password', f2:'Verify Your Contact', f3:'Set New Password', f4:'Password Reset!' }[step])}
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.g500, lineHeight: 1.4 }}>
                      {mode === 'register'
                        ? (step === 4 ? 'Your account is ready' : 'Fill in your details to get started')
                        : ({ f1:"We'll send a reset code to your contact", f2:`Check your ${method} for the code`, f3:'Choose a new secure password', f4:'You can now log in with your new password' }[step])}
                    </p>
                  </div>
                </div>

                {step !== 4 && step !== 'f4' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                    {(mode === 'register' ? [1] : ['f1','f2','f3','f4']).map((s, i) => (
                      <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: (mode === 'register' ? step === 4 : ['f2','f3','f4'].includes(step) && i < ['f1','f2','f3','f4'].indexOf(step)) ? C.green : C.g200, transition: 'background 0.4s' }}/>
                    ))}
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="pq-fade" key={String(step)} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* ─── REGISTER STEP 1 ─── */}
                {step === 1 && mode === 'register' && (
                  <>
                    {globalError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, fontSize: 12, background: '#FEF2F2', color: C.danger, border: '1.5px solid #FECACA' }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }}/>{globalError}
                      </div>
                    )}

                    {/* Method toggle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 5, borderRadius: 14, background: C.g100 }}>
                      {[{ val: 'email', Icon: AtSign, label: 'Email' }, { val: 'phone', Icon: Smartphone, label: 'Phone' }].map(({ val, Icon, label }) => (
                        <button key={val} onClick={() => { setMethod(val); setErrs({}); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: method === val ? C.white : 'transparent', color: method === val ? C.green : C.g500, boxShadow: method === val ? '0 1px 6px rgba(0,0,0,0.10)' : 'none' }}>
                          <Icon size={14}/>{label}
                        </button>
                      ))}
                    </div>

                    {/* Email or Phone */}
                    {method === 'email' ? (
                      <div>
                        <Label>Email Address</Label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                          <input type="email" value={email} placeholder="you@example.com"
                            onChange={e => setEmail(e.target.value)} className="pq-inp"
                            style={inpWithIcon(!!email, errs.email)}/>
                        </div>
                        <ErrMsg text={errs.email}/>
                      </div>
                    ) : (
                      <div>
                        <Label>Phone Number</Label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <button onClick={() => setShowCodes(!showCodes)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 12px', border: `2px solid ${C.g200}`, borderRadius: 14, background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.g700, whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 18 }}>{phoneCode.flag}</span>
                              <span>{phoneCode.code}</span>
                              <ChevronDown size={13} style={{ color: C.g400 }}/>
                            </button>
                            {showCodes && (
                              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 240, maxWidth: 'calc(100vw - 40px)', background: C.white, borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', zIndex: 100, border: `1px solid ${C.g100}`, overflow: 'hidden' }}>
                                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                  {PHONE_CODES.map(pc => (
                                    <button key={pc.code} onClick={() => { setPhoneCode(pc); setShowCodes(false); }}
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: phoneCode.code === pc.code ? `${C.green}08` : 'transparent', border: 'none', borderBottom: `1px solid ${C.g50}`, cursor: 'pointer', textAlign: 'left' }}>
                                      <span style={{ fontSize: 20 }}>{pc.flag}</span>
                                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.g700 }}>{pc.name}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: phoneCode.code === pc.code ? C.green : C.g400 }}>{pc.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ position: 'relative' }}>
                              <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                              <input type="tel" value={phone} placeholder="e.g. 244 123 4567"
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="pq-inp"
                                style={inpWithIcon(!!phone, errs.phone)}/>
                            </div>
                          </div>
                        </div>
                        <ErrMsg text={errs.phone}/>
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <Label>Full Name</Label>
                      <div style={{ position: 'relative' }}>
                        <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type="text" value={fullName} placeholder="John Doe"
                          onChange={e => setFullName(e.target.value)} className="pq-inp"
                          style={inpWithIcon(!!fullName, errs.fullName)}/>
                      </div>
                      <ErrMsg text={errs.fullName}/>
                    </div>

                    {/* Username */}
                    <div>
                      <Label>Username</Label>
                      <div style={{ position: 'relative' }}>
                        <AtSign size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type="text" value={username} placeholder="john_doe"
                          onChange={e => setUsername(e.target.value.toLowerCase())} className="pq-inp"
                          style={inpWithIcon(!!username, errs.username)}/>
                      </div>
                      <ErrMsg text={errs.username}/>
                    </div>

                    {/* Password */}
                    <div>
                      <Label>Password</Label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type={showPw ? 'text' : 'password'} value={password} placeholder="Create a strong password"
                          onChange={e => setPassword(e.target.value)} className="pq-inp"
                          style={inpIconRight(!!password, errs.password)}/>
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.g400, padding: 4, display: 'flex', alignItems: 'center' }}>
                          {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                        </button>
                      </div>
                      <ErrMsg text={errs.password}/>
                      <PwStrength password={password}/>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <Label>Confirm Password</Label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type={showConfirm ? 'text' : 'password'} value={confirm} placeholder="Repeat your password"
                          onChange={e => setConfirm(e.target.value)} className="pq-inp"
                          style={inpIconRight(!!confirm, errs.confirm)}/>
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.g400, padding: 4, display: 'flex', alignItems: 'center' }}>
                          {showConfirm ? <EyeOff size={17}/> : <Eye size={17}/>}
                        </button>
                      </div>
                      <ErrMsg text={errs.confirm}/>
                    </div>

                    {/* Terms */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                        <div onClick={() => setAgreed(!agreed)}
                          style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${agreed ? C.green : errs.agreed ? C.danger : C.g300}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: agreed ? C.green : 'transparent', transition: 'all 0.15s', cursor: 'pointer' }}>
                          {agreed && <Check size={11} color="white"/>}
                        </div>
                        <p style={{ fontSize: 12, lineHeight: 1.6, color: C.g600, margin: 0 }}>
                          I agree to the{' '}
                          <a href="/terms" style={{ fontWeight: 700, color: C.green }}>Terms of Service</a>
                          {' '}and{' '}
                          <a href="/privacy" style={{ fontWeight: 700, color: C.green }}>Privacy Policy</a>.
                          I understand all trades are escrow-protected.
                        </p>
                      </label>
                      <ErrMsg text={errs.agreed}/>
                    </div>

                    <PrimaryBtn onClick={handleRegister} disabled={loading}>
                      {loading ? <><RefreshCw size={15} className="pq-spin"/>Creating Account…</> : <>Create Account <ArrowRight size={15}/></>}
                    </PrimaryBtn>

                    <p style={{ textAlign: 'center', fontSize: 13, color: C.g500, margin: 0 }}>
                      Already have an account?{' '}
                      <Link to="/login" style={{ fontWeight: 800, color: C.green }}>Log In</Link>
                    </p>
                  </>
                )}

                {/* ─── FORGOT f1 ─── */}
                {step === 'f1' && (
                  <>
                    {globalError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, fontSize: 12, background: '#FEF2F2', color: C.danger, border: '1.5px solid #FECACA' }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }}/>{globalError}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 5, borderRadius: 14, background: C.g100 }}>
                      {[{ val: 'email', Icon: AtSign, label: 'Email' }, { val: 'phone', Icon: Smartphone, label: 'Phone' }].map(({ val, Icon, label }) => (
                        <button key={val} onClick={() => { setMethod(val); setErrs({}); }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: method === val ? C.white : 'transparent', color: method === val ? C.green : C.g500, boxShadow: method === val ? '0 1px 6px rgba(0,0,0,0.10)' : 'none' }}>
                          <Icon size={14}/>{label}
                        </button>
                      ))}
                    </div>

                    {method === 'email' ? (
                      <div>
                        <Label>Email Address</Label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                          <input type="email" value={email} placeholder="you@example.com"
                            onChange={e => setEmail(e.target.value)} className="pq-inp"
                            style={inpWithIcon(!!email, errs.email)}/>
                        </div>
                        <ErrMsg text={errs.email}/>
                      </div>
                    ) : (
                      <div>
                        <Label>Phone Number</Label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setShowCodes(!showCodes)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 12px', border: `2px solid ${C.g200}`, borderRadius: 14, background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.g700, flexShrink: 0 }}>
                            <span style={{ fontSize: 18 }}>{phoneCode.flag}</span>
                            <span>{phoneCode.code}</span>
                          </button>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                            <input type="tel" value={phone} placeholder="24 XXX XXXX"
                              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="pq-inp"
                              style={inpWithIcon(!!phone, errs.phone)}/>
                          </div>
                        </div>
                        <ErrMsg text={errs.phone}/>
                      </div>
                    )}

                    <PrimaryBtn onClick={sendOTP} disabled={loading}>
                      {loading ? <><RefreshCw size={15} className="pq-spin"/>Sending code…</> : <>Send Reset Code <ArrowRight size={15}/></>}
                    </PrimaryBtn>

                    <button onClick={backToRegister} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.g500 }}>
                      ← Back to Register
                    </button>
                  </>
                )}

                {/* ─── FORGOT f2 OTP ─── */}
                {step === 'f2' && (
                  <>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ width: 60, height: 60, borderRadius: 20, background: `${C.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>
                        {method === 'email' ? '📧' : '📱'}
                      </div>
                      <p style={{ fontSize: 12, color: C.g500, margin: '0 0 4px' }}>We sent a 6-digit code to</p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: C.forest, margin: 0 }}>{contact}</p>
                    </div>

                    {globalError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, fontSize: 12, background: '#FEF2F2', color: C.danger }}>
                        <AlertCircle size={13}/>{globalError}
                      </div>
                    )}

                    <OTPInput value={otp} onChange={setOtp} hasError={!!otpError}/>

                    {otpError && (
                      <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: 0 }}>
                        <AlertCircle size={11}/>{otpError}
                      </p>
                    )}

                    <PrimaryBtn onClick={verifyOTP} disabled={loading || otp.length < 6}>
                      {loading ? <><RefreshCw size={15} className="pq-spin"/>Verifying…</> : <>Verify Code <ArrowRight size={15}/></>}
                    </PrimaryBtn>

                    <div style={{ textAlign: 'center' }}>
                      {otpTimer > 0
                        ? <p style={{ fontSize: 12, color: C.g400, margin: 0 }}>Resend in <span style={{ fontWeight: 700, color: C.green }}>{otpTimer}s</span></p>
                        : <button onClick={() => { setOtp(''); sendOTP(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto' }}>
                            <RefreshCw size={11}/>Resend Code
                          </button>
                      }
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 14px', borderRadius: 12, background: `${C.gold}12`, fontSize: 12, color: C.g600 }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>💡</span>
                      Check your spam/junk folder if you don't see it. Codes expire in 10 minutes.
                    </div>
                  </>
                )}

                {/* ─── FORGOT f3 new password ─── */}
                {step === 'f3' && (
                  <>
                    {globalError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, fontSize: 12, background: '#FEF2F2', color: C.danger }}>
                        <AlertCircle size={13}/>{globalError}
                      </div>
                    )}

                    <div>
                      <Label>New Password</Label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type={showPw ? 'text' : 'password'} value={password} placeholder="Create a new strong password"
                          onChange={e => setPassword(e.target.value)} className="pq-inp"
                          style={inpIconRight(!!password, errs.password)}/>
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.g400, padding: 4 }}>
                          {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                        </button>
                      </div>
                      <ErrMsg text={errs.password}/>
                      <PwStrength password={password}/>
                    </div>

                    <div>
                      <Label>Confirm New Password</Label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.g400, pointerEvents: 'none' }}/>
                        <input type={showConfirm ? 'text' : 'password'} value={confirm} placeholder="Repeat your password"
                          onChange={e => setConfirm(e.target.value)} className="pq-inp"
                          style={inpIconRight(!!confirm, errs.confirm)}/>
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.g400, padding: 4 }}>
                          {showConfirm ? <EyeOff size={17}/> : <Eye size={17}/>}
                        </button>
                      </div>
                      <ErrMsg text={errs.confirm}/>
                    </div>

                    <PrimaryBtn onClick={handleResetPassword} disabled={loading}>
                      {loading ? <><RefreshCw size={15} className="pq-spin"/>Resetting…</> : <>Reset Password <ArrowRight size={15}/></>}
                    </PrimaryBtn>
                  </>
                )}

                {/* ─── REGISTER step 4 success ─── */}
                {step === 4 && (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${C.success}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                      <CheckCircle size={42} style={{ color: C.success }}/>
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: C.forest, fontFamily: "'Syne',sans-serif", margin: '0 0 8px' }}>Welcome to PRAQEN! 🎉</h3>
                    <p style={{ fontSize: 13, color: C.g500, margin: '0 0 24px' }}>Your account is ready. Redirecting to the marketplace…</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: C.g400 }}>
                      <RefreshCw size={12} className="pq-spin"/>Taking you to live offers…
                    </div>
                  </div>
                )}

                {/* ─── FORGOT f4 success ─── */}
                {step === 'f4' && (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${C.success}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                      <CheckCircle size={42} style={{ color: C.success }}/>
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: C.forest, fontFamily: "'Syne',sans-serif", margin: '0 0 8px' }}>Password Reset! ✅</h3>
                    <p style={{ fontSize: 13, color: C.g500, margin: '0 0 24px' }}>You can now log in with your new password.</p>
                    <PrimaryBtn onClick={() => navigate('/login')}>Go to Login →</PrimaryBtn>
                  </div>
                )}

              </div>

              {/* Card footer */}
              {step !== 4 && step !== 'f4' && (
                <div style={{ padding: '11px 16px', borderTop: `1px solid ${C.g100}`, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Shield size={10} style={{ color: C.g400 }}/>
                    <span style={{ fontSize: 10, color: C.g400 }}>SSL · Zero fraud</span>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {mode === 'register' && step === 1 && (
                      <button onClick={startForgot} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.green, whiteSpace: 'nowrap' }}>
                        Forgot password?
                      </button>
                    )}
                    {mode === 'forgot' && (
                      <button onClick={backToRegister} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.g500, whiteSpace: 'nowrap' }}>
                        ← Register instead
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {step === 1 && mode === 'register' && (
              <p style={{ textAlign: 'center', fontSize: 13, color: C.g500, marginTop: 16 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 800, color: C.green }}>Sign In</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <div className="pq-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.g200}`, zIndex: 40, paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0' }}>
        <style>{`@media(min-width:1024px){ .pq-bottom-nav { display:none !important; } }`}</style>
        {[
          { Icon: Home,  label: 'Home',    path: '/' },
          { Icon: Gift,  label: 'Gifts',   path: '/gift-cards' },
          { Icon: LogIn, label: 'Sign In', path: '/login' },
        ].map(({ Icon, label, path }) => (
          <button key={label} onClick={() => navigate(path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 22px', borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer', color: C.g400 }}>
            <Icon size={21} strokeWidth={1.8}/>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
