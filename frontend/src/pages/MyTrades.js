import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Clock, CheckCircle, AlertCircle, Shield, Bitcoin,
  ArrowRight, RefreshCw, TrendingUp, Activity,
  AlertTriangle, Eye, MessageCircle, Zap, Timer,
  Filter, Search, DollarSign, X, Bell, ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
  online:'#22C55E', purple:'#8B5CF6',
};

const authH = () => { const t=localStorage.getItem('token'); return t?{Authorization:`Bearer ${t}`}:{}; };
const fmt = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc = n => parseFloat(n||0).toFixed(8);
const fmtAge = d => {
  if(!d)return'—';
  const s=(Date.now()-new Date(d))/1000;
  if(s<60)return'Just now';
  if(s<3600)return`${~~(s/60)}m ago`;
  if(s<86400)return`${~~(s/3600)}h ago`;
  return`${~~(s/86400)}d ago`;
};

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_MAP = {
  CREATED:      {label:'Escrow Active',   short:'Escrow',    color:C.green,   bg:`${C.green}15`,   dot:C.online,   urgent:true},
  FUNDS_LOCKED: {label:'Escrow Active',   short:'Escrow',    color:C.green,   bg:`${C.green}15`,   dot:C.online,   urgent:true},
  PAYMENT_SENT: {label:'Payment Sent',    short:'Paid',      color:C.paid,    bg:`${C.paid}15`,    dot:C.paid,     urgent:true},
  PAID:         {label:'Payment Sent',    short:'Paid',      color:C.paid,    bg:`${C.paid}15`,    dot:C.paid,     urgent:true},
  COMPLETED:    {label:'Completed',       short:'Done',      color:C.success, bg:`${C.success}15`, dot:C.success,  urgent:false},
  CANCELLED:    {label:'Cancelled',       short:'Cancelled', color:C.g500,    bg:`${C.g100}`,      dot:C.g400,     urgent:false},
  DISPUTED:     {label:'Disputed',        short:'Dispute',   color:C.danger,  bg:`${C.danger}15`,  dot:C.danger,   urgent:true},
};
const getStatus = s => STATUS_MAP[s?.toUpperCase()]||STATUS_MAP.CREATED;

// Only real DB statuses — excludes COMPLETED and CANCELLED
const isActive = s => ['CREATED','FUNDS_LOCKED','PAYMENT_SENT','PAID','DISPUTED'].includes((s||'').toUpperCase());

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({icon:Icon, label, value, color, sub}) {
  return(
    <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{borderColor:C.g200}}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{backgroundColor:`${color}15`}}>
        <Icon size={15} style={{color}}/>
      </div>
      <p className="text-xl font-black" style={{color:C.g800}}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{color:C.g500}}>{label}</p>
      {sub&&<p className="text-xs mt-0.5" style={{color:C.g400}}>{sub}</p>}
    </div>
  );
}

