import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, Shield,
  CheckCircle, ArrowRight, ArrowLeft, RefreshCw,
  AlertCircle, Smartphone, AtSign,
  Check, X, Home, Gift, LogIn,
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155',
  g800:'#1E293B',
  success:'#10B981', danger:'#EF4444',
};

// ── Password strength checker ─────────────────────────────────────────────────
const pwChecks = [
  { label:'At least 8 characters',    test: p => p.length >= 8 },
  { label:'Uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { label:'Lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { label:'Number (0–9)',              test: p => /\d/.test(p) },
];

function PwStrength({ password }) {
  const passed = pwChecks.filter(c => c.test(password)).length;
  const colors = ['', C.danger, '#F97316', C.amber, C.success, C.success];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= passed ? colors[passed] : C.g200 }}/>
        ))}
      </div>
      <p className="text-xs font-bold" style={{ color: colors[passed] }}>{labels[passed]}</p>
      <div className="grid grid-cols-1 gap-0.5">
        {pwChecks.map(({ label, test }) => (
          <div key={label} className="flex items-center gap-1.5">
            {test(password) ? <Check size={10} style={{ color:C.success }}/> : <X size={10} style={{ color:C.g300 }}/>}
            <span className="text-xs" style={{ color: test(password) ? C.g600 : C.g400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange, hasError }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      onChange(value.slice(0, Math.max(0, i)));
      if (i > 0) refs[i-1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const arr = (value + '      ').slice(0,6).split('');
      arr[i] = e.key;
      onChange(arr.join('').replace(/\s/g,''));
      if (i < 5) refs[i+1].current?.focus();
    }
    e.preventDefault();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    onChange(paste);
    refs[Math.min(paste.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d === ' ' ? '' : d}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onChange={() => {}}
          onClick={() => refs[i].current?.focus()}
          className="text-center text-xl font-black border-2 rounded-xl focus:outline-none transition-all"
          style={{
            width: 48, height: 52,
            borderColor: hasError ? C.danger : d !== ' ' && d ? C.green : C.g200,
            backgroundColor: d !== ' ' && d ? `${C.green}08` : C.white,
            color: C.forest,
          }}
        />
      ))}
    </div>
  );
}

// ── Reusable Field + Input ─────────────────────────────────────────────────────
function Field({ label, error, hint, children }) {
  return (
    <div>
      {label && <label className="block text-xs font-bold mb-1.5" style={{ color:C.g700 }}>{label}</label>}
      {children}
      {hint && !error && <p className="text-xs mt-1" style={{ color:C.g400 }}>{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs mt-1" style={{ color:C.danger }}>
          <AlertCircle size={10}/>{error}
        </p>
      )}
    </div>
  );
}

function Input({ icon:Icon, rightIcon, type='text', error, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:C.g400 }}/>}
      <input type={type} {...props}
        className="w-full py-3 border-2 rounded-xl focus:outline-none transition-all"
        style={{
          paddingLeft: Icon ? 40 : 16,
          paddingRight: rightIcon ? 44 : 16,
          fontSize: 16,
          borderColor: error ? C.danger : props.value ? C.green : C.g200,
          color: C.g800,
          backgroundColor: C.white,
        }}
      />
      {rightIcon}
    </div>
  );
}

// ── Country phone codes ───────────────────────────────────────────────────────
const PHONE_CODES = [
  { flag:'🇬🇭', code:'+233', name:'Ghana' },
  { flag:'🇳🇬', code:'+234', name:'Nigeria' },
  { flag:'🇰🇪', code:'+254', name:'Kenya' },
  { flag:'🇿🇦', code:'+27',  name:'South Africa' },
  { flag:'🇺🇬', code:'+256', name:'Uganda' },
  { flag:'🇹🇿', code:'+255', name:'Tanzania' },
  { flag:'🇺🇸', code:'+1',   name:'United States' },
  { flag:'🇬🇧', code:'+44',  name:'United Kingdom' },
  { flag:'🇪🇺', code:'+32',  name:'Europe' },
  { flag:'🇨🇲', code:'+237', name:'Cameroon' },
  { flag:'🇸🇳', code:'+221', name:'Senegal' },
];

