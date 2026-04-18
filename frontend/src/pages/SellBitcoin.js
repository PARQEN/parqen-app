import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bitcoin, ChevronDown, CheckCircle, RefreshCw,
  AlertTriangle, BadgeCheck, Star, Timer, Eye,
  Heart, X, Info, Shield, ArrowRight, PlusCircle,
  DollarSign, TrendingUp, Lock, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import TradeDisplay from '../components/TradeDisplay';

const API_URL = 'http://localhost:5000/api';

// ─── Color palette — sell page uses amber/orange accent ──────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#FF0000', online:'#22C55E',
  warn:'#F59E0B', paid:'#3B82F6', purple:'#8B5CF6',
  sell:'#D97706', sellBg:'#FFFBEB',
};

// ─── Convert ISO country code → emoji flag ───────────────────────────────────
function isoToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  );
}

// ─── Trust badges — real from profile.badge field ────────────────────────────
const TRUST_MAP = {
  LEGEND:     {label:'Legend',    icon:'👑', color:'#7C3AED'},
  AMBASSADOR: {label:'Ambassador',icon:'🌟', color:'#8B5CF6'},
  EXPERT:     {label:'Expert',    icon:'💎', color:'#0EA5E9'},
  PRO:        {label:'Pro',       icon:'⭐', color:'#10B981'},
  ACTIVE:     {label:'Active',    icon:'🔥', color:'#F59E0B'},
  BEGINNER:   {label:'New',       icon:'🆕', color:'#94A3B8'},
};
function deriveBadge(u) {
  if (u?.badge) {
    const badgeUpper = String(u.badge).toUpperCase();
    if (TRUST_MAP[badgeUpper]) return TRUST_MAP[badgeUpper];
  }
  
  for (const key in TRUST_MAP) {
    if (u?.[key.toLowerCase()]) return TRUST_MAP[key];
  }
  
  const t = parseInt(u?.total_trades ?? u?.trade_count ?? 0);
  const r = parseFloat(u?.average_rating ?? 0);
  if (t >= 500 && r >= 4.8) return TRUST_MAP.LEGEND;
  if (t >= 200 && r >= 4.5) return TRUST_MAP.EXPERT;
  if (t >= 50  && r >= 4.0) return TRUST_MAP.PRO;
  if (t >= 5)               return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

const USD_RATES = {GHS:11.85,NGN:1580,KES:130,ZAR:18.5,UGX:3720,TZS:2680,USD:1,GBP:0.79,EUR:0.92,XAF:612,XOF:612};
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',TZS:'TSh',USD:'$',GBP:'£',EUR:'€',XAF:'CFA',XOF:'CFA'};

const PAYMENT_MAP = {
  'mtn mobile money':{name:'MTN Mobile Money',icon:'📱',short:'MTN MoMo'},
  'mtn momo':        {name:'MTN Mobile Money',icon:'📱',short:'MTN MoMo'},
  mtn:               {name:'MTN Mobile Money',icon:'📱',short:'MTN MoMo'},
  'vodafone cash':   {name:'Vodafone Cash',   icon:'📱',short:'Vodafone'},
  vodafone:          {name:'Vodafone Cash',   icon:'📱',short:'Vodafone'},
  'airteltigo money':{name:'AirtelTigo',      icon:'📱',short:'AirtelTigo'},
  airteltigo:        {name:'AirtelTigo',      icon:'📱',short:'AirtelTigo'},
  'bank transfer':   {name:'Bank Transfer',   icon:'🏦',short:'Bank'},
  bank:              {name:'Bank Transfer',   icon:'🏦',short:'Bank'},
  paypal:            {name:'PayPal',          icon:'💰',short:'PayPal'},
  mpesa:             {name:'M-Pesa',          icon:'📱',short:'M-Pesa'},
  'm-pesa':          {name:'M-Pesa',          icon:'📱',short:'M-Pesa'},
  opay:              {name:'OPay',            icon:'💳',short:'OPay'},
  palmpay:           {name:'PalmPay',         icon:'💳',short:'PalmPay'},
  zelle:             {name:'Zelle',           icon:'💳',short:'Zelle'},
  'orange money':    {name:'Orange Money',    icon:'📱',short:'Orange'},
  wave:              {name:'Wave',            icon:'📱',short:'Wave'},
};

const PAYMENT_FILTERS = [
  {value:'all',       label:'All Methods',      icon:'💳'},
  {value:'mtn',       label:'MTN Mobile Money', icon:'📱'},
  {value:'vodafone',  label:'Vodafone Cash',    icon:'📱'},
  {value:'airteltigo',label:'AirtelTigo',       icon:'📱'},
  {value:'bank',      label:'Bank Transfer',    icon:'🏦'},
  {value:'paypal',    label:'PayPal',           icon:'💰'},
  {value:'mpesa',     label:'M-Pesa',           icon:'📱'},
  {value:'opay',      label:'OPay',             icon:'💳'},
];

const COUNTRIES = [
  {code:'ALL',name:'All Countries',    flag:'🌍',currency:'USD',symbol:'$'},
  {code:'GH', name:'Ghana',            flag:'🇬🇭',currency:'GHS',symbol:'₵'},
  {code:'NG', name:'Nigeria',          flag:'🇳🇬',currency:'NGN',symbol:'₦'},
  {code:'KE', name:'Kenya',            flag:'🇰🇪',currency:'KES',symbol:'KSh'},
  {code:'ZA', name:'South Africa',     flag:'🇿🇦',currency:'ZAR',symbol:'R'},
  {code:'UG', name:'Uganda',           flag:'🇺🇬',currency:'UGX',symbol:'USh'},
  {code:'US', name:'United States',    flag:'🇺🇸',currency:'USD',symbol:'$'},
  {code:'GB', name:'United Kingdom',   flag:'🇬🇧',currency:'GBP',symbol:'£'},
  {code:'EU', name:'Europe',           flag:'🇪🇺',currency:'EUR',symbol:'€'},
  {code:'CM', name:'Cameroon',         flag:'🇨🇲',currency:'XAF',symbol:'CFA'},
  {code:'SN', name:'Senegal',          flag:'🇸🇳',currency:'XOF',symbol:'CFA'},
];

const fmt  = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fBtc = (n)     => parseFloat(n||0).toFixed(6);

const getUser    = (u) => Array.isArray(u)?u[0]:(u||{});
const getPayInfo = (l) => {
  const raw = l.payment_method||(Array.isArray(l.payment_methods)?l.payment_methods[0]:'')||'';
  return PAYMENT_MAP[String(raw).toLowerCase().trim()]||{name:raw||'Payment',icon:'💳',short:raw||'Pay'};
};
const isVerified = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades  = (u) => parseInt(u?.total_trades??u?.trade_count??0);
const getLastSeen= (u) => {
  const d = u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if (!d) return {label:'—',online:false};
  const s = (Date.now()-new Date(d))/1000;
  if (s<300)   return {label:'● Active',online:true};
  if (s<3600)  return {label:`Last seen ${~~(s/60)}m ago`,online:false};
  if (s<86400) return {label:`Last seen ${~~(s/3600)}h ago`,online:false};
  return {label:`Last seen ${~~(s/86400)}d ago`,online:false};
};
const getRateUSD = (l,btcPrice) => {
  if (l.pricing_type==='fixed'){const s=parseFloat(l.bitcoin_price||0);if(s>100)return s;}
  return btcPrice*(1+parseFloat(l.margin||0)/100);
};

// ─── Avatar — real image or initial ──────────────────────────────────────────
function Avatar({user, size=34, radius='rounded-lg'}) {
  const [err, setErr] = useState(false);
  const u = getUser(user);
  if (u?.avatar_url && !err) return (
    <img src={u.avatar_url} alt={u.username||'user'} onError={()=>setErr(true)}
      className={`object-cover flex-shrink-0 ${radius}`}
      style={{width:size,height:size}}/>
  );
  return (
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.sell,fontSize:size*0.38}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Buyer profile popup ──────────────────────────────────────────────────────
function BuyerModal({buyer, listing, onClose, onTrade}) {
  const [tab, setTab] = useState('rules');
  if (!buyer) return null;
  const u       = getUser(buyer);
  const badge   = deriveBadge(u);
  const seen    = getLastSeen(u);
  const trades  = getTrades(u);
  const rating  = parseFloat(u.average_rating||0);
  const fb      = parseInt(u.total_feedback_count??u.feedback_count??0);
  const verif   = isVerified(u);
  const payInfo = getPayInfo(listing||{});
  const margin  = parseFloat(listing?.margin||0);
  const cur     = listing?.currency||'USD';
  const sym     = listing?.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate = USD_RATES[cur]||1;
  const rateLocal = getRateUSD(listing||{},68000)*usdRate;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl border"
        style={{borderColor:C.g200, animation:'slideUp .25s ease'}}>

        {/* Header — amber gradient for sell page */}
        <div className="relative p-5 text-white"
          style={{background:`linear-gradient(135deg,${C.forest},${C.sell})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white"/>
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Real avatar */}
              <Avatar user={u} size={52} radius="rounded-xl"/>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{backgroundColor:seen.online?C.online:C.g400}}/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">{u.username||'Buyer'}</h3>
                {verif&&<BadgeCheck size={15} style={{color:'#93C5FD'}}/>}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* Real badge */}
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{backgroundColor:badge.color,color:'#fff'}}>
                  {badge.icon} {badge.label}
                </span>
                {/* Real country flag */}
                <span className="text-xs text-white/60">
                  <CountryFlag className="w-3 h-2 inline-block mr-1" /> {u.country||listing?.country_name||''}
                </span>
              </div>
            </div>
          </div>
          {/* Real stats */}
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
          <div className="mt-2 text-center">
            <p className="text-white font-black text-xs">
              👍 {fmt(u.positive_feedback||0)} · 👎 {fmt(u.negative_feedback||0)} · {fmt(trades)} Trades
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{borderColor:C.g200}}>
          {[['rules','📋 Trade Rules'],['offer','📊 Offer'],['trade','💱 Trade Display']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition"
              style={{color:tab===t?C.sell:C.g500,borderBottom:tab===t?`2px solid ${C.sell}`:'2px solid transparent',backgroundColor:tab===t?`${C.sell}05`:'transparent'}}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {tab==='rules'?(
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.mist, color:C.g700, border:`1px solid ${C.g200}`}}>
                {listing?.trade_instructions||listing?.description||
                  'Confirm payment received in your account before releasing Bitcoin. Never release early.'}
              </div>
              {listing?.listing_terms&&listing?.trade_instructions&&(
                <div className="p-3 rounded-xl text-xs" style={{backgroundColor:'#F0F9FF',color:C.g600}}>
                  <p className="font-bold mb-1 text-blue-600">Terms</p>
                  {listing.listing_terms}
                </div>
              )}
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{backgroundColor:C.sellBg,border:'1px solid #FDE68A'}}>
                <Timer size={12} style={{color:C.sell,flexShrink:0}}/>
                <p className="text-[10px] font-bold" style={{color:'#92400E'}}>
                  Time limit: {listing?.time_limit||30} minutes — auto-cancels if not paid
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Trades',  value:fmt(trades),                color:C.green},
                  {label:'Rating',  value:`${rating.toFixed(1)} / 5`, color:C.warn},
                  {label:'👍 Positive',value:fmt(u.positive_feedback||0),color:C.success},
                  {label:'👎 Negative', value:fmt(u.negative_feedback||0), color:C.danger},
                ].map(({label,value,color})=>(
                  <div key={label} className="p-2 rounded-xl" style={{backgroundColor:C.g50}}>
                    <p className="text-[9px] text-gray-400">{label}</p>
                    <p className="text-xs font-black" style={{color}}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-2 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-[9px] text-red-600">Never release BTC before confirming payment. Escrow protects every trade.</p>
              </div>
            </div>
          ):tab==='offer'?(
            <div className="space-y-2">
              {[
                {label:'Offer Type',  value:'🔵 Buy Bitcoin'},
                {label:'Country',     value:<><CountryFlag className="w-4 h-3 inline-block mr-1" />{listing?.country_name||u.country||'—'}</>},
                {label:'Payment',     value:`${payInfo.icon} ${payInfo.name}`},
                {label:'Rate / BTC',  value:`${sym}${fmt(rateLocal)} ${cur}`},
                {label:'Margin',      value:margin===0?'At market':margin>0?`+${margin}% above market`:`${margin}% below market`},
                {label:'Trade range', value:listing?.min_limit_local&&listing?.max_limit_local
                  ?`${sym}${fmt(listing.min_limit_local)} — ${sym}${fmt(listing.max_limit_local)} ${cur}`
                  :`$${listing?.min_limit_usd||10} — $${listing?.max_limit_usd||1000}`},
                {label:'Time limit',  value:`${listing?.time_limit||30} minutes`},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between text-xs py-1.5 border-b last:border-0" style={{borderColor:C.g100}}>
                  <span style={{color:C.g500}}>{label}</span>
                  <span className="font-bold" style={{color:C.g800}}>{value}</span>
                </div>
              ))}
            </div>
          ):(
            <div className="space-y-3">
              <TradeDisplay
                usdAmount={100}
                sellerRate={getRateUSD(listing||{},68000)}
                paymentMethod={listing?.payment_method || 'mtn'}
                localCurrency={cur}
                exchangeRate={usdRate}
              />
            </div>
          )}
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{borderColor:C.g200,color:C.g600}}>Close</button>
          <button onClick={()=>{onClose();onTrade();}}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2"
            style={{backgroundColor:C.sell}}>
            <DollarSign size={14}/> Sell BTC
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Offer Card — same layout spec as BuyBitcoin, amber accent ────────
// ┌─ Avatar  Buyer 🇬🇭 [BADGE] ──────────────┐
// │  👍 98%  120 Trades  ● Active            │
// ├──────────────────────────────────────────┤
// │  Send BTC           Receive MTN MoMo     │
// │  [input: 0.001 BTC] 839 GHS              │
// ├──────────────────────────────────────────┤
// │  ₵839,858 GHS/BTC   [+8%]               │
// │  ₵400 – ₵11,183     ⏱ 30min             │
// ├──────────────────────────────────────────┤
// │  [ ⓘ ]              [ SELL BTC → ]       │
// └──────────────────────────────────────────┘
function OfferCard({listing, btcPriceUSD, onViewBuyer, onSell, liked, onToggleLike}) {
  const [sellAmt, setSellAmt] = useState('');
  const u        = getUser(listing.users);
  const badge    = deriveBadge(u);      // real badge
  const seen     = getLastSeen(u);
  const verif    = isVerified(u);
  const trades   = getTrades(u);
  const rating   = parseFloat(u.average_rating||0);
  const payInfo  = getPayInfo(listing);
  const margin   = parseFloat(listing.margin||0);
  const cur      = listing.currency||'USD';
  const sym      = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate  = USD_RATES[cur]||1;
  const rateUSD  = getRateUSD(listing, btcPriceUSD);
  const rateLocal= rateUSD * usdRate;
  const completion= parseFloat(u.completion_rate||u.completion||98);

  const minLocal  = listing.min_limit_local||(listing.min_limit_usd?listing.min_limit_usd*usdRate:0);
  const maxLocal  = listing.max_limit_local||(listing.max_limit_usd?listing.max_limit_usd*usdRate:0);

  // For sell page: +margin = buyer pays above market = GREEN (good for seller)
  //               -margin = buyer pays below market = RED (bad for seller)
  const marginLabel = margin===0?'Market':margin>0?`+${margin}%`:`${margin}%`;
  const marginColor = margin>0?C.success:margin<0?C.danger:C.g500;

  const inputBtc   = sellAmt ? parseFloat(sellAmt) : 0.001;
  const recvLocal  = inputBtc * rateLocal;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
      style={{borderColor:C.g200}}>

      {/* ── ROW 1: Avatar + name + badge + status ─────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center gap-2">
          {/* Real avatar — image or initial */}
          <button onClick={onViewBuyer} className="relative flex-shrink-0">
            <Avatar user={u} size={34} radius="rounded-lg"/>
            {seen.online&&(
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{backgroundColor:C.online}}/>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={onViewBuyer}
                className="font-black text-xs hover:underline" style={{color:C.g800}}>
                {u.username||'Buyer'}
              </button>
              <CountryFlag className="w-4 h-3" />
              {/* Real badge — from profile.badge or derived */}
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm"
                style={{backgroundColor:badge.color,color:'#fff'}}>
                {badge.icon} {badge.label}
              </span>
              {verif&&<BadgeCheck size={10} style={{color:C.paid}}/>}
            </div>
            {/* Real live data from DB */}
            <div className="flex items-center gap-1.5 text-[9px] mt-1 text-gray-700 flex-wrap font-black">
              <span className="font-black" style={{color:C.success}}>👍 {u.positive_feedback || 0}</span>
              <span style={{color:C.g300}}>·</span>
              <span className="font-black" style={{color:C.danger}}>👎 {u.negative_feedback || 0}</span>
              <span style={{color:C.g300}}>·</span>
              <span className="font-black text-gray-700">{fmt(trades)} Trades</span>
              <span style={{color:C.g300}}>·</span>
              <span style={{color:seen.online?C.online:C.g400}} className="font-black">{seen.label}</span>
            </div>
          </div>

          <button onClick={onToggleLike}
            className="w-6 h-6 rounded-md flex items-center justify-center border flex-shrink-0"
            style={{borderColor:C.g200, backgroundColor:liked?'#FFF1F2':'transparent'}}>
            <Heart size={10} style={{color:liked?C.danger:C.g300,fill:liked?C.danger:'none'}}/>
          </button>
        </div>
      </div>

      {/* ── ROW 2: Send BTC / Receive local ───────────────────────────── */}
      <div className="px-3 py-2 border-b grid grid-cols-2 gap-2" style={{borderColor:C.g100}}>
        <div>
          <p className="text-[8px] text-gray-700 font-black uppercase tracking-wide mb-0.5">Send BTC</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black" style={{color:C.g500}}>₿</span>
            <input
              type="number"
              value={sellAmt}
              onChange={e=>setSellAmt(e.target.value)}
              placeholder="0.001"
              className="w-full text-xs font-black bg-transparent border-0 outline-none"
              style={{color:C.g800}}/>
          </div>
        </div>
        <div className="border-l pl-2" style={{borderColor:C.g100}}>
          <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{color:'#000000'}}>Receive <span className="font-black text-xs">{payInfo.short}</span></p>
          <p className="text-xs font-black" style={{color:C.g800}}>
            {sym}{fmt(recvLocal)}
          </p>
        </div>
      </div>

      {/* ── ROW 3: Rate + margin + range ──────────────────────────────── */}
      <div className="px-3 py-2 border-b" style={{borderColor:C.g100}}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-black" style={{color:'#FF0000'}}>
            ₿ {sym}{fmt(rateLocal)} {cur}
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
            style={{color:marginColor, backgroundColor:`${marginColor}10`}}>
            {marginLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]" style={{color:C.g400}}>
          <span>
            {minLocal&&maxLocal?`${sym}${fmt(minLocal)} – ${sym}${fmt(maxLocal)} ${cur}`:'Any amount'}
          </span>
          <span>⏱ {listing.time_limit||30}min</span>
        </div>
      </div>

      {/* ── ROW 4: Actions ────────────────────────────────────────────── */}
      <div className="px-3 py-2 flex items-center gap-2">
        <button onClick={onViewBuyer}
          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
          style={{borderColor:C.g200}}>
          <Info size={12} style={{color:C.g400}}/>
        </button>
        <button onClick={onSell}
          className="flex-1 py-1.5 rounded-md text-white font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          style={{backgroundColor:C.sell}}>
          <DollarSign size={11}/> SELL BTC <ArrowRight size={10}/>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SellBitcoin({user}) {
  const navigate = useNavigate();
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [btcPrice, setBtcPrice]       = useState(68000);
  const [loadingRates, setLoadingRates]= useState(false);
  const [selCountry, setSelCountry]   = useState(COUNTRIES[0]);
  const [selPayment, setSelPayment]   = useState('all');
  const [showCountry, setShowCountry] = useState(false);
  const [sortBy, setSortBy]           = useState('rate_high'); // highest = best for seller
  const [modal, setModal]             = useState(null);
  const [liked, setLiked]             = useState(new Set());
  const [sellAmt, setSellAmt]         = useState('');
  const [activeTab, setActiveTab]     = useState('all');
  const countryRef = useRef(null);
  const [search, setSearch]           = useState('');

  // Detect user's country from IP on load
  useEffect(()=>{
    fetchRates(); loadOffers();
    detectCountry();
  },[]);
  useEffect(()=>{
    const h=e=>{if(countryRef.current&&!countryRef.current.contains(e.target))setShowCountry(false);};
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  // Auto-detect user's country from IP
  const detectCountry = async () => {
    try {
      const r = await axios.get('https://ipapi.co/json/');
      const code = r.data?.country_code;
      if (code) {
        const found = COUNTRIES.find(c=>c.code===code);
        if (found) setSelCountry(found);
      }
    } catch {} // silently fail — keep 'All Countries' default
  };

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const r = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try { const r2=await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json'); setBtcPrice(r2.data.bpi.USD.rate_float); }
      catch {}
    }
    finally{setLoadingRates(false);}
  };

  const loadOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/listings`);
      const all = (res.data.listings||[]).map(l=>({...l,users:Array.isArray(l.users)?l.users[0]:l.users}));
      const buys = all.filter(l=>
        l.listing_type==='BUY'||l.listing_type==='BUY_BITCOIN'||l.listing_type==='BUY_GIFT_CARD'||
        l.gift_card_brand==='Buy Bitcoin'||l.giftCardBrand==='Buy Bitcoin'
      );
      setOffers(buys.length>0?buys:all);
    } catch{toast.error('Failed to load marketplace');}
    finally{setLoading(false);}
  };

  const getFiltered = () => {
    let list=[...offers];
    if (activeTab==='online')   list=list.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300);
    if (activeTab==='verified') list=list.filter(l=>isVerified(l.users||{}));
    if (selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if (selPayment!=='all')      list=list.filter(l=>String(l.payment_method||'').toLowerCase().includes(selPayment));
    if (sellAmt && parseFloat(sellAmt)>0) {
      const a=parseFloat(sellAmt);
      list=list.filter(l=>a>=(l.min_limit_btc||0)&&a<=(l.max_limit_btc||999));
    }
    if (search) list = list.filter(l => (l.users?.username||'').toLowerCase().includes(search.toLowerCase()));
    if (sortBy==='rate_high') list.sort((a,b)=>parseFloat(b.margin||0)-parseFloat(a.margin||0));
    else if(sortBy==='rate_low') list.sort((a,b)=>parseFloat(a.margin||0)-parseFloat(b.margin||0));
    else if(sortBy==='rating')   list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    else if(sortBy==='trades')   list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));
    return list;
  };

  const handleSell = (id) => {
    if (!user){toast.info('Please login to start trading');navigate('/login');return;}
    navigate(`/listing/${id}`);
  };

  const pfInfo    = PAYMENT_FILTERS.find(p=>p.value===selPayment);
  const hdrName   = selPayment==='all'?'Local Currency':pfInfo?.label||'Local Currency';
  const hdrIcon   = pfInfo?.icon||'💳';
  const filtered  = getFiltered();
  const onlineCnt = offers.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300).length;
  const cur       = selCountry.code!=='ALL'?selCountry.currency:'GHS';
  const sym       = selCountry.code!=='ALL'?selCountry.symbol:'₵';
  const usdRate   = USD_RATES[cur]||1;
  const estLocal  = sellAmt?(parseFloat(sellAmt)*btcPrice*usdRate):0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:C.sell,borderTopColor:'transparent'}}/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.mist,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3 space-y-3">

        {/* ── HEADER — amber/sell accent ──────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{background:`linear-gradient(135deg,${C.forest},${C.sell})`}}>
          <div className="px-5 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black leading-tight" style={{fontFamily:"'Syne',sans-serif"}}>
                  <span className="text-white">Sell BTC </span>
                  <span className="text-white/40 text-lg">for </span>
                  <span style={{background:`linear-gradient(90deg,${C.gold},#FCD34D)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                    {hdrIcon} {hdrName}
                  </span>
                </h1>
                <p className="text-white/50 text-xs mt-1">
                  Find buyers • Escrow protected • 0.5% fee only
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">1 USD</p>
                  <p className="text-white font-black text-base">
                    = <span style={{color:C.gold}}>{fmt(USD_RATES[selCountry.code!=='ALL'?selCountry.currency:'GHS'],2)}</span>
                    <span className="text-white/40 text-xs ml-1">{selCountry.code!=='ALL'?selCountry.currency:'GHS'}</span>
                  </p>
                </div>
                <div className="w-px h-8 bg-white/20"/>
                <div>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest">1 BTC</p>
                  <p className="font-black text-base" style={{color:C.gold}}>
                    = {CUR_SYM[selCountry.code!=='ALL'?selCountry.currency:'GHS']||'₵'}
                    {fmt(btcPrice*(USD_RATES[selCountry.code!=='ALL'?selCountry.currency:'GHS']||1))}
                  </p>
                </div>
                <button onClick={()=>{fetchRates();loadOffers();}}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  <RefreshCw size={13} className={`text-white ${loadingRates?'animate-spin':''}`}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border p-3" style={{borderColor:C.g200}}>
          <div className="flex flex-wrap gap-2 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Search Buyer</label>
              <div className="relative mt-0.5">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buyer name"
                  className="w-full pl-8 pr-2 py-2 text-xs border-2 rounded-lg focus:outline-none"
                  style={{borderColor:search?C.sell:C.g200}}/>
              </div>
            </div>

            {/* BTC amount */}
            <div className="flex-1 min-w-[120px]">
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Sell BTC Amount</label>
              <div className="relative mt-0.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{color:C.g400}}>₿</span>
                <input type="number" value={sellAmt} onChange={e=>setSellAmt(e.target.value)} placeholder="0.001"
                  className="w-full pl-6 pr-2 py-2 text-xs border-2 rounded-lg focus:outline-none"
                  style={{borderColor:sellAmt?C.sell:C.g200}}/>
              </div>
              {sellAmt&&<p className="text-[9px] mt-0.5" style={{color:C.sell}}>≈ {sym}{fmt(estLocal)} {cur}</p>}
            </div>

            {/* Country */}
            <div className="relative" ref={countryRef}>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Country</label>
              <button onClick={()=>setShowCountry(!showCountry)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg flex items-center gap-1.5"
                style={{borderColor:selCountry.code!=='ALL'?C.sell:C.g200}}>
                {/* Show real ISO flag */}
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
                      {selCountry.code===c.code&&<CheckCircle size={10} style={{color:C.sell,marginLeft:'auto'}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Payment</label>
              <select value={selPayment} onChange={e=>setSelPayment(e.target.value)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg focus:outline-none block"
                style={{borderColor:selPayment!=='all'?C.sell:C.g200}}>
                {PAYMENT_FILTERS.map(p=><option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-wide" style={{color:C.g500}}>Sort</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                className="mt-0.5 px-2.5 py-2 text-xs border-2 rounded-lg focus:outline-none block"
                style={{borderColor:C.g200}}>
                <option value="rate_high">Best Rate (Highest) ↑</option>
                <option value="rate_low">Lowest Rate ↓</option>
                <option value="rating">Top Rated</option>
                <option value="trades">Most Trades</option>
              </select>
            </div>

            <button onClick={()=>navigate('/create-offer')}
              className="mt-auto px-3 py-2 rounded-lg font-black text-xs flex items-center gap-1.5"
              style={{backgroundColor:C.sell,color:C.white}}>
              <PlusCircle size={12}/> Post Buy Offer
            </button>
          </div>

          {/* Tab filters */}
          <div className="flex gap-1.5 mt-2 pt-2 border-t" style={{borderColor:C.g100}}>
            {[['all','All Buyers'],['online','🟢 Online'],['verified','✅ Verified']].map(([t,l])=>(
              <button key={t} onClick={()=>setActiveTab(t)}
                className="px-3 py-1 rounded-full text-xs font-bold transition"
                style={{backgroundColor:activeTab===t?C.sell:C.g100,color:activeTab===t?C.white:C.g600}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── COUNT ROW ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{color:C.g500}}>
            <span className="font-black" style={{color:C.g800}}>{filtered.length}</span> buyers
            {selCountry.code!=='ALL'&&` · ${selCountry.flag} ${selCountry.name}`}
            {selPayment!=='all'&&` · ${pfInfo?.icon} ${pfInfo?.label}`}
          </p>
          <span className="flex items-center gap-1 text-[10px]" style={{color:C.g400}}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
            {onlineCnt} online
          </span>
        </div>

        {/* ── OFFER GRID — compact, 5 columns max ────────────────────── */}
        {filtered.length===0?(
          <div className="bg-white rounded-xl border p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-black text-sm mb-1" style={{color:C.g800}}>No buyers found</p>
            <p className="text-xs mb-4" style={{color:C.g400}}>Adjust filters or post the first buy offer</p>
            <button onClick={()=>navigate('/create-offer')}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold"
              style={{backgroundColor:C.sell}}>
              Post Buy Offer
            </button>
          </div>
        ):(
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map(l=>(
              <OfferCard
                key={l.id}
                listing={l}
                btcPriceUSD={btcPrice}
                onViewBuyer={()=>setModal({buyer:l.users||{},listing:l})}
                onSell={()=>handleSell(l.id)}
                liked={liked.has(l.id)}
                onToggleLike={()=>setLiked(prev=>{const n=new Set(prev);n.has(l.id)?n.delete(l.id):n.add(l.id);return n;})}
              />
            ))}
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.sellBg,borderColor:'#FDE68A'}}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{color:C.sell}}/>
          <p className="text-[10px] leading-relaxed" style={{color:'#92400E'}}>
            <strong>Sell Safely:</strong> Never release Bitcoin before confirming payment received. All trades are escrow-protected. Report suspicious buyers immediately.
          </p>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="mt-4" style={{backgroundColor:C.forest}}>
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg" style={{backgroundColor:C.gold,color:C.forest}}>P</div>
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
                {[['Sell Bitcoin','/sell-bitcoin'],['Buy Bitcoin','/buy-bitcoin'],['Create Offer','/create-offer'],['My Trades','/my-trades']].map(([l,h])=>(
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t" style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-[10px] flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>

      {/* Buyer modal */}
      {modal&&(
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