// ─── Active trade alert banner ──────────────────────────────────────────────
function ActiveAlert({trade, userId, onDismiss}) {
  const isBuyer   = String(userId)===String(trade.buyer_id);
  const st        = getStatus(trade.status);
  const cp        = isBuyer ? trade.seller : trade.buyer;
  const payMethod = trade.payment_method||'Mobile Money';
  const cur       = trade.local_currency||trade.currency||trade.listing?.currency||'GHS';
  const sym       = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',USD:'$',GBP:'£',EUR:'€'}[cur]||'₵';
  const localAmt  = parseFloat(trade.amount_local||trade.local_amount||0);
  const feeBtc    = parseFloat(trade.amount_btc||0)*0.005;
  const btcNet    = parseFloat(trade.amount_btc||0) - feeBtc;
  const isPaid    = ['PAYMENT_SENT','PAID'].includes(trade.status?.toUpperCase());
  const isDisputed= trade.status?.toUpperCase()==='DISPUTED';

  // Countdown timer
  const [timeLeft, setTimeLeft] = React.useState(null);
  React.useEffect(()=>{
    if(!trade.created_at) return;
    const mins = parseInt(trade.time_limit||45);
    const tick = ()=>{
      const rem = Math.max(0,Math.floor((new Date(trade.created_at).getTime()+mins*60000-Date.now())/1000));
      setTimeLeft(rem);
    };
    tick();
    const iv = setInterval(tick,1000);
    return()=>clearInterval(iv);
  },[trade.created_at,trade.time_limit]);

  const fmtTimer = s=>{
    if(s===null||s===undefined)return'--:--';
    if(s<=0)return'00:00';
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
    return h>0
      ?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
      :`${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
  };

  const urgent = timeLeft!==null&&timeLeft<300&&timeLeft>0;

  // Dynamic message by role + status
  const roleMsg = isBuyer
    ? isPaid  ? `✅ Payment sent — awaiting release from ${cp?.username||'seller'}`
               : `💸 Send ${sym}${fmt(localAmt)} ${cur} via ${payMethod} to ${cp?.username||'seller'}`
    : isPaid  ? `🔓 ${cp?.username||'Buyer'} paid! Check your ${payMethod} and RELEASE BITCOIN`
               : `⏳ ${cp?.username||'Buyer'} is sending ${sym}${fmt(localAmt)} via ${payMethod}…`;

  return(
    <div className="rounded-2xl overflow-hidden shadow-xl border-2"
      style={{borderColor:isDisputed?C.danger:urgent?C.danger:st.color}}>

      {/* Top bar — gradient with live status */}
      <div className="flex items-center gap-2 px-4 py-2"
        style={{background:`linear-gradient(90deg,${C.forest},${isDisputed?C.danger:st.color})`}}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{backgroundColor:C.online}}/>
        <Bell size={12} className="text-white flex-shrink-0"/>
        <span className="text-xs font-black text-white flex-1">
          {isDisputed?'🚨 DISPUTE ACTIVE — SUPPORT REVIEWING':'⚡ ACTIVE TRADE — ACTION REQUIRED'}
        </span>
        {/* Live countdown */}
        {timeLeft!==null&&!isPaid&&!isDisputed&&(
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full flex-shrink-0 ${urgent?'animate-pulse':''}`}
            style={{backgroundColor:urgent?C.danger:'rgba(255,255,255,0.2)',color:'#fff'}}>
            <Timer size={10} className="inline mr-1"/>
            {fmtTimer(timeLeft)}
          </span>
        )}
        <button onClick={()=>onDismiss(trade.id)} className="text-white/50 hover:text-white ml-1 flex-shrink-0">
          <X size={13}/>
        </button>
      </div>

      {/* Main body */}
      <div className="bg-white">
        {/* Role + action message */}
        <div className="px-4 pt-3 pb-2 border-b" style={{borderColor:C.g100}}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{backgroundColor:`${isBuyer?C.green:C.amber}15`,color:isBuyer?C.green:C.amber}}>
                  {isBuyer?'🛒 YOU ARE BUYING':'💰 YOU ARE SELLING'}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{backgroundColor:st.bg,color:st.color}}>
                  {st.label}
                </span>
                <span className="text-xs font-mono" style={{color:C.g400}}>
                  #{String(trade.id||'').slice(0,8).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-black leading-tight" style={{color:C.forest}}>{roleMsg}</p>
            </div>
            <Link to={`/trade/${trade.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-white font-black text-xs hover:opacity-90 transition shadow flex-shrink-0"
              style={{backgroundColor:isDisputed?C.danger:st.color}}>
              <Zap size={12}/> {isDisputed?'View Dispute':'Open Trade'} <ArrowRight size={11}/>
            </Link>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x px-0" style={{borderColor:C.g100}}>
          {/* User */}
          <div className="px-3 py-2.5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:C.g400}}>
              {isBuyer?'Seller':'Buyer'}
            </p>
            <p className="text-xs font-black truncate" style={{color:C.forest}}>
              {cp?.username||'—'}
            </p>
          </div>
          {/* Payment method */}
          <div className="px-3 py-2.5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:C.g400}}>Payment</p>
            <p className="text-xs font-black truncate" style={{color:C.forest}}>{payMethod}</p>
          </div>
          {/* Amount */}
          <div className="px-3 py-2.5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:C.g400}}>
              {isBuyer?'You Pay':'You Get'}
            </p>
            <p className="text-xs font-black" style={{color:C.forest}}>{sym}{fmt(localAmt)}</p>
          </div>
          {/* BTC */}
          <div className="px-3 py-2.5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:C.g400}}>
              {isBuyer?'You Receive':'You Send'}
            </p>
            <p className="text-xs font-black" style={{color:C.gold}}>₿{fmtBtc(btcNet)}</p>
          </div>
        </div>

        {/* Urgent time warning */}
        {urgent&&!isPaid&&(
          <div className="flex items-center gap-2 px-4 py-2 border-t animate-pulse"
            style={{borderColor:C.danger, backgroundColor:`${C.danger}08`}}>
            <AlertTriangle size={12} style={{color:C.danger,flexShrink:0}}/>
            <p className="text-xs font-black" style={{color:C.danger}}>
              ⚠️ Less than 5 minutes left! Trade auto-cancels at 00:00.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trade row card ─────────────────────────────────────────────────────────
function TradeCard({trade, userId}) {
  const isBuyer = String(userId)===String(trade.buyer_id);
  const st      = getStatus(trade.status);
  const cp      = isBuyer ? trade.seller : trade.buyer;
  const counterpartyName = cp?.username || '—';
  const active  = isActive(trade.status);
  
  // Role Badge logic
  const roleBadge = isBuyer ? '🛒 YOU ARE BUYING' : '💰 YOU ARE SELLING';
  
  // Payment Display - Use Actual Local Currency
  const lcur    = trade.local_currency||trade.currency||trade.listing?.currency||'';
  const lsym    = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',USD:'$',GBP:'£',EUR:'€'}[lcur]||'';
  const lamount = parseFloat(trade.amount_local||trade.local_amount||0);
  const paymentDisplay = (lamount && lcur)
    ? `${lsym}${lamount.toLocaleString()} ${lcur}`
    : `$${trade.amount_usd?.toLocaleString()||'0'} USD`;

  // BTC display with fiat equivalent
  const btcDisplay = `₿ ${trade.amount_btc ? parseFloat(trade.amount_btc).toFixed(8) : '0.00000000'} BTC`;
  const fiatEquivalent = (lamount && lcur)
    ? `${lsym}${lamount.toLocaleString()} ${lcur}`
    : `$${trade.amount_usd?.toLocaleString()||'0'} USD`;

  return(
    <Link to={`/trade/${trade.id}`}
      className={`block bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all p-4 ${active?'border-2':''}`}
      style={{borderColor:active?st.color:C.g200}}>
      <div className="flex justify-between items-center">
        <span className="badge" style={{
            backgroundColor: isBuyer ? '#F4A422' : '#1B4332',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
        }}>
            {roleBadge}
        </span>
        <span className="text-sm text-gray-500">#{trade.id.slice(0,8).toUpperCase()}</span>
      </div>
    
      <div className="mt-3 space-y-2">
        <div className="flex justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase">👤 {isBuyer ? 'Seller' : 'Buyer'}:</span>
            <span className="font-semibold text-sm">{counterpartyName}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase">💳 Payment:</span>
            <span className="text-sm">{trade.payment_method}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase">💵 You {isBuyer ? 'Pay' : 'Get'}:</span>
            <span className="font-black text-sm" style={{color:C.forest}}>{paymentDisplay}</span>
        </div>
        <div className="flex justify-between items-baseline">
            <span className="text-gray-500 text-xs font-bold uppercase">🛒 You {isBuyer ? 'Receive' : 'Send'}:</span>
            <div className="text-right">
                <span className="font-black text-sm" style={{ color: isBuyer ? '#22C55E' : '#EF4444' }}>
                    {btcDisplay}
                </span>
                <div className="text-xs font-bold text-gray-400">≈ {fiatEquivalent}</div>
            </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Active Trade Modal Popup ───────────────────────────────────────────────
function ActiveTradeModal({ trades, userId, onClose }) {
  if (!trades.length) return null;

  const symMap = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',USD:'$',GBP:'£',EUR:'€'};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)'}}>
      <div className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden"
        style={{maxWidth:480,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
          <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
            style={{backgroundColor:C.online}}/>
          <Bell size={16} className="text-white flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm">⚡ You Have an Active Trade</p>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.7)'}}>
              Action required — don't miss your trade window
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition flex-shrink-0">
            <X size={18}/>
          </button>
        </div>

        {/* Trade cards */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {trades.map(trade=>{
            const isBuyer = String(userId)===String(trade.buyer_id);
            const st      = getStatus(trade.status);
            const cp      = isBuyer ? trade.seller : trade.buyer;
            // Handle both nested-object and flat-string counterparty names
            const cpName  = cp?.username
              || (isBuyer ? trade.seller_name : trade.buyer_name)
              || '—';
            // local_currency / amount_local are the primary field names from /api/my-trades
            const cur     = trade.local_currency||trade.currency||'';
            const sym     = symMap[cur]||'';
            const localAmt= trade.amount_local||trade.local_amount||0;
            const payDisp = localAmt
              ? `${sym}${fmt(localAmt)} ${cur}`
              : `$${fmt(trade.amount_usd||0)} USD`;
            const roleBg  = isBuyer ? C.gold : C.forest;

            return(
              <div key={trade.id} className="rounded-2xl border-2 overflow-hidden"
                style={{borderColor:st.color}}>

                {/* Role + ID */}
                <div className="flex items-center justify-between px-4 py-2.5"
                  style={{backgroundColor:`${st.color}12`}}>
                  <span className="font-black text-xs px-3 py-1 rounded-full"
                    style={{backgroundColor:roleBg,color:'#fff'}}>
                    {isBuyer?'🛒 YOU ARE BUYING':'💰 YOU ARE SELLING'}
                  </span>
                  <span className="font-mono text-xs" style={{color:C.g400}}>
                    #{String(trade.id||'').slice(0,8).toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-2 bg-white">
                  <div className="flex justify-between text-xs">
                    <span style={{color:C.g500}}>👤 {isBuyer?'Seller':'Buyer'}:</span>
                    <span className="font-bold" style={{color:C.forest}}>{cpName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{color:C.g500}}>💳 Payment:</span>
                    <span className="font-bold">{trade.payment_method||'—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{color:C.g500}}>💵 You {isBuyer?'Pay':'Get'}:</span>
                    <span className="font-black" style={{color:C.forest}}>{payDisp}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{color:C.g500}}>₿ You {isBuyer?'Receive':'Send'}:</span>
                    <span className="font-black"
                      style={{color:isBuyer?C.success:C.danger}}>
                      ₿ {parseFloat(trade.amount_btc||0).toFixed(8)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{color:C.g500}}>📊 Status:</span>
                    <span className="font-bold px-2 py-0.5 rounded-full text-xs"
                      style={{backgroundColor:st.bg,color:st.color}}>{st.label}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-4 pb-3 bg-white">
                  <Link to={`/trade/${trade.id}`} onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-black text-xs w-full hover:opacity-90 transition shadow"
                    style={{backgroundColor:st.color}}>
                    <Zap size={13}/> Open Trade Now <ArrowRight size={12}/>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between"
          style={{borderColor:C.g200,backgroundColor:C.g50}}>
          <div className="flex items-center gap-1.5">
            <Shield size={12} style={{color:C.green}}/>
            <p className="text-xs font-semibold" style={{color:C.g500}}>Escrow-protected trades</p>
          </div>
          <button onClick={onClose}
            className="text-xs font-bold px-4 py-2 rounded-xl border hover:bg-gray-50 transition"
            style={{borderColor:C.g200,color:C.g600}}>
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MyTrades({user}) {
  const navigate  = useNavigate();
  const _cache = () => { try{const c=JSON.parse(sessionStorage.getItem('praqen_trades')||'null');return c&&Date.now()-c.ts<60000?c.data:null;}catch{return null;} };
  const [trades,   setTrades]   = useState(()=>_cache()||[]);
  const [loading,  setLoading]  = useState(()=>!_cache());
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [dismissed,setDismissed]= useState(new Set());
  const [showModal, setShowModal]= useState(false);
  const timerRef = useRef(null);

  // sessionStorage helpers — same key as ActiveTradeBanner so both share seen state
  const getSeenIds = () => {
    try { return new Set(JSON.parse(sessionStorage.getItem('praqen_shown_trade_alerts')||'[]')); }
    catch { return new Set(); }
  };
  const markSeen = ids => {
    try {
      const seen = getSeenIds();
      ids.forEach(id=>seen.add(String(id)));
      sessionStorage.setItem('praqen_shown_trade_alerts', JSON.stringify([...seen]));
    } catch {}
  };

  useEffect(()=>{
    if(!user){navigate('/login');return;}
    load(trades.length === 0);
    timerRef.current = setInterval(()=>{ if(document.visibilityState==='visible') silentRefresh(); },15000);
    return()=>clearInterval(timerRef.current);
  },[user]);

  // Pop the modal ONCE per trade per session when new active trades appear
  useEffect(()=>{
    const seen   = getSeenIds();
    const fresh  = trades.filter(t=>isActive(t.status)&&!seen.has(String(t.id)));
    if(fresh.length>0){
      markSeen(fresh.map(t=>t.id));
      setShowModal(true);
    }
  },[trades]);

  const load = async(showSpinner = false)=>{
    if (showSpinner) setLoading(true);
    try{
      const r = await axios.get(`${API_URL}/my-trades`,{headers:authH()});
      const data = r.data.trades||[];
      setTrades(data);
      try { sessionStorage.setItem('praqen_trades', JSON.stringify({data, ts:Date.now()})); } catch {}
    }catch(e){ console.error('Failed to load trades',e); }
    finally{ setLoading(false); }
  };

  const silentRefresh = async()=>{
    try{
      const r = await axios.get(`${API_URL}/my-trades`,{headers:authH()});
      const data = r.data.trades||[];
      setTrades(data);
      try { sessionStorage.setItem('praqen_trades', JSON.stringify({data, ts:Date.now()})); } catch {}
    }catch{}
  };

  // All active trades (for modal — no dismiss filter)
  const allActiveTrades = trades.filter(t=>isActive(t.status));
  // Active trades that need banner attention — not dismissed
  const activeTrades = trades.filter(t=>isActive(t.status)&&!dismissed.has(t.id));

  // Stats
  const completed  = trades.filter(t=>t.status==='COMPLETED').length;
  const active     = trades.filter(t=>isActive(t.status)).length;
  const disputed   = trades.filter(t=>t.status==='DISPUTED').length;
  const totalBtc   = trades.filter(t=>t.status==='COMPLETED').reduce((s,t)=>s+parseFloat(t.amount_btc||0),0);

  // Filtered list
  const filtered = trades
    .filter(t=>{
      if(filter==='active')    return isActive(t.status);
      if(filter==='completed') return t.status==='COMPLETED';
      if(filter==='cancelled') return t.status==='CANCELLED';
      if(filter==='disputed')  return t.status==='DISPUTED';
      return true;
    })
    .filter(t=>{
      if(!search.trim()) return true;
      const q=search.toLowerCase();
      return(
        String(t.id||'').toLowerCase().includes(q)||
        (t.seller?.username||'').toLowerCase().includes(q)||
        (t.buyer?.username||'').toLowerCase().includes(q)||
        (t.payment_method||'').toLowerCase().includes(q)||
        (t.listings?.gift_card_brand||'').toLowerCase().includes(q)
      );
    });


  return(
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50, fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes pulse-once{0%,100%{opacity:1}50%{opacity:0.6}}
        .animate-pulse-once{animation:pulse-once 1.8s ease-in-out 3}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        .slide-up{animation:slideUp 0.35s ease-out}
      `}</style>

      {/* ── ACTIVE TRADE MODAL POPUP ─────────────────────────────── */}
      {showModal&&(
        <ActiveTradeModal
          trades={allActiveTrades}
          userId={user?.id}
          onClose={()=>setShowModal(false)}
        />
      )}


      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 space-y-5">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-black text-2xl" style={{color:C.forest, fontFamily:"'Syne',sans-serif"}}>
              My Trades
            </h1>
            <p className="text-xs mt-0.5" style={{color:C.g500}}>
              {trades.length} total · {active} active · {completed} completed
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold hover:bg-white transition"
              style={{borderColor:C.g200, color:C.g600}}>
              <RefreshCw size={12}/> Refresh
            </button>
            <button onClick={()=>navigate('/buy-bitcoin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black hover:opacity-90 transition"
              style={{backgroundColor:C.gold, color:C.forest}}>
              <Bitcoin size={14}/> New Trade
            </button>
          </div>
        </div>

        {/* ── ACTIVE TRADE ALERTS — top priority ─────────────── */}
        {activeTrades.length>0&&(
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.danger}}/>
              <p className="text-xs font-black" style={{color:C.danger}}>
                {activeTrades.length} TRADE{activeTrades.length>1?'S':''} NEED YOUR ATTENTION
              </p>
            </div>
            {activeTrades.map(t=>(
              <ActiveAlert
                key={t.id}
                trade={t}
                userId={user?.id}
                onDismiss={id=>setDismissed(prev=>new Set([...prev,id]))}
              />
            ))}
          </div>
        )}

        {/* ── STATS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity}    label="Total Trades"  value={trades.length}      color={C.green}/>
          <StatCard icon={Zap}         label="Active Now"    value={active}             color={C.warn}  sub={active>0?'Needs action':''}/>
          <StatCard icon={CheckCircle} label="Completed"     value={completed}          color={C.success}/>
          <StatCard icon={Bitcoin}     label="BTC Traded"    value={`₿${fmtBtc(totalBtc)}`} color={C.gold}/>
        </div>

        {/* ── FILTER + SEARCH ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border p-3 space-y-2" style={{borderColor:C.g200}}>
          <div className="flex gap-1 flex-wrap">
            {[
              ['all',       `All (${trades.length})`],
              ['active',    `Active (${active})`],
              ['completed', `Completed (${completed})`],
              ['disputed',  `Disputes (${disputed})`],
              ['cancelled', 'Cancelled'],
            ].map(([val,lbl])=>(
              <button key={val} onClick={()=>setFilter(val)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                style={{
                  backgroundColor:filter===val?C.green:'transparent',
                  color:filter===val?C.white:C.g500,
                }}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by Trade ID, username, payment…"
              className="w-full pl-7 pr-3 py-2 text-xs border-2 rounded-xl focus:outline-none"
              style={{borderColor:search?C.green:C.g200}}/>
          </div>
        </div>

        {/* ── TRADE LIST ─────────────────────────────────────── */}
        {loading && !trades.length ? (
          <div className="space-y-2">
            {Array(4).fill(0).map((_,i)=>(
              <div key={i} className="bg-white rounded-2xl border animate-pulse p-4" style={{borderColor:C.g200}}>
                <div className="flex justify-between mb-3">
                  <div className="h-5 rounded-full w-32" style={{backgroundColor:C.g200}}/>
                  <div className="h-4 rounded w-20" style={{backgroundColor:C.g100}}/>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded w-3/4" style={{backgroundColor:C.g100}}/>
                  <div className="h-3 rounded w-1/2" style={{backgroundColor:C.g100}}/>
                  <div className="h-3 rounded w-2/3" style={{backgroundColor:C.g100}}/>
                </div>
              </div>
            ))}
          </div>
        ) : trades.length===0?(
          <div className="bg-white rounded-2xl border p-10 text-center shadow-sm" style={{borderColor:C.g200}}>
            <div className="text-5xl mb-4">🔄</div>
            <h3 className="font-black text-lg mb-2" style={{color:C.forest}}>No trades yet</h3>
            <p className="text-sm mb-5" style={{color:C.g500}}>
              Browse the marketplace and start your first Bitcoin trade.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button onClick={()=>navigate('/buy-bitcoin')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm"
                style={{backgroundColor:C.green}}>
                <Bitcoin size={15}/> Buy Bitcoin
              </button>
              <button onClick={()=>navigate('/sell-bitcoin')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm border"
                style={{borderColor:C.g200, color:C.g700}}>
                Sell Bitcoin
              </button>
            </div>
          </div>
        ) : filtered.length===0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center" style={{borderColor:C.g200}}>
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-bold text-sm" style={{color:C.g700}}>No trades match your filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Separator: active first, then others */}
            {active>0&&filter==='all'&&(
              <p className="text-xs font-black uppercase tracking-widest px-1" style={{color:C.g400}}>
                Active Trades
              </p>
            )}
            {filtered
              .sort((a,b)=>{
                // Active trades always first
                const aAct=isActive(a.status)?1:0, bAct=isActive(b.status)?1:0;
                if(aAct!==bAct) return bAct-aAct;
                return new Date(b.created_at)-new Date(a.created_at);
              })
              .map((t,i)=>{
                const prevActive = i>0&&isActive(filtered[i-1].status);
                const thisActive = isActive(t.status);
                return(
                  <React.Fragment key={t.id}>
                    {/* Separator between active and non-active */}
                    {i>0&&prevActive&&!thisActive&&filter==='all'&&(
                      <p className="text-xs font-black uppercase tracking-widest px-1 pt-2" style={{color:C.g400}}>
                        Trade History
                      </p>
                    )}
                    <TradeCard trade={t} userId={user?.id}/>
                  </React.Fragment>
                );
              })}
          </div>
        )}

        {/* Escrow safety info */}
        {trades.length>0&&(
          <div className="flex items-start gap-3 p-4 rounded-2xl border"
            style={{backgroundColor:`${C.green}06`, borderColor:`${C.green}20`}}>
            <Shield size={14} style={{color:C.green, flexShrink:0, marginTop:1}}/>
            <div>
              <p className="text-xs font-black mb-0.5" style={{color:C.forest}}>All trades are escrow-protected</p>
              <p className="text-xs leading-relaxed" style={{color:C.g500}}>
                Bitcoin is locked in escrow from the moment a trade starts. It is only released when both parties confirm. 0.5% fee auto-deducted on completion.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="mb-3">
                <span className="text-xl font-black" style={{fontFamily:"'Syne',sans-serif"}}>
                  <span className="text-white">PRA</span><span style={{color:C.gold}}>QEN</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.4)'}}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  {href:'https://x.com/praqenapp?s=21',label:'𝕏',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',label:'📸',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',label:'💼',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',label:'💬',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://discord.gg/V6zCZxfdy',label:'🎮',bg:'rgba(88,101,242,0.4)'},
                ].map(({href,label,bg})=>(
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition"
                    style={{backgroundColor:bg}}>
                    <span className="text-white font-black">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Trade</p>
              <div className="space-y-2">
                {[['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Gift Cards','/gift-cards'],['Create Offer','/create-offer'],['My Listings','/my-listings']].map(([l,h])=>(
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Community</p>
              <div className="space-y-2">
                {[
                  ['💬 WhatsApp Community','https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
                  ['🎮 Discord','https://discord.gg/V6zCZxfdy'],
                  ['𝕏 Twitter/X','https://x.com/praqenapp?s=21'],
                  ['📸 Instagram','https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr'],
                  ['💼 LinkedIn','https://www.linkedin.com/in/pra-qen-045373402/'],
                  ['📧 support@praqen.com','mailto:support@praqen.com'],
                ].map(([l,h])=>(
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t"
            style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-xs flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
