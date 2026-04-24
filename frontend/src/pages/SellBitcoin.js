import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Bitcoin, CheckCircle, RefreshCw,
  AlertTriangle, BadgeCheck, Timer,
  X, Info, Shield, ArrowRight, PlusCircle,
  Filter, Home, Wallet, User, Gift,
  ChevronDown, DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import ActiveTradeBanner from '../components/ActiveTradeBanner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', sell:'#D97706', sellBg:'#FFFBEB',
  mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B',
};

// ── Trust badge map ───────────────────────────────────────────────────────────
const TRUST_MAP = {
  LEGEND:     { label:'LEGEND',     icon:'♛', iconColor:'#F4A422', textColor:'#1B4332', borderColor:'#A7F3D0', bg:'#ECFDF5' },
  AMBASSADOR: { label:'AMBASSADOR', icon:'◈', iconColor:null,      textColor:'#FFFFFF',  borderColor:'#0D9488', bg:'linear-gradient(135deg,#0D9488,#2D6A4F)' },
  EXPERT:     { label:'EXPERT',     icon:'▲', iconColor:null,      textColor:'#FFFFFF',  borderColor:'#0D9488', bg:'linear-gradient(135deg,#0D9488,#134E4A)' },
  PRO:        { label:'PRO',        icon:'●', iconColor:null,      textColor:'#1B4332',  borderColor:'#2D6A4F', bg:'linear-gradient(135deg,#D1FAE5,#A7F3D0)' },
  ACTIVE:     { label:'Active',     icon:'○', iconColor:null,      textColor:'#1B4332',  borderColor:'#6EE7B7', bg:'#F0FDF4' },
  BEGINNER:   { label:'New',        icon:'·', iconColor:null,      textColor:'#64748B',  borderColor:'#CBD5E1', bg:'#F8FAFC' },
};

