import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRates } from '../contexts/RatesContext';
import {
  Copy, Bitcoin, RefreshCw, CheckCircle,
  ArrowDownLeft, ArrowUpRight, Shield, AlertTriangle,
  Clock, Eye, EyeOff, QrCode, Zap,
  ChevronRight, X, Wallet
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest: '#1B4332', green: '#2D6A4F', mint: '#40916C', sage: '#52B788',
  gold: '#F4A422', mist: '#F0FAF5',
  g50: '#F8FAFC', g100: '#F1F5F9', g200: '#E2E8F0',
  g400: '#94A3B8', g500: '#64748B', g600: '#475569', g700: '#334155', g800: '#1E293B',
  success: '#10B981', danger: '#EF4444', warn: '#F59E0B', paid: '#3B82F6',
};

const authH  = () => { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const fmt    = (n, d = 8) => parseFloat(n || 0).toFixed(d);
const fmtUsd = n => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtAge = d => {
  if (!d) return '—';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${~~(s / 60)}m ago`;
  if (s < 86400) return `${~~(s / 3600)}h ago`;
  return `${~~(s / 86400)}d ago`;
};

// ─── Withdraw Modal ────────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSend }) {
  const [address, setAddress] = useState('');
  const [amount,  setAmount]  = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const btcAmt    = parseFloat(amount || 0);
  const fee       = btcAmt * 0.001;
  const total     = btcAmt + fee;
  const hasEnough = total <= parseFloat(balance || 0);
  const valid     = address.trim().length > 25 && btcAmt > 0 && hasEnough;

  const handleSend = async () => {
    if (!valid) return;
    setSending(true);
    try { await onSend(address.trim(), btcAmt); onClose(); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl">
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
          <div className="p-3 rounded-xl" style={{ backgroundColor: C.g50, border: `1px solid ${C.g200}` }}>
            <p className="text-xs font-bold text-gray-500 mb-0.5">Available Balance</p>
            <p className="font-black text-lg" style={{ color: C.green }}>₿ {fmt(balance)}</p>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-700">Recipient Bitcoin Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="bc1q… or tb1q…"
              className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none font-mono"
              style={{ borderColor: address.length > 25 ? C.green : C.g200 }} />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-700">Amount (BTC)</label>
            <div className="relative">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00000000" step="0.00000001"
                className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none"
                style={{ borderColor: !amount ? C.g200 : hasEnough ? C.green : C.danger }} />
              <button onClick={() => setAmount((parseFloat(balance || 0) * 0.999).toFixed(8))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black px-2 py-1 rounded-lg"
                style={{ backgroundColor: `${C.green}15`, color: C.green }}>MAX</button>
            </div>
            {amount && !hasEnough && (
              <p className="text-xs mt-1 font-semibold" style={{ color: C.danger }}>
                Insufficient balance — need {fmt(total)} BTC incl. fee
              </p>
            )}
          </div>

          {btcAmt > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl" style={{ backgroundColor: `${C.green}08`, border: `1px solid ${C.green}20` }}>
              {[
                { label: 'Amount',            val: `₿ ${fmt(btcAmt)}` },
                { label: 'Network fee (~0.1%)', val: `₿ ${fmt(fee)}` },
                { label: 'Total deducted',    val: `₿ ${fmt(total)}`, bold: true },
              ].map(({ label, val, bold }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: C.g500 }}>{label}</span>
                  <span className={bold ? 'font-black' : 'font-semibold'} style={{ color: bold ? C.forest : C.g700 }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} className="mt-0.5 accent-green-600" />
            <p className="text-xs font-semibold" style={{ color: C.g600 }}>
              I confirm this address is correct. Bitcoin transactions cannot be reversed.
            </p>
          </label>

          <button onClick={handleSend} disabled={!valid || !confirm || sending}
            className="w-full py-3.5 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition"
            style={{ backgroundColor: C.danger }}>
            {sending
              ? <><RefreshCw size={14} className="animate-spin" /> Sending…</>
              : <><ArrowUpRight size={14} /> Send {btcAmt > 0 ? `₿ ${fmt(btcAmt)}` : 'Bitcoin'}</>}
          </button>

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={12} style={{ color: C.warn, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              Double-check the address. Sending to the wrong address results in permanent loss of funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receive Modal ─────────────────────────────────────────────────────────────
function ReceiveModal({ address, network, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const explorerUrl = network === 'mainnet'
    ? `https://mempool.space/address/${address}`
    : `https://mempool.space/testnet/address/${address}`;

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
          {network === 'testnet' && (
            <div className="p-2.5 rounded-xl text-center text-xs font-black"
              style={{ backgroundColor: `${C.warn}15`, color: C.warn }}>
              ⚠️ TESTNET — Use testnet faucet only. Not real BTC.
            </div>
          )}

          <p className="text-xs text-gray-500">Send BTC to your unique address. Credited after 1 confirmation (~10 min).</p>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-600">Your Bitcoin Address</label>
            <div className="p-3 rounded-xl border font-mono text-xs break-all"
              style={{ borderColor: C.g200, backgroundColor: C.g50, color: C.g700 }}>
              {address || 'Loading…'}
            </div>
          </div>

          <button onClick={copy} disabled={!address}
            className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? C.success : C.green }}>
            {copied ? <><CheckCircle size={15} /> Copied!</> : <><Copy size={15} /> Copy Address</>}
          </button>

          {address && (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
              style={{ borderColor: C.g200, color: C.g600 }}>
              View on Mempool Explorer ↗
            </a>
          )}

          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF', border: `1px solid ${C.paid}20` }}>
            <Shield size={12} style={{ color: C.paid, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs font-semibold text-blue-700">
              Only send Bitcoin (BTC) to this address. Other coins will be lost permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Row ───────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const isSend    = tx.type === 'WITHDRAWAL' || tx.type === 'send';
  const isPending = tx.status === 'PENDING'  || tx.status === 'pending';
  const color     = isSend ? C.danger : C.success;
  const label     = isSend ? 'Sent' : tx.type === 'DEPOSIT' ? 'Received' : 'Trade';
  const txHash    = tx.tx_hash || tx.txHash;
  const network   = process.env.REACT_APP_HD_NETWORK || 'testnet';
  const explorerBase = network === 'mainnet' ? 'https://mempool.space/tx' : 'https://mempool.space/testnet/tx';

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: C.g100 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}10` }}>
        {isSend
          ? <ArrowUpRight size={16} style={{ color }} />
          : <ArrowDownLeft size={16} style={{ color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold" style={{ color: C.g800 }}>{label}</p>
          {isPending && (
            <span className="text-xs font-black px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${C.warn}20`, color: C.warn }}>PENDING</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs truncate" style={{ color: C.g400 }}>
            {tx.notes || (txHash ? `${txHash.slice(0, 14)}…` : fmtAge(tx.created_at))}
          </p>
          {txHash && (
            <a href={`${explorerBase}/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold flex-shrink-0 hover:underline"
              style={{ color: C.paid }}>↗</a>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black" style={{ color }}>
          {isSend ? '−' : '+'}₿{fmt(Math.abs(tx.amount_btc || 0))}
        </p>
        <p className="text-xs" style={{ color: C.g400 }}>{fmtAge(tx.created_at)}</p>
      </div>
    </div>
  );
}

const CURRENCY_SYMBOLS = { USD:'$', GBP:'£', EUR:'€', GHS:'₵', NGN:'₦', KES:'KSh ', ZAR:'R ' };

// ─── Main Wallet Page ──────────────────────────────────────────────────────────
export default function WalletPage({ user }) {
  const navigate = useNavigate();
  const { rates: USD_RATES } = useRates();

  const [walletData,       setWalletData]       = useState(null);
  const [transactions,     setTransactions]     = useState([]);
  const [btcPrice,         setBtcPrice]         = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [checking,         setChecking]         = useState(false);
  const [showBal,          setShowBal]          = useState(true);
  const [showSend,         setShowSend]         = useState(false);
  const [showRecv,         setShowRecv]         = useState(false);
  const [displayCurrency,  setDisplayCurrency]  = useState(localStorage.getItem('praqen_currency') || 'USD');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.preferred_currency) {
          setDisplayCurrency(res.data.preferred_currency);
          localStorage.setItem('praqen_currency', res.data.preferred_currency);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('praqen_currency');
        if (saved) setDisplayCurrency(saved);
      });
  }, []);

  // ── Load wallet from HD wallet endpoint ────────────────────────────────────
  const loadWallet = async () => {
    try {
      const r = await axios.get(`${API_URL}/hd-wallet/wallet`, { headers: authH() });
      setWalletData({
        address:     r.data.address,
        balance_btc: r.data.balance_btc,
        network:     r.data.network,
        has_address: r.data.has_address,
      });
      setTransactions(r.data.transactions || []);
    } catch (e) {
      console.error('[Wallet] Load error:', e.message);
      toast.error('Failed to load wallet');
    }
  };

  // ── Fetch live BTC price ───────────────────────────────────────────────────
  const loadBtcPrice = async () => {
    try {
      const r = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try {
        const r2 = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        setBtcPrice(parseFloat(r2.data.data.amount));
      } catch {
        setBtcPrice(88000); // fallback
      }
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const init = async () => {
      setLoading(true);
      await Promise.all([loadWallet(), loadBtcPrice()]);
      setLoading(false);
    };
    init();
  }, [user]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWallet(), loadBtcPrice()]);
    setRefreshing(false);
    toast.success('Wallet refreshed');
  };

  // ── Generate address ───────────────────────────────────────────────────────
  const generateAddress = async () => {
    try {
      const r = await axios.post(`${API_URL}/hd-wallet/generate-address`, {}, { headers: authH() });
      toast.success('Bitcoin address generated!');
      setWalletData(prev => ({ ...prev, address: r.data.address, has_address: true }));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to generate address');
    }
  };

  // ── Check for new deposits ─────────────────────────────────────────────────
  const checkDeposit = async () => {
    setChecking(true);
    try {
      const r = await axios.post(`${API_URL}/hd-wallet/check-deposit`, {}, { headers: authH() });
      toast.info(r.data.message || 'Check complete');
      await loadWallet(); // refresh balance after check
    } catch (e) {
      toast.error('Failed to check deposits');
    } finally { setChecking(false); }
  };

  // ── Send BTC (real on-chain withdrawal) ────────────────────────────────────
  const sendBitcoin = async (toAddress, amountBtc) => {
    try {
      const r = await axios.post(`${API_URL}/hd-wallet/send`,
        { toAddress, amountBtc },
        { headers: authH() }
      );
      toast.success(`₿${fmt(amountBtc)} sent! TX: ${r.data.txid?.slice(0,12)}…`);
      await loadWallet();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send Bitcoin');
      throw e;
    }
  };

  const balance = parseFloat(walletData?.balance_btc || 0);
  const balUsd  = balance * (btcPrice || 88000);
  const network = walletData?.network || 'testnet';

  const fxRate   = displayCurrency === 'USD' ? 1 : (USD_RATES?.[displayCurrency] || 1);
  const sym      = CURRENCY_SYMBOLS[displayCurrency] || `${displayCurrency} `;
  const fmtLocal = n => `${sym}${(n * fxRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.mist }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto"
          style={{ borderColor: C.sage, borderTopColor: 'transparent' }} />
        <p className="text-sm font-semibold" style={{ color: C.green }}>Loading wallet…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.g50, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Testnet banner */}
        {network === 'testnet' && (
          <div className="p-3 rounded-xl text-center text-sm font-black"
            style={{ backgroundColor: `${C.warn}20`, color: C.warn, border: `1px solid ${C.warn}40` }}>
            ⚠️ TESTNET MODE — Using fake BTC. Switch HD_NETWORK=mainnet for real Bitcoin.
          </div>
        )}

        {/* ── WALLET CARD ──────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden shadow-lg relative"
          style={{ background: `linear-gradient(135deg,${C.forest} 0%,${C.green} 60%,${C.mint} 100%)` }}>

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
                  <p className="text-white/60 text-xs">{user?.username} · {network.toUpperCase()}</p>
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
                  <p className="text-4xl font-black text-white tracking-tight">₿ {fmt(balance)}</p>
                  <p className="text-white/60 text-sm mt-0.5">≈ {fmtLocal(balUsd)}</p>
                  {btcPrice > 0 && (
                    <p className="text-white/40 text-xs mt-0.5">
                      Live BTC: {fmtLocal(btcPrice)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-4xl font-black text-white">••••••••</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Receive', icon: ArrowDownLeft, color: C.success, action: () => setShowRecv(true) },
                { label: 'Send',    icon: ArrowUpRight,  color: C.danger,  action: () => setShowSend(true) },
                { label: 'Check',   icon: Zap,           color: C.gold,    action: checkDeposit },
              ].map(({ label, icon: Icon, color, action }) => (
                <button key={label} onClick={action}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:opacity-90 transition"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}25` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span className="text-white text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── DEPOSIT ADDRESS CARD ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: C.g200 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowDownLeft size={15} style={{ color: C.success }} />
              <p className="font-black text-sm" style={{ color: C.g800 }}>Your Deposit Address</p>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: walletData?.address ? `${C.success}15` : `${C.warn}15`,
                color: walletData?.address ? C.success : C.warn
              }}>
              {walletData?.address ? '✅ Ready' : '⚠️ Not Generated'}
            </span>
          </div>

          {walletData?.address ? (
            <div className="space-y-3">
              {/* Address display */}
              <div className="p-3 rounded-xl border font-mono text-xs break-all"
                style={{ borderColor: C.g100, backgroundColor: C.g50, color: C.g700 }}>
                {walletData.address}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(walletData.address); toast.success('Address copied!'); }}
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

              {/* Check for new deposits */}
              <button onClick={checkDeposit} disabled={checking}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold hover:bg-gray-50 transition"
                style={{ borderColor: C.g200, color: C.g600 }}>
                {checking
                  ? <><RefreshCw size={12} className="animate-spin" /> Checking mempool…</>
                  : <><Zap size={12} style={{ color: C.gold }} /> Check for New Deposits</>}
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Bitcoin size={36} className="mx-auto mb-3" style={{ color: C.g300 }} />
              <p className="text-sm font-bold text-gray-600 mb-1">No address generated yet</p>
              <p className="text-xs text-gray-400 mb-4">Generate your unique Bitcoin deposit address</p>
              <button onClick={generateAddress}
                className="px-6 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90"
                style={{ backgroundColor: C.green }}>
                <Bitcoin size={14} className="inline mr-1.5" /> Generate My Address
              </button>
            </div>
          )}

          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <AlertTriangle size={12} style={{ color: C.warn, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              Only send Bitcoin (BTC) to this address. Sending other coins will result in permanent loss.
            </p>
          </div>
        </div>

        {/* ── STATS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'BTC Balance',  value: `₿${fmt(balance, 6)}`, color: C.gold },
            { label: `${displayCurrency} Value`, value: fmtLocal(balUsd), color: C.success },
            { label: 'Transactions', value: `${transactions.length}`, color: C.paid },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm text-center" style={{ borderColor: C.g200 }}>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: C.g400 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── SECURITY INFO ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: C.g200 }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} style={{ color: C.green }} />
            <p className="font-black text-sm" style={{ color: C.g800 }}>Wallet Security</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: '🔑', label: 'Self-Custodial HD Wallet',  desc: 'Your keys derived from master seed — PRAQEN controls nothing' },
              { icon: '🔒', label: 'Escrow Protected Trades',   desc: 'Trade funds locked until both parties confirm' },
              { icon: '⚡', label: 'Auto Deposit Detection',    desc: 'Balance updates automatically when BTC arrives' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: C.g50 }}>
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: C.g700 }}>{label}</p>
                  <p className="text-xs" style={{ color: C.g400 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRANSACTION HISTORY ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: C.g200 }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.g100 }}>
            <p className="font-black text-sm" style={{ color: C.g800 }}>Transaction History</p>
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ backgroundColor: C.g100, color: C.g500 }}>
              {transactions.length} records
            </span>
          </div>
          <div className="px-5">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={36} className="mx-auto mb-3" style={{ color: C.g300 }} />
                <p className="font-bold text-sm" style={{ color: C.g500 }}>No transactions yet</p>
                <p className="text-xs mt-1" style={{ color: C.g400 }}>Deposits and trades appear here</p>
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

        {/* ── SUPPORT ──────────────────────────────────────────────── */}
        <a href="https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl border hover:bg-gray-50 transition"
          style={{ borderColor: C.g200, backgroundColor: 'white' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-black" style={{ color: C.g800 }}>Need wallet help?</p>
              <p className="text-xs" style={{ color: C.g400 }}>Reach PRAQEN support on WhatsApp</p>
            </div>
          </div>
          <ChevronRight size={15} style={{ color: C.g400 }} />
        </a>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
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
                {[
                  ['Buy Bitcoin',  '/buy-bitcoin'],
                  ['Sell Bitcoin', '/sell-bitcoin'],
                  ['My Trades',   '/my-trades'],
                  ['Settings',    '/settings'],
                  ['📧 support@praqen.com', 'mailto:support@praqen.com'],
                ].map(([l, h]) => (
                  <a key={l} href={h} className="block text-xs hover:text-white transition"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} PRAQEN. All rights reserved.
            </p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <Shield size={10} /> Self-Custodial HD Wallet · 0.5% fee on trades
            </p>
          </div>
        </div>
      </footer>

      {showSend && <WithdrawModal balance={balance} onClose={() => setShowSend(false)} onSend={sendBitcoin} />}
      {showRecv && <ReceiveModal address={walletData?.address} network={network} onClose={() => setShowRecv(false)} />}
    </div>
  );
}
