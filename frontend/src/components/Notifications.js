﻿import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell, X, CheckCheck, ArrowRight, Bitcoin,
  Shield, AlertTriangle, Megaphone, Gift, Zap,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
  purple:'#8B5CF6',
};

const CUR_SYM = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',USD:'$',GBP:'£',EUR:'€',UGX:'USh',TZS:'TSh',XAF:'CFA',XOF:'CFA'};
const fmt    = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n||0);
const fmtBtc = n => parseFloat(n||0).toFixed(6);

const flag = c =>
  !c || c.length !== 2 ? '🌍' :
  c.toUpperCase().replace(/./g, ch => String.fromCodePoint(0x1F1E0 + ch.charCodeAt(0) - 65));

const relTime = d => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { day:'numeric', month:'short' });
};

const absTime = d =>
  !d ? '' : new Date(d).toLocaleString('en-US', {
    day:'numeric', month:'short', hour:'2-digit', minute:'2-digit',
  });

// ─── Completed / Congrats card ────────────────────────────────────────────────
function CompletedCard({ n, trade, userId, onNavigate }) {
  const isBuyer = String(userId) === String(trade.buyer_id);
  const local   = trade.amount_local || trade.local_amount || 0;
  const cur     = trade.local_currency || trade.currency || 'USD';
  const btc     = fmtBtc(trade.amount_btc);
  const pm      = trade.payment_method || '—';
  const cp       = isBuyer ? trade.seller : trade.buyer;
  const cpName   = cp?.username || 'Trader';

  const headline = isBuyer ? `🎉 Trade with ${cpName} complete!` : `✅ Trade with ${cpName} complete!`;

  const subline = isBuyer
    ? `You bought BTC ${btc} for ${fmt(local)} ${cur}`
    : `You received ${fmt(local)} ${cur} for your BTC`;

  const when = absTime(trade.completed_at || n.created_at);

  return (
    <button onClick={() => onNavigate(n)}
      className={`w-full text-left px-4 py-3.5 border-b transition hover:bg-emerald-50 ${!n.is_read ? 'bg-emerald-50/60' : 'bg-white'}`}
      style={{ borderColor: C.g100 }}>

      {/* Congrats banner */}
      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
        style={{ background: `linear-gradient(135deg,${C.green},${C.mint})` }}>
        <Zap size={12} className="text-white flex-shrink-0" />
        <span className="text-white font-black text-[11px] uppercase tracking-wide flex-1">{headline}</span>
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
        )}
      </div>

      <p className="text-xs font-semibold mb-1" style={{ color: C.g600 }}>{subline}</p>
      <p className="text-xs" style={{ color: C.g400 }}>
        🏆 Trade ID: #${String(trade.id).slice(0,8).toUpperCase()} · {relTime(trade.completed_at || n.created_at)}
      </p>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed" style={{ borderColor: C.g100 }}>
        <span className="text-[10px] font-bold text-gray-400">
          {absTime(trade.completed_at || n.created_at)}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-black"
          style={{ color: C.green }}>
          View trade <ArrowRight size={10} />
        </span>
      </div>
    </button>
  );
}

