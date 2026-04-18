import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Copy, Bitcoin, RefreshCw, ExternalLink, CheckCircle,
  ArrowDownLeft, ArrowUpRight, Shield, AlertTriangle,
  Clock, Eye, EyeOff, Send, QrCode, Zap, Lock,
  TrendingUp, ChevronRight, X, ArrowRight, Wallet
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const C = {
  forest: '#1B4332', green: '#2D6A4F', mint: '#40916C', sage: '#52B788',
  gold: '#F4A422', amber: '#F59E0B', mist: '#F0FAF5',
  g50: '#F8FAFC', g100: '#F1F5F9', g200: '#E2E8F0',
  g400: '#94A3B8', g500: '#64748B', g600: '#475569', g700: '#334155', g800: '#1E293B',
  success: '#10B981', danger: '#EF4444', warn: '#F59E0B', paid: '#3B82F6',
};

const authH = () => { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const fmt = (n, d = 8) => parseFloat(n || 0).toFixed(d);
const fmtUsd = n => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtAge = d => {
  if (!d) return '—';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 3600) return `${~~(s / 60)}m ago`;
  if (s < 86400) return `${~~(s / 3600)}h ago`;
  return `${~~(s / 86400)}d ago`;
};

// ─── Withdraw Modal ────────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSend }) {
  const [address, setAddress] = useState('');
  const [amount, setAmount]   = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const btcAmt   = parseFloat(amount || 0);
  const fee      = btcAmt * 0.001;
  const total    = btcAmt + fee;
  const hasEnough = total <= parseFloat(balance || 0);
  const valid    = address.trim().length > 25 && btcAmt > 0 && hasEnough;

  const handleSend = async () => {
    if (!valid) return;
    setSending(true);
    try {
      await onSend(address.trim(), btcAmt);
      onClose();
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.g100 }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.danger}15` }}>
              <ArrowUpRight size={15} style={{ color: C.danger }} />
            </div>
            <h2 className="font-black text-sm" style={{ color: C.g800 }}>Send Bitcoin</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X size={14} style={{ color: C.g500 }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Available balance */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.g50, border: `1px solid ${C.g200}` }}>
            <p className="text-xs font-bold text-gray-500 mb-0.5">Available</p>
            <p className="font-black text-lg" style={{ color: C.green }}>₿ {fmt(balance)}</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-700">Recipient Bitcoin Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="bc1q... or 1... or 3..."
              className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none font-mono"
              style={{ borderColor: address.length > 25 ? C.green : C.g200 }}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-700">Amount (BTC)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00000000"
                step="0.00000001"
                className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none"
                style={{ borderColor: !amount ? C.g200 : hasEnough ? C.green : C.danger }}
              />
              <button
                onClick={() => setAmount((parseFloat(balance || 0) * 0.999).toFixed(8))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-1 rounded-lg"
                style={{ backgroundColor: `${C.green}15`, color: C.green }}>
                MAX
              </button>
            </div>
            {amount && !hasEnough && (
              <p className="text-xs mt-1 font-semibold" style={{ color: C.danger }}>
                Insufficient balance (need {fmt(total)} BTC incl. fee)
              </p>
            )}
          </div>

          {/* Fee breakdown */}
          {btcAmt > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl" style={{ backgroundColor: `${C.green}08`, border: `1px solid ${C.green}20` }}>
              {[
                { label: 'Amount',         val: `₿ ${fmt(btcAmt)}` },
                { label: 'Network fee (0.1%)', val: `₿ ${fmt(fee)}` },
                { label: 'Total deducted', val: `₿ ${fmt(total)}`, bold: true },
              ].map(({ label, val, bold }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: C.g500 }}>{label}</span>
                  <span className={bold ? 'font-black' : 'font-semibold'} style={{ color: bold ? C.forest : C.g700 }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} className="mt-0.5 accent-green-600" />
            <p className="text-xs font-semibold" style={{ color: C.g600 }}>
              I confirm this address is correct. Bitcoin transactions cannot be reversed.
            </p>
          </label>

          <button
            onClick={handleSend}
            disabled={!valid || !confirm || sending}
            className="w-full py-3.5 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition"
            style={{ backgroundColor: C.danger }}>
            {sending
              ? <><RefreshCw size={14} className="animate-spin" /> Sending…</>
              : <><ArrowUpRight size={14} /> Send {btcAmt > 0 ? `₿${fmt(btcAmt)}` : 'Bitcoin'}</>}
          </button>

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={12} style={{ color: C.warn, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[10px] font-semibold" style={{ color: '#92400E' }}>
              Double-check the address. Sending to the wrong address results in permanent loss of funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receive Modal ─────────────────────────────────────────────────────────────
function ReceiveModal({ address, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.g100 }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.success}15` }}>
              <ArrowDownLeft size={15} style={{ color: C.success }} />
            </div>
            <h2 className="font-black text-sm" style={{ color: C.g800 }}>Receive Bitcoin</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X size={14} style={{ color: C.g500 }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Send BTC to your unique address below. Credited after 2 network confirmations.</p>

          {/* QR Code placeholder */}
          <div className="flex items-center justify-center p-8 rounded-2xl border-2 border-dashed" style={{ borderColor: C.g200, backgroundColor: C.g50 }}>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-3 rounded-xl border-4 flex items-center justify-center" style={{ borderColor: C.green, backgroundColor: '#fff' }}>
                <div className="grid grid-cols-5 gap-0.5 p-2">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: Math.random() > 0.5 ? C.forest : 'transparent' }} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-400">QR Code</p>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-600">Your Bitcoin Address</label>
            <div className="p-3 rounded-xl border font-mono text-xs break-all" style={{ borderColor: C.g200, backgroundColor: C.g50, color: C.g700 }}>
              {address || 'Loading address…'}
            </div>
          </div>

          <button onClick={copy} disabled={!address}
            className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? C.success : C.green }}>
            {copied ? <><CheckCircle size={15} /> Copied!</> : <><Copy size={15} /> Copy Address</>}
          </button>

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF', border: `1px solid ${C.paid}20` }}>
            <Shield size={12} style={{ color: C.paid, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[10px] font-semibold text-blue-700">
              Only send Bitcoin (BTC) to this address. Sending other cryptocurrencies will result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Row ───────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const isSend    = tx.type === 'send' || tx.type === 'WITHDRAWAL';
  const isReceive = tx.type === 'receive' || tx.type === 'DEPOSIT';
  const isPending = tx.status === 'pending' || tx.status === 'PENDING';

  const color = isSend ? C.danger : C.success;
  const bg    = isSend ? `${C.danger}10` : `${C.success}10`;
  const label = isSend ? 'Sent' : isReceive ? 'Received' : 'Trade';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: C.g100 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        {isSend
          ? <ArrowUpRight size={16} style={{ color }} />
          : <ArrowDownLeft size={16} style={{ color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold truncate" style={{ color: C.g800 }}>{label}</p>
          {isPending && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${C.warn}20`, color: C.warn }}>
              PENDING
            </span>
          )}
        </div>
        <p className="text-[10px] truncate" style={{ color: C.g400 }}>
          {tx.txHash
            ? `${tx.txHash.slice(0, 12)}…${tx.txHash.slice(-6)}`
            : tx.description || fmtAge(tx.created_at || tx.date)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black" style={{ color }}>
          {isSend ? '−' : '+'}₿{fmt(Math.abs(tx.amount_btc || tx.amount || 0))}
        </p>
        <p className="text-[10px]" style={{ color: C.g400 }}>{fmtAge(tx.created_at || tx.date)}</p>
      </div>
    </div>
  );
}

// ─── Main Wallet Component ─────────────────────────────────────────────────────
export default function WalletPage({ user }) {
  const navigate     = useNavigate();
  const [walletData, setWalletData]   = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [refreshing,setRefreshing]    = useState(false);
  const [showBal,   setShowBal]       = useState(true);
  const [showSend,  setShowSend]      = useState(false);
  const [showRecv,  setShowRecv]      = useState(false);
  const [checking,  setChecking]      = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/wallet`, { headers: authH() });
      setWalletData(r.data.wallet);
      setTransactions(r.data.transactions || []);
    } catch (e) {
      console.error('Wallet load error:', e);
      toast.error('Failed to load wallet');
    } finally { setLoading(false); }
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success('Wallet refreshed');
  };

  const createAddress = async () => {
    try {
      const r = await axios.post(`${API_URL}/wallet/create-address`, {}, { headers: authH() });
      toast.success('New Bitcoin address generated!');
      setWalletData(prev => ({ ...prev, address: r.data.address, has_address: true }));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create address');
    }
  };

  const checkPayment = async () => {
    setChecking(true);
    try {
      const r = await axios.post(`${API_URL}/wallet/check-payment`, {}, { headers: authH() });
      if (r.data.confirmed) {
        toast.success(`₿${fmt(r.data.amount_btc)} received! Balance updated.`);
        load();
      } else {
        toast.info('No new confirmed payments yet. Confirmations can take 10–60 minutes.');
      }
    } catch (e) {
      toast.error('Failed to check payments');
    } finally { setChecking(false); }
  };

  const sendBitcoin = async (address, amountBtc) => {
    try {
      const r = await axios.post(`${API_URL}/wallet/withdraw`, { address, amountBtc }, { headers: authH() });
      toast.success(`₿${fmt(amountBtc)} sent successfully!`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send Bitcoin');
      throw e;
    }
  };

  const balance = parseFloat(walletData?.balance_btc || 0);
  const balUsd  = balance * 68000; // approx — ideally fetch live rate

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.mist }}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.sage, borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.g50, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* ── WALLET HEADER CARD ────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden shadow-lg"
          style={{ background: `linear-gradient(135deg,${C.forest} 0%,${C.green} 60%,${C.mint} 100%)` }}>
          {/* Grid bg */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative p-6">
            {/* Top row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <Wallet size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Bitcoin Wallet</p>
                  <p className="text-white/60 text-[10px]">{user?.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBal(!showBal)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  {showBal ? <Eye size={13} className="text-white" /> : <EyeOff size={13} className="text-white" />}
                </button>
                <button onClick={refresh} disabled={refreshing}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <RefreshCw size={13} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-white/60 text-xs mb-1">Total Balance</p>
              {showBal ? (
                <>
                  <p className="text-4xl font-black text-white tracking-tight">
                    ₿ {fmt(balance)}
                  </p>
                  <p className="text-white/60 text-sm mt-0.5">≈ {fmtUsd(balUsd)}</p>
                </>
              ) : (
                <p className="text-4xl font-black text-white">••••••••</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Receive',  icon: ArrowDownLeft, color: C.success, action: () => setShowRecv(true) },
                { label: 'Send',     icon: ArrowUpRight,  color: C.danger,  action: () => setShowSend(true) },
                { label: 'Refresh',  icon: Zap,           color: C.gold,    action: checkPayment },
              ].map(({ label, icon: Icon, color, action }) => (
                <button key={label} onClick={action}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:opacity-90 transition"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}25` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-white text-[11px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BITCOIN ADDRESS CARD ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: C.g200 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowDownLeft size={15} style={{ color: C.success }} />
              <p className="font-black text-sm" style={{ color: C.g800 }}>Deposit Address</p>
            </div>
            {walletData?.has_address && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${C.success}15`, color: C.success }}>
                ✅ Ready
              </span>
            )}
          </div>

          {walletData?.address ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border font-mono text-xs break-all"
                style={{ borderColor: C.g100, backgroundColor: C.g50, color: C.g700 }}>
                {walletData.address}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(walletData.address); toast.success('Address copied!'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-bold text-xs hover:opacity-90"
                  style={{ backgroundColor: C.green }}>
                  <Copy size={13} /> Copy Address
                </button>
                <button onClick={() => setShowRecv(true)}
                  className="px-3 py-2.5 rounded-xl border font-bold text-xs hover:bg-gray-50"
                  style={{ borderColor: C.g200, color: C.g600 }}>
                  <QrCode size={14} />
                </button>
              </div>
              <button onClick={checkPayment} disabled={checking}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold hover:bg-gray-50 transition"
                style={{ borderColor: C.g200, color: C.g600 }}>
                {checking
                  ? <><RefreshCw size={12} className="animate-spin" /> Checking…</>
                  : <><Zap size={12} style={{ color: C.gold }} /> Check for New Payments</>}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Bitcoin size={36} className="mx-auto mb-3" style={{ color: C.g300 }} />
              <p className="text-sm font-bold text-gray-600 mb-1">No Bitcoin address yet</p>
              <p className="text-xs text-gray-400 mb-4">Generate your unique Bitcoin deposit address</p>
              <button onClick={createAddress}
                className="px-6 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90"
                style={{ backgroundColor: C.green }}>
                <Bitcoin size={14} className="inline mr-1.5" /> Generate My Address
              </button>
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={12} style={{ color: C.warn, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[10px] font-semibold" style={{ color: '#92400E' }}>
              Only send Bitcoin (BTC) to this address. Sending other coins will result in permanent loss.
            </p>
          </div>
        </div>

        {/* ── QUICK STATS ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'BTC Balance',     value: `₿${fmt(balance, 6)}`,           color: C.gold },
            { label: 'USD Value',        value: fmtUsd(balUsd),                  color: C.success },
            { label: 'Transactions',     value: transactions.length.toString(),   color: C.paid },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm text-center" style={{ borderColor: C.g200 }}>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: C.g400 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── SECURITY INFO ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: C.g200 }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} style={{ color: C.green }} />
            <p className="font-black text-sm" style={{ color: C.g800 }}>Wallet Security</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: '🔒', label: 'Escrow Protected',    desc: 'All trade funds held in secure escrow' },
              { icon: '⚡', label: 'Instant Settlement',  desc: 'BTC released immediately on trade completion' },
              { icon: '🛡️', label: 'Non-custodial',       desc: 'Powered by Coinbase — your keys, your Bitcoin' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: C.g50 }}>
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: C.g700 }}>{label}</p>
                  <p className="text-[10px]" style={{ color: C.g400 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRANSACTION HISTORY ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: C.g200 }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.g100 }}>
            <p className="font-black text-sm" style={{ color: C.g800 }}>Transaction History</p>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ backgroundColor: C.g100, color: C.g500 }}>
              {transactions.length} records
            </span>
          </div>

          <div className="px-5">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={36} className="mx-auto mb-3" style={{ color: C.g300 }} />
                <p className="font-bold text-sm" style={{ color: C.g500 }}>No transactions yet</p>
                <p className="text-xs mt-1" style={{ color: C.g400 }}>
                  Completed trades and deposits will appear here
                </p>
                <button onClick={() => navigate('/buy-bitcoin')}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-black text-xs mx-auto"
                  style={{ backgroundColor: C.green }}>
                  <Bitcoin size={12} /> Start Trading
                </button>
              </div>
            ) : (
              transactions.map((tx, i) => <TxRow key={tx.id || i} tx={tx} />)
            )}
          </div>
        </div>

        {/* ── SUPPORT LINK ──────────────────────────────────────────── */}
        <a href="https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl border hover:bg-gray-50 transition"
          style={{ borderColor: C.g200, backgroundColor: 'white' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-black" style={{ color: C.g800 }}>Need help with your wallet?</p>
              <p className="text-xs" style={{ color: C.g400 }}>Reach PRAQEN support on WhatsApp</p>
            </div>
          </div>
          <ChevronRight size={15} style={{ color: C.g400 }} />
        </a>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: C.forest }}>
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-5">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <span className="text-xl font-black" style={{ fontFamily: "'Syne',sans-serif" }}>
                <span className="text-white">PRA</span><span style={{ color: C.gold }}>QEN</span>
              </span>
              <p className="text-xs leading-relaxed my-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Africa's most trusted P2P Bitcoin platform.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { href: 'https://x.com/praqenapp?s=21', label: '𝕏' },
                  { href: 'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr', label: '📸' },
                  { href: 'https://www.linkedin.com/in/pra-qen-045373402/', label: '💼' },
                  { href: 'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t', label: '💬' },
                  { href: 'https://discord.gg/V6zCZxfdy', label: '🎮' },
                ].map(({ href, label }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Quick Links</p>
              <div className="space-y-2">
                {[['Buy Bitcoin', '/buy-bitcoin'], ['Sell Bitcoin', '/sell-bitcoin'], ['My Trades', '/my-trades'], ['Settings', '/settings'], ['📧 support@praqen.com', 'mailto:support@praqen.com']].map(([l, h]) => (
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Shield size={10} /> Escrow Protected · Powered by Coinbase
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSend && <WithdrawModal balance={balance} onClose={() => setShowSend(false)} onSend={sendBitcoin} />}
      {showRecv && <ReceiveModal address={walletData?.address} onClose={() => setShowRecv(false)} />}
    </div>
  );
}
