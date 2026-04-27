import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import CountryFlag from './CountryFlag';
import { BadgeChip } from '../lib/badge';

const LIMIT_SECS = 30 * 60; // 30-minute escrow window

const STATUS_CFG = {
  CREATED:      { bg:'#FFFBEB', border:'#F59E0B', badge:'#FEF3C7', badgeTxt:'#92400E', label:'⏳ Waiting',        btn:'#F59E0B' },
  FUNDS_LOCKED: { bg:'#F0FDF4', border:'#22C55E', badge:'#DCFCE7', badgeTxt:'#166534', label:'✅ Active & Funded', btn:'#16A34A' },
  PAYMENT_SENT: { bg:'#EFF6FF', border:'#3B82F6', badge:'#DBEAFE', badgeTxt:'#1E40AF', label:'💳 Payment Sent',    btn:'#2563EB' },
  DISPUTED:     { bg:'#FFF1F2', border:'#EF4444', badge:'#FEE2E2', badgeTxt:'#991B1B', label:'⚠️ In Dispute',      btn:'#DC2626' },
};

function TradeTimer({ createdAt }) {
  const calc = () => {
    if (!createdAt) return LIMIT_SECS;
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return Math.max(0, LIMIT_SECS - elapsed);
  };
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt]);

  const mm      = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss      = String(secs % 60).padStart(2, '0');
  const urgent  = secs > 0 && secs < 300;
  const expired = secs === 0;
  const bg      = expired ? '#FEE2E2' : urgent ? '#FEF3C7' : '#F0FDF4';
  const color   = expired ? '#DC2626' : urgent ? '#D97706' : '#16A34A';

  return (
    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: bg, color }}>
      ⏱ {expired ? 'Expired' : `${mm}:${ss}`}
    </span>
  );
}

function getMyId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).userId || null;
  } catch { return null; }
}

export default function ActiveTradeCard({ trade }) {
  const navigate   = useNavigate();
  const myId       = getMyId();
  const isBuyer    = myId ? String(trade.buyer_id) === String(myId) : true;
  const counterparty = isBuyer ? trade.seller : trade.buyer;
  const pos        = parseInt(counterparty?.positive_feedback || 0);
  const neg        = parseInt(counterparty?.negative_feedback || 0);
  const cc         = (counterparty?.country || 'gh').toLowerCase();
  const cfg        = STATUS_CFG[trade.status] || STATUS_CFG.CREATED;

  const payLabel  = isBuyer ? 'You Pay' : 'You Receive';
  const recvLabel = isBuyer ? 'You Receive' : 'You Pay';
  const payAmt    = isBuyer
    ? `${trade.local_currency || ''} ${trade.amount_local?.toLocaleString() || '—'}`
    : `₿ ${trade.crypto_amount ? parseFloat(trade.crypto_amount).toFixed(8) : '—'}`;
  const recvAmt   = isBuyer
    ? `₿ ${trade.crypto_amount ? parseFloat(trade.crypto_amount).toFixed(8) : '—'}`
    : `${trade.local_currency || ''} ${trade.amount_local?.toLocaleString() || '—'}`;
  const payNote   = isBuyer ? `via ${trade.payment_method || '—'}` : 'Bitcoin escrow';
  const recvNote  = isBuyer ? 'Bitcoin' : `via ${trade.payment_method || '—'}`;

  return (
    <div className="rounded-xl mb-2 overflow-hidden"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* ── Row 1: status + countdown ── */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full truncate"
          style={{ backgroundColor: cfg.badge, color: cfg.badgeTxt }}>
          {cfg.label}
        </span>
        <TradeTimer createdAt={trade.created_at} />
      </div>

      {/* ── Row 2: flag + username + badge + feedback ── */}
      <div className="flex items-center justify-between px-3 pb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CountryFlag countryCode={cc} className="w-4 h-3 rounded-sm flex-shrink-0" />
          <span className="font-bold text-sm text-gray-800 truncate">{counterparty?.username || '—'}</span>
          <BadgeChip user={counterparty} className="text-[10px] flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#16A34A' }}>
            <ThumbsUp size={10} />{pos}
          </span>
          <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: '#DC2626' }}>
            <ThumbsDown size={10} />{neg}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 mb-2" style={{ height: '1px', backgroundColor: cfg.border, opacity: 0.2 }} />

      {/* ── Row 3: Pay | Receive two-column ── */}
      <div className="px-3 pb-2.5 flex gap-2">
        <div className="flex-1 rounded-lg px-2.5 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{payLabel}</p>
          <p className="font-black text-sm text-gray-900 leading-tight break-all">{payAmt}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{payNote}</p>
        </div>
        <div className="flex items-center justify-center text-gray-300 text-base px-0.5">→</div>
        <div className="flex-1 rounded-lg px-2.5 py-2" style={{ backgroundColor: cfg.badge }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: cfg.badgeTxt }}>{recvLabel}</p>
          <p className="font-black text-sm leading-tight break-all" style={{ color: cfg.border }}>{recvAmt}</p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: cfg.badgeTxt, opacity: 0.75 }}>{recvNote}</p>
        </div>
      </div>

      {/* ── Action button ── */}
      <button onClick={() => navigate(`/trade/${trade.id}`)}
        className="w-full py-2 text-xs font-bold text-white tracking-widest uppercase"
        style={{ backgroundColor: cfg.btn }}>
        Attend to Trade →
      </button>
    </div>
  );
}
