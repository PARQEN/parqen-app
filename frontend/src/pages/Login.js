import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import { supabase } from '../lib/supabaseClient';
import {
  Mail, Lock, Eye, EyeOff, Shield, ArrowRight,
  AlertCircle, RefreshCw, Smartphone, AtSign, Bitcoin,
  Home, Gift, LogIn,
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155',
  success:'#10B981', danger:'#EF4444',
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

  const [method, setMethod]         = useState('email');
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
      const { error } = await supabase.auth.resend({ type:'signup', email: method==='email' ? email : undefined });
      if (error) setError(error.message);
      else { setError('Verification email sent! Please check your inbox.'); setShowResend(false); }
    } catch { setError('Failed to resend verification email.'); }
    finally { setLoading(false); }
  };

  const sendOtp = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: contact });
      if (error) setError(error.message);
      else { setOtpSent(true); setError('OTP sent to your phone!'); }
    } catch { setError('Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: contact, token: otp, type:'sms' });
      if (error) setError(error.message);
      else {
        const response = await axios.post(`${API_URL}/auth/login`, { phone: contact, method:'phone' });
        if (response.data.success) {
          if (rememberMe) localStorage.setItem('remember_contact', contact);
          onLogin(response.data.user, response.data.token);
          navigate('/buy-bitcoin');
        }
      }
    } catch (err) { setError(err.response?.data?.error || 'OTP verification failed.'); }
    finally { setLoading(false); }
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
    setError(''); setShowResend(false);
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.success) {
        if (rememberMe) localStorage.setItem('remember_contact', email);
        onLogin(response.data.user, response.data.token);
        navigate('/buy-bitcoin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      padding:'32px 16px 112px', fontFamily:"'DM Sans',sans-serif",
      background:`linear-gradient(160deg,${C.forest} 0%,${C.green} 55%,${C.mint} 100%)`,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .sl{animation:slideUp .3s ease}
      `}</style>

      {/* ── Single card — no split panel, one logo only ── */}
      <div className="sl" style={{
        width:'100%', maxWidth:420,
        backgroundColor:C.white, borderRadius:28,
        boxShadow:'0 24px 60px rgba(0,0,0,0.35)', overflow:'hidden',
      }}>

        {/* Card header — green, contains the ONE logo */}
        <div style={{
          background:`linear-gradient(140deg,${C.forest} 0%,${C.green} 60%,${C.mint} 100%)`,
          padding:'28px 24px 24px', position:'relative', overflow:'hidden',
        }}>
          {/* Dot pattern */}
          <div style={{
            position:'absolute', inset:0, opacity:0.08,
            backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',
            backgroundSize:'24px 24px',
          }}/>
          {/* Gold glow orb */}
          <div style={{
            position:'absolute', top:-40, right:-40, width:120, height:120,
            borderRadius:'50%', backgroundColor:C.gold, opacity:0.25, filter:'blur(40px)',
          }}/>
          <div style={{position:'relative'}}>
            {/* Logo — ONE instance */}
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16}}>
              <div style={{
                width:36, height:36, borderRadius:10, display:'flex', alignItems:'center',
                justifyContent:'center', fontWeight:900, fontSize:16,
                backgroundColor:C.gold, color:C.forest, flexShrink:0,
              }}>P</div>
              <span style={{color:C.white, fontWeight:900, fontSize:20, fontFamily:"'Syne',sans-serif", letterSpacing:'-0.3px'}}>
                PRAQEN
              </span>
            </div>
            <h1 style={{color:C.white, fontWeight:900, fontSize:26, fontFamily:"'Syne',sans-serif", margin:'0 0 4px'}}>
              Welcome Back
            </h1>
            <p style={{color:'rgba(255,255,255,0.65)', fontSize:13, margin:0}}>
              Sign in to your P2P trading account
            </p>
          </div>
        </div>

        {/* Form body */}
        <div style={{padding:'20px 24px', display:'flex', flexDirection:'column', gap:14}}>

          {redirectMessage && !error && (
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',borderRadius:12,fontSize:12,
              backgroundColor:'#FFFBEB',color:'#92400E',border:'1.5px solid #FDE68A'}}>
              <AlertCircle size={14} style={{flexShrink:0}}/>{redirectMessage}
            </div>
          )}

          {error && (
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 14px',borderRadius:12,fontSize:12,
              backgroundColor:'#FEF2F2',color:C.danger,border:'1.5px solid #FECACA'}}>
              <AlertCircle size={14} style={{flexShrink:0}}/>{error}
            </div>
          )}

          {showResend && (
            <button onClick={resendVerification} disabled={loading} style={{
              width:'100%',padding:'12px',borderRadius:12,border:'none',cursor:'pointer',
              color:C.white,fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              background:`linear-gradient(135deg,${C.green},${C.mint})`,opacity:loading?0.6:1,
            }}>
              {loading ? <RefreshCw size={12} className="animate-spin"/> : <Mail size={12}/>}
              Resend Verification Email
            </button>
          )}

          {/* Email / Phone toggle */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,padding:6,
            backgroundColor:C.g100,borderRadius:16}}>
            {[
              { val:'email', Icon:AtSign,     label:'Email' },
              { val:'phone', Icon:Smartphone, label:'Phone' },
            ].map(({ val, Icon, label }) => (
              <button key={val}
                onClick={() => { setMethod(val); setError(''); setOtpSent(false); setOtp(''); }}
                style={{
                  display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  padding:'10px 0', borderRadius:12, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                  backgroundColor: method===val ? C.white : 'transparent',
                  color: method===val ? C.green : C.g500,
                  boxShadow: method===val ? '0 2px 8px rgba(45,106,79,0.15)' : 'none',
                }}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>

          {/* Contact input */}
          {method === 'email' ? (
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,marginBottom:6,color:C.g700}}>
                Email Address
              </label>
              <div style={{position:'relative'}}>
                <Mail size={15} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:C.g400}}/>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  style={{
                    width:'100%',boxSizing:'border-box',
                    paddingLeft:40,paddingRight:16,paddingTop:13,paddingBottom:13,
                    fontSize:15,border:`2px solid ${error&&!email ? C.danger : email ? C.green : C.g200}`,
                    borderRadius:12,outline:'none',color:'#1E293B',
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,marginBottom:6,color:C.g700}}>
                Phone Number
              </label>
              <div style={{display:'flex',gap:8}}>
                <div style={{position:'relative',flexShrink:0}}>
                  <button onClick={() => setShowCodes(!showCodes)} style={{
                    display:'flex',alignItems:'center',gap:6,padding:'13px 12px',
                    border:`2px solid ${C.g200}`,borderRadius:12,background:C.white,cursor:'pointer',
                    fontSize:12,fontWeight:700,color:C.g700,
                  }}>
                    <span style={{fontSize:16}}>{phoneCode.flag}</span>
                    <span>{phoneCode.code}</span>
                    <span style={{color:C.g400,fontSize:10}}>▼</span>
                  </button>
                  {showCodes && (
                    <div style={{
                      position:'absolute',top:'100%',left:0,marginTop:6,width:220,
                      backgroundColor:C.white,borderRadius:16,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',
                      zIndex:50,border:`1px solid ${C.g100}`,maxHeight:200,overflowY:'auto',
                    }}>
                      {PHONE_CODES.map(pc => (
                        <button key={pc.code}
                          onClick={() => { setPhoneCode(pc); setShowCodes(false); }}
                          style={{
                            width:'100%',display:'flex',alignItems:'center',gap:10,
                            padding:'10px 14px',background:'none',border:'none',
                            borderBottom:`1px solid ${C.g50}`,cursor:'pointer',fontSize:12,
                          }}>
                          <span style={{fontSize:16}}>{pc.flag}</span>
                          <span style={{fontWeight:700,flex:1,textAlign:'left',color:C.g700}}>{pc.name}</span>
                          <span style={{color:C.g400}}>{pc.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{flex:1,position:'relative'}}>
                  <Smartphone size={15} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:C.g400}}/>
                  <input type="tel" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g,'')); setError(''); }}
                    placeholder="24 XXX XXXX"
                    style={{
                      width:'100%',boxSizing:'border-box',
                      paddingLeft:40,paddingRight:16,paddingTop:13,paddingBottom:13,
                      fontSize:15,border:`2px solid ${error&&!phone ? C.danger : phone ? C.green : C.g200}`,
                      borderRadius:12,outline:'none',color:'#1E293B',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email: password + remember me + submit */}
          {method === 'email' && (
            <>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <label style={{fontSize:11,fontWeight:700,color:C.g700}}>Password</label>
                  <Link to="/forgot-password" style={{fontSize:11,fontWeight:700,color:C.green,textDecoration:'none'}}>
                    Forgot?
                  </Link>
                </div>
                <div style={{position:'relative'}}>
                  <Lock size={15} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:C.g400}}/>
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    style={{
                      width:'100%',boxSizing:'border-box',
                      paddingLeft:40,paddingRight:44,paddingTop:13,paddingBottom:13,
                      fontSize:15,border:`2px solid ${error&&!password ? C.danger : password ? C.green : C.g200}`,
                      borderRadius:12,outline:'none',color:'#1E293B',
                    }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',color:C.g400,padding:0,
                  }}>
                    {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>

              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <div onClick={() => setRememberMe(!rememberMe)} style={{
                  width:20,height:20,borderRadius:6,border:`2px solid ${rememberMe ? C.green : C.g200}`,
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                  backgroundColor: rememberMe ? C.green : 'transparent',
                }}>
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{fontSize:12,color:C.g600}}>Remember me on this device</span>
              </label>

              <button onClick={handleEmailLogin} disabled={loading} style={{
                width:'100%',padding:'14px',borderRadius:14,border:'none',cursor:'pointer',
                color:C.white,fontSize:14,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                background:`linear-gradient(135deg,${C.green},${C.mint})`,
                boxShadow:'0 4px 16px rgba(45,106,79,0.4)',opacity:loading?0.6:1,
              }}>
                {loading ? <><RefreshCw size={15} className="animate-spin"/>Signing in…</> : <>Sign In <ArrowRight size={16}/></>}
              </button>
            </>
          )}

          {/* Phone: OTP */}
          {method === 'phone' && (
            <>
              {!otpSent ? (
                <button onClick={sendOtp} disabled={loading} style={{
                  width:'100%',padding:'14px',borderRadius:14,border:'none',cursor:'pointer',
                  color:C.white,fontSize:14,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  background:`linear-gradient(135deg,${C.green},${C.mint})`,
                  boxShadow:'0 4px 16px rgba(45,106,79,0.4)',opacity:loading?0.6:1,
                }}>
                  {loading ? <><RefreshCw size={15} className="animate-spin"/>Sending OTP…</> : <>Send OTP <ArrowRight size={16}/></>}
                </button>
              ) : (
                <>
                  <div>
                    <label style={{display:'block',fontSize:11,fontWeight:700,marginBottom:6,color:C.g700}}>
                      Enter 6-digit OTP
                    </label>
                    <input type="text" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
                      placeholder="123456"
                      style={{
                        width:'100%',boxSizing:'border-box',
                        padding:'14px',fontSize:22,fontFamily:'monospace',letterSpacing:8,
                        border:`2px solid ${error&&otp.length!==6 ? C.danger : otp.length===6 ? C.green : C.g200}`,
                        borderRadius:12,outline:'none',color:'#1E293B',textAlign:'center',
                      }}
                    />
                  </div>
                  <button onClick={verifyOtp} disabled={loading || otp.length !== 6} style={{
                    width:'100%',padding:'14px',borderRadius:14,border:'none',cursor:'pointer',
                    color:C.white,fontSize:14,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                    background:`linear-gradient(135deg,${C.green},${C.mint})`,
                    boxShadow:'0 4px 16px rgba(45,106,79,0.4)',
                    opacity: loading || otp.length!==6 ? 0.5 : 1,
                  }}>
                    {loading ? <><RefreshCw size={15} className="animate-spin"/>Verifying…</> : <>Verify OTP <ArrowRight size={16}/></>}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(''); setError(''); }} style={{
                    width:'100%',padding:'10px',borderRadius:12,border:'none',background:'none',
                    cursor:'pointer',fontSize:12,fontWeight:700,color:C.green,
                  }}>
                    ← Resend OTP
                  </button>
                </>
              )}
            </>
          )}

          {/* Divider */}
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{flex:1,height:1,backgroundColor:C.g200}}/>
            <span style={{fontSize:11,fontWeight:600,color:C.g400}}>OR</span>
            <div style={{flex:1,height:1,backgroundColor:C.g200}}/>
          </div>

          <button onClick={() => navigate('/register')} style={{
            width:'100%',padding:'13px',borderRadius:14,
            border:`2px solid ${C.green}`,background:'none',cursor:'pointer',
            fontSize:13,fontWeight:700,color:C.green,
          }}>
            Create a Free Account
          </button>

          {/* Trust pills */}
          <div style={{display:'flex',justifyContent:'space-around',paddingTop:4}}>
            {[['🔒','Secure'],['⚡','Fast'],['🌍','Global']].map(([icon,label]) => (
              <div key={label} style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                padding:'8px 12px',borderRadius:10,backgroundColor:C.g50,
              }}>
                <span style={{fontSize:18}}>{icon}</span>
                <span style={{fontSize:10,fontWeight:700,color:C.g600}}>{label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Card footer */}
        <div style={{
          padding:'12px 24px',borderTop:`1px solid ${C.g100}`,backgroundColor:C.g50,
          display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.g400}}>
            <Shield size={11}/> SSL Encrypted
          </div>
          <span style={{fontSize:11,color:C.g400}}>© 2025 PRAQEN</span>
        </div>
      </div>

      {/* Sign up link */}
      <p style={{color:'rgba(255,255,255,0.65)',fontSize:12,marginTop:20,textAlign:'center'}}>
        Don't have an account?{' '}
        <Link to="/register" style={{color:C.white,fontWeight:900,textDecoration:'none'}}>Sign Up Free</Link>
      </p>

      {/* Mobile bottom nav */}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,
        backgroundColor:C.white,borderTop:`1px solid ${C.g100}`,
        zIndex:40,paddingBottom:'env(safe-area-inset-bottom)',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',padding:'8px 8px'}}>
          {[
            { Icon:Home,    label:'Home',  path:'/' },
            { Icon:Bitcoin, label:'P2P',   path:'/buy-bitcoin' },
            { Icon:Gift,    label:'Gifts', path:'/gift-cards' },
            { Icon:LogIn,   label:'Login', path:'/login' },
          ].map(({ Icon, label, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:3,
              padding:'6px 16px',borderRadius:12,background:'none',border:'none',cursor:'pointer',
              color: label==='Login' ? C.forest : C.g400,
            }}>
              <Icon size={20} strokeWidth={label==='Login' ? 2.5 : 1.8}/>
              <span style={{fontSize:10,fontWeight:700}}>{label}</span>
              {label==='Login' && (
                <span style={{width:5,height:5,borderRadius:'50%',backgroundColor:C.forest,display:'block'}}/>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
