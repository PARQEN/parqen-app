import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notifications from './Notifications';
import {
  ShoppingBag, PlusCircle, List, Wallet, User, Settings,
  LogOut, Menu, X, LayoutDashboard, TrendingUp, Bitcoin,
  DollarSign, ChevronDown, Eye, EyeOff, Gift, Shield,
  Award, BarChart3, Bell, HelpCircle, Zap, ArrowRight,
  BadgeCheck
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155',
  success:'#10B981', danger:'#EF4444',
};

// ─── Beta badge ───────────────────────────────────────────────────────────────
function Beta({small=false}) {
  return (
    <span
      className={`inline-flex items-center font-black rounded-full ${small?'text-[8px] px-1.5 py-0':'text-[9px] px-2 py-0.5'}`}
      style={{backgroundColor:'#EF4444', color:'#fff', letterSpacing:'0.05em'}}>
      BETA
    </span>
  );
}

export default function Navbar({user, onLogout}) {
  const navigate = useNavigate();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [marketDrop,   setMarketDrop]   = useState(false);
  const [profileDrop,  setProfileDrop]  = useState(false);
  const [showBal,      setShowBal]      = useState(true);
  const [balance,      setBalance]      = useState(0);
  const [hdBalance,    setHdBalance]    = useState(0);
  const [localUser,    setLocalUser]    = useState(user);

  // Sync from localStorage on avatar/profile update
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

  useEffect(()=>{
    if(user) loadBalance();
  },[user]);

  const loadBalance = async()=>{
    try {
      const tk=localStorage.getItem('token');
      // Fetch regular wallet balance
      const r=await axios.get(`${API_URL}/wallet`,{headers:{Authorization:`Bearer ${tk}`}});
      const walletBal = r.data.wallet?.balance_btc||0;
      setBalance(walletBal);
      
      // Fetch HD wallet balance
      try {
        const hdR = await axios.get(`${API_URL}/hd-wallet/wallet`, {headers:{Authorization:`Bearer ${tk}`}});
        const hdBal = hdR.data.balance_btc || 0;
        setHdBalance(hdBal);
        console.log('💰 HD Wallet balance from navbar:', hdBal, 'BTC');
        console.log('💰 Total balance (wallet + HD):', (parseFloat(walletBal) + parseFloat(hdBal)).toFixed(8), 'BTC');
      } catch (hdErr) {
        console.error('Failed to load HD wallet balance:', hdErr);
        setHdBalance(0);
      }
      
      console.log('💰 Regular wallet balance from navbar:', walletBal);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
      setBalance(0);
      setHdBalance(0);
    }
  };

  // Close dropdowns on outside click
  useEffect(()=>{
    const h=()=>{ setMarketDrop(false); setProfileDrop(false); };
    document.addEventListener('click',h);
    return()=>document.removeEventListener('click',h);
  },[]);

  const displayUser = localUser?.id ? localUser : user;
  const fmtBtc = n => parseFloat(n||0).toFixed(6);

  const handleLogout=()=>{ onLogout(); navigate('/login'); };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b" style={{borderColor:C.g200, boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── LOGO ─────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center flex-shrink-0 select-none">
            <span className="text-2xl font-black tracking-tight" style={{fontFamily:"'DM Sans',sans-serif"}}>
              <span style={{color:C.forest}}>PRA</span><span style={{color:C.gold}}>QEN</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV ────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-0.5">

            {/* Dashboard */}
            <Link to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-gray-50"
              style={{color:C.g700}}>
              <LayoutDashboard size={16}/>
              Dashboard
            </Link>

            {/* Marketplace dropdown */}
            <div className="relative">
              <button
                onClick={e=>{e.stopPropagation();setMarketDrop(!marketDrop);setProfileDrop(false);}}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-gray-50"
                style={{color:C.g700}}>
                <ShoppingBag size={16}/>
                Marketplace
                <Beta small/>
                <ChevronDown size={14} className={`transition-transform ml-0.5 ${marketDrop?'rotate-180':''}`} style={{color:C.g400}}/>
              </button>

              {marketDrop&&(
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border overflow-hidden"
                  style={{borderColor:C.g100}}>
                  {/* P2P Bitcoin */}
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{color:C.g400}}>
                      P2P BITCOIN
                    </p>
                  </div>
                  <Link to="/buy-bitcoin" onClick={()=>setMarketDrop(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition mx-1 rounded-xl">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{backgroundColor:`${C.success}15`}}>
                      <Bitcoin size={15} style={{color:C.success}}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm" style={{color:C.g800}}>Buy Bitcoin</p>
                        <Beta small/>
                      </div>
                      <p className="text-[10px]" style={{color:C.g400}}>Pay with mobile money or bank</p>
                    </div>
                  </Link>
                  <Link to="/sell-bitcoin" onClick={()=>setMarketDrop(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition mx-1 rounded-xl">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{backgroundColor:`${C.amber}15`}}>
                      <DollarSign size={15} style={{color:C.amber}}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm" style={{color:C.g800}}>Sell Bitcoin</p>
                        <Beta small/>
                      </div>
                      <p className="text-[10px]" style={{color:C.g400}}>Receive local currency instantly</p>
                    </div>
                  </Link>

                  {/* Gift Cards */}
                  <div className="px-3 pt-2 pb-1 mt-1 border-t" style={{borderColor:C.g100}}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{color:C.g400}}>
                      GIFT CARDS
                    </p>
                  </div>
                  <Link to="/gift-cards" onClick={()=>setMarketDrop(false)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition mx-1 mb-1 rounded-xl">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{backgroundColor:'#CCFBF1'}}>
                      <Gift size={15} style={{color:'#0D9488'}}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm" style={{color:C.g800}}>Gift Cards</p>
                        <Beta small/>
                      </div>
                      <p className="text-[10px]" style={{color:C.g400}}>Amazon, iTunes, Steam & more</p>
                    </div>
                  </Link>

                  {/* Create Offer CTA */}
                  <div className="p-3 border-t" style={{borderColor:C.g100}}>
                    <Link to="/create-offer" onClick={()=>setMarketDrop(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl font-bold text-sm"
                      style={{backgroundColor:C.gold, color:C.forest}}>
                      <span>Create an Offer</span>
                      <ArrowRight size={14}/>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* My Trades */}
            <Link to="/my-trades"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-gray-50"
              style={{color:C.g700}}>
              <List size={16}/>
              My Trades
            </Link>

            {/* Gift Cards — standalone link, no icon, Beta badge */}
            <Link to="/gift-cards"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-gray-50"
              style={{color:C.g700}}>
              Gift Cards
              <Beta small/>
            </Link>

            {/* Create Offer */}
            <Link to="/create-offer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition ml-1"
              style={{backgroundColor:C.gold, color:C.forest}}>
              <PlusCircle size={15}/>
              Create Offer
            </Link>

            {/* Wallet balance */}
            <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
              style={{backgroundColor:C.mist, borderColor:`${C.green}20`}}>
              <button onClick={()=>setShowBal(!showBal)} style={{color:C.g400}} className="hover:text-gray-600">
                {showBal?<Eye size={14}/>:<EyeOff size={14}/>}
              </button>
              <Link to="/wallet" className="flex items-center gap-1.5">
                <Wallet size={14} style={{color:C.green}}/>
                <span className="font-black text-xs" style={{color:C.green}}>
                  {showBal?`${fmtBtc(parseFloat(balance||0) + parseFloat(hdBalance||0))} BTC`:'••••••'}
                </span>
              </Link>
            </div>

            {/* Notifications */}
            <Notifications user={displayUser}/>

            {/* Profile dropdown */}
            <div className="relative ml-1">
              <button
                onClick={e=>{e.stopPropagation();setProfileDrop(!profileDrop);setMarketDrop(false);}}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition">
                {/* Real avatar */}
                <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm text-white"
                  style={{backgroundColor:C.green}}>
                  {displayUser?.avatar_url
                    ? <img src={displayUser.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                    : displayUser?.username?.charAt(0)?.toUpperCase()||'U'}
                </div>
                <ChevronDown size={13} className={`transition-transform ${profileDrop?'rotate-180':''}`} style={{color:C.g400}}/>
              </button>

              {profileDrop&&(
                <div className="absolute top-full right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border overflow-hidden"
                  style={{borderColor:C.g100}}>

                  {/* User info header */}
                  <div className="flex items-center gap-3 p-4 border-b" style={{borderColor:C.g100,backgroundColor:C.mist}}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                      style={{backgroundColor:C.green}}>
                      {displayUser?.avatar_url
                        ? <img src={displayUser.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                        : displayUser?.username?.charAt(0)?.toUpperCase()||'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate" style={{color:C.forest}}>{displayUser?.username||'User'}</p>
                      <p className="text-[11px] truncate" style={{color:C.g400}}>{displayUser?.email||''}</p>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    {[
                      {to:'/profile',      icon:User,      label:'Your public profile',   sub:'View and edit your profile'},
                      {to:'/my-trades',    icon:BarChart3, label:'Trade history',          sub:'Partners, statistics'},
                      {to:'/my-listings',  icon:Gift,      label:'My Listings',            sub:'Manage your offers'},
                      {to:'/settings',     icon:Settings,  label:'Account settings',       sub:'Verification, notifications, security'},
                    ].map(({to,icon:Icon,label,sub})=>(
                      <Link key={to} to={to} onClick={()=>setProfileDrop(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                        <Icon size={16} style={{color:C.green,flexShrink:0}}/>
                        <div>
                          <p className="font-semibold text-sm" style={{color:C.g800}}>{label}</p>
                          <p className="text-[10px]" style={{color:C.g400}}>{sub}</p>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={()=>{setProfileDrop(false);window.open('mailto:support@praqen.com?subject=Idea Submission','_blank');}}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left">
                      <HelpCircle size={16} style={{color:C.green,flexShrink:0}}/>
                      <div>
                        <p className="font-semibold text-sm" style={{color:C.g800}}>Submit an idea</p>
                        <p className="text-[10px]" style={{color:C.g400}}>Help us improve PRAQEN</p>
                      </div>
                    </button>
                    <div className="border-t mx-3 my-1" style={{borderColor:C.g100}}/>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition text-left">
                      <LogOut size={16} className="text-red-500 flex-shrink-0"/>
                      <div>
                        <p className="font-semibold text-sm text-red-600">Log out</p>
                        <p className="text-[10px]" style={{color:C.g400}}>Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile burger */}
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg"
            style={{color:C.green}}>
            {mobileOpen?<X size={22}/>:<Menu size={22}/>}
          </button>
        </div>

        {/* ── MOBILE MENU ──────────────────────────────────────── */}
        {mobileOpen&&(
          <div className="md:hidden py-3 border-t space-y-1" style={{borderColor:C.g200}}>
            {[
              {to:'/dashboard',    icon:LayoutDashboard, label:'Dashboard'},
              {to:'/buy-bitcoin',  icon:Bitcoin,         label:'Buy Bitcoin',  beta:true},
              {to:'/sell-bitcoin', icon:DollarSign,      label:'Sell Bitcoin', beta:true},
              {to:'/gift-cards',   icon:null,            label:'Gift Cards',   beta:true},
              {to:'/my-trades',    icon:List,            label:'My Trades'},
              {to:'/create-offer', icon:PlusCircle,      label:'Create Offer', cta:true},
              {to:'/wallet',       icon:Wallet,          label:`Wallet (${fmtBtc(balance)} BTC)`},
              {to:'/profile',      icon:User,            label:'Profile'},
              {to:'/settings',     icon:Settings,        label:'Settings'},
            ].map(({to,icon:Icon,label,beta,cta})=>(
              <Link key={to} to={to} onClick={()=>setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                style={cta?{backgroundColor:C.gold,color:C.forest}:{color:C.g700}}>
                {Icon&&<Icon size={17} style={{color:cta?C.forest:C.green}}/>}
                <span className="font-semibold text-sm">{label}</span>
                {beta&&<Beta small/>}
              </Link>
            ))}
            <div className="border-t pt-2" style={{borderColor:C.g100}}>
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition w-full text-red-600">
                <LogOut size={17}/>
                <span className="font-semibold text-sm">Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
