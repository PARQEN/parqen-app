import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useRates } from '../contexts/RatesContext';
import Notifications from './Notifications';
import {
  Wallet, User, Settings, LogOut, ChevronDown,
  BarChart3, Gift, List, Eye, EyeOff, ShoppingCart, Tag,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5',
  g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g700:'#334155', g800:'#1E293B',
};

const fmt    = (n,d=2) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc = (n)    => parseFloat(n||0).toFixed(4);

export default function Navbar({user, onLogout}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {rates: USD_RATES, btcUsd} = useRates();
  const [profileDrop, setProfileDrop] = useState(false);
  const [marketDrop,  setMarketDrop]  = useState(false);
  const [balance,     setBalance]     = useState(0);
  const [hdBalance,   setHdBalance]   = useState(0);
  const [localUser,   setLocalUser]   = useState(user);
  const [showBal,     setShowBal]     = useState(true);
  const dropRef   = useRef(null);
  const marketRef = useRef(null);

  // Sync user from localStorage / profile updates
  useEffect(()=>{
    const sync=()=>{
      const s=JSON.parse(localStorage.getItem('user')||'{}');
      if(s?.id) setLocalUser(s);
    };
    sync();
    window.addEventListener('storage',sync);
    window.addEventListener('userUpdated',sync);
    return()=>{ window.removeEventListener('storage',sync); window.removeEventListener('userUpdated',sync); };
  },[]);

  useEffect(()=>{ if(user?.id) setLocalUser(user); },[user?.id]);

  // Poll wallet balance every 30 s
  useEffect(()=>{
    if(!user) return;
    loadBalance();
    const iv=setInterval(loadBalance,30000);
    return()=>clearInterval(iv);
  },[user]);

  const loadBalance = async()=>{
    try {
      const tk=localStorage.getItem('token');
      const [r1,r2]=await Promise.allSettled([
        axios.get(`${API_URL}/wallet`,          {headers:{Authorization:`Bearer ${tk}`}}),
        axios.get(`${API_URL}/hd-wallet/wallet`,{headers:{Authorization:`Bearer ${tk}`}}),
      ]);
      setBalance  (r1.status==='fulfilled'?r1.value.data.wallet?.balance_btc||0:0);
      setHdBalance(r2.status==='fulfilled'?r2.value.data.balance_btc||0:0);
    } catch {}
  };

  // Close dropdowns on outside click
  useEffect(()=>{
    const h=e=>{
      if(dropRef.current   && !dropRef.current.contains(e.target))   setProfileDrop(false);
      if(marketRef.current && !marketRef.current.contains(e.target)) setMarketDrop(false);
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const displayUser    = localUser?.id ? localUser : user;
  const totalBtc       = parseFloat(balance||0)+parseFloat(hdBalance||0);
  const ghsRate        = USD_RATES?.GHS||0;
  const btcToGhs       = (btcUsd||0)*ghsRate;
  const totalLocal     = totalBtc * btcToGhs;
  const localSym       = '₵';
  const handleLogout   = ()=>{ onLogout(); navigate('/login'); };

  const isActive       = (path) => location.pathname === path;
  const isMarketActive = ['/buy-bitcoin','/sell-bitcoin','/gift-cards'].some(p => location.pathname.startsWith(p));

  const navLink = (path) =>
    isActive(path)
      ? 'px-3 py-2 rounded-lg text-sm font-black transition whitespace-nowrap bg-[#F0FAF5] text-[#1B4332]'
      : 'px-3 py-2 rounded-lg text-sm font-black transition whitespace-nowrap text-[#334155] hover:bg-gray-50 hover:text-[#1B4332]';

  // ── Shared Nav Links ────────────────────────────────────────────────────────
  const DesktopNavLinks = () => (
    <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">

      <Link to="/dashboard" className={navLink('/dashboard')}>Dashboard</Link>

      {/* Marketplace Dropdown */}
      <div className="relative" ref={marketRef}>
        <button
          onClick={() => setMarketDrop(!marketDrop)}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-black transition whitespace-nowrap ${
            isMarketActive
              ? 'bg-[#F0FAF5] text-[#1B4332]'
              : 'text-[#334155] hover:bg-gray-50 hover:text-[#1B4332]'
          }`}>
          Marketplace
          <span className="text-[10px] bg-[#F4A422] text-white px-1.5 py-0.5 rounded-full font-black">BETA</span>
          <ChevronDown size={14} className={`transition-transform ${marketDrop?'rotate-180':''}`} />
        </button>

        {marketDrop && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            <Link to="/buy-bitcoin" onClick={()=>setMarketDrop(false)}
              className={`flex items-center gap-3 px-4 py-3 transition border-b border-gray-100 ${isActive('/buy-bitcoin')?'bg-[#F0FAF5]':'hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <ShoppingCart size={16} className="text-[#2D6A4F]" />
              </div>
              <div>
                <p className={`text-sm font-black ${isActive('/buy-bitcoin')?'text-[#1B4332]':'text-[#1E293B]'}`}>Buy Bitcoin</p>
                <p className="text-[10px] text-gray-400">Pay with local currency</p>
              </div>
            </Link>
            <Link to="/sell-bitcoin" onClick={()=>setMarketDrop(false)}
              className={`flex items-center gap-3 px-4 py-3 transition border-b border-gray-100 ${isActive('/sell-bitcoin')?'bg-[#F0FAF5]':'hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Tag size={16} className="text-[#F4A422]" />
              </div>
              <div>
                <p className={`text-sm font-black ${isActive('/sell-bitcoin')?'text-[#1B4332]':'text-[#1E293B]'}`}>Sell Bitcoin</p>
                <p className="text-[10px] text-gray-400">Get paid in local currency</p>
              </div>
            </Link>
            <Link to="/gift-cards" onClick={()=>setMarketDrop(false)}
              className={`flex items-center gap-3 px-4 py-3 transition ${isActive('/gift-cards')?'bg-[#F0FAF5]':'hover:bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Gift size={16} className="text-[#8B5CF6]" />
              </div>
              <div>
                <p className={`text-sm font-black ${isActive('/gift-cards')?'text-[#1B4332]':'text-[#1E293B]'}`}>Gift Cards</p>
                <p className="text-[10px] text-gray-400">Trade cards for Bitcoin</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      <Link to="/my-trades" className={navLink('/my-trades')}>My Trades</Link>

      {/* Create Offer CTA */}
      <Link to="/create-offer"
        className={`px-3 py-2 rounded-xl text-sm font-black text-white transition whitespace-nowrap ${
          isActive('/create-offer') ? 'bg-[#2D6A4F]' : 'bg-[#1B4332] hover:bg-[#2D6A4F]'
        }`}>
        + Create Offer
      </Link>
    </div>
  );

  // ── Guest navbar (unauthenticated) ─────────────────────────────────────────
  if(!user) return (
    <nav className="bg-white sticky top-0 z-50 border-b"
      style={{borderColor:C.g200, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 select-none">
            <span className="text-xl font-black tracking-tight">
              <span style={{color:C.forest}}>PRA</span><span style={{color:C.gold}}>QEN</span>
            </span>
          </Link>
          {/* Desktop Nav Links */}
          <DesktopNavLinks />
          {/* Right: auth buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/login"
              className="px-4 py-2 rounded-xl text-sm font-black border-2 transition hover:bg-gray-50"
              style={{
                borderColor: isActive('/login') ? C.forest : C.g200,
                color:       isActive('/login') ? C.forest : C.g700,
                backgroundColor: isActive('/login') ? C.mist : undefined,
              }}>
              Log In
            </Link>
            <Link to="/register"
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition hover:opacity-90"
              style={{backgroundColor: isActive('/register') ? C.green : C.forest}}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <nav className="bg-white sticky top-0 z-50 border-b"
      style={{borderColor:C.g200, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-center justify-between h-14 gap-2">

          {/* ── LOGO ───────────────────────────────────────────────── */}
          <Link to="/" className="flex-shrink-0 select-none">
            <span className="text-xl font-black tracking-tight">
              <span style={{color:C.forest}}>PRA</span><span style={{color:C.gold}}>QEN</span>
            </span>
          </Link>

          {/* ── CENTER: Desktop Nav Links ───────────────────────────── */}
          <DesktopNavLinks />

          {/* ── RIGHT: Wallet · Avatar · Bell ──────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Wallet balance */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border"
              style={{borderColor:`${C.green}30`, backgroundColor: isActive('/wallet') ? '#d9f0e5' : C.mist}}>
              <button onClick={()=>setShowBal(!showBal)}
                className="flex-shrink-0 hover:opacity-70 transition"
                title={showBal?'Hide balance':'Show balance'}>
                {showBal
                  ? <Eye size={14} style={{color:C.green}}/>
                  : <EyeOff size={14} style={{color:C.g400}}/>}
              </button>
              <Link to="/wallet" className="flex items-center gap-1 hover:opacity-80 transition">
                <span className="text-sm font-black" style={{color:C.forest}}>
                  {showBal ? `${localSym}${fmt(totalLocal,2)}` : '••••'}
                </span>
              </Link>
            </div>

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={()=>setProfileDrop(!profileDrop)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                  style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
                  {displayUser?.avatar_url
                    ? <img src={displayUser.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                    : displayUser?.username?.charAt(0)?.toUpperCase()||'U'}
                </div>
                <span className="hidden md:block text-sm font-black truncate max-w-[80px]" style={{color:C.g700}}>
                  {displayUser?.username||'User'}
                </span>
                <ChevronDown size={14}
                  className={`transition-transform ${profileDrop?'rotate-180':''}`}
                  style={{color:C.g400}}/>
              </button>

              {/* ── DROPDOWN ─────────────────────────────────────────── */}
              {profileDrop&&(
                <div className="absolute top-full right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50"
                  style={{borderColor:C.g100}}>

                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{borderColor:C.g100,backgroundColor:C.mist}}>
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
                      {displayUser?.avatar_url
                        ? <img src={displayUser.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                        : displayUser?.username?.charAt(0)?.toUpperCase()||'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate" style={{color:C.forest}}>
                        {displayUser?.username||'User'}
                      </p>
                      <p className="text-xs font-bold truncate" style={{color:C.g400}}>
                        {displayUser?.email||''}
                      </p>
                    </div>
                  </div>

                  {/* Wallet row */}
                  <Link to="/wallet" onClick={()=>setProfileDrop(false)}
                    className={`flex items-center justify-between px-4 py-2.5 transition border-b ${isActive('/wallet')?'bg-[#F0FAF5]':'hover:bg-gray-50'}`}
                    style={{borderColor:C.g100}}>
                    <div className="flex items-center gap-2.5">
                      <Wallet size={14} style={{color: isActive('/wallet') ? C.forest : C.green, flexShrink:0}}/>
                      <span className="text-sm font-bold" style={{color: isActive('/wallet') ? C.forest : C.g800}}>My Wallet</span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                      style={{backgroundColor:C.mist,color:C.forest,border:`1px solid ${C.green}30`}}>
                      ₿ {fmtBtc(totalBtc)}
                    </span>
                  </Link>

                  {/* Nav links */}
                  <div className="py-1">
                    {[
                      {to:'/profile',      icon:User,     label:'Your Profile'},
                      {to:'/my-trades',    icon:List,     label:'My Trades'},
                      {to:'/my-listings',  icon:BarChart3,label:'My Listings'},
                      {to:'/gift-cards',   icon:Gift,     label:'Gift Cards'},
                      {to:'/settings',     icon:Settings, label:'Settings'},
                    ].map(({to,icon:Icon,label})=>(
                      <Link key={to} to={to} onClick={()=>setProfileDrop(false)}
                        className={`flex items-center gap-3 px-4 py-2 transition ${isActive(to)?'bg-[#F0FAF5]':'hover:bg-gray-50'}`}>
                        <Icon size={14} style={{color: isActive(to) ? C.forest : C.green, flexShrink:0}}/>
                        <span className="text-sm font-bold" style={{color: isActive(to) ? C.forest : C.g800}}>{label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="border-t mx-3 my-1" style={{borderColor:C.g100}}/>
                  <button onClick={()=>{setProfileDrop(false);handleLogout();}}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-left mb-1">
                    <LogOut size={14} className="text-red-500 flex-shrink-0"/>
                    <span className="text-sm font-bold text-red-600">Log out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications bell */}
            <Notifications user={displayUser}/>
          </div>
        </div>
      </div>
    </nav>
  );
}