// ── Mobile bottom nav (lg:hidden — never shown on desktop) ───────────────────
function BottomNav() {
  const navigate = useNavigate();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 shadow-2xl"
      style={{ borderColor:C.g200, paddingBottom:'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {[
          { Icon:Home,  label:'Home',    path:'/' },
          { Icon:Gift,  label:'Gifts',   path:'/gift-cards' },
          { Icon:LogIn, label:'Sign In', path:'/login' },
        ].map(({ Icon, label, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition"
            style={{ color: C.g400 }}>
            <Icon size={20} strokeWidth={1.8}/>
            <span className="text-xs font-bold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── STEPS ─────────────────────────────────────────────────────────────────────
// register: 1 = contact, 2 = verify OTP, 3 = profile + password, 4 = success
// forgot:  f1 = contact, f2 = OTP, f3 = new password, f4 = success

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
    else if (pwChecks.filter(c => c.test(password)).length < 3) e.password = 'Password is too weak';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must agree to continue';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const validateProfile = () => validateAll();

  const validateNewPassword = () => {
    const e = {};
    if (!password) e.password = 'Required';
    else if (pwChecks.filter(c => c.test(password)).length < 3) e.password = 'Too weak';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const sendOTP = async () => {
    if (!validateContact()) return;
    setLoading(true); setGlobalError('');
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { method, contact, purpose:'forgot-password' });
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

  const STEP_LABELS = mode === 'register'
    ? ['Details', 'Done']
    : ['Contact', 'Verify', 'New Password', 'Done'];
  const currentStepNum = mode === 'register'
    ? (step === 4 ? 2 : 1)
    : ({ f1:1, f2:2, f3:3, f4:4 }[step] || 1);

  const heroTitle = mode === 'forgot'
    ? 'Reset Password'
    : 'Create Account';
  const heroSub = mode === 'forgot'
    ? "We'll help you get back in"
    : "Join Africa's #1 P2P Bitcoin platform";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily:"'DM Sans',sans-serif", backgroundColor:C.mist }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .slide{animation:slideUp .25s ease}
        .fade{animation:fadeIn .3s ease}
        input:focus{outline:none;}
        button:focus{outline:none;}
        * { -webkit-tap-highlight-color: transparent; }
        button, a { touch-action: manipulation; }
        input, select, textarea { font-size: 16px !important; }
        html, body { overscroll-behavior: none; }
      `}</style>

      {/* ── Desktop left branding panel (lg+ only) ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background:`linear-gradient(140deg,${C.forest},${C.green})` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize:'28px 28px' }}/>
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor:C.gold }}/>
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
              style={{ backgroundColor:C.gold, color:C.forest }}>P</div>
            <span className="text-white font-black text-xl" style={{ fontFamily:"'Syne',sans-serif" }}>PRAQEN</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily:"'Syne',sans-serif" }}>
            Trade Bitcoin<br/>Safely & Easily
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Join 2.4M+ traders using the most trusted P2P platform in Africa. Fast trades, real escrow, zero fraud.
          </p>
          <div className="space-y-3">
            {[
              { icon:'🔒', label:'Escrow on every trade',    sub:'Bitcoin locked until both confirm' },
              { icon:'⚡', label:'Complete in under 15 min', sub:'Mobile money & bank transfer' },
              { icon:'💸', label:'0.5% flat fee only',       sub:'No hidden charges. Ever.' },
              { icon:'🌍', label:'180+ countries supported', sub:'GHS, NGN, KES, EUR & more' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor:'rgba(255,255,255,0.06)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-white text-xs font-bold">{label}</p>
                  <p className="text-white/45 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-white/30 text-xs">
          <Shield size={12}/> All data encrypted · ISO 27001 security standards
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center" style={{ backgroundColor:C.mist }}>

        {/* Mobile hero — only shown below lg, never on desktop */}
        <div className="lg:hidden relative overflow-hidden px-5 pt-10 pb-14"
          style={{ background:`linear-gradient(140deg,${C.forest} 0%,${C.green} 55%,${C.mint} 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize:'28px 28px' }}/>
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ backgroundColor:C.gold }}/>
          <div className="relative">
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily:"'Syne',sans-serif" }}>
              {heroTitle}
            </h1>
            <p className="text-white/70 text-sm mb-3">{heroSub}</p>
            <div className="flex gap-2 flex-wrap">
              {[['🔒','Escrow'],['⚡','Fast'],['🌍','Global'],['💸','0.5% Fee']].map(([icon,label]) => (
                <div key={label} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor:'rgba(255,255,255,0.15)' }}>
                  <span className="text-sm">{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form card area — overlaps hero on mobile */}
        <div className="w-full lg:max-w-md px-4 lg:px-0 -mt-6 lg:mt-0 pb-20 lg:pb-10 lg:py-10 relative z-10">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden" style={{ borderColor:C.g200 }}>

            {/* Card header */}
            <div className="px-5 md:px-7 py-5 border-b" style={{ borderColor:C.g100 }}>
              <div className="flex items-center justify-between mb-1">
                {(step === 'f2' || step === 'f3') && (
                  <button onClick={() => {
                    if (step === 'f2') setStep('f1');
                    else if (step === 'f3') setStep('f2');
                  }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition mr-2 flex-shrink-0"
                    style={{ color:C.g500 }}>
                    <ArrowLeft size={15}/>
                  </button>
                )}
                <div className="flex-1">
                  <h1 className="font-black text-lg" style={{ color:C.forest, fontFamily:"'Syne',sans-serif" }}>
                    {mode === 'register'
                      ? (step === 4 ? 'Welcome!' : 'Create Account')
                      : ({ f1:'Forgot Password', f2:'Verify Your Contact', f3:'Set New Password', f4:'Password Reset!' }[step])}
                  </h1>
                  <p className="text-xs mt-0.5" style={{ color:C.g500 }}>
                    {mode === 'register'
                      ? (step === 4 ? 'Your account is ready' : 'Fill in your details to get started')
                      : ({ f1:"We'll send a reset code to your contact", f2:`Check your ${method} for the code`, f3:'Choose a new secure password', f4:'You can now log in with your new password' }[step])}
                  </p>
                </div>
              </div>

              {step !== 4 && step !== 'f4' && (
                <div className="flex gap-1.5 mt-3">
                  {STEP_LABELS.map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                      style={{ backgroundColor: i < currentStepNum ? C.green : C.g200 }}/>
                  ))}
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="px-5 md:px-7 py-5 space-y-4 slide" key={String(step)}>

              {/* STEP 1 — Register: all fields in one go */}
              {step === 1 && mode === 'register' && (
                <>
                  {globalError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ backgroundColor:'#FEF2F2', color:C.danger }}>
                      <AlertCircle size={13}/>{globalError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor:C.g100 }}>
                    {[
                      { val:'email', Icon:AtSign,     label:'Email' },
                      { val:'phone', Icon:Smartphone, label:'Phone' },
                    ].map(({ val, Icon, label }) => (
                      <button key={val} onClick={() => { setMethod(val); setErrs({}); }}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
                        style={{
                          backgroundColor: method===val ? C.white : 'transparent',
                          color: method===val ? C.green : C.g500,
                          boxShadow: method===val ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                        }}>
                        <Icon size={13}/>{label}
                      </button>
                    ))}
                  </div>

                  {method === 'email' ? (
                    <Field label="Email Address" error={errs.email}>
                      <Input icon={Mail} type="email" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} error={errs.email}/>
                    </Field>
                  ) : (
                    <Field label="Phone Number" error={errs.phone}>
                      <div className="flex gap-2">
                        <div className="relative flex-shrink-0">
                          <button onClick={() => setShowCodes(!showCodes)}
                            className="flex items-center gap-1 px-3 py-3 border-2 rounded-xl text-sm font-bold transition"
                            style={{ borderColor:C.g200, color:C.g700 }}>
                            <span>{phoneCode.flag}</span>
                            <span>{phoneCode.code}</span>
                            <span className="text-xs" style={{ color:C.g400 }}>▼</span>
                          </button>
                          {showCodes && (
                            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl z-50 border max-h-48 overflow-y-auto"
                              style={{ borderColor:C.g100 }}>
                              {PHONE_CODES.map(pc => (
                                <button key={pc.code} onClick={() => { setPhoneCode(pc); setShowCodes(false); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-xs border-b last:border-0"
                                  style={{ borderColor:C.g50 }}>
                                  <span className="text-base">{pc.flag}</span>
                                  <span className="font-bold" style={{ color:C.g700 }}>{pc.name}</span>
                                  <span className="ml-auto" style={{ color:C.g400 }}>{pc.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Input icon={Phone} type="tel" placeholder="24 XXX XXXX"
                            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                            error={errs.phone}/>
                        </div>
                      </div>
                    </Field>
                  )}

                  <Field label="Full Name" error={errs.fullName}>
                    <Input icon={User} placeholder="John Doe"
                      value={fullName} onChange={e => setFullName(e.target.value)} error={errs.fullName}/>
                  </Field>

                  <Field label="Username" error={errs.username}>
                    <Input icon={AtSign} placeholder="john_doe"
                      value={username} onChange={e => setUsername(e.target.value.toLowerCase())} error={errs.username}/>
                  </Field>

                  <Field label="Password" error={errs.password}>
                    <Input icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Create a strong password"
                      value={password} onChange={e => setPassword(e.target.value)} error={errs.password}
                      rightIcon={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:C.g400 }}>
                          {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      }/>
                    <PwStrength password={password}/>
                  </Field>

                  <Field label="Confirm Password" error={errs.confirm}>
                    <Input icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                      value={confirm} onChange={e => setConfirm(e.target.value)} error={errs.confirm}
                      rightIcon={
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:C.g400 }}>
                          {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      }/>
                  </Field>

                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <div onClick={() => setAgreed(!agreed)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition"
                        style={{ borderColor: agreed ? C.green : errs.agreed ? C.danger : C.g300, backgroundColor: agreed ? C.green : 'transparent' }}>
                        {agreed && <Check size={11} className="text-white"/>}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color:C.g600 }}>
                        I agree to the{' '}
                        <a href="/terms" className="font-bold hover:underline" style={{ color:C.green }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="font-bold hover:underline" style={{ color:C.green }}>Privacy Policy</a>.
                        I understand that all trades are escrow-protected.
                      </p>
                    </label>
                    {errs.agreed && <p className="text-xs mt-1" style={{ color:C.danger }}>{errs.agreed}</p>}
                  </div>

                  <button onClick={handleRegister} disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/>Creating Account…</> : <>Create Account <ArrowRight size={15}/></>}
                  </button>

                  <p className="text-center text-xs" style={{ color:C.g500 }}>
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold hover:underline" style={{ color:C.green }}>Log In</Link>
                  </p>
                </>
              )}

              {/* f1 — Forgot password: contact only */}
              {step === 'f1' && (
                <>
                  {globalError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ backgroundColor:'#FEF2F2', color:C.danger }}>
                      <AlertCircle size={13}/>{globalError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor:C.g100 }}>
                    {[
                      { val:'email', Icon:AtSign,     label:'Email' },
                      { val:'phone', Icon:Smartphone, label:'Phone' },
                    ].map(({ val, Icon, label }) => (
                      <button key={val} onClick={() => { setMethod(val); setErrs({}); }}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition"
                        style={{
                          backgroundColor: method===val ? C.white : 'transparent',
                          color: method===val ? C.green : C.g500,
                          boxShadow: method===val ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                        }}>
                        <Icon size={13}/>{label}
                      </button>
                    ))}
                  </div>

                  {method === 'email' ? (
                    <Field label="Email Address" error={errs.email}>
                      <Input icon={Mail} type="email" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} error={errs.email}/>
                    </Field>
                  ) : (
                    <Field label="Phone Number" error={errs.phone}>
                      <div className="flex gap-2">
                        <div className="relative flex-shrink-0">
                          <button onClick={() => setShowCodes(!showCodes)}
                            className="flex items-center gap-1 px-3 py-3 border-2 rounded-xl text-sm font-bold transition"
                            style={{ borderColor:C.g200, color:C.g700 }}>
                            <span>{phoneCode.flag}</span>
                            <span>{phoneCode.code}</span>
                            <span className="text-xs" style={{ color:C.g400 }}>▼</span>
                          </button>
                          {showCodes && (
                            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl z-50 border max-h-48 overflow-y-auto"
                              style={{ borderColor:C.g100 }}>
                              {PHONE_CODES.map(pc => (
                                <button key={pc.code} onClick={() => { setPhoneCode(pc); setShowCodes(false); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left text-xs border-b last:border-0"
                                  style={{ borderColor:C.g50 }}>
                                  <span className="text-base">{pc.flag}</span>
                                  <span className="font-bold" style={{ color:C.g700 }}>{pc.name}</span>
                                  <span className="ml-auto" style={{ color:C.g400 }}>{pc.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Input icon={Phone} type="tel" placeholder="24 XXX XXXX"
                            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                            error={errs.phone}/>
                        </div>
                      </div>
                    </Field>
                  )}

                  <button onClick={sendOTP} disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/>Sending code…</> : <>Send Reset Code <ArrowRight size={15}/></>}
                  </button>

                  <button onClick={backToRegister} className="w-full text-center text-xs font-semibold hover:underline" style={{ color:C.g500 }}>
                    ← Back to Register
                  </button>
                </>
              )}

              {/* f2 — Forgot password OTP */}
              {step === 'f2' && (
                <>
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
                      style={{ backgroundColor:`${C.green}12` }}>
                      {method === 'email' ? '📧' : '📱'}
                    </div>
                    <p className="text-xs mb-1" style={{ color:C.g500 }}>We sent a 6-digit code to</p>
                    <p className="font-black text-sm" style={{ color:C.forest }}>{contact}</p>
                  </div>

                  {globalError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ backgroundColor:'#FEF2F2', color:C.danger }}>
                      <AlertCircle size={13}/>{globalError}
                    </div>
                  )}

                  <OTPInput value={otp} onChange={setOtp} hasError={!!otpError}/>

                  {otpError && (
                    <p className="text-center text-xs font-semibold" style={{ color:C.danger }}>
                      <AlertCircle size={11} className="inline mr-1"/>{otpError}
                    </p>
                  )}

                  <button onClick={verifyOTP} disabled={loading || otp.length < 6}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/>Verifying…</> : <>Verify Code <ArrowRight size={15}/></>}
                  </button>

                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <p className="text-xs" style={{ color:C.g400 }}>
                        Resend code in <span className="font-bold" style={{ color:C.green }}>{otpTimer}s</span>
                      </p>
                    ) : (
                      <button onClick={() => { setOtp(''); sendOTP(); }}
                        className="text-xs font-bold hover:underline flex items-center gap-1 mx-auto"
                        style={{ color:C.green }}>
                        <RefreshCw size={11}/>Resend Code
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ backgroundColor:`${C.gold}10`, color:C.g600 }}>
                    <span className="flex-shrink-0 mt-0.5">💡</span>
                    Check your spam/junk folder if you don't see it. Codes expire in 10 minutes.
                  </div>
                </>
              )}


              {/* STEP 4 — Success */}
              {step === 4 && (
                <div className="text-center py-6 fade">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor:`${C.success}15` }}>
                    <CheckCircle size={40} style={{ color:C.success }}/>
                  </div>
                  <h3 className="text-xl font-black mb-2" style={{ color:C.forest, fontFamily:"'Syne',sans-serif" }}>
                    Welcome to PRAQEN! 🎉
                  </h3>
                  <p className="text-sm mb-6" style={{ color:C.g500 }}>
                    Your account is ready. Redirecting to the marketplace…
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs" style={{ color:C.g400 }}>
                    <RefreshCw size={12} className="animate-spin"/>Taking you to live offers…
                  </div>
                </div>
              )}

              {/* FORGOT f3 — New password */}
              {step === 'f3' && (
                <>
                  {globalError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ backgroundColor:'#FEF2F2', color:C.danger }}>
                      <AlertCircle size={13}/>{globalError}
                    </div>
                  )}
                  <Field label="New Password" error={errs.password}>
                    <Input icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Create a new strong password"
                      value={password} onChange={e => setPassword(e.target.value)} error={errs.password}
                      rightIcon={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:C.g400 }}>
                          {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      }/>
                    <PwStrength password={password}/>
                  </Field>
                  <Field label="Confirm New Password" error={errs.confirm}>
                    <Input icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                      value={confirm} onChange={e => setConfirm(e.target.value)} error={errs.confirm}
                      rightIcon={
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:C.g400 }}>
                          {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      }/>
                  </Field>
                  <button onClick={handleResetPassword} disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/>Resetting…</> : <>Reset Password <ArrowRight size={15}/></>}
                  </button>
                </>
              )}

              {/* FORGOT f4 — Success */}
              {step === 'f4' && (
                <div className="text-center py-6 fade">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor:`${C.success}15` }}>
                    <CheckCircle size={40} style={{ color:C.success }}/>
                  </div>
                  <h3 className="text-xl font-black mb-2" style={{ color:C.forest, fontFamily:"'Syne',sans-serif" }}>
                    Password Reset! ✅
                  </h3>
                  <p className="text-sm mb-6" style={{ color:C.g500 }}>
                    You can now log in with your new password.
                  </p>
                  <button onClick={() => navigate('/login')}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-white hover:opacity-90 transition shadow-lg"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    Go to Login →
                  </button>
                </div>
              )}

            </div>

            {/* Card footer */}
            {step !== 4 && step !== 'f4' && (
              <div className="px-5 md:px-7 py-3.5 border-t" style={{ borderColor:C.g100, backgroundColor:C.g50 }}>
                <p className="text-center font-bold mb-1" style={{ fontSize:11, color:C.forest }}>
                  🏆 Africa's #1 P2P Bitcoin Platform
                </p>
                <p className="text-center mb-2.5" style={{ fontSize:10, color:C.g500, lineHeight:1.5 }}>
                  Escrow on every trade · 0.5% flat fee · 180+ countries · 2.4M+ traders
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1" style={{ fontSize:10, color:C.g400 }}>
                    <Shield size={10}/> 256-bit SSL · Zero fraud guarantee
                  </div>
                  {mode === 'register' && step === 1 && (
                    <button onClick={startForgot} className="text-xs font-bold hover:underline" style={{ color:C.green }}>
                      Forgot password?
                    </button>
                  )}
                  {mode === 'forgot' && (
                    <button onClick={backToRegister} className="text-xs font-bold hover:underline" style={{ color:C.g500 }}>
                      ← Register instead
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {step === 1 && mode === 'register' && (
            <p className="text-center text-xs mt-4" style={{ color:C.g500 }}>
              Already have an account?{' '}
              <Link to="/login" className="font-black hover:underline" style={{ color:C.green }}>Sign In</Link>
            </p>
          )}
        </div>
      </div>

      <BottomNav/>
    </div>
  );
}
