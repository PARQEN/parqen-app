import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronDown, CheckCircle, RefreshCw, AlertTriangle,
  BadgeCheck, Star, Timer, Heart, X, Info, Shield,
  ArrowRight, PlusCircle, DollarSign, Search, Gift,
  Tag, Zap, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

// ─── Gift Card brand palette — teal + coral + gold accent ───────────────────
// Distinct from Buy (green) and Sell (amber)
const C = {
  // Brand base
  forest:'#1B4332', green:'#2D6A4F', gold:'#F4A422',
  mist:'#F0FAF5', white:'#FFFFFF',
  // Gift card unique accent — rich teal + warm coral
  teal:'#0D9488',       // primary teal
  tealDark:'#0F766E',   // dark teal
  tealLight:'#CCFBF1',  // teal bg
  coral:'#E85D4A',      // coral accent (CTAs)
  coralLight:'#FEF2F0', // coral bg
  rose:'#F43F5E',       // like/alert
  violet:'#7C3AED',     // legend badge
  // Neutrals
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B', paid:'#3B82F6', purple:'#8B5CF6',
};

// ─── ISO → emoji flag ────────────────────────────────────────────────────────
function isoToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  );
}

// ─── Trust badges — real from profile.badge ──────────────────────────────────
const TRUST_MAP = {
  LEGEND:     { label:'LEGEND',     icon:'👑', color:'#7C3AED' },
  AMBASSADOR: { label:'AMBASSADOR', icon:'🌟', color:'#8B5CF6' },
  EXPERT:     { label:'EXPERT',     icon:'💎', color:'#0D9488' },
  PRO:        { label:'PRO',        icon:'⭐', color:'#10B981' },
  ACTIVE:     { label:'ACTIVE',     icon:'🔥', color:'#F59E0B' },
  BEGINNER:   { label:'NEW',        icon:'🆕', color:'#94A3B8' },
};
function deriveBadge(u) {
  if (u?.badge && TRUST_MAP[u.badge]) return TRUST_MAP[u.badge];
  const t = parseInt(u?.total_trades ?? u?.trade_count ?? 0);
  const r = parseFloat(u?.average_rating ?? 0);
  if (t >= 500 && r >= 4.8) return TRUST_MAP.LEGEND;
  if (t >= 200 && r >= 4.5) return TRUST_MAP.EXPERT;
  if (t >= 50  && r >= 4.0) return TRUST_MAP.PRO;
  if (t >= 5)               return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

// ─── Gift card brand configs ──────────────────────────────────────────────────
const GC_BRANDS = {
  amazon:     { name:'Amazon',      emoji:'📦', color:'#FF9900', bg:'#FFF3CD' },
  itunes:     { name:'iTunes',      emoji:'🎵', color:'#FC3C44', bg:'#FFE8E9' },
  google:     { name:'Google Play', emoji:'▶️',  color:'#34A853', bg:'#E8F5E9' },
  steam:      { name:'Steam',       emoji:'🎮', color:'#1B2838', bg:'#E8EAF0' },
  netflix:    { name:'Netflix',     emoji:'🎬', color:'#E50914', bg:'#FFE8E8' },
  spotify:    { name:'Spotify',     emoji:'🎧', color:'#1DB954', bg:'#E8F8EE' },
  playstation:{ name:'PlayStation', emoji:'🕹️', color:'#003087', bg:'#E8EDF8' },
  xbox:       { name:'Xbox',        emoji:'🟩', color:'#107C10', bg:'#E8F5E9' },
  ebay:       { name:'eBay',        emoji:'🛒', color:'#E53238', bg:'#FFE8E8' },
  walmart:    { name:'Walmart',     emoji:'🏪', color:'#0071CE', bg:'#E8F2FF' },
  visa:       { name:'Visa Gift',   emoji:'💳', color:'#1A1F71', bg:'#E8E9F8' },
  other:      { name:'Other',       emoji:'🎁', color:'#0D9488', bg:'#CCFBF1' },
};

const GC_FILTER_LIST = [
  { value:'all',        label:'All Brands',   emoji:'🎁' },
  { value:'amazon',     label:'Amazon',       emoji:'📦' },
  { value:'itunes',     label:'iTunes',       emoji:'🎵' },
  { value:'google',     label:'Google Play',  emoji:'▶️' },
  { value:'steam',      label:'Steam',        emoji:'🎮' },
  { value:'netflix',    label:'Netflix',      emoji:'🎬' },
  { value:'spotify',    label:'Spotify',      emoji:'🎧' },
  { value:'playstation',label:'PlayStation',  emoji:'🕹️' },
  { value:'visa',       label:'Visa Gift',    emoji:'💳' },
];

const USD_RATES = {GHS:11.85,NGN:1580,KES:130,ZAR:18.5,UGX:3720,TZS:2680,USD:1,GBP:0.79,EUR:0.92,XAF:612,XOF:612};
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',TZS:'TSh',USD:'$',GBP:'£',EUR:'€',XAF:'CFA',XOF:'CFA'};

const COUNTRIES = [
  {code:'ALL',name:'All Countries',  flag:'🌍',currency:'USD',symbol:'$'},
  {code:'GH', name:'Ghana',          flag:'🇬🇭',currency:'GHS',symbol:'₵'},
  {code:'NG', name:'Nigeria',        flag:'🇳🇬',currency:'NGN',symbol:'₦'},
  {code:'KE', name:'Kenya',          flag:'🇰🇪',currency:'KES',symbol:'KSh'},
  {code:'ZA', name:'South Africa',   flag:'🇿🇦',currency:'ZAR',symbol:'R'},
  {code:'US', name:'United States',  flag:'🇺🇸',currency:'USD',symbol:'$'},
  {code:'GB', name:'United Kingdom', flag:'🇬🇧',currency:'GBP',symbol:'£'},
];

const fmt  = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fBtc = (n)     => parseFloat(n||0).toFixed(6);

const getUser     = (u) => Array.isArray(u)?u[0]:(u||{});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades??u?.trade_count??0);
const getLastSeen = (u) => {
  const d=u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if(!d)return{label:'—',online:false};
  const s=(Date.now()-new Date(d))/1000;
  if(s<300)  return{label:'● Active',online:true};
  if(s<3600) return{label:`${~~(s/60)}m ago`,online:false};
  if(s<86400)return{label:`${~~(s/3600)}h ago`,online:false};
  return{label:`${~~(s/86400)}d ago`,online:false};
};

