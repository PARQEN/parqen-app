import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Bitcoin, CheckCircle, RefreshCw,
  AlertTriangle, BadgeCheck, Timer,
  Heart, X, Info, Shield, ArrowRight, PlusCircle,
  Filter, Home, Wallet, User, Gift,
  ChevronDown, TrendingUp, BarChart2, ThumbsUp, ThumbsDown, Repeat2
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import { TRUST_MAP, deriveBadge } from '../lib/badge';
import ActiveTradeCard from '../components/ActiveTradeCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B',
};


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
];

const fmt  = (n, d=0) => new Intl.NumberFormat('en-US', {minimumFractionDigits:0, maximumFractionDigits:d}).format(n||0);
const fBtc = (n)      => parseFloat(n||0).toFixed(8);

const getUser     = (u) => Array.isArray(u) ? u[0] : (u||{});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades ?? u?.trade_count ?? 0);
const getLastSeen = (u) => {
  const d = u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if (!d) return {label:'—', online:false};
  const s = (Date.now()-new Date(d))/1000;
  if (s<300)   return {label:'ACTIVE NOW', online:true};
  if (s<3600)  { const m=~~(s/60); return {label:`${m} ${m===1?'min':'mins'} ago`, online:false}; }
  if (s<86400) { const h=~~(s/3600); return {label:`${h} ${h===1?'hr':'hrs'} ago`, online:false}; }
  const dy=~~(s/86400); return {label:`${dy} ${dy===1?'day':'days'} ago`, online:false};
};
const getRateUSD = (l, btcPrice) => {
  if (l.pricing_type==='fixed') { const s=parseFloat(l.bitcoin_price||0); if(s>100) return s; }
  return btcPrice * (1 + parseFloat(l.margin||0)/100);
};
const calcBtc = (fiatAmt, btcUSD, marginPct, usdToLocal) => {
  const sellerRateLocal = btcUSD * (1+marginPct/100) * usdToLocal;
  const btcReceived     = fiatAmt / sellerRateLocal;
  return { btcReceived };
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({user, size=36, radius='rounded-xl'}) {
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
      style={{width:size, height:size, backgroundColor:C.green, fontSize:Math.round(size*0.38)}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Offer Card ────────────────────────────────────────────────────────────────
function OfferCard({listing, btcPriceUSD, onViewSeller, onBuy, liked, onToggleLike}) {
  const { rates: USD_RATES } = useRates();
  const u         = getUser(listing.users);
  const badge     = deriveBadge(u);
  const [seen, setSeen] = useState(() => getLastSeen(u));
  useEffect(() => {
    const id = setInterval(() => setSeen(getLastSeen(u)), 30000);
    return () => clearInterval(id);
  }, []);
  const trades    = getTrades(u);
  const margin    = parseFloat(listing.margin||0);
  const cur       = listing.currency || 'GHS';
  const sym       = listing.currency_symbol || CUR_SYM[cur] || '₵';
  const usdRate   = USD_RATES[cur] || 1;
  const rateLocal = getRateUSD(listing, btcPriceUSD) * usdRate;

  const minLocal = listing.min_limit_local || (listing.min_limit_usd ? listing.min_limit_usd*usdRate : 100*usdRate);
  const maxLocal = listing.max_limit_local || (listing.max_limit_usd ? listing.max_limit_usd*usdRate : 1000*usdRate);

  const examplePay = minLocal || Math.round(100*usdRate);
  const { btcReceived } = calcBtc(examplePay, btcPriceUSD, margin, usdRate);

  const marginLabel = margin===0 ? 'Market rate' : margin>0 ? `+${margin}% above market` : `${Math.abs(margin)}% below market`;
  const marginBg    = margin>0 ? C.danger : margin<0 ? C.success : C.g400;

  const pos   = parseInt(u.positive_feedback||0);
  const neg   = parseInt(u.negative_feedback||0);

  const pmLabel = listing.payment_method || 'Payment';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all w-full"
      style={{borderColor:C.g200}}>

      {/* ─ Seller header ─────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">

          {/* Avatar + online dot */}
          <div className="relative flex-shrink-0">
            <button onClick={onViewSeller}>
              <Avatar user={u} size={48} radius="rounded-xl"/>
            </button>
            {seen.online && (
              <span className="absolute -bottom-0.5 -right-0.5">
                <span className="absolute inline-flex w-3.5 h-3.5 rounded-full animate-ping"
                  style={{backgroundColor:C.online, opacity:0.6}}/>
                <span className="relative inline-flex w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{backgroundColor:C.online}}/>
              </span>
            )}
          </div>

          {/* Name + badge + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CountryFlag
                countryCode={(u?.country_code||u?.country||'gh').toLowerCase()}
                className="w-4 h-3 rounded-sm flex-shrink-0"/>
              <button onClick={onViewSeller}
                className="font-black text-sm hover:underline leading-tight truncate"
                style={{color:C.g800, maxWidth:'130px'}}>
                {u.username||'Seller'}
              </button>
              {isVerified(u) && <BadgeCheck size={14} style={{color:'#3B82F6', flexShrink:0}}/>}
              <span className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badge.animate ? 'shadow-md' : ''}`}
                style={{background:badge.bg, borderColor:badge.borderColor, fontSize:'9px', boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
                <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                <span style={{color:badge.textColor}}>{badge.label}</span>
              </span>
            </div>

            {/* Stats row — feedback left, trades + status right */}
            <div className="flex items-start justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'#DCFCE7', color:'#16A34A'}}>
                  <ThumbsUp size={9} strokeWidth={2.5}/>{fmt(pos)}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'#FEE2E2', color:'#DC2626'}}>
                  <ThumbsDown size={9} strokeWidth={2.5}/>{fmt(neg)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:C.g100, color:C.g600}}>
                  <Repeat2 size={9} strokeWidth={2.5}/>{fmt(trades)} trades
                </span>
                {seen.online ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                    style={{backgroundColor:'#F0FDF4', color:C.online}}>
                    <span className="relative flex w-1.5 h-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor:C.online}}/>
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{backgroundColor:C.online}}/>
                    </span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                    style={{backgroundColor:C.g100, color:C.g400}}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:C.g300}}/>
                    {seen.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-2.5">
          <span className="inline-flex flex-col px-2.5 py-1.5 rounded-lg"
            style={{backgroundColor:C.g100}}>
            <span className="text-xs font-normal leading-tight" style={{color:C.g400}}>Seller accepts:</span>
            <span className="text-xs font-black leading-tight tracking-wide" style={{color:C.g700}}>{pmLabel.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* ─ Divider ───────────────────────────────────────────── */}
      <div style={{height:1, backgroundColor:C.g100}}/>

      {/* ─ You Pay / You Receive ────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:C.g500}}>YOU PAY</p>
          <p className="text-2xl font-black leading-tight truncate" style={{color:C.g800}}>
            {sym}{fmt(examplePay)}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>{cur}</p>
        </div>
        <div className="border-l pl-3" style={{borderColor:C.g100}}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:C.g500}}>YOU RECEIVE</p>
          <p className="font-black leading-tight" style={{color:C.gold, fontSize: btcReceived < 0.001 ? '14px' : '20px'}}>
            ₿{fBtc(btcReceived)}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>Bitcoin</p>
        </div>
      </div>

      {/* ─ Rate + margin ─────────────────────────────────────── */}
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold truncate" style={{color:C.g600}}>
          Rate: {sym}{fmt(rateLocal)}/BTC
        </p>
        <span className="font-semibold px-2 py-0.5 rounded flex-shrink-0"
          style={{backgroundColor:marginBg, color:'#fff', fontSize:'10px', letterSpacing:'0.01em'}}>
          {marginLabel}
        </span>
      </div>

      {/* ─ Limit row ─────────────────────────────────────────── */}
      {(minLocal > 0 || maxLocal > 0) && (
        <div className="px-4 pb-2">
          <p className="text-xs font-bold" style={{color:C.g600}}>
            Available LIMIT {cur} {fmt(minLocal)} – {fmt(maxLocal)}
          </p>
        </div>
      )}

      {/* ─ Actions ───────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button onClick={onViewSeller}
          className="w-10 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition"
          style={{borderColor:C.g200}}>
          <Info size={15} style={{color:C.g400}}/>
        </button>
        <button onClick={onBuy}
          className="flex-1 h-11 rounded-xl text-white font-black text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition"
          style={{backgroundColor:C.forest}}>
          BUY BTC <ArrowRight size={15}/>
        </button>
      </div>
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({seller, listing, onClose, onTrade}) {
  const [tab, setTab] = useState('rules');
  const { rates: USD_RATES } = useRates();
  if (!seller) return null;
  const u         = getUser(seller);
  const badge     = deriveBadge(u);
  const seen      = getLastSeen(u);
  const trades    = getTrades(u);
  const rating    = parseFloat(u.average_rating||0);
  const fb        = parseInt(u.total_feedback_count ?? u.feedback_count ?? 0);
  const margin    = parseFloat(listing?.margin||0);
  const cur       = listing?.currency||'GHS';
  const sym       = listing?.currency_symbol || CUR_SYM[cur] || '₵';
  const usdRate   = USD_RATES[cur]||1;
  const rateLocal = getRateUSD(listing||{}, 68000) * usdRate;
  const ccCode    = (u?.country_code||u?.country||'gh').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{border:`1px solid ${C.g200}`, animation:'slideUp .25s ease'}}>

        {/* Header */}
        <div className="relative p-4 sm:p-5 text-white flex-shrink-0"
          style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
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
                <h3 className="font-black text-base leading-tight truncate">{u.username||'Seller'}</h3>
                {isVerified(u) && <BadgeCheck size={14} style={{color:'#93C5FD'}}/>}
                <CountryFlag countryCode={ccCode} className="w-4 h-3 rounded-sm"/>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full border ${badge.animate ? 'shadow-md' : ''}`}
                  style={{background:badge.bg, borderColor:badge.borderColor, fontSize:'9px', boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
                  <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                  <span style={{color:badge.textColor}}>{badge.label}</span>
                </span>
                <span className="text-xs text-white/60">{seen.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'rgba(134,239,172,0.2)', color:'#86EFAC'}}>
                  <ThumbsUp size={9} strokeWidth={2.5}/>{fmt(u.positive_feedback||0)}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'rgba(252,165,165,0.2)', color:'#FCA5A5'}}>
                  <ThumbsDown size={9} strokeWidth={2.5}/>{fmt(u.negative_feedback||0)}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.85)'}}>
                  <Repeat2 size={9} strokeWidth={2.5}/>{fmt(trades)} Trades
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-4 pt-4 border-t border-white/20 text-center">
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
        <div className="flex border-b flex-shrink-0" style={{borderColor:C.g200}}>
          {[['rules','📋 Trade Rules'],['offer','📊 Offer Details']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition"
              style={{
                color:tab===t ? C.green : C.g500,
                borderBottom:tab===t ? `2px solid ${C.green}` : '2px solid transparent',
                backgroundColor:tab===t ? `${C.green}08` : 'transparent'
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1" style={{WebkitOverflowScrolling:'touch'}}>
          {tab==='rules' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.mist, color:C.g700, border:`1px solid ${C.g200}`}}>
                {listing?.trade_instructions||listing?.description||
                  'Send payment within the time limit and click "I Have Paid". Share proof of payment if requested.'}
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{backgroundColor:'#FFFBEB', border:'1px solid #FDE68A'}}>
                <Timer size={12} style={{color:C.warn, flexShrink:0}}/>
                <p className="text-xs font-bold" style={{color:'#92400E'}}>
                  Time limit: {listing?.time_limit||30} minutes — auto-cancels if unpaid
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-xs text-red-600">Never pay outside the platform. Escrow protects every trade.</p>
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
                  <span className="font-black text-right ml-2" style={{color:C.g800}}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 pt-0 flex gap-2 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{borderColor:C.g200, color:C.g600}}>
            Close
          </button>
          <button onClick={()=>{onClose();onTrade();}}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-1.5"
            style={{backgroundColor:C.forest}}>
            <Bitcoin size={14}/> Buy BTC
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

  const path     = window.location.pathname;
  const activeId = path.includes('buy-bitcoin')||path.includes('sell-bitcoin') ? 'p2p'
                 : path.includes('gift')    ? 'giftcards'
                 : path.includes('wallet')  ? 'wallet'
                 : path.includes('profile') ? 'profile'
                 : 'home';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden"
      style={{borderColor:C.g200, paddingBottom:'env(safe-area-inset-bottom, 0px)'}}>
      <div className="flex items-center justify-around px-1 py-2">
        {items.map(({id, icon:Icon, label, path:to}) => {
          const active = id === activeId;
          return (
            <button key={id} onClick={()=>navigate(to)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color: active ? C.forest : C.g400,
                backgroundColor: active ? `${C.forest}12` : 'transparent',
                minWidth: '52px',
              }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8}/>
              <span className="text-xs font-bold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main BuyBitcoin Page ──────────────────────────────────────────────────────
export default function BuyBitcoin({user}) {
  const navigate = useNavigate();
  const { rates: USD_RATES, btcUsd: contextBtcUsd } = useRates();
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [btcPrice,     setBtcPrice]     = useState(68000);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selCountry,   setSelCountry]   = useState(COUNTRIES[1]);
  const [selPayment,   setSelPayment]   = useState('all');
  const [showFilters,  setShowFilters]  = useState(false);
  const [showCountry,  setShowCountry]  = useState(false);
  const [sortBy,       setSortBy]       = useState('rate_low');
  const [modal,        setModal]        = useState(null);
  const [liked,        setLiked]        = useState(new Set());
  const [buyAmt,       setBuyAmt]       = useState('');
  const [activeTrades, setActiveTrades] = useState([]);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const countryRef = useRef(null);

  useEffect(()=>{ if(contextBtcUsd>0) setBtcPrice(contextBtcUsd); },[contextBtcUsd]);
  useEffect(()=>{
    fetchRates(); loadListings();
  },[]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchTrades = async () => {
      try {
        const res = await axios.get(`${API_URL}/trades/active`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setActiveTrades(res.data.trades || []);
      } catch {}
    };
    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(()=>{
    const h = e => { if(countryRef.current&&!countryRef.current.contains(e.target)) setShowCountry(false); };
    document.addEventListener('mousedown',h);
    return () => document.removeEventListener('mousedown',h);
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

  const loadListings = async () => {
    try {
      const r = await axios.get(`${API_URL}/listings`);
      const all = (r.data.listings||[]).map(l=>({...l, users:Array.isArray(l.users)?l.users[0]:l.users}));
      setListings(all.filter(l=>l.listing_type==='SELL'||l.listing_type==='SELL_BITCOIN'));
    } catch { toast.error('Failed to load marketplace'); }
    finally { setLoading(false); }
  };

  const getFiltered = () => {
    let list = [...listings];
    if (selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if (selPayment!=='all')      list=list.filter(l=>String(l.payment_method||'').toLowerCase().includes(selPayment));
    if (buyAmt && parseFloat(buyAmt)>0) {
      const a = parseFloat(buyAmt);
      list=list.filter(l=>a>=(l.min_limit_usd||0)&&a<=(l.max_limit_usd||999999));
    }
    const rate = l => getRateUSD(l,btcPrice);
    if (sortBy==='rate_low')    list.sort((a,b)=>rate(a)-rate(b));
    else if (sortBy==='rating') list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    else if (sortBy==='trades') list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));

    // One offer per seller per payment method — keep the best-sorted one
    const seen = new Set();
    list = list.filter(l => {
      const key = `${l.seller_id}:${String(l.payment_method||'').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return list;
  };

  const handleBuy = (id) => {
    if (!user) { navigate('/login?message=Please log in to start trading'); return; }
    navigate(`/listing/${id}`);
  };

  const filtered  = getFiltered();
  const cur       = selCountry.currency || 'GHS';
  const sym       = CUR_SYM[cur] || '₵';
  const usdRate   = USD_RATES[cur] || 1;
  const btcLocal  = btcPrice * usdRate;
  const selPmInfo = PAYMENT_OPTIONS.find(p=>p.value===selPayment);
  const onlineCnt   = listings.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300).length;
  const sellerCount = new Set(listings.map(l=>l.seller_id)).size;
  const hasFilters = selPayment!=='all' || buyAmt || selCountry.code!=='ALL';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.g100}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{borderColor:C.mint, borderTopColor:'transparent'}}/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 overflow-x-hidden"
      style={{backgroundColor:C.g100, fontFamily:"'DM Sans',sans-serif"}}>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        * { -webkit-tap-highlight-color: transparent; }
        html, body { overscroll-behavior: none; }
      `}</style>

      {/* ══ 1. RATE BAR ════════════════════════════════════════ */}
      <div style={{backgroundColor:C.forest}} className="w-full flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">

            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-xl md:text-3xl font-black text-white leading-tight mb-1.5">
                Buy Bitcoin with{' '}
                <span style={{color:C.gold}}>
                  {selPayment==='all' ? 'Local Currency' : (selPmInfo?.label || 'Mobile Money')}
                </span>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>
                  1 USD = <span className="font-black" style={{color:'rgba(255,255,255,0.75)'}}>{sym}{fmt(usdRate,2)} {cur}</span>
                </span>
                <span style={{color:'rgba(255,255,255,0.2)', fontSize:10}}>|</span>
                <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>
                  1 BTC = <span className="font-black" style={{color:'rgba(255,255,255,0.75)'}}>{sym}{fmt(btcLocal)} {cur}</span>
                </span>
              </div>
            </div>

            <button onClick={()=>{fetchRates();loadListings();}}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/20 flex-shrink-0"
              style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <RefreshCw size={15} className={`text-white ${loadingRates?'animate-spin':''}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* ══ 2. TAB NAVIGATION ══════════════════════════════════ */}
      <div className="bg-white border-b sticky top-0 z-30 flex-shrink-0" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3 overflow-x-auto" style={{WebkitOverflowScrolling:'touch'}}>
          <div className="flex items-center min-w-max">
            {[
              {label:'Buy BTC',    path:'/buy-bitcoin',  active:true},
              {label:'Sell BTC',   path:'/sell-bitcoin', active:false},
              {label:'Gift Cards', path:'/gift-cards',   active:false},
            ].map(tab=>(
              <Link key={tab.path} to={tab.path}
                className="px-3 sm:px-4 py-3 sm:py-3.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: tab.active ? C.forest : 'transparent',
                  color:       tab.active ? C.forest : C.g500,
                }}>
                {tab.label}
              </Link>
            ))}

            <div className="ml-auto flex items-center gap-2 py-2 flex-shrink-0 pl-3">
              <span className="text-xs font-semibold whitespace-nowrap" style={{color:C.g400}}>
                {sellerCount} seller{sellerCount!==1?'s':''}
              </span>
              <span style={{color:C.g300, fontSize:10}}>|</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{backgroundColor: onlineCnt>0 ? C.online : C.g300,
                          boxShadow: onlineCnt>0 ? `0 0 0 3px ${C.online}30` : 'none'}}/>
                <span className="text-xs font-semibold"
                  style={{color: onlineCnt>0 ? C.online : C.g400}}>
                  {onlineCnt>0 ? `${onlineCnt} online` : 'offline — offers still available'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 3. FILTER BAR ══════════════════════════════════════ */}
      <div className="bg-white border-b flex-shrink-0" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3 py-2.5">

          {/* Amount input */}
          <div className="flex items-center border-2 rounded-xl overflow-hidden mb-2"
            style={{borderColor:buyAmt ? C.forest : C.g200, height:'52px'}}>
            <input
              type="number"
              value={buyAmt}
              onChange={e=>setBuyAmt(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 pl-4 pr-2 text-base font-bold focus:outline-none bg-transparent w-full min-w-0"
              style={{color:C.g800, fontSize:'16px'}}/>
            <span className="pr-4 text-xs font-black flex-shrink-0" style={{color:C.g400}}>{cur}</span>
          </div>

          {/* Row: Currency selector + Sort button */}
          <div className="flex items-center gap-1.5 mb-2">

            <div className="relative flex-1 min-w-0" ref={countryRef}>
              <button
                onClick={()=>setShowCountry(!showCountry)}
                className="w-full flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl border-2 font-bold transition"
                style={{
                  borderColor:      selCountry.code!=='ALL' ? C.forest : C.g200,
                  color:            selCountry.code!=='ALL' ? C.forest : C.g600,
                  backgroundColor:  selCountry.code!=='ALL' ? `${C.forest}08` : 'transparent',
                }}>
                <span className="text-base leading-none flex-shrink-0">{selCountry.flag}</span>
                <span className="text-xs font-black truncate">{selCountry.currency}</span>
                <ChevronDown size={12} className={`transition-transform flex-shrink-0 ${showCountry?'rotate-180':''}`}
                  style={{color:selCountry.code!=='ALL' ? C.forest : C.g400}}/>
              </button>
              {showCountry && (
                <div className="absolute top-full left-0 mt-1.5 w-48 sm:w-52 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                  style={{borderColor:C.g100}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code} onClick={()=>{setSelCountry(c);setShowCountry(false);}}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 border-b last:border-0 transition"
                      style={{borderColor:C.g50}}>
                      <span className="text-base">{c.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-xs" style={{color:C.g800}}>{c.name}</p>
                        <p className="text-xs" style={{color:C.g400}}>{c.currency}</p>
                      </div>
                      {selCountry.code===c.code && <CheckCircle size={12} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={()=>setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl border-2 text-xs font-black transition flex-shrink-0"
              style={{
                borderColor:     showFilters ? C.forest : C.g200,
                color:           showFilters ? C.forest : C.g600,
                backgroundColor: showFilters ? `${C.forest}08` : 'transparent',
              }}>
              <Filter size={12}/>
              Sort
            </button>
          </div>

          {/* Payment method pills — always visible */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none', WebkitOverflowScrolling:'touch'}}>
            {PAYMENT_OPTIONS.map(p => {
              const active = selPayment === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setSelPayment(p.value)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full border-2 text-xs font-black whitespace-nowrap transition flex-shrink-0"
                  style={{
                    borderColor:     active ? C.forest : C.g200,
                    color:           active ? '#fff'    : C.g600,
                    backgroundColor: active ? C.forest  : 'transparent',
                  }}>
                  <span>{p.icon}</span>
                  <span>{p.label.replace(' Mobile Money','').replace(' Cash','').replace(' Transfer','')}</span>
                  {active && selPayment !== 'all' && (
                    <span onClick={e=>{e.stopPropagation();setSelPayment('all');}}
                      className="ml-0.5 hover:opacity-70">✕</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort panel (collapsed by default) */}
          {showFilters && (
            <div className="mt-2.5 pt-2.5 border-t grid grid-cols-1 sm:grid-cols-2 gap-2"
              style={{borderColor:C.g100}}>
              <div>
                <p className="text-xs font-bold mb-1" style={{color:C.g500}}>Sort By</p>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm border-2 rounded-xl focus:outline-none"
                  style={{borderColor:C.g200, color:C.g800, fontSize:'16px'}}>
                  <option value="rate_low">Best Rate</option>
                  <option value="rating">Top Rated</option>
                  <option value="trades">Most Trades</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={()=>navigate('/create-offer')}
                  className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition hover:opacity-90"
                  style={{backgroundColor:C.gold, color:C.forest}}>
                  <PlusCircle size={13}/> Sell BTC
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline active trade cards ── */}
      {activeTrades.length > 0 && (
        <div className="px-3 mb-2 max-w-7xl mx-auto w-full">
          {activeTrades.slice(0, showAllTrades ? activeTrades.length : 3).map(trade => (
            <ActiveTradeCard key={trade.id} trade={trade} />
          ))}
          {activeTrades.length > 3 && (
            <button onClick={() => setShowAllTrades(p => !p)}
              className="w-full text-xs font-semibold py-1.5 rounded-xl border mb-1"
              style={{color:'#92400E', borderColor:'#F59E0B', backgroundColor:'#FFFBEB'}}>
              {showAllTrades ? 'Show less ▲' : `Show all (${activeTrades.length}) ▼`}
            </button>
          )}
        </div>
      )}

      {/* ══ 4. OFFER GRID ══════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3 space-y-3" style={{WebkitOverflowScrolling:'touch'}}>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold" style={{color:C.g500}}>
            <span className="font-black text-sm" style={{color:C.g800}}>{filtered.length}</span>{' '}
            offers{selCountry.code!=='ALL' ? ` · ${selCountry.flag} ${selCountry.name}` : ''}
          </p>
          <button onClick={()=>navigate('/create-offer')}
            className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{backgroundColor:`${C.forest}12`, color:C.forest}}>
            <PlusCircle size={12}/> Sell BTC
          </button>
        </div>

        {filtered.length===0 ? (
          <div className="bg-white rounded-2xl border p-6 sm:p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-black text-base mb-1" style={{color:C.g800}}>No offers found</p>
            <p className="text-sm" style={{color:C.g400}}>Adjust your filters or create the first offer</p>
            <button onClick={()=>navigate('/create-offer')}
              className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90 transition"
              style={{backgroundColor:C.forest}}>
              Create Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
            {filtered.map(l=>(
              <div key={l.id} className="w-full">
                <OfferCard
                  listing={l}
                  btcPriceUSD={btcPrice}
                  onViewSeller={()=>{
                    setModal({seller:l.users||{}, listing:l});
                    axios.post(`${API_URL}/listings/${l.id}/view`).catch(()=>{});
                  }}
                  onBuy={()=>handleBuy(l.id)}
                  liked={liked.has(l.id)}
                  onToggleLike={()=>setLiked(prev=>{
                    const n=new Set(prev);
                    n.has(l.id) ? n.delete(l.id) : n.add(l.id);
                    return n;
                  })}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:'#FFFBEB', borderColor:'#FDE68A'}}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{color:C.warn}}/>
          <p className="text-xs leading-relaxed" style={{color:'#92400E'}}>
            <strong>Trade Safely:</strong> Never send payment outside an active trade.
            All trades are escrow-protected.
          </p>
        </div>
      </div>

      {/* ══ 5. BOTTOM NAV ══════════════════════════════════════ */}
      <BottomNav/>

      {modal && (
        <ProfileModal
          seller={modal.seller}
          listing={modal.listing}
          onClose={()=>setModal(null)}
          onTrade={()=>handleBuy(modal.listing?.id)}
        />
      )}
    </div>
  );
}