function deriveBadge(u) {
  if (u?.badge) {
    const b = String(u.badge).toUpperCase();
    if (TRUST_MAP[b]) return TRUST_MAP[b];
  }
  const t = parseInt(u?.total_trades ?? u?.trade_count ?? 0);
  const r = parseFloat(u?.average_rating ?? 0);
  if (t >= 500 && r >= 4.8) return TRUST_MAP.LEGEND;
  if (t >= 200 && r >= 4.5) return TRUST_MAP.EXPERT;
  if (t >= 50  && r >= 4.0) return TRUST_MAP.PRO;
  if (t >= 5)               return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

const CUR_SYM = { GHS:'₵', NGN:'₦', KES:'KSh', ZAR:'R', UGX:'USh', TZS:'TSh', USD:'$', GBP:'£', EUR:'€', XAF:'CFA', XOF:'CFA' };

const COUNTRIES = [
  {code:'ALL', name:'All Countries',   flag:'🌍', currency:'GHS', symbol:'₵'},
  {code:'GH',  name:'Ghana',           flag:'🇬🇭', currency:'GHS', symbol:'₵'},
  {code:'NG',  name:'Nigeria',         flag:'🇳🇬', currency:'NGN', symbol:'₦'},
  {code:'KE',  name:'Kenya',           flag:'🇰🇪', currency:'KES', symbol:'KSh'},
  {code:'ZA',  name:'South Africa',    flag:'🇿🇦', currency:'ZAR', symbol:'R'},
  {code:'UG',  name:'Uganda',          flag:'🇺🇬', currency:'UGX', symbol:'USh'},
  {code:'US',  name:'United States',   flag:'🇺🇸', currency:'USD', symbol:'$'},
  {code:'GB',  name:'United Kingdom',  flag:'🇬🇧', currency:'GBP', symbol:'£'},
  {code:'EU',  name:'Europe',          flag:'🇪🇺', currency:'EUR', symbol:'€'},
  {code:'CM',  name:'Cameroon',        flag:'🇨🇲', currency:'XAF', symbol:'CFA'},
  {code:'SN',  name:'Senegal',         flag:'🇸🇳', currency:'XOF', symbol:'CFA'},
];

const PAYMENT_OPTIONS = [
  {value:'all',         label:'All Methods',       icon:'💳'},
  {value:'mtn',         label:'MTN Mobile Money',  icon:'📱'},
  {value:'vodafone',    label:'Vodafone Cash',     icon:'📱'},
  {value:'airteltigo',  label:'AirtelTigo',        icon:'📱'},
  {value:'bank',        label:'Bank Transfer',     icon:'🏦'},
  {value:'paypal',      label:'PayPal',            icon:'💰'},
  {value:'mpesa',       label:'M-Pesa',            icon:'📱'},
  {value:'opay',        label:'OPay',              icon:'💳'},
];

const fmt  = (n, d=0) => new Intl.NumberFormat('en-US', {minimumFractionDigits:0, maximumFractionDigits:d}).format(n||0);
const fBtc = (n)      => parseFloat(n||0).toFixed(6);

const getUser     = (u) => Array.isArray(u) ? u[0] : (u||{});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades ?? u?.trade_count ?? 0);
const getLastSeen = (u) => {
  const d = u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if (!d) return {label:'—', online:false};
  const s = (Date.now()-new Date(d))/1000;
  if (s<300)   return {label:'Active',            online:true};
  if (s<3600)  return {label:`${~~(s/60)}m ago`,   online:false};
  if (s<86400) return {label:`${~~(s/3600)}h ago`,  online:false};
  return {label:`${~~(s/86400)}d ago`, online:false};
};
const getRateUSD = (l, btcPrice) => {
  if (l.pricing_type==='fixed') { const s=parseFloat(l.bitcoin_price||0); if(s>100) return s; }
  return btcPrice * (1 + parseFloat(l.margin||0)/100);
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({user, size=44, radius='rounded-xl'}) {
  const [err, setErr] = useState(false);
  const u = getUser(user);
  if (u?.avatar_url && !err) {
    return (
      <img src={u.avatar_url} alt={u.username||'user'} onError={()=>setErr(true)}
        className={`object-cover flex-shrink-0 ${radius}`}
        style={{width:size, height:size}}/>
    );
  }
  return (
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size, height:size, backgroundColor:C.sell, fontSize:Math.round(size*0.38)}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Offer Card — Noones-style (Sell side) ─────────────────────────────────────
function OfferCard({listing, btcPriceUSD, onViewBuyer, onSell}) {
  const { rates: USD_RATES } = useRates();
  const u       = getUser(listing.users);
  const badge   = deriveBadge(u);
  const seen    = getLastSeen(u);
  const trades  = getTrades(u);
  const margin  = parseFloat(listing.margin||0);
  const cur     = listing.currency || 'GHS';
  const sym     = listing.currency_symbol || CUR_SYM[cur] || '₵';
  const usdRate = USD_RATES[cur] || 1;
  const rateLocal = getRateUSD(listing, btcPriceUSD) * usdRate;

  const minLocal = listing.min_limit_local || (listing.min_limit_usd ? listing.min_limit_usd*usdRate : 100*usdRate);
  const maxLocal = listing.max_limit_local || (listing.max_limit_usd ? listing.max_limit_usd*usdRate : 1000*usdRate);

  // Example: min receive amount → back-calc BTC to send
  const exampleRecv = minLocal || Math.round(100*usdRate);
  const exampleBtc  = rateLocal > 0 ? exampleRecv / rateLocal : 0.001;

  const marginLabel = margin===0 ? 'Market' : margin>0 ? `+${margin}%` : `${margin}%`;
  const marginBg    = margin>0 ? C.success : margin<0 ? C.danger : C.g400;

  const pos   = parseInt(u.positive_feedback||0);
  const neg   = parseInt(u.negative_feedback||0);
  const total = pos + neg;

  const pm      = String(listing.payment_method||'').toLowerCase();
  const pmIcon  = pm.includes('mtn')||pm.includes('mobile') ? '📱'
                : pm.includes('vodafone')||pm.includes('airteltigo') ? '📱'
                : pm.includes('bank') ? '🏦' : '💳';
  const pmLabel = listing.payment_method || 'Payment';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all"
      style={{borderColor:C.g200}}>

      {/* ─ Seller/Buyer header ───────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2">

          {/* Avatar + online dot */}
          <div className="relative flex-shrink-0">
            <button onClick={onViewBuyer}>
              <Avatar user={u} size={44} radius="rounded-xl"/>
            </button>
            {seen.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{backgroundColor:C.online}}/>
            )}
          </div>

          {/* Name + badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <button onClick={onViewBuyer}
                className="font-black text-xs hover:underline leading-tight truncate flex-shrink min-w-0"
                style={{color:C.g800}}>
                {u.username||'Buyer'}
              </button>
              {isVerified(u) && <BadgeCheck size={13} style={{color:'#3B82F6', flexShrink:0}}/>}
              <CountryFlag
                countryCode={(u?.country_code||u?.country||'gh').toLowerCase()}
                className="w-4 h-3 rounded-sm flex-shrink-0"/>
              <span className="inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded border flex-shrink-0"
                style={{background:badge.bg, borderColor:badge.borderColor}}>
                <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                <span style={{color:badge.textColor, fontSize:11}}> {badge.label}</span>
              </span>
            </div>

            {/* Single stats line — no wrap */}
            <div className="flex items-center gap-1 mt-0.5 overflow-hidden whitespace-nowrap">
              <span className="text-xs font-bold flex-shrink-0" style={{color:C.success}}>👍 {fmt(pos)}</span>
              <span className="text-xs flex-shrink-0" style={{color:C.g300}}>·</span>
              <span className="text-xs font-bold flex-shrink-0" style={{color:C.danger}}>👎 {fmt(neg)}</span>
              <span className="text-xs flex-shrink-0" style={{color:C.g300}}>·</span>
              <span className="text-xs font-semibold flex-shrink-0" style={{color:C.g600}}>{fmt(trades)} trades</span>
              <span className="text-xs flex-shrink-0" style={{color:C.g300}}>·</span>
              <span className="text-xs font-semibold flex items-center gap-0.5 flex-shrink-0"
                style={{color:seen.online ? C.online : C.g400}}>
                <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                  style={{backgroundColor:seen.online ? C.online : C.g400}}/>
                {seen.label}
              </span>
            </div>

            {/* Payment badge */}
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                style={{backgroundColor:C.g100, color:C.g700}}>
                {pmIcon} Pay: {pmLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─ Divider ───────────────────────────────────────────────── */}
      <div style={{height:1, backgroundColor:C.g100}}/>

      {/* ─ You Send / You Receive ────────────────────────────────── */}
      <div className="px-3 py-2.5 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{color:C.g500}}>YOU SEND</p>
          <p className="text-lg font-black leading-tight" style={{color:C.gold}}>₿{fBtc(exampleBtc)}</p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>Bitcoin</p>
        </div>
        <div className="border-l pl-2.5" style={{borderColor:C.g100}}>
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{color:C.g500}}>YOU RECEIVE</p>
          <p className="text-lg font-black leading-tight" style={{color:C.g800}}>
            {sym}{fmt(exampleRecv)}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>{cur}</p>
        </div>
      </div>

      {/* ─ Rate + margin ─────────────────────────────────────────── */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold" style={{color:C.g600}}>
          Rate: {sym}{fmt(rateLocal)}/BTC
        </p>
        <span className="text-xs font-black px-1.5 py-0.5 rounded"
          style={{backgroundColor:marginBg, color:'#fff'}}>
          {marginLabel}
        </span>
      </div>

      {/* ─ Limit row ─────────────────────────────────────────────── */}
      {(minLocal > 0 || maxLocal > 0) && (
        <div className="px-3 pb-2">
          <p className="text-xs" style={{color:C.g400}}>
            Limit: {sym}{fmt(minLocal)} – {sym}{fmt(maxLocal)} {cur}
          </p>
        </div>
      )}

      {/* ─ Actions ───────────────────────────────────────────────── */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <button onClick={onViewBuyer}
          className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition"
          style={{borderColor:C.g200}}>
          <Info size={14} style={{color:C.g400}}/>
        </button>
        <button onClick={onSell}
          className="flex-1 py-2.5 rounded-xl text-white font-black text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          style={{backgroundColor:C.sell}}>
          SELL BTC <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

// ── Buyer Modal ───────────────────────────────────────────────────────────────
function BuyerModal({buyer, listing, onClose, onTrade}) {
  const [tab, setTab] = useState('rules');
  const { rates: USD_RATES } = useRates();
  if (!buyer) return null;
  const u      = getUser(buyer);
  const badge  = deriveBadge(u);
  const seen   = getLastSeen(u);
  const trades = getTrades(u);
  const rating = parseFloat(u.average_rating||0);
  const fb     = parseInt(u.total_feedback_count ?? u.feedback_count ?? 0);
  const margin = parseFloat(listing?.margin||0);
  const cur    = listing?.currency||'GHS';
  const sym    = listing?.currency_symbol || CUR_SYM[cur] || '₵';
  const usdRate = USD_RATES[cur]||1;
  const rateLocal = getRateUSD(listing||{}, 68000) * usdRate;
  const ccCode = (u?.country_code||u?.country||'gh').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl"
        style={{border:`1px solid ${C.g200}`, animation:'slideUp .25s ease'}}>

        {/* Header */}
        <div className="relative p-5 text-white"
          style={{background:`linear-gradient(135deg,${C.forest},${C.sell})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white"/>
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar user={u} size={52} radius="rounded-xl"/>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{backgroundColor:seen.online ? C.online : C.g400}}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base leading-tight">{u.username||'Buyer'}</h3>
                {isVerified(u) && <BadgeCheck size={14} style={{color:'#93C5FD'}}/>}
                <CountryFlag countryCode={ccCode} className="w-4 h-3 rounded-sm"/>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded border"
                  style={{background:badge.bg, borderColor:badge.borderColor}}>
                  <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                  <span style={{color:badge.textColor}}> {badge.label}</span>
                </span>
                <span className="text-xs text-white/60">{seen.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs font-black">
                <span style={{color:'#86EFAC'}}>👍 {fmt(u.positive_feedback||0)}</span>
                <span className="text-white/30">·</span>
                <span style={{color:'#FCA5A5'}}>👎 {fmt(u.negative_feedback||0)}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/80">{fmt(trades)} Trades</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20 text-center">
            {[
              {label:'Trades',   value:fmt(trades)},
              {label:'Rating',   value:`${rating.toFixed(1)}★`},
              {label:'Reviews',  value:fmt(fb)},
              {label:'Complete', value:`${u.completion_rate||98}%`},
            ].map(s=>(
              <div key={s.label}>
                <p className="text-white font-black text-sm">{s.value}</p>
                <p className="text-white/50 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{borderColor:C.g200}}>
          {[['rules','📋 Trade Rules'],['offer','📊 Offer Details']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition"
              style={{
                color:tab===t ? C.sell : C.g500,
                borderBottom:tab===t ? `2px solid ${C.sell}` : '2px solid transparent',
                backgroundColor:tab===t ? `${C.sell}08` : 'transparent'
              }}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {tab==='rules' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.mist, color:C.g700, border:`1px solid ${C.g200}`}}>
                {listing?.trade_instructions||listing?.description||
                  'Confirm payment received in your account before releasing Bitcoin. Never release early.'}
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{backgroundColor:C.sellBg, border:'1px solid #FDE68A'}}>
                <Timer size={12} style={{color:C.sell, flexShrink:0}}/>
                <p className="text-xs font-bold" style={{color:'#92400E'}}>
                  Time limit: {listing?.time_limit||30} minutes — auto-cancels if unpaid
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-xs text-red-600">Never release BTC before confirming payment. Escrow protects every trade.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[
                {label:'Payment',     value:listing?.payment_method||'—'},
                {label:'Rate / BTC',  value:`${sym}${fmt(rateLocal)} ${cur}`},
                {label:'Margin',      value:margin===0?'At market':margin>0?`+${margin}% above market`:`${margin}% below market`},
                {label:'Trade range', value:listing?.min_limit_local&&listing?.max_limit_local
                  ? `${sym}${fmt(listing.min_limit_local)} – ${sym}${fmt(listing.max_limit_local)} ${cur}`
                  : `$${listing?.min_limit_usd||10} – $${listing?.max_limit_usd||1000}`},
                {label:'Time limit',  value:`${listing?.time_limit||30} minutes`},
                {label:'Country',     value:listing?.country_name||u.country||'—'},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between text-xs py-1.5 border-b last:border-0"
                  style={{borderColor:C.g100}}>
                  <span className="font-semibold" style={{color:C.g500}}>{label}</span>
                  <span className="font-black" style={{color:C.g800}}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{borderColor:C.g200, color:C.g600}}>
            Close
          </button>
          <button onClick={()=>{onClose();onTrade();}}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-1.5"
            style={{backgroundColor:C.sell}}>
            <Bitcoin size={14}/> Sell BTC
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Navigation (mobile only) ──────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate();
  const items = [
    {id:'home',      icon:Home,    label:'Home',       path:'/dashboard'},
    {id:'p2p',       icon:Bitcoin, label:'P2P',        path:'/buy-bitcoin'},
    {id:'giftcards', icon:Gift,    label:'Gift Cards', path:'/gift-cards'},
    {id:'wallet',    icon:Wallet,  label:'Wallet',     path:'/wallet'},
    {id:'profile',   icon:User,    label:'Profile',    path:'/profile'},
  ];

  const path = window.location.pathname;
  const activeId = path.includes('sell-bitcoin') ? 'p2p'
                 : path.includes('gift') ? 'giftcards'
                 : path.includes('wallet') ? 'wallet'
                 : path.includes('profile') ? 'profile'
                 : 'home';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden"
      style={{borderColor:C.g200, paddingBottom:'env(safe-area-inset-bottom)'}}>
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map(({id,icon:Icon,label,path:to})=>{
          const active = id===activeId;
          return (
            <button key={id} onClick={()=>navigate(to)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              style={{color:active ? C.forest : C.g400}}>
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8}/>
              <span className="text-xs font-bold">{label}</span>
              {active && <span className="w-1 h-1 rounded-full" style={{backgroundColor:C.forest}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main SellBitcoin Page ─────────────────────────────────────────────────────
export default function SellBitcoin({user}) {
  const navigate = useNavigate();
  const { rates: USD_RATES, btcUsd: contextBtcUsd } = useRates();
  const [offers,       setOffers]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [btcPrice,     setBtcPrice]     = useState(68000);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selCountry,   setSelCountry]   = useState(COUNTRIES[1]); // Ghana default
  const [selPayment,   setSelPayment]   = useState('all');
  const [showFilters,  setShowFilters]  = useState(false);
  const [showCountry,  setShowCountry]  = useState(false);
  const [sortBy,       setSortBy]       = useState('rate_high');
  const [modal,        setModal]        = useState(null);
  const [sellAmt,      setSellAmt]      = useState('');
  const countryRef = useRef(null);

  useEffect(()=>{ if(contextBtcUsd>0) setBtcPrice(contextBtcUsd); },[contextBtcUsd]);
  useEffect(()=>{ fetchRates(); loadOffers(); },[]);
  useEffect(()=>{
    const h=e=>{ if(countryRef.current&&!countryRef.current.contains(e.target)) setShowCountry(false); };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const r = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try {
        const r2 = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
        setBtcPrice(r2.data.bpi.USD.rate_float);
      } catch {}
    } finally { setLoadingRates(false); }
  };

  const loadOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/listings`);
      const all = (res.data.listings||[]).map(l=>({...l, users:Array.isArray(l.users)?l.users[0]:l.users}));
      setOffers(all.filter(l=>l.listing_type==='BUY'||l.listing_type==='BUY_BITCOIN'));
    } catch { toast.error('Failed to load marketplace'); }
    finally { setLoading(false); }
  };

  const getFiltered = () => {
    let list = [...offers];
    if (selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if (selPayment!=='all')      list=list.filter(l=>String(l.payment_method||'').toLowerCase().includes(selPayment));
    if (sellAmt && parseFloat(sellAmt)>0) {
      const a = parseFloat(sellAmt);
      list=list.filter(l=>a>=(l.min_limit_btc||0)&&a<=(l.max_limit_btc||999));
    }
    if (sortBy==='rate_high') list.sort((a,b)=>parseFloat(b.margin||0)-parseFloat(a.margin||0));
    else if (sortBy==='rating') list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    else if (sortBy==='trades') list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));
    return list;
  };

  const handleSell = (id) => {
    if (!user) { navigate('/login?message=Please log in to start trading'); return; }
    navigate(`/listing/${id}`);
  };

  const filtered   = getFiltered();
  const cur        = selCountry.currency || 'GHS';
  const sym        = CUR_SYM[cur] || '₵';
  const usdRate    = USD_RATES[cur] || 1;
  const btcLocal   = btcPrice * usdRate;
  const selPmInfo  = PAYMENT_OPTIONS.find(p=>p.value===selPayment);
  const onlineCnt  = offers.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300).length;
  const hasFilters = selPayment!=='all' || sellAmt || selCountry.code!=='ALL';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.g100}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{borderColor:C.sell, borderTopColor:'transparent'}}/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0"
      style={{backgroundColor:C.g100, fontFamily:"'DM Sans',sans-serif"}}>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      `}</style>

      {/* ══════════════════════════════════════════════════
          1. RATE BAR
      ══════════════════════════════════════════════════ */}
      <div style={{backgroundColor:C.forest}} className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">

            {/* Heading + rates */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl md:text-3xl font-black text-white leading-tight mb-1.5">
                Sell Bitcoin with{' '}
                <span style={{color:C.gold}}>
                  {selPayment==='all' ? 'Local Currency' : (selPmInfo?.label || 'Mobile Money')}
                </span>
              </p>
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>
                  1 USD = <span className="font-black" style={{color:'rgba(255,255,255,0.75)'}}>{sym}{fmt(usdRate,2)} {cur}</span>
                </span>
                <span style={{color:'rgba(255,255,255,0.2)', fontSize:10}}>|</span>
                <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>
                  1 BTC = <span className="font-black" style={{color:'rgba(255,255,255,0.75)'}}>{sym}{fmt(btcLocal)} {cur}</span>
                </span>
                <span className="text-xs font-black select-none" style={{color:'rgba(255,255,255,0.3)'}}>₿</span>
              </div>
            </div>

            {/* Refresh */}
            <button onClick={()=>{fetchRates();loadOffers();}}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/20 flex-shrink-0"
              style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <RefreshCw size={15} className={`text-white ${loadingRates?'animate-spin':''}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          2. TAB NAVIGATION
      ══════════════════════════════════════════════════ */}
      <div className="bg-white border-b sticky top-0 z-30" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center">
            {[
              {label:'Buy BTC',    path:'/buy-bitcoin',  active:false},
              {label:'Sell BTC',   path:'/sell-bitcoin', active:true},
              {label:'Gift Cards', path:'/gift-cards',   active:false},
            ].map(tab=>(
              <Link key={tab.path} to={tab.path}
                className="px-4 py-3.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor:tab.active ? C.sell : 'transparent',
                  color:tab.active ? C.sell : C.g500,
                }}>
                {tab.label}
              </Link>
            ))}
            <div className="ml-auto flex items-center gap-1.5 py-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
              <span className="text-xs font-semibold" style={{color:C.g400}}>{onlineCnt} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active trade alerts */}
      <ActiveTradeBanner user={user} currentPage="sell"/>

      {/* ══════════════════════════════════════════════════
          3. FILTER BAR
      ══════════════════════════════════════════════════ */}
      <div className="bg-white border-b" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3 py-2.5">

          {/* Row 1 — Amount full width */}
          <div className="flex items-center border-2 rounded-xl overflow-hidden mb-2"
            style={{borderColor:sellAmt ? C.sell : C.g200}}>
            <input
              type="number"
              value={sellAmt}
              onChange={e=>setSellAmt(e.target.value)}
              placeholder="Enter BTC amount"
              className="flex-1 pl-3 pr-2 py-3 text-base font-bold focus:outline-none bg-transparent"
              style={{color:C.g800}}/>
            <span className="pr-3 text-xs font-black flex-shrink-0" style={{color:C.g400}}>BTC</span>
          </div>

          {/* Row 2 — Currency | Payment | Filter */}
          <div className="flex items-center gap-2">

            {/* Currency selector */}
            <div className="relative flex-1" ref={countryRef}>
              <button
                onClick={()=>setShowCountry(!showCountry)}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                style={{
                  borderColor:selCountry.code!=='ALL' ? C.sell : C.g200,
                  color:selCountry.code!=='ALL' ? C.sell : C.g600,
                  backgroundColor:selCountry.code!=='ALL' ? `${C.sell}08` : 'transparent'
                }}>
                <span className="text-base leading-none">{selCountry.flag}</span>
                <span className="text-xs font-black">{selCountry.currency}</span>
                <ChevronDown size={12} className={`transition-transform ${showCountry?'rotate-180':''}`}
                  style={{color:selCountry.code!=='ALL' ? C.sell : C.g400}}/>
              </button>
              {showCountry && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                  style={{borderColor:C.g100}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code} onClick={()=>{setSelCountry(c);setShowCountry(false);}}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 border-b last:border-0 transition"
                      style={{borderColor:C.g50}}>
                      <span className="text-base">{c.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-xs" style={{color:C.g800}}>{c.name}</p>
                        <p style={{color:C.g400, fontSize:11}}>{c.currency}</p>
                      </div>
                      {selCountry.code===c.code && <CheckCircle size={13} style={{color:C.sell}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment badge */}
            <button
              onClick={()=>setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl border-2 text-xs font-bold transition"
              style={{
                borderColor:selPayment!=='all' ? C.sell : C.g200,
                color:selPayment!=='all' ? C.sell : C.g600,
                backgroundColor:selPayment!=='all' ? `${C.sell}08` : 'transparent'
              }}>
              {selPmInfo?.icon||'💳'}
              <span className="ml-0.5 truncate">
                {selPayment==='all' ? 'Payment' : (selPmInfo?.label||'').replace(' Mobile Money','').replace(' Cash','').replace(' Transfer','')}
              </span>
            </button>

            {/* Filter toggle */}
            <button
              onClick={()=>setShowFilters(!showFilters)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-xs font-black transition"
              style={{
                borderColor:showFilters||hasFilters ? C.sell : C.g200,
                color:showFilters||hasFilters ? C.sell : C.g600,
                backgroundColor:showFilters||hasFilters ? `${C.sell}08` : 'transparent'
              }}>
              <Filter size={13}/>
              Filter
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{backgroundColor:C.sell}}/>}
            </button>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-2.5 pt-2.5 border-t grid grid-cols-2 sm:grid-cols-3 gap-2"
              style={{borderColor:C.g100}}>
              <div>
                <p className="text-xs font-bold mb-1" style={{color:C.g500}}>Payment Method</p>
                <select value={selPayment} onChange={e=>setSelPayment(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border-2 rounded-xl focus:outline-none"
                  style={{borderColor:selPayment!=='all'?C.sell:C.g200, color:C.g800}}>
                  {PAYMENT_OPTIONS.map(p=>(
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{color:C.g500}}>Sort By</p>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border-2 rounded-xl focus:outline-none"
                  style={{borderColor:C.g200, color:C.g800}}>
                  <option value="rate_high">Best Rate (Highest)</option>
                  <option value="rating">Top Rated</option>
                  <option value="trades">Most Trades</option>
                </select>
              </div>
              <div className="flex items-end col-span-2 sm:col-span-1">
                <button onClick={()=>navigate('/create-offer')}
                  className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition hover:opacity-90"
                  style={{backgroundColor:C.sell, color:'#fff'}}>
                  <PlusCircle size={13}/> Post Buy Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          4. OFFER GRID
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3 space-y-3">

        {/* Count row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{color:C.g500}}>
            <span className="font-black text-sm" style={{color:C.g800}}>{filtered.length}</span>{' '}
            buyers{selCountry.code!=='ALL' ? ` · ${selCountry.flag} ${selCountry.name}` : ''}
          </p>
          <button onClick={()=>navigate('/create-offer')}
            className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{backgroundColor:`${C.sell}12`, color:C.sell}}>
            <PlusCircle size={12}/> Post Offer
          </button>
        </div>

        {filtered.length===0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-black text-base mb-1" style={{color:C.g800}}>No buyers found</p>
            <p className="text-sm" style={{color:C.g400}}>Adjust your filters or post the first buy offer</p>
            <button onClick={()=>navigate('/create-offer')}
              className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90 transition"
              style={{backgroundColor:C.sell}}>
              Post Buy Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(l=>(
              <OfferCard
                key={l.id}
                listing={l}
                btcPriceUSD={btcPrice}
                onViewBuyer={()=>{
                  setModal({buyer:l.users||{}, listing:l});
                  axios.post(`${API_URL}/listings/${l.id}/view`).catch(()=>{});
                }}
                onSell={()=>handleSell(l.id)}
              />
            ))}
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.sellBg, borderColor:'#FDE68A'}}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{color:C.sell}}/>
          <p className="text-xs leading-relaxed" style={{color:'#92400E'}}>
            <strong>Sell Safely:</strong> Never release Bitcoin before confirming payment received.
            All trades are escrow-protected. Report suspicious buyers immediately.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          5. BOTTOM NAVIGATION (mobile only)
      ══════════════════════════════════════════════════ */}
      <BottomNav/>

      {/* Buyer modal */}
      {modal && (
        <BuyerModal
          buyer={modal.buyer}
          listing={modal.listing}
          onClose={()=>setModal(null)}
          onTrade={()=>handleSell(modal.listing?.id)}
        />
      )}
    </div>
  );
}