// ─── Active trade card ────────────────────────────────────────────────────────
function TradeCard({ n, trade, userId, onNavigate }) {
  const isBuyer  = String(userId) === String(trade.buyer_id);
  const cp       = isBuyer ? trade.seller : trade.buyer;
  const cpName   = cp?.username || 'Trader';

  const local = trade.amount_local || trade.local_amount || 0;
  const cur   = trade.local_currency || trade.currency || 'USD';
  const btc   = fmtBtc(trade.amount_btc);
  const type  = (trade.trade_type || 'BTC').toUpperCase();
  const tradeIdShort = String(trade.id || '').slice(0, 8).toUpperCase();

  // Status colour
  const STATUS = {
    CREATED:      { dot: C.green,   label: 'Escrow active'   },
    FUNDS_LOCKED: { dot: C.green,   label: 'Escrow active'   },
    PAYMENT_SENT: { dot: C.paid,    label: 'Payment sent'    },
    PAID:         { dot: C.paid,    label: 'Payment sent'    },
    DISPUTED:     { dot: C.danger,  label: 'Disputed'        },
  };
  const st = STATUS[(trade.status||'').toUpperCase()] || STATUS.CREATED;

  return (
    <button onClick={() => onNavigate(n)}
      className={`w-full text-left px-4 py-3.5 border-b transition hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
      style={{ borderColor: C.g100 }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: !n.is_read ? `${st.dot}15` : C.g50 }}>
          <Bitcoin size={18} style={{ color: st.dot }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <p className="font-black text-sm text-slate-800 truncate">
              {isBuyer ? `Trade with ${cpName}` : `${cpName} wants to trade with you`}
            </p>
            <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap ml-2">
              {relTime(n.created_at)}
            </span>
          </div>
          <p className="text-xs font-bold text-gray-600 mb-2">
            {isBuyer ? `You started a ${type} Bitcoin trade` : `${cpName} started a ${type} Bitcoin trade`}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-2 text-[11px] font-black border border-gray-100 flex flex-wrap gap-x-3 gap-y-1 mb-2">
            <span style={{ color: C.forest }}>Amount: {fmt(local)} {cur}</span>
            <span style={{ color: C.gold }}>BTC: {btc}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400">ID: #{tradeIdShort}</span>
              <span className="text-[9px] font-black uppercase mt-0.5" style={{ color: st.dot }}>● {st.label}</span>
            </div>
            <span className="text-[11px] font-black flex items-center gap-1" style={{ color: C.green }}>
              Open Trade <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Support / generic card ───────────────────────────────────────────────────
function BasicCard({ n, onNavigate }) {
  const ICON_MAP = {
    trade:    { Icon: Bitcoin,       color: C.paid    },
    support:  { Icon: Shield,        color: C.danger  },
    dispute:  { Icon: AlertTriangle, color: C.warn    },
    update:   { Icon: Megaphone,     color: C.green   },
    alert:    { Icon: AlertTriangle, color: C.warn    },
    gift:     { Icon: Gift,          color: C.purple  },
  };
  const cfg = ICON_MAP[n.type] || { Icon: Bell, color: C.g400 };
  const { Icon, color } = cfg;

  return (
    <button onClick={() => onNavigate(n)}
      className={`w-full text-left px-4 py-3.5 border-b transition hover:bg-gray-50 relative ${!n.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
      style={{ borderColor: C.g100 }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-black text-xs leading-tight" style={{ color: C.g800 }}>{n.title}</p>
            <p className="text-xs flex-shrink-0" style={{ color: C.g400 }}>{relTime(n.created_at)}</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: C.g500 }}>{n.message}</p>
          {n.action && (
            <span className="inline-flex items-center gap-1 text-xs font-black mt-1.5"
              style={{ color }}>
              View details <ArrowRight size={9} />
            </span>
          )}
        </div>
        {!n.is_read && (
          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: C.green }} />
        )}
      </div>
    </button>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
function NotifCard({ n, userId, onNavigate }) {
  const trade = n.trade;
  if (trade && trade.status === 'COMPLETED') {
    return <CompletedCard n={n} trade={trade} userId={userId} onNavigate={onNavigate} />;
  }
  if (trade) {
    return <TradeCard n={n} trade={trade} userId={userId} onNavigate={onNavigate} />;
  }
  return <BasicCard n={n} onNavigate={onNavigate} />;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function Notifications({ user }) {
  const navigate = useNavigate();
  const ref      = useRef(null);
  const [notifs,      setNotifs]      = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [loading,     setLoading]     = useState(false);

  const unread = notifs.filter(n => !n.is_read).length;
  const token  = () => localStorage.getItem('token');
  const hdrs   = () => ({ Authorization: `Bearer ${token()}` });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/notifications`, { headers: hdrs() });
      setNotifs(r.data.notifications || []);
    } catch { /* keep previous state */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const markRead = async id => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try { await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers: hdrs() }); } catch {}
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    try { await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: hdrs() }); } catch {}
  };

  const handleClick = n => {
    if (!n.is_read) markRead(n.id);
    if (n.action) navigate(n.action);
    setShowDrop(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>

      {/* ── Bell button ── */}
      <button
        onClick={() => { setShowDrop(v => !v); if (!showDrop) load(); }}
        className="relative p-2 rounded-xl transition hover:bg-gray-100"
        aria-label="Notifications">
        <Bell size={20} style={{ color: C.forest }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-xs font-black flex items-center justify-center animate-pulse"
            style={{ backgroundColor: C.danger }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {showDrop && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50 w-[92vw] sm:w-[420px] max-h-[82vh]"
          style={{ borderColor: C.g200, display: 'flex', flexDirection: 'column', maxWidth: 'calc(100vw - 16px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${C.forest},${C.mint})` }}>
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-white" />
              <span className="text-white font-black text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white"
                  style={{ color: C.forest }}>
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition">
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button onClick={() => setShowDrop(false)} className="text-white/60 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-7 h-7 border-2 rounded-full animate-spin mb-2"
                  style={{ borderColor: C.mint, borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: C.g400 }}>Loading…</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: C.mist }}>
                  <Bell size={24} style={{ color: C.g400 }} />
                </div>
                <p className="font-black text-sm mb-1" style={{ color: C.g800 }}>All caught up!</p>
                <p className="text-xs" style={{ color: C.g400 }}>
                  We'll notify you when a trade comes in or payment is confirmed.
                </p>
              </div>
            ) : (
              notifs.map(n => (
                <NotifCard
                  key={n.id}
                  n={n}
                  userId={user?.id}
                  onNavigate={handleClick}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t flex items-center justify-between flex-shrink-0"
            style={{ borderColor: C.g100, backgroundColor: C.g50 }}>
            <p className="text-xs" style={{ color: C.g400 }}>
              {notifs.length} notification{notifs.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => { setShowDrop(false); navigate('/my-trades'); }}
              className="flex items-center gap-1 text-xs font-black hover:underline"
              style={{ color: C.green }}>
              View my trades <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
