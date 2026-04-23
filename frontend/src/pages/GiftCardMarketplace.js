import React, { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronDown, CheckCircle, RefreshCw, AlertTriangle,
  BadgeCheck, Timer, Heart, X, Info, Shield,
  ArrowRight, PlusCircle, DollarSign, Search,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import ActiveTradeBanner from '../components/ActiveTradeBanner';

const API_URL = 'http://localhost:5000/api';

// ── Clean neutral palette — no excessive colors ───────────────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', gold:'#F4A422',
  mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B', paid:'#3B82F6', accent:'#0D9488',
};

function isoToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  );
}

const TRUST_MAP = {
  LEGEND:     { label:'LEGEND',     icon:'♛', iconColor:'#F4A422', textColor:'#1B4332', borderColor:'#A7F3D0', bg:'#ECFDF5' },
  AMBASSADOR: { label:'AMBASSADOR', icon:'◈', iconColor:null,      textColor:'#FFFFFF',  borderColor:'#0D9488',    bg:'linear-gradient(135deg,#0D9488,#2D6A4F)' },
  EXPERT:     { label:'EXPERT',     icon:'▲', iconColor:null,      textColor:'#FFFFFF',  borderColor:'#0D9488',    bg:'linear-gradient(135deg,#0D9488,#134E4A)' },
  PRO:        { label:'PRO',        icon:'●', iconColor:null,      textColor:'#1B4332',  borderColor:'#2D6A4F',    bg:'linear-gradient(135deg,#D1FAE5,#A7F3D0)' },
  ACTIVE:     { label:'Active',     icon:'○', iconColor:null,      textColor:'#1B4332',  borderColor:'#6EE7B7',    bg:'#F0FDF4' },
  BEGINNER:   { label:'New',        icon:'·', iconColor:null,      textColor:'#64748B',  borderColor:'#CBD5E1',    bg:'#F8FAFC' },
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

// USD_RATES is now provided by RatesContext — do NOT define a static object here
const CUR_SYM = {
  GHS:'₵', NGN:'₦', KES:'KSh', ZAR:'R', UGX:'USh',
  TZS:'TSh', USD:'$', GBP:'£', EUR:'€', XAF:'CFA', XOF:'CFA',
  RWF:'RF', ETB:'Br', AUD:'A$', CAD:'C$',
};

const COUNTRIES = [
  { code:'ALL', name:'All Countries',   flag:'🌍', currency:'USD', symbol:'$' },
  { code:'GH',  name:'Ghana',           flag:'🇬🇭', currency:'GHS', symbol:'₵' },
  { code:'NG',  name:'Nigeria',         flag:'🇳🇬', currency:'NGN', symbol:'₦' },
  { code:'KE',  name:'Kenya',           flag:'🇰🇪', currency:'KES', symbol:'KSh' },
  { code:'ZA',  name:'South Africa',    flag:'🇿🇦', currency:'ZAR', symbol:'R' },
  { code:'UG',  name:'Uganda',          flag:'🇺🇬', currency:'UGX', symbol:'USh' },
  { code:'TZ',  name:'Tanzania',        flag:'🇹🇿', currency:'TZS', symbol:'TSh' },
  { code:'US',  name:'United States',   flag:'🇺🇸', currency:'USD', symbol:'$' },
  { code:'GB',  name:'United Kingdom',  flag:'🇬🇧', currency:'GBP', symbol:'£' },
  { code:'EU',  name:'Europe',          flag:'🇪🇺', currency:'EUR', symbol:'€' },
  { code:'CM',  name:'Cameroon',        flag:'🇨🇲', currency:'XAF', symbol:'CFA' },
  { code:'SN',  name:'Senegal',         flag:'🇸🇳', currency:'XOF', symbol:'CFA' },
];

// Face value presets — same as CreateOffer
const GC_FACE_VALUES = [10, 20, 25, 50, 100, 200, 500, 1000];

// Common payment methods for the filter
const PAYMENT_FILTERS = [
  'All Payments',
  'MTN Mobile Money',
  'M-Pesa',
  'Vodafone Cash',
  'AirtelTigo Money',
  'Bank Transfer',
  'Wire Transfer',
  'PayPal',
  'Cash App',
  'Apple Pay',
  'Alipay',
  'OPay',
  'PalmPay',
  'Chipper Cash',
  'Orange Money',
  'Wave',
  'Zelle',
  'Revolut',
];

// Known gift card brands — clean lookup, no emoji on card
const GC_BRAND_LIST = [
  'All Brands','Amazon','Apple / iTunes','Google Play','Steam','eBay',
  'Walmart','Target','Visa Gift Card','Mastercard GC','Amex Gift Card',
  'Netflix','Spotify','Xbox','PlayStation','Nintendo','Razer Gold',
  'PLS Gift Card','Vanilla Card','Roblox','Fortnite V-Bucks','Other',
];

const fmt  = (n, d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fBtc = (n)      => parseFloat(n||0).toFixed(6);

const getUser     = (u) => Array.isArray(u) ? u[0] : (u || {});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades ?? u?.trade_count ?? 0);
const getLastSeen = (u) => {
  const d = u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if (!d) return { label:'—', online:false };
  const s = (Date.now()-new Date(d))/1000;
  if (s<300)   return { label:'● Active',                      online:true  };
  if (s<3600)  return { label:`Last seen ${~~(s/60)}m ago`,    online:false };
  if (s<86400) return { label:`Last seen ${~~(s/3600)}h ago`,  online:false };
  return         { label:`Last seen ${~~(s/86400)}d ago`,      online:false };
};

const getRateUSD = (l, btcPrice) => {
  if (l.pricing_type==='fixed') { const s=parseFloat(l.bitcoin_price||0); if(s>100) return s; }
  return btcPrice * (1 + parseFloat(l.margin||0) / 100);
};

// Get clean brand name from listing
const getBrandName = (l) => {
  return l.gift_card_brand || l.giftCardBrand || l.card_brand || 'Gift Card';
};

// Get face value from listing
const getFaceValue = (l) => {
  const v = l.face_value || l.card_value || l.amount_usd;
  return v ? parseFloat(v) : null;
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size=34, radius='rounded-lg' }) {
  const [err, setErr] = useState(false);
  const u = getUser(user);
  if (u?.avatar_url && !err) return (
    <img src={u.avatar_url} alt={u.username||'user'} onError={()=>setErr(true)}
      className={`object-cover flex-shrink-0 ${radius}`} style={{width:size,height:size}}/>
  );
  return (
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.green,fontSize:size*0.38}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Seller detail modal ───────────────────────────────────────────────────────
function SellerModal({ seller, listing, onClose, onTrade }) {
  const [tab, setTab] = useState('rules');
  const { rates: USD_RATES } = useRates();
  if (!seller) return null;
  const u      = getUser(seller);
  const badge  = deriveBadge(u);
  const seen   = getLastSeen(u);
  const trades = getTrades(u);
  const rating = parseFloat(u.average_rating||0);
  const fb     = parseInt(u.total_feedback_count??u.feedback_count??0);
  const verif  = isVerified(u);
  const brand  = getBrandName(listing||{});
  const fv     = getFaceValue(listing||{});
  const cur    = listing?.currency||'USD';
  const sym    = listing?.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate= USD_RATES[cur]||1;
  const rate   = getRateUSD(listing||{}, 68000) * usdRate;
  const margin = parseFloat(listing?.margin||0);
  const pay    = listing?.payment_method||'—';
  const countryCode = (u?.country_code||u?.country||'gh').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl border"
        style={{borderColor:C.g200,animation:'slideUp .25s ease'}}>

        {/* ── Header ── */}
        <div className="relative p-5 text-white"
          style={{background:`linear-gradient(135deg,${C.forest},${C.green})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white"/>
          </button>

          {/* Brand tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-3"
            style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
            <CreditCard size={11} className="text-white/70"/>
            <span className="text-xs font-black text-white">{brand}</span>
            {fv && <span className="text-xs font-black text-white/70">${fv}</span>}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar user={u} size={54} radius="rounded-xl"/>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{backgroundColor:seen.online?C.online:C.g400}}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base leading-tight">{u.username||'Seller'}</h3>
                {verif && <BadgeCheck size={14} style={{color:'#99F6E4'}}/>}
                <CountryFlag countryCode={countryCode} className="w-4 h-3 rounded-sm"/>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full border tracking-wide"
                  style={{background:badge.bg,borderColor:badge.borderColor}}>
                  <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                  <span style={{color:badge.textColor}}> {badge.label}</span>
                  <BadgeCheck size={8} style={{color:badge.textColor,opacity:0.9}}/>
                </span>
                <span className="text-[10px] text-white/60 font-semibold">{seen.label}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black">
                <span style={{color:'#86EFAC'}}>👍 {fmt(u.positive_feedback||0)}</span>
                <span className="text-white/30">·</span>
                <span style={{color:'#FCA5A5'}}>👎 {fmt(u.negative_feedback||0)}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/80">{fmt(trades)} Trades</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
            {[
              {label:'Trades',   value:fmt(trades)},
              {label:'Rating',   value:`${rating.toFixed(1)}★`},
              {label:'Reviews',  value:fmt(fb)},
              {label:'Complete', value:`${u.completion_rate||98}%`},
            ].map(s=>(
              <div key={s.label}>
                <p className="text-white font-black text-sm">{s.value}</p>
                <p className="text-white/50 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b" style={{borderColor:C.g200}}>
          {[['rules','📋 Trade Rules'],['offer','📊 Offer Details']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition"
              style={{color:tab===t?C.green:C.g500,borderBottom:tab===t?`2px solid ${C.green}`:'2px solid transparent',backgroundColor:tab===t?`${C.green}05`:'transparent'}}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {tab==='rules' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.g50,color:C.g700,border:`1px solid ${C.g200}`}}>
                {listing?.trade_instructions||listing?.description||
                  'Send the gift card code and PIN in the trade chat. Wait for buyer confirmation before release.'}
              </div>
              {listing?.listing_terms && (
                <div className="p-3 rounded-xl text-xs" style={{backgroundColor:'#F0F9FF',color:C.g600}}>
                  <p className="font-bold mb-1" style={{color:C.paid}}>Terms</p>
                  {listing.listing_terms}
                </div>
              )}
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{backgroundColor:'#FFFBEB',border:'1px solid #FDE68A'}}>
                <Timer size={12} style={{color:C.warn,flexShrink:0}}/>
                <p className="text-[10px] font-bold" style={{color:'#92400E'}}>
                  Time limit: {listing?.time_limit||30} min — auto-cancels if not completed
                </p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-[9px] text-red-600">Only share card codes inside the active trade chat. Escrow protects both parties.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {[
                {label:'Card Brand',  value:brand},
                {label:'Face Value',  value:fv?`$${fv} USD`:'Varies'},
                {label:'Payment',     value:pay},
                {label:'Country',     value:listing?.country_name||u.country||'—'},
                {label:'Rate',        value:`${sym}${fmt(rate)} ${cur}/BTC`},
                {label:'Margin',      value:margin===0?'Market rate':`+${margin}%`},
                {label:'Range',       value:listing?.min_limit_local&&listing?.max_limit_local
                  ?`${sym}${fmt(listing.min_limit_local)} – ${sym}${fmt(listing.max_limit_local)}`
                  :fv?`$${fv}`:'—'},
                {label:'Time limit',  value:`${listing?.time_limit||30} minutes`},
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
            style={{borderColor:C.g200,color:C.g600}}>Close</button>
          <button onClick={()=>{ onClose(); onTrade(); }}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2"
            style={{backgroundColor:C.green}}>
            Trade Now <ArrowRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gift Card Offer Card ──────────────────────────────────────────────────────
// Card name bold at top, no emoji, clean bold text, aligned with created offer
function GCCard({ listing, btcPriceUSD, onViewSeller, onTrade, liked, onToggleLike }) {
  const { rates: USD_RATES } = useRates();
  const u         = getUser(listing.users);
  const badge     = deriveBadge(u);
  const seen      = getLastSeen(u);
  const verif     = isVerified(u);
  const trades    = getTrades(u);
  const brand     = getBrandName(listing);
  const fv        = getFaceValue(listing);
  const margin    = parseFloat(listing.margin||0);
  const cur       = listing.currency||'USD';
  const sym       = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate   = USD_RATES[cur]||1;
  const rateUSD   = getRateUSD(listing, btcPriceUSD);
  const rateLocal = rateUSD * usdRate;
  const pay       = listing.payment_method||'—';

  const minLocal  = listing.min_limit_local || (fv ? fv * usdRate : 0);
  const maxLocal  = listing.max_limit_local || (fv ? fv * usdRate : 0);

  // BTC the trade opener receives for the face value
  // Fix: Subtract 0.5% platform fee to show correct "You Receive" amount
  const btcGross = fv ? (fv / rateUSD) : (minLocal / rateLocal);
  const feeBtc   = btcGross * 0.005;
  const btcOut   = btcGross - feeBtc;

  const marginColor = margin > 10 ? C.danger : margin > 0 ? C.warn : C.success;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
      style={{borderColor:C.g200}}>

      {/* ── TOP: Brand name — bold, clean, no emoji ─────────────────── */}
      <div className="px-3 pt-2.5 pb-2 border-b flex items-center justify-between"
        style={{borderColor:C.g100, backgroundColor:C.g50}}>
        <span className="text-sm font-black tracking-tight" style={{color:C.g800}}>
          {brand}
        </span>
        {fv && (
          <span className="text-xs font-black px-2 py-0.5 rounded-md"
            style={{backgroundColor:C.g800,color:C.white}}>
            ${fv}
          </span>
        )}
      </div>

      {/* ── ROW 1: User info ─────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center gap-2">
          <button onClick={onViewSeller} className="relative flex-shrink-0">
            <Avatar user={u} size={30} radius="rounded-lg"/>
            {seen.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                style={{backgroundColor:C.online}}/>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={onViewSeller}
                className="font-black text-xs hover:underline" style={{color:C.g800}}>
                {u.username||'Seller'}
              </button>
              <CountryFlag
                countryCode={(u?.country_code || u?.country || 'gh').toLowerCase()}
                className="w-4 h-3"
              />
              <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-sm border tracking-wide"
                style={{background:badge.bg,borderColor:badge.borderColor}}>
                <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                <span style={{color:badge.textColor}}> {badge.label}</span>
                <BadgeCheck size={8} style={{color:badge.textColor,opacity:0.9}}/>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] mt-0.5 font-black flex-wrap">
              <span style={{color:C.success}}>👍 {u.positive_feedback||0}</span>
              <span style={{color:C.danger}}>👎 {u.negative_feedback||0}</span>
              <span style={{color:C.g300}}>·</span>
              <span style={{color:C.g700}}>{fmt(trades)} Trades</span>
              <span style={{color:C.g300}}>·</span>
              <span style={{color:seen.online?C.online:C.g400}}>{seen.label}</span>
            </div>
          </div>
          <button onClick={onToggleLike}
            className="w-6 h-6 rounded-md flex items-center justify-center border flex-shrink-0"
            style={{borderColor:C.g200}}>
            <Heart size={10} style={{color:liked?C.danger:C.g300,fill:liked?C.danger:'none'}}/>
          </button>
        </div>
      </div>

      {/* ── ROW 2: You Give / You Receive ───────────────────────────── */}
      <div className="px-3 py-2 border-b grid grid-cols-2 gap-2" style={{borderColor:C.g100}}>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{color:C.g500}}>You Give</p>
          <p className="text-sm font-black leading-tight" style={{color:C.g800}}>
            {fv ? `$${fv}` : sym + fmt(minLocal, 0)}
          </p>
          <p className="text-[9px] font-semibold" style={{color:C.g400}}>
            {fv ? 'USD card' : cur}
          </p>
        </div>
        <div className="border-l pl-2" style={{borderColor:C.g100}}>
          <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{color:C.g500}}>You Receive</p>
          <p className="text-sm font-black leading-tight" style={{color:C.g800}}>₿ {fBtc(btcOut)}</p>
          {margin !== 0 && fv && (
            <p className="text-[9px] font-semibold" style={{color:C.g400}}>
              ≈ ${fmt(fv / (1 + margin / 100), 2)} value
            </p>
          )}
        </div>
      </div>

      {/* ── ROW 3: Payment method ────────────────────────────────────── */}
      <div className="px-3 py-2 border-b" style={{borderColor:C.g100}}>
        <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{color:C.g500}}>
          Payment Method
        </p>
        <p className="text-xs font-black" style={{color:C.g700}}>{pay}</p>
      </div>

      {/* ── ROW 4: Rate + margin + range ────────────────────────────── */}
      <div className="px-3 py-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-black" style={{color:C.g800}}>
            {sym}{fmt(rateLocal)} {cur}/BTC
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
            style={{color:'#ffffff',backgroundColor:C.danger}}>
            +{margin}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold" style={{color:C.g600}}>
            {minLocal && maxLocal && minLocal !== maxLocal
              ? `${sym}${fmt(minLocal)} – ${sym}${fmt(maxLocal)} ${cur}`
              : fv ? `$${fv} USD` : 'Any amount'}
          </span>
          <span className="text-[10px] font-bold" style={{color:C.g500}}>
            ⏱ {listing.time_limit||30}min
          </span>
        </div>
      </div>

      {/* ── ROW 5: Actions ──────────────────────────────────────────── */}
      <div className="px-3 py-2 flex items-center gap-2 mt-auto">
        <button onClick={onViewSeller}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
          style={{borderColor:C.g200}}>
          <Info size={12} style={{color:C.g400}}/>
        </button>
        <button onClick={onTrade}
          className="flex-1 py-1.5 rounded-md text-white font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          style={{backgroundColor:C.green}}>
          Sell My Card <ArrowRight size={10}/>
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GiftCards({ user }) {
  const navigate = useNavigate();
  const { btcUsd: contextBtcUsd } = useRates();
  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [btcPrice,      setBtcPrice]      = useState(68000);
  const [loadingRates,  setLoadingRates]  = useState(false);
  const [selCountry,    setSelCountry]    = useState(COUNTRIES[0]);
  const [selBrand,      setSelBrand]      = useState('All Brands');
  const [selPayment,    setSelPayment]    = useState('All Payments');
  const [selFaceValue,  setSelFaceValue]  = useState(0);   // 0 = all
  const [sortBy,        setSortBy]        = useState('rate_low');
  const [modal,         setModal]         = useState(null);
  const [liked,         setLiked]         = useState(new Set());
  const [search,        setSearch]        = useState('');
  const [showCountry,   setShowCountry]   = useState(false);
  const [showPayment,   setShowPayment]   = useState(false);
  const [detectedFlag,  setDetectedFlag]  = useState('🌍'); // flag from IP, shown even on "All Countries"
  const countryRef  = useRef(null);
  const paymentRef  = useRef(null);

  useEffect(() => { if (contextBtcUsd > 0) setBtcPrice(contextBtcUsd); }, [contextBtcUsd]);
  useEffect(() => { fetchRates(); loadListings(); detectCountry(); }, []);

  useEffect(() => {
    const h = e => {
      if (countryRef.current  && !countryRef.current.contains(e.target))  setShowCountry(false);
      if (paymentRef.current  && !paymentRef.current.contains(e.target))  setShowPayment(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const detectCountry = async () => {
    try {
      let code = null;
      try {
        const r = await axios.get('https://ipapi.co/json/');
        code = r.data?.country_code;
      } catch {
        const r2 = await axios.get('https://ip-api.com/json');
        code = r2.data?.countryCode;
      }
      if (code) {
        setDetectedFlag(isoToFlag(code));
      }
    } catch {}
  };

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const r = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try { const r2 = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json'); setBtcPrice(r2.data.bpi.USD.rate_float); }
      catch {}
    } finally { setLoadingRates(false); }
  };

  const loadListings = async () => {
    try {
      const r = await axios.get(`${API_URL}/listings`);
      const all = (r.data.listings||[]).map(l => ({...l, users:Array.isArray(l.users)?l.users[0]:l.users}));
      // Gift Card page: ONLY BUY_GIFT_CARD / SELL_GIFT_CARD — strict, no fallback.
      const gcs = all.filter(l =>
        l.listing_type === 'BUY_GIFT_CARD' ||
        l.listing_type === 'SELL_GIFT_CARD'
      );
      setListings(gcs);
    } catch { toast.error('Failed to load gift card marketplace'); }
    finally { setLoading(false); }
  };

  const getFiltered = () => {
    let list = [...listings];

    // Country filter
    if (selCountry.code !== 'ALL')
      list = list.filter(l => l.country === selCountry.code);

    // Brand filter
    if (selBrand !== 'All Brands')
      list = list.filter(l => {
        const b = (getBrandName(l)||'').toLowerCase();
        return b.includes(selBrand.toLowerCase()) || selBrand.toLowerCase().includes(b.substring(0,5));
      });

    // Payment filter
    if (selPayment !== 'All Payments')
      list = list.filter(l =>
        (l.payment_method||'').toLowerCase().includes(selPayment.toLowerCase())
      );

    // Face value filter
    if (selFaceValue > 0)
      list = list.filter(l => {
        const fv = getFaceValue(l);
        return fv === selFaceValue;
      });

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        getBrandName(l).toLowerCase().includes(q) ||
        (getUser(l.users)?.username||'').toLowerCase().includes(q) ||
        (l.payment_method||'').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy==='rate_low')  list.sort((a,b) => parseFloat(a.margin||0)-parseFloat(b.margin||0));
    if (sortBy==='rate_high') list.sort((a,b) => parseFloat(b.margin||0)-parseFloat(a.margin||0));
    if (sortBy==='rating')    list.sort((a,b) => (b.users?.average_rating||0)-(a.users?.average_rating||0));
    if (sortBy==='trades')    list.sort((a,b) => getTrades(b.users)-getTrades(a.users));
    return list;
  };

  const handleTrade = (id) => {
    if (!user) { toast.info('Please login to start trading'); navigate('/login'); return; }
    navigate(`/listing/${id}`);
  };

  const filtered   = getFiltered();
  const onlineCnt  = listings.filter(l => (Date.now()-new Date(l.users?.last_login||0))/1000<300).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:C.green,borderTopColor:'transparent'}}/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3 space-y-3">

        {/* Active Trade Alerts */}
        <ActiveTradeBanner user={user} currentPage="gift-cards" />

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{background:`linear-gradient(135deg,${C.forest},${C.green})`}}>
          <div className="px-5 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight"
                  style={{fontFamily:"'Syne',sans-serif"}}>
                  Gift Card Marketplace
                </h1>
                <p className="text-white/60 text-xs mt-1">
                  Sell your gift cards · Get paid in Bitcoin · Escrow protected
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[
                    {label:'Offers',  value:fmt(listings.length)},
                    {label:'Online',  value:fmt(onlineCnt)},
                    {label:'1 BTC',   value:`$${fmt(btcPrice,0)}`},
                  ].map(s=>(
                    <div key={s.label} className="text-center px-3 py-1.5 rounded-xl"
                      style={{backgroundColor:'rgba(255,255,255,0.12)'}}>
                      <p className="font-black text-sm text-white">{s.value}</p>
                      <p className="text-white/50 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{ fetchRates(); loadListings(); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  <RefreshCw size={13} className={`text-white ${loadingRates?'animate-spin':''}`}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BRAND FILTER PILLS ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border overflow-x-auto" style={{borderColor:C.g200}}>
          <div className="flex gap-1.5 px-3 py-2.5 min-w-max">
            {GC_BRAND_LIST.map(b => (
              <button key={b} onClick={() => setSelBrand(b)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition whitespace-nowrap"
                style={{
                  borderColor: selBrand===b ? C.forest : C.g200,
                  backgroundColor: selBrand===b ? C.forest : C.white,
                  color: selBrand===b ? C.white : C.g600,
                }}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ── FACE VALUE FILTER ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border p-3" style={{borderColor:C.g200}}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{color:C.g400}}>
            Filter by Face Value (USD)
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelFaceValue(0)}
              className="px-3 py-1.5 rounded-lg text-xs font-black border-2 transition"
              style={{
                borderColor: selFaceValue===0 ? C.green : C.g200,
                backgroundColor: selFaceValue===0 ? C.green : C.white,
                color: selFaceValue===0 ? C.white : C.g700,
              }}>
              All Amounts
            </button>
            {GC_FACE_VALUES.map(v => (
              <button key={v} onClick={() => setSelFaceValue(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-black border-2 transition"
                style={{
                  borderColor: selFaceValue===v ? C.green : C.g200,
                  backgroundColor: selFaceValue===v ? C.green : C.white,
                  color: selFaceValue===v ? C.white : C.g700,
                }}>
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border p-3" style={{borderColor:C.g200}}>
          <div className="flex flex-wrap gap-2 items-end">

            {/* Search */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Search</label>
              <div className="relative mt-0.5">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Brand, seller name…"
                  className="w-full pl-7 pr-2 py-2 text-xs border-2 rounded-lg focus:outline-none"
                  style={{borderColor:search?C.green:C.g200}}/>
              </div>
            </div>

            {/* Payment method dropdown */}
            <div ref={paymentRef} className="relative">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Payment</label>
              <button onClick={() => setShowPayment(!showPayment)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg flex items-center gap-1.5 min-w-[140px]"
                style={{borderColor:selPayment!=='All Payments'?C.green:C.g200}}>
                <DollarSign size={11} style={{color:C.g400}}/>
                <span className="font-semibold flex-1 text-left truncate"
                  style={{color:selPayment!=='All Payments'?C.g800:C.g500}}>
                  {selPayment}
                </span>
                <ChevronDown size={10} style={{color:C.g400}}/>
              </button>
              {showPayment && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl z-40 border overflow-hidden"
                  style={{borderColor:C.g100,maxHeight:260,overflowY:'auto'}}>
                  {PAYMENT_FILTERS.map(p => (
                    <button key={p}
                      onClick={() => { setSelPayment(p); setShowPayment(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-0"
                      style={{borderColor:C.g50}}>
                      <span className="font-semibold" style={{color:C.g800}}>{p}</span>
                      {selPayment===p && <CheckCircle size={11} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country dropdown */}
            <div ref={countryRef} className="relative">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Country</label>
              <button onClick={() => setShowCountry(!showCountry)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg flex items-center gap-1.5"
                style={{borderColor:selCountry.code!=='ALL'?C.green:C.g200}}>
                <span>{selCountry.code === 'ALL' ? detectedFlag : selCountry.flag}</span>
                <span className="font-semibold">{selCountry.name}</span>
                {selCountry.code !== 'ALL' && (
                  <span className="font-black text-[9px] px-1 py-0.5 rounded"
                    style={{backgroundColor:C.g100,color:C.g600}}>
                    {selCountry.currency}
                  </span>
                )}
                <ChevronDown size={10} style={{color:C.g400}}/>
              </button>
              {showCountry && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-2xl z-40 border overflow-hidden"
                  style={{borderColor:C.g100,maxHeight:260,overflowY:'auto'}}>
                  {COUNTRIES.map(c => (
                    <button key={c.code}
                      onClick={() => { setSelCountry(c); setShowCountry(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-0"
                      style={{borderColor:C.g50}}>
                      <span className="text-base">{c.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold" style={{color:C.g800}}>{c.name}</p>
                        <p className="text-[9px]" style={{color:C.g400}}>{c.symbol} {c.currency}</p>
                      </div>
                      {selCountry.code===c.code && <CheckCircle size={11} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Sort</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg focus:outline-none block"
                style={{borderColor:C.g200,color:C.g700,fontWeight:700}}>
                <option value="rate_low">Best Rate ↑</option>
                <option value="rate_high">Highest Rate</option>
                <option value="rating">Top Rated</option>
                <option value="trades">Most Trades</option>
              </select>
            </div>

            <button onClick={() => navigate('/create-offer')}
              className="mt-auto px-3 py-2 rounded-lg font-black text-xs flex items-center gap-1.5"
              style={{backgroundColor:C.forest,color:C.white}}>
              <PlusCircle size={12}/> Post Offer
            </button>
          </div>
        </div>

        {/* ── COUNT ROW ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold" style={{color:C.g600}}>
            <span className="font-black" style={{color:C.g800}}>{filtered.length}</span> offers
            {selBrand!=='All Brands' && <span> · {selBrand}</span>}
            {selFaceValue > 0 && <span> · ${selFaceValue}</span>}
            {selCountry.code!=='ALL' && <span> · {selCountry.flag} {selCountry.name}</span>}
            {selPayment!=='All Payments' && <span> · {selPayment}</span>}
          </p>
          <span className="flex items-center gap-1 text-[10px] font-bold" style={{color:C.g500}}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
            {onlineCnt} online
          </span>
        </div>

        {/* ── OFFER GRID ──────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-4xl mb-3">🎁</p>
            <p className="font-black text-sm mb-1" style={{color:C.g800}}>No gift card offers found</p>
            <p className="text-xs mb-4" style={{color:C.g400}}>Adjust filters or be the first to post</p>
            <button onClick={() => navigate('/create-offer')}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold"
              style={{backgroundColor:C.green}}>
              Post First Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map(l => (
              <GCCard
                key={l.id}
                listing={l}
                btcPriceUSD={btcPrice}
                onViewSeller={() => setModal({seller:l.users||{},listing:l})}
                onTrade={() => handleTrade(l.id)}
                liked={liked.has(l.id)}
                onToggleLike={() => setLiked(prev => {
                  const n = new Set(prev);
                  n.has(l.id) ? n.delete(l.id) : n.add(l.id);
                  return n;
                })}
              />
            ))}
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.mist,borderColor:`${C.green}30`}}>
          <Shield size={13} className="flex-shrink-0 mt-0.5" style={{color:C.green}}/>
          <p className="text-[10px] font-semibold leading-relaxed" style={{color:C.g700}}>
            <strong>Trade Safely:</strong> Only share gift card codes inside the active escrow trade. Never send codes before the trade is confirmed locked. Every trade is platform-protected.
          </p>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="mt-4" style={{backgroundColor:C.forest}}>
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg"
                  style={{backgroundColor:C.gold,color:C.forest}}>P</div>
                <span className="text-white font-black" style={{fontFamily:"'Syne',sans-serif"}}>PRAQEN</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.4)'}}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  {href:'https://x.com/praqenapp?s=21',                                                                          label:'𝕏',  bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',                         label:'📸', bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',                                                        label:'💼', bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',                                           label:'💬', bg:'rgba(255,255,255,0.1)'},
                  {href:'https://discord.gg/V6zCZxfdy',                                                                          label:'🎮', bg:'rgba(88,101,242,0.4)'},
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
                {[['Gift Cards','/gift-cards'],['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Create Offer','/create-offer'],['My Trades','/my-trades']].map(([l,h])=>(
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
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                    className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t"
            style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-[10px] flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>

      {modal && (
        <SellerModal
          seller={modal.seller}
          listing={modal.listing}
          onClose={() => setModal(null)}
          onTrade={() => handleTrade(modal.listing?.id)}
        />
      )}
    </div>
  );
}