// Resolve gift card brand from listing fields
function getGCBrand(l) {
  const raw = (l.gift_card_brand||l.giftCardBrand||l.card_brand||'other').toLowerCase().replace(/\s+/g,'');
  for (const [k,v] of Object.entries(GC_BRANDS)) {
    if (raw.includes(k) || k.includes(raw.substring(0,4))) return {...v,key:k};
  }
  return {...GC_BRANDS.other, key:'other'};
}

const getListingFlag = (l) => isoToFlag(l.country||l.country_code||getUser(l.users)?.country||'');
const getRateUSD     = (l,btcPrice) => {
  if(l.pricing_type==='fixed'){const s=parseFloat(l.bitcoin_price||0);if(s>100)return s;}
  return btcPrice*(1+parseFloat(l.margin||0)/100);
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({user,size=34,radius='rounded-lg'}) {
  const [err,setErr]=useState(false);
  const u=getUser(user);
  if(u?.avatar_url&&!err) return(
    <img src={u.avatar_url} alt={u.username||'user'} onError={()=>setErr(true)}
      className={`object-cover flex-shrink-0 ${radius}`} style={{width:size,height:size}}/>
  );
  return(
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.teal,fontSize:size*0.38}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Seller popup ─────────────────────────────────────────────────────────────
function SellerModal({seller,listing,onClose,onTrade}) {
  const [tab,setTab]=useState('rules');
  if(!seller)return null;
  const u=getUser(seller);
  const badge=deriveBadge(u);
  const seen=getLastSeen(u);
  const trades=getTrades(u);
  const rating=parseFloat(u.average_rating||0);
  const fb=parseInt(u.total_feedback_count??u.feedback_count??0);
  const verif=isVerified(u);
  const brand=getGCBrand(listing||{});
  const listingFlag=getListingFlag(listing||{});
  const cur=listing?.currency||'USD';
  const sym=listing?.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate=USD_RATES[cur]||1;
  const rate=getRateUSD(listing||{},68000)*usdRate;
  const margin=parseFloat(listing?.margin||0);

  return(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl border"
        style={{borderColor:C.g200,animation:'slideUp .25s ease'}}>

        {/* Header — teal gradient */}
        <div className="relative p-5 text-white"
          style={{background:`linear-gradient(135deg,${C.tealDark},${C.teal})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white"/>
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar user={u} size={52} radius="rounded-xl"/>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{backgroundColor:seen.online?C.online:C.g400}}/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">{u.username||'Seller'}</h3>
                {verif&&<BadgeCheck size={15} style={{color:'#99F6E4'}}/>}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{backgroundColor:badge.color,color:'#fff'}}>
                  {badge.icon} {badge.label}
                </span>
                <span className="text-xs text-white/60">{listingFlag} {u.country||listing?.country_name||''}</span>
                {/* Gift card brand chip */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{backgroundColor:'rgba(255,255,255,0.2)',color:'#fff'}}>
                  {brand.emoji} {brand.name}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20 text-center">
            {[
              {label:'Trades',  value:fmt(trades)},
              {label:'Rating',  value:`${rating.toFixed(1)}★`},
              {label:'Reviews', value:fmt(fb)},
              {label:'Complete',value:`${u.completion_rate||98}%`},
            ].map(s=>(
              <div key={s.label}>
                <p className="text-white font-black text-sm">{s.value}</p>
                <p className="text-white/50 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex border-b" style={{borderColor:C.g200}}>
          {[['rules','📋 Trade Rules'],['offer','🎁 Offer Details']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition"
              style={{color:tab===t?C.teal:C.g500,borderBottom:tab===t?`2px solid ${C.teal}`:'2px solid transparent',backgroundColor:tab===t?`${C.teal}05`:'transparent'}}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {tab==='rules'?(
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.tealLight,color:C.g700,border:`1px solid ${C.teal}30`}}>
                {listing?.trade_instructions||listing?.description||
                  'Send the gift card code and PIN. Wait for buyer to confirm card validity before releasing payment.'}
              </div>
              {listing?.listing_terms&&(
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
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Trades',  value:fmt(trades),               color:C.teal},
                  {label:'Rating',  value:`${rating.toFixed(1)} / 5`,color:C.warn},
                  {label:'Complete',value:`${u.completion_rate||98}%`,color:C.success},
                  {label:'Reviews', value:fmt(fb),                   color:C.paid},
                ].map(({label,value,color})=>(
                  <div key={label} className="p-2 rounded-xl" style={{backgroundColor:C.g50}}>
                    <p className="text-[9px] text-gray-400">{label}</p>
                    <p className="text-xs font-black" style={{color}}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-[9px] text-red-600">Only use card codes within the active trade chat. Escrow protects both parties.</p>
              </div>
            </div>
          ):(
            <div className="space-y-2">
              {[
                {label:'Card Brand',  value:`${brand.emoji} ${brand.name}`},
                {label:'Country',     value:`${listingFlag} ${listing?.country_name||u.country||'—'}`},
                {label:'Card Value',  value:listing?.card_value?`$${listing.card_value}`:'Varies'},
                {label:'Rate',        value:`${sym}${fmt(rate)} ${cur}/BTC`},
                {label:'Margin',      value:margin===0?'Market rate':margin>0?`+${margin}%`:`${margin}% below`},
                {label:'Range',       value:listing?.min_limit_local&&listing?.max_limit_local
                  ?`${sym}${fmt(listing.min_limit_local)} – ${sym}${fmt(listing.max_limit_local)}`
                  :`$${listing?.min_limit_usd||10} – $${listing?.max_limit_usd||500}`},
                {label:'Time limit',  value:`${listing?.time_limit||30} minutes`},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between text-xs py-1.5 border-b last:border-0" style={{borderColor:C.g100}}>
                  <span style={{color:C.g500}}>{label}</span>
                  <span className="font-bold" style={{color:C.g800}}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{borderColor:C.g200,color:C.g600}}>Close</button>
          <button onClick={()=>{onClose();onTrade();}}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2"
            style={{backgroundColor:C.coral}}>
            <Gift size={14}/> Trade Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Gift Card Offer Card ─────────────────────────────────────────────
// ┌─ [🎁BRAND]  Avatar  Seller 🇬🇭 [BADGE] ──┐
// │  👍 98%  120 Trades  ● Active            │
// ├──────────────────────────────────────────┤
// │  Card Value $50       Rate per BTC       │
// │  Pay ₵2,100           ₿ 0.002500         │
// ├──────────────────────────────────────────┤
// │  ₵839,858 GHS/BTC    [+8%]               │
// │  ₵400 – ₵5,000       ⏱ 30min            │
// ├──────────────────────────────────────────┤
// │  [ ⓘ ]               [ TRADE → ]         │
// └──────────────────────────────────────────┘
function GCCard({listing, btcPriceUSD, onViewSeller, onTrade, liked, onToggleLike}) {
  const [payAmt, setPayAmt] = useState('');
  const u          = getUser(listing.users);
  const badge      = deriveBadge(u);
  const seen       = getLastSeen(u);
  const verif      = isVerified(u);
  const trades     = getTrades(u);
  const rating     = parseFloat(u.average_rating||0);
  const listingFlag= getListingFlag(listing);
  const brand      = getGCBrand(listing);
  const margin     = parseFloat(listing.margin||0);
  const cur        = listing.currency||'USD';
  const sym        = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate    = USD_RATES[cur]||1;
  const rateUSD    = getRateUSD(listing, btcPriceUSD);
  const rateLocal  = rateUSD * usdRate;
  const completion = parseFloat(u.completion_rate||98);

  const minLocal = listing.min_limit_local||(listing.min_limit_usd?listing.min_limit_usd*usdRate:0);
  const maxLocal = listing.max_limit_local||(listing.max_limit_usd?listing.max_limit_usd*usdRate:0);

  const inputLocal = payAmt ? parseFloat(payAmt) : (minLocal||100);
  const btcOut     = inputLocal / rateLocal;

  const marginLabel = margin===0?'Market':margin>0?`+${margin}%`:`${margin}%`;
  const marginColor = margin>0?C.danger:margin<0?C.success:C.g500;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
      style={{borderColor:C.g200}}>

      {/* Brand strip — colored top accent */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-1.5" style={{backgroundColor:brand.bg}}>
        <span className="text-base leading-none">{brand.emoji}</span>
        <span className="text-[10px] font-black" style={{color:brand.color}}>{brand.name}</span>
        {listing.card_value && (
          <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
            style={{backgroundColor:brand.color}}>
            ${listing.card_value}
          </span>
        )}
      </div>

      {/* ── ROW 1: Avatar + name + badge ────────────────────────────── */}
      <div className="px-3 pt-2 pb-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center gap-2">
          <button onClick={onViewSeller} className="relative flex-shrink-0">
            <Avatar user={u} size={32} radius="rounded-lg"/>
            {seen.online&&(
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{backgroundColor:C.online}}/>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={onViewSeller}
                className="font-black text-xs hover:underline" style={{color:C.g800}}>
                {u.username||'Seller'}
              </button>
              <span className="text-sm leading-none">{listingFlag}</span>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm"
                style={{backgroundColor:badge.color,color:'#fff'}}>
                {badge.label}
              </span>
              {verif&&<BadgeCheck size={10} style={{color:C.teal}}/>}
            </div>
            <div className="flex items-center gap-1 text-[9px] mt-0.5" style={{color:C.g500}}>
              <span style={{color:C.success}}>👍 {completion.toFixed(0)}%</span>
              <span style={{color:C.g300}}>·</span>
              <span>{fmt(trades)} Trades</span>
              <span style={{color:C.g300}}>·</span>
              <span style={{color:seen.online?C.online:C.g400}}>{seen.label}</span>
            </div>
          </div>
          <button onClick={onToggleLike}
            className="w-6 h-6 rounded-md flex items-center justify-center border flex-shrink-0"
            style={{borderColor:C.g200,backgroundColor:liked?'#FFF1F2':'transparent'}}>
            <Heart size={10} style={{color:liked?C.rose:C.g300,fill:liked?C.rose:'none'}}/>
          </button>
        </div>
      </div>

      {/* ── ROW 2: Pay / Receive ────────────────────────────────────── */}
      <div className="px-3 py-2 border-b grid grid-cols-2 gap-2" style={{borderColor:C.g100}}>
        <div>
          <p className="text-[8px] text-gray-400 uppercase tracking-wide mb-0.5">Pay {sym}</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{color:C.g500}}>{sym}</span>
            <input
              type="number"
              value={payAmt}
              onChange={e=>setPayAmt(e.target.value)}
              placeholder={minLocal?fmt(minLocal):'100'}
              className="w-full text-xs font-black bg-transparent border-0 outline-none"
              style={{color:C.g800}}/>
          </div>
        </div>
        <div className="border-l pl-2" style={{borderColor:C.g100}}>
          <p className="text-[8px] text-gray-400 uppercase tracking-wide mb-0.5">Receive BTC</p>
          <p className="text-xs font-black" style={{color:C.g700}}>₿ {fBtc(btcOut)}</p>
        </div>
      </div>

      {/* ── ROW 3: Rate + range ─────────────────────────────────────── */}
      <div className="px-3 py-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-black" style={{color:C.g800}}>
            {sym}{fmt(rateLocal)} {cur}/₿
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
            style={{color:marginColor,backgroundColor:`${marginColor}10`}}>
            {marginLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]" style={{color:C.g400}}>
          <span>{minLocal&&maxLocal?`${sym}${fmt(minLocal)} – ${sym}${fmt(maxLocal)}`:'Any amount'}</span>
          <span>⏱ {listing.time_limit||30}min</span>
        </div>
      </div>

      {/* ── ROW 4: Actions ──────────────────────────────────────────── */}
      <div className="px-3 py-2 flex items-center gap-2 mt-auto">
        <button onClick={onViewSeller}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
          style={{borderColor:C.g200}}>
          <Info size={12} style={{color:C.g400}}/>
        </button>
        <button onClick={onTrade}
          className="flex-1 py-1.5 rounded-md text-white font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          style={{backgroundColor:C.coral}}>
          <Gift size={11}/> TRADE <ArrowRight size={10}/>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GiftCards({user}) {
  const navigate = useNavigate();
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [btcPrice, setBtcPrice]       = useState(68000);
  const [loadingRates, setLoadingRates]= useState(false);
  const [selCountry, setSelCountry]   = useState(COUNTRIES[0]);
  const [selBrand, setSelBrand]       = useState('all');
  const [showCountry, setShowCountry] = useState(false);
  const [sortBy, setSortBy]           = useState('rate_low');
  const [modal, setModal]             = useState(null);
  const [liked, setLiked]             = useState(new Set());
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState('all'); // all | buy | sell
  const countryRef = useRef(null);

  useEffect(()=>{ fetchRates(); loadListings(); detectCountry(); },[]);
  useEffect(()=>{
    const h=e=>{if(countryRef.current&&!countryRef.current.contains(e.target))setShowCountry(false);};
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  const detectCountry = async () => {
    try {
      const r=await axios.get('https://ipapi.co/json/');
      const code=r.data?.country_code;
      if(code){const f=COUNTRIES.find(c=>c.code===code);if(f)setSelCountry(f);}
    } catch {}
  };

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const r=await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try{const r2=await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json');setBtcPrice(r2.data.bpi.USD.rate_float);}
      catch{}
    }
    finally{setLoadingRates(false);}
  };

  const loadListings = async () => {
    try {
      const r=await axios.get(`${API_URL}/listings`);
      const all=(r.data.listings||[]).map(l=>({...l,users:Array.isArray(l.users)?l.users[0]:l.users}));
      // Include gift card listings (exclude pure buy/sell bitcoin)
      const gcs=all.filter(l=>
        l.gift_card_brand||l.giftCardBrand||l.card_brand||
        (l.listing_type&&!['BUY','SELL','BUY_BITCOIN','SELL_BITCOIN'].includes(l.listing_type))
      );
      setListings(gcs.length>0?gcs:all);
    } catch{toast.error('Failed to load gift card marketplace');}
    finally{setLoading(false);}
  };

  const getFiltered = () => {
    let list=[...listings];
    if(activeTab==='buy')  list=list.filter(l=>l.listing_type==='BUY'||l.listing_type==='BUY_GIFT_CARD');
    if(activeTab==='sell') list=list.filter(l=>l.listing_type==='SELL'||l.listing_type==='SELL_GIFT_CARD');
    if(selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if(selBrand!=='all') list=list.filter(l=>{
      const brand=getGCBrand(l).key; return brand===selBrand||brand.includes(selBrand);
    });
    if(search.trim()) {
      const q=search.toLowerCase();
      list=list.filter(l=>
        (l.gift_card_brand||l.giftCardBrand||'').toLowerCase().includes(q)||
        (getUser(l.users)?.username||'').toLowerCase().includes(q)||
        (l.payment_method||'').toLowerCase().includes(q)
      );
    }
    if(sortBy==='rate_low')  list.sort((a,b)=>parseFloat(a.margin||0)-parseFloat(b.margin||0));
    if(sortBy==='rate_high') list.sort((a,b)=>parseFloat(b.margin||0)-parseFloat(a.margin||0));
    if(sortBy==='rating')    list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    if(sortBy==='trades')    list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));
    return list;
  };

  const handleTrade = (id) => {
    if(!user){toast.info('Please login to start trading');navigate('/login');return;}
    navigate(`/listing/${id}`);
  };

  const filtered  = getFiltered();
  const onlineCnt = listings.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300).length;

  // Brand counts
  const brandCounts = GC_FILTER_LIST.slice(1).map(b=>({
    ...b,
    count:listings.filter(l=>getGCBrand(l).key===b.value).length,
  }));

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:C.teal,borderTopColor:'transparent'}}/>
    </div>
  );

  return(
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3 space-y-3">

        {/* ── HEADER — teal gradient, unique from buy/sell ─────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{background:`linear-gradient(135deg,${C.tealDark} 0%,${C.teal} 60%,#14B8A6 100%)`}}>
          <div className="px-5 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={20} className="text-white/70"/>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight"
                    style={{fontFamily:"'Syne',sans-serif"}}>
                    Gift Card Marketplace
                  </h1>
                </div>
                <p className="text-white/50 text-xs">
                  Buy & sell Amazon, iTunes, Steam, Netflix + 50 more brands
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Brand quick stats */}
                <div className="flex gap-2">
                  {[
                    {label:'Active',value:fmt(listings.length)},
                    {label:'Brands',value:'50+'},
                    {label:'Online',value:fmt(onlineCnt)},
                  ].map(s=>(
                    <div key={s.label} className="text-center px-3 py-1.5 rounded-xl"
                      style={{backgroundColor:'rgba(255,255,255,0.12)'}}>
                      <p className="font-black text-sm text-white">{s.value}</p>
                      <p className="text-white/50 text-[9px]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{fetchRates();loadListings();}}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  <RefreshCw size={13} className={`text-white ${loadingRates?'animate-spin':''}`}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BRAND QUICK FILTERS ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border p-3 overflow-x-auto" style={{borderColor:C.g200}}>
          <div className="flex gap-2 min-w-max pb-0.5">
            {/* All */}
            <button onClick={()=>setSelBrand('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition"
              style={{
                backgroundColor:selBrand==='all'?C.teal:'transparent',
                color:selBrand==='all'?'#fff':C.g600,
                borderColor:selBrand==='all'?C.teal:C.g200,
              }}>
              🎁 All Brands
            </button>
            {GC_FILTER_LIST.slice(1).map(b=>{
              const active=selBrand===b.value;
              const cfg=GC_BRANDS[b.value]||GC_BRANDS.other;
              return(
                <button key={b.value} onClick={()=>setSelBrand(b.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                  style={{
                    backgroundColor:active?cfg.color:'transparent',
                    color:active?'#fff':C.g600,
                    borderColor:active?cfg.color:C.g200,
                  }}>
                  {b.emoji} {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border p-3" style={{borderColor:C.g200}}>
          <div className="flex flex-wrap gap-2 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Search</label>
              <div className="relative mt-0.5">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Brand, seller, payment…"
                  className="w-full pl-7 pr-2 py-2 text-xs border-2 rounded-lg focus:outline-none"
                  style={{borderColor:search?C.teal:C.g200}}/>
              </div>
            </div>

            {/* Country */}
            <div className="relative" ref={countryRef}>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Country</label>
              <button onClick={()=>setShowCountry(!showCountry)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg flex items-center gap-1.5"
                style={{borderColor:selCountry.code!=='ALL'?C.teal:C.g200}}>
                <span>{selCountry.flag}</span>
                <span className="font-semibold">{selCountry.name}</span>
                <ChevronDown size={10} style={{color:C.g400}}/>
              </button>
              {showCountry&&(
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-2xl z-40 border overflow-hidden"
                  style={{borderColor:C.g100}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code} onClick={()=>{setSelCountry(c);setShowCountry(false);}}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-0"
                      style={{borderColor:C.g50}}>
                      <span>{c.flag}</span>
                      <div>
                        <p className="font-bold" style={{color:C.g800}}>{c.name}</p>
                        <p style={{color:C.g400,fontSize:9}}>{c.currency}</p>
                      </div>
                      {selCountry.code===c.code&&<CheckCircle size={10} style={{color:C.teal,marginLeft:'auto'}}/>}
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
                style={{borderColor:C.g200}}>
                <option value="rate_low">Best Rate ↑</option>
                <option value="rate_high">Highest Rate</option>
                <option value="rating">Top Rated</option>
                <option value="trades">Most Trades</option>
              </select>
            </div>

            {/* Buy/Sell tab */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Type</label>
              <div className="mt-0.5 flex border-2 rounded-lg overflow-hidden" style={{borderColor:C.g200}}>
                {[['all','All'],['sell','Buy'],['buy','Sell']].map(([t,l])=>(
                  <button key={t} onClick={()=>setActiveTab(t)}
                    className="px-3 py-2 text-xs font-bold transition"
                    style={{backgroundColor:activeTab===t?C.teal:'transparent',color:activeTab===t?'#fff':C.g600}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={()=>navigate('/create-offer')}
              className="mt-auto px-3 py-2 rounded-lg font-black text-xs flex items-center gap-1.5"
              style={{backgroundColor:C.coral,color:C.white}}>
              <PlusCircle size={12}/> Create Offer
            </button>
          </div>
        </div>

        {/* ── COUNT ROW ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{color:C.g500}}>
            <span className="font-black" style={{color:C.g800}}>{filtered.length}</span> offers
            {selBrand!=='all'&&` · ${GC_BRANDS[selBrand]?.emoji||''} ${GC_BRANDS[selBrand]?.name||selBrand}`}
            {selCountry.code!=='ALL'&&` · ${selCountry.flag} ${selCountry.name}`}
          </p>
          <span className="flex items-center gap-1 text-[10px]" style={{color:C.g400}}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
            {onlineCnt} online
          </span>
        </div>

        {/* ── OFFER GRID — 5 columns max ─────────────────────────────── */}
        {filtered.length===0?(
          <div className="bg-white rounded-xl border p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-4xl mb-3">🎁</p>
            <p className="font-black text-sm mb-1" style={{color:C.g800}}>No gift card offers found</p>
            <p className="text-xs mb-4" style={{color:C.g400}}>Try a different brand or country</p>
            <button onClick={()=>navigate('/create-offer')}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold"
              style={{backgroundColor:C.teal}}>
              Post First Offer
            </button>
          </div>
        ):(
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map(l=>(
              <GCCard
                key={l.id}
                listing={l}
                btcPriceUSD={btcPrice}
                onViewSeller={()=>setModal({seller:l.users||{},listing:l})}
                onTrade={()=>handleTrade(l.id)}
                liked={liked.has(l.id)}
                onToggleLike={()=>setLiked(prev=>{const n=new Set(prev);n.has(l.id)?n.delete(l.id):n.add(l.id);return n;})}
              />
            ))}
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.tealLight,borderColor:`${C.teal}30`}}>
          <Shield size={13} className="flex-shrink-0 mt-0.5" style={{color:C.tealDark}}/>
          <p className="text-[10px] leading-relaxed" style={{color:C.tealDark}}>
            <strong>Trade Gift Cards Safely:</strong> Only share card codes inside the active trade chat. Never send codes before the trade is locked in escrow. Every trade is platform-protected.
          </p>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
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
                  {href:'https://x.com/praqenapp?s=21',              label:'𝕏',  bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',label:'📸',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',label:'💼',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',label:'💬',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://discord.gg/V6zCZxfdy',               label:'🎮',bg:'rgba(88,101,242,0.4)'},
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
                {[
                  ['Gift Cards',    '/gift-cards'],
                  ['Buy Bitcoin',   '/buy-bitcoin'],
                  ['Sell Bitcoin',  '/sell-bitcoin'],
                  ['Create Offer',  '/create-offer'],
                  ['My Trades',     '/my-trades'],
                ].map(([l,h])=>(
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
                    className="block text-xs hover:text-white transition"
                    style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
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

      {modal&&(
        <SellerModal
          seller={modal.seller}
          listing={modal.listing}
          onClose={()=>setModal(null)}
          onTrade={()=>handleTrade(modal.listing?.id)}
        />
      )}
    </div>
  );
}
