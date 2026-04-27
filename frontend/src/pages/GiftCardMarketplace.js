import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle, RefreshCw, AlertTriangle,
  BadgeCheck, Timer, X, Info, Shield,
  ArrowRight, PlusCircle, Filter,
  Home, Wallet, User, Gift, Bitcoin,
  ChevronDown, CreditCard, ThumbsUp, ThumbsDown, Repeat2
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import { TRUST_MAP, deriveBadge } from '../lib/badge';
import ActiveTradeCard from '../components/ActiveTradeCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', accent:'#0D9488', mist:'#F0FAF5',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B',
};

// ── Trust badge map ───────────────────────────────────────────────────────────

const CUR_SYM = {
  GHS:'₵',  NGN:'₦',  KES:'KSh', ZAR:'R',  UGX:'USh', TZS:'TSh',
  USD:'$',  GBP:'£',  EUR:'€',   XAF:'CFA', XOF:'CFA',
  INR:'₹',  CNY:'¥',  JPY:'¥',  KRW:'₩',  PHP:'₱',  THB:'฿',
  MYR:'RM', IDR:'Rp', VND:'₫',  PKR:'₨',  BDT:'৳',  RUB:'₽', VES:'Bs.',
};

const COUNTRIES = [
  {code:'ALL', name:'All Countries',  flag:'🌍'},
  {code:'GH',  name:'Ghana',          flag:'🇬🇭'},
  {code:'NG',  name:'Nigeria',        flag:'🇳🇬'},
  {code:'KE',  name:'Kenya',          flag:'🇰🇪'},
  {code:'ZA',  name:'South Africa',   flag:'🇿🇦'},
  {code:'UG',  name:'Uganda',         flag:'🇺🇬'},
  {code:'TZ',  name:'Tanzania',       flag:'🇹🇿'},
  {code:'US',  name:'United States',  flag:'🇺🇸'},
  {code:'GB',  name:'United Kingdom', flag:'🇬🇧'},
  {code:'EU',  name:'Europe',         flag:'🇪🇺'},
  {code:'CM',  name:'Cameroon',       flag:'🇨🇲'},
  {code:'SN',  name:'Senegal',        flag:'🇸🇳'},
  {code:'CI',  name:"Côte d'Ivoire",  flag:'🇨🇮'},
  {code:'DE',  name:'Germany',        flag:'🇩🇪'},
  {code:'ES',  name:'Spain',          flag:'🇪🇸'},
  {code:'RU',  name:'Russia',         flag:'🇷🇺'},
  {code:'VE',  name:'Venezuela',      flag:'🇻🇪'},
  {code:'CN',  name:'China',          flag:'🇨🇳'},
  {code:'JP',  name:'Japan',          flag:'🇯🇵'},
  {code:'KR',  name:'South Korea',    flag:'🇰🇷'},
  {code:'PH',  name:'Philippines',    flag:'🇵🇭'},
  {code:'TH',  name:'Thailand',       flag:'🇹🇭'},
  {code:'IN',  name:'India',          flag:'🇮🇳'},
];

const CURRENCIES = [
  {code:'GHS', symbol:'₵',   name:'Ghana Cedi'},
  {code:'NGN', symbol:'₦',   name:'Nigerian Naira'},
  {code:'KES', symbol:'KSh', name:'Kenyan Shilling'},
  {code:'ZAR', symbol:'R',   name:'SA Rand'},
  {code:'USD', symbol:'$',   name:'US Dollar'},
  {code:'GBP', symbol:'£',   name:'British Pound'},
  {code:'EUR', symbol:'€',   name:'Euro'},
  {code:'XAF', symbol:'CFA', name:'CFA Franc'},
  {code:'INR', symbol:'₹',   name:'Indian Rupee'},
  {code:'CNY', symbol:'¥',   name:'Chinese Yuan'},
  {code:'JPY', symbol:'¥',   name:'Japanese Yen'},
  {code:'KRW', symbol:'₩',   name:'Korean Won'},
  {code:'RUB', symbol:'₽',   name:'Russian Ruble'},
  {code:'PHP', symbol:'₱',   name:'Philippine Peso'},
];

const PAYMENT_OPTIONS = [
  'All Payments','MTN Mobile Money','Vodafone Cash','AirtelTigo Money',
  'M-Pesa','Bank Transfer','PayPal','Cash App','OPay','PalmPay',
  'Orange Money','Wave','Zelle','Revolut',
];

const GC_BRANDS = [
  'All Brands','Amazon','Apple / iTunes','Google Play','Steam','eBay',
  'Walmart','Target','Visa Gift Card','Mastercard GC','Netflix',
  'Spotify','Xbox','PlayStation','Nintendo','Razer Gold','Roblox','Other',
];

const GC_FACE_VALUES = [10,20,25,50,100,200,500,1000];

const fmt  = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fBtc = (n)     => parseFloat(n||0).toFixed(6);

const getUser     = (u) => Array.isArray(u)?u[0]:(u||{});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades??u?.trade_count??0);
const getLastSeen = (u) => {
  const d=u?.last_login||u?.last_seen||u?.updated_at||u?.created_at;
  if(!d) return {label:'—',online:false};
  const s=(Date.now()-new Date(d))/1000;
  if(s<300)   return {label:'ACTIVE NOW', online:true};
  if(s<3600)  { const m=~~(s/60); return {label:`${m} ${m===1?'min':'mins'} ago`, online:false}; }
  if(s<86400) { const h=~~(s/3600); return {label:`${h} ${h===1?'hr':'hrs'} ago`, online:false}; }
  const dy=~~(s/86400); return {label:`${dy} ${dy===1?'day':'days'} ago`, online:false};
};
const getRateUSD  = (l,btcPrice) => {
  if(l.pricing_type==='fixed'){const s=parseFloat(l.bitcoin_price||0);if(s>100)return s;}
  return btcPrice*(1+parseFloat(l.margin||0)/100);
};
const getBrand = (l) => l.gift_card_brand||l.giftCardBrand||l.card_brand||'Gift Card';
const getFaceVal = (l) => { const v=l.face_value||l.card_value||l.amount_usd; return v?parseFloat(v):null; };
const getCardRange = (l) => {
  let arr = l.card_values||l.face_values||l.accepted_denominations||l.denominations||l.card_denominations;
  if (typeof arr === 'string') {
    // Handle PostgreSQL array format: {10,20,50}
    if (arr.startsWith('{')) arr = arr.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean);
    else { try { arr = JSON.parse(arr); } catch { arr = arr.split(',').map(Number).filter(Boolean); } }
  }
  if(Array.isArray(arr)&&arr.length) return arr.map(v=>parseFloat(v)).filter(Boolean).sort((a,b)=>a-b);
  const fv = getFaceVal(l);
  if(fv) return [fv];
  const min = l.min_face_value||l.min_card_value; const max = l.max_face_value||l.max_card_value;
  if(min&&max) return [{min:parseFloat(min),max:parseFloat(max),isRange:true}];
  return null;
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({user, size=48, radius='rounded-xl'}) {
  const [err,setErr] = useState(false);
  const u = getUser(user);
  if(u?.avatar_url&&!err) return (
    <img src={u.avatar_url} alt={u.username||'user'} onError={()=>setErr(true)}
      className={`object-cover flex-shrink-0 ${radius}`} style={{width:size,height:size}}/>
  );
  return (
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.accent,fontSize:Math.round(size*0.38)}}>
      {(u?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Gift Card Offer Card ──────────────────────────────────────────────────────
function GCCard({listing, btcPriceUSD, onViewSeller, onTrade}) {
  const {rates:USD_RATES} = useRates();
  const u        = getUser(listing.users);
  const badge    = deriveBadge(u);
  const [seen, setSeen] = useState(() => getLastSeen(u));
  useEffect(() => {
    const id = setInterval(() => setSeen(getLastSeen(u)), 30000);
    return () => clearInterval(id);
  }, []);
  const trades   = getTrades(u);
  const brand    = getBrand(listing);
  const fv       = getFaceVal(listing);
  const margin   = parseFloat(listing.margin||0);
  const cur      = listing.currency||'USD';
  const sym      = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate  = USD_RATES[cur]||1;
  const rateUSD  = getRateUSD(listing, btcPriceUSD);
  const rateLocal= rateUSD*usdRate;

  const cardType  = listing.card_type || 'both';
  const cardRange = getCardRange(listing);
  const youGive = (() => {
    if (!cardRange) { const ml=listing.min_limit_local||(fv?fv*usdRate:0); return {val:`${sym}${fmt(ml)}`,sub:cur}; }
    if (cardRange[0]?.isRange) return {val:`$${cardRange[0].min}`,sub:'USD starting'};
    if (cardRange.length===1) return {val:`$${cardRange[0]}`,sub:'USD card'};
    return {val:`$${cardRange[0]}`,sub:'USD starting'};
  })();
  const refUSD   = cardRange ? (cardRange[0]?.isRange ? cardRange[0].min : cardRange[0]) : (fv||1);
  const btcGross = refUSD / rateUSD;
  const btcOut   = btcGross - btcGross*0.005;

  const marginLabel = margin===0?'Market':margin>0?`+${margin}%`:`${margin}%`;
  const marginBg    = margin>10?C.danger:margin>0?C.warn:C.success;

  const pos   = parseInt(u.positive_feedback||0);
  const neg   = parseInt(u.negative_feedback||0);

  const pmLabel  = listing.payment_method||'Payment';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all w-full min-w-0"
      style={{borderColor:C.g200}}>

      {/* ─ Seller row ────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">

          {/* Avatar + online */}
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
            <div className="flex items-center gap-1.5 overflow-hidden">
              <CountryFlag
                countryCode={(u?.country_code||u?.country||'gh').toLowerCase()}
                className="w-4 h-3 rounded-sm flex-shrink-0"/>
              <button onClick={onViewSeller}
                className="font-black text-sm hover:underline leading-tight truncate flex-shrink min-w-0"
                style={{color:C.g800, maxWidth:'130px'}}>
                {u.username||'Seller'}
              </button>
              {isVerified(u) && <BadgeCheck size={13} style={{color:'#3B82F6',flexShrink:0}}/>}
              <span className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badge.animate ? 'shadow-md' : ''}`}
                style={{background:badge.bg, borderColor:badge.borderColor, boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
                <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                <span style={{color:badge.textColor}}>{badge.label}</span>
              </span>
            </div>

            {/* Stats row — feedback left, trades+status right */}
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

            {/* Card brand + type */}
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex flex-col px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{backgroundColor:C.g100, minWidth:0}}>
                <span className="text-xs font-normal leading-snug" style={{color:C.g400}}>I'm buying</span>
                <span className="text-xs font-black leading-snug tracking-wide truncate" style={{color:C.g700, maxWidth:'110px'}}>
                  {/card/i.test(brand) ? brand.toUpperCase() : `${brand.toUpperCase()} CARD`}
                </span>
              </span>
              <div className="flex flex-col gap-1.5">
                {(cardType==='physical'||cardType==='both') && (
                  <span className="inline-flex items-center font-bold rounded-full whitespace-nowrap"
                    style={{backgroundColor:'#DCFCE7', color:'#166534', fontSize:'9px', padding:'2px 7px'}}>
                    Physical
                  </span>
                )}
                {(cardType==='ecode'||cardType==='both') && (
                  <span className="inline-flex items-center font-bold rounded-full whitespace-nowrap"
                    style={{backgroundColor:'#EDE9FE', color:'#5B21B6', fontSize:'9px', padding:'2px 7px'}}>
                    E-Code
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─ Divider ───────────────────────────────────────────────── */}
      <div style={{height:1,backgroundColor:C.g100}}/>

      {/* ─ You Give / You Receive ────────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{color:C.g500}}>YOU GIVE</p>
          <p className="text-2xl font-black leading-tight" style={{color:C.g800}}>{youGive.val}</p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>{youGive.sub}</p>
        </div>
        <div className="border-l pl-2.5" style={{borderColor:C.g100}}>
          <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{color:C.g500}}>YOU RECEIVE</p>
          <p className="text-2xl font-black leading-tight" style={{color:C.gold}}>₿{fBtc(btcOut)}</p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>Bitcoin</p>
        </div>
      </div>

      {/* ─ Card Range ───────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <p className="text-xs font-semibold mb-1" style={{color:C.g400}}>Card Range</p>
        <div className="flex flex-wrap gap-1">
          {!cardRange
            ? <span className="text-xs font-bold" style={{color:C.g500}}>Any Value</span>
            : <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                style={{backgroundColor:C.forest+'15', color:C.forest, border:`1px solid ${C.forest}30`}}>
                ${cardRange[0]?.isRange ? cardRange[0].min : cardRange[0]}
              </span>
          }
        </div>
      </div>

      {/* ─ Rate + margin ─────────────────────────────────────────── */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold" style={{color:C.g600}}>
          Rate: {sym}{fmt(rateLocal)}/BTC
        </p>
        <span className="text-xs font-black px-1.5 py-0.5 rounded"
          style={{backgroundColor:marginBg, color:'#fff'}}>
          {marginLabel}
        </span>
      </div>

      {/* ─ Actions ───────────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button onClick={onViewSeller}
          className="w-10 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition"
          style={{borderColor:C.g200}}>
          <Info size={14} style={{color:C.g400}}/>
        </button>
        <button onClick={onTrade}
          className="flex-1 h-11 rounded-xl text-white font-black text-base flex items-center justify-center gap-1.5 hover:opacity-90 transition active:scale-[0.98]"
          style={{backgroundColor:C.forest}}>
          TRADE <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

// ── Seller Modal ──────────────────────────────────────────────────────────────
function SellerModal({seller, listing, onClose, onTrade}) {
  const [tab, setTab] = useState('rules');
  const {rates:USD_RATES} = useRates();
  if(!seller) return null;
  const u      = getUser(seller);
  const badge  = deriveBadge(u);
  const seen   = getLastSeen(u);
  const trades = getTrades(u);
  const rating = parseFloat(u.average_rating||0);
  const fb     = parseInt(u.total_feedback_count??u.feedback_count??0);
  const brand  = getBrand(listing||{});
  const fv     = getFaceVal(listing||{});
  const cur    = listing?.currency||'USD';
  const sym    = listing?.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate= USD_RATES[cur]||1;
  const rate   = getRateUSD(listing||{},68000)*usdRate;
  const margin = parseFloat(listing?.margin||0);
  const ccCode = (u?.country_code||u?.country||'gh').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden"
      style={{backgroundColor:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        style={{border:`1px solid ${C.g200}`,animation:'slideUp .25s ease'}}>

        {/* Header */}
        <div className="relative p-5 text-white flex-shrink-0"
          style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white"/>
          </button>
          {/* Brand tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-3"
            style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
            <CreditCard size={11} className="text-white/70"/>
            <span className="text-xs font-black text-white">{brand}</span>
            {fv&&<span className="text-xs font-black text-white/70">${fv}</span>}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar user={u} size={52} radius="rounded-xl"/>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{backgroundColor:seen.online?C.online:C.g400}}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base leading-tight">{u.username||'Seller'}</h3>
                {isVerified(u)&&<BadgeCheck size={14} style={{color:'#99F6E4'}}/>}
                <CountryFlag countryCode={ccCode} className="w-4 h-3 rounded-sm"/>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded-full border ${badge.animate ? 'shadow-md' : ''}`}
                  style={{background:badge.bg, borderColor:badge.borderColor, boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
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

          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20 text-center">
            {[
              {label:'Trades',  value:fmt(trades)},
              {label:'Rating',  value:`${rating.toFixed(1)}★`},
              {label:'Reviews', value:fmt(fb)},
              {label:'Done',    value:`${u.completion_rate||98}%`},
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
                color:tab===t?C.green:C.g500,
                borderBottom:tab===t?`2px solid ${C.green}`:'2px solid transparent',
                backgroundColor:tab===t?`${C.green}08`:'transparent'
              }}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {tab==='rules'?(
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                style={{backgroundColor:C.mist,color:C.g700,border:`1px solid ${C.g200}`}}>
                {listing?.trade_instructions||listing?.description||
                  'Send the gift card code and PIN in the trade chat. Wait for buyer confirmation before release.'}
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{backgroundColor:'#FFFBEB',border:'1px solid #FDE68A'}}>
                <Timer size={12} style={{color:C.warn,flexShrink:0}}/>
                <p className="text-xs font-bold" style={{color:'#92400E'}}>
                  Time limit: {listing?.time_limit||30} min — auto-cancels if not completed
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{backgroundColor:'#FEF2F2'}}>
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{color:C.danger}}/>
                <p className="text-xs text-red-600">Only share card codes inside the active trade chat. Escrow protects both parties.</p>
              </div>
            </div>
          ):(
            <div className="space-y-1.5">
              {[
                {label:'Card Brand', value:brand},
                {label:'Face Value', value:fv?`$${fv} USD`:'Varies'},
                {label:'Payment',    value:listing?.payment_method||'—'},
                {label:'Rate / BTC', value:`${sym}${fmt(rate)} ${cur}`},
                {label:'Margin',     value:margin===0?'Market rate':margin>0?`+${margin}% above market`:`${margin}% below market`},
                {label:'Time limit', value:`${listing?.time_limit||30} minutes`},
                {label:'Country',    value:listing?.country_name||u.country||'—'},
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

        <div className="p-4 pt-0 flex gap-2 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50"
            style={{borderColor:C.g200,color:C.g600}}>Close</button>
          <button onClick={()=>{onClose();onTrade();}}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
            style={{backgroundColor:C.forest}}>
            Trade Now <ArrowRight size={14}/>
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
  const activeId = 'giftcards';
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden"
      style={{borderColor:C.g200,paddingBottom:'env(safe-area-inset-bottom)'}}>
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map(({id,icon:Icon,label,path:to})=>{
          const active=id===activeId;
          return (
            <button key={id} onClick={()=>navigate(to)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{
                color:active?C.forest:C.g400,
                backgroundColor:active?`${C.forest}12`:'transparent',
                minWidth:'52px',
              }}>
              <Icon size={22} strokeWidth={active?2.5:1.8}/>
              <span className="text-xs font-bold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main GiftCards Page ───────────────────────────────────────────────────────
export default function GiftCards({user}) {
  const navigate = useNavigate();
  const {rates:USD_RATES, btcUsd:contextBtcUsd} = useRates();
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [btcPrice,     setBtcPrice]     = useState(68000);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selCountry,   setSelCountry]   = useState(COUNTRIES[0]);
  const [selCurrency,  setSelCurrency]  = useState(CURRENCIES[0]);
  const [selPayment,   setSelPayment]   = useState('All Payments');
  const [selBrand,     setSelBrand]     = useState('All Brands');
  const [selFaceValue, setSelFaceValue] = useState(0);
  const [sortBy,       setSortBy]       = useState('rate_low');
  const [showFilters,  setShowFilters]  = useState(false);
  const [showCountry,  setShowCountry]  = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showPayment,  setShowPayment]  = useState(false);
  const [showBrand,    setShowBrand]    = useState(false);
  const [modal,        setModal]        = useState(null);
  const [activeTrades, setActiveTrades] = useState([]);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const countryRef  = useRef(null);
  const currencyRef = useRef(null);
  const paymentRef  = useRef(null);
  const brandRef    = useRef(null);

  useEffect(()=>{ if(contextBtcUsd>0) setBtcPrice(contextBtcUsd); },[contextBtcUsd]);
  useEffect(()=>{ fetchRates(); loadListings(); },[]);
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
  },[]);
  useEffect(()=>{
    const h=e=>{
      if(countryRef.current&&!countryRef.current.contains(e.target))   setShowCountry(false);
      if(currencyRef.current&&!currencyRef.current.contains(e.target)) setShowCurrency(false);
      if(paymentRef.current&&!paymentRef.current.contains(e.target))   setShowPayment(false);
      if(brandRef.current&&!brandRef.current.contains(e.target))       setShowBrand(false);
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const r=await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      setBtcPrice(r.data.bitcoin.usd);
    } catch {
      try { const r2=await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json'); setBtcPrice(r2.data.bpi.USD.rate_float); }
      catch {}
    } finally { setLoadingRates(false); }
  };

  const loadListings = async () => {
    try {
      const r=await axios.get(`${API_URL}/listings`);
      const all=(r.data.listings||[]).map(l=>({...l,users:Array.isArray(l.users)?l.users[0]:l.users}));
      setListings(all.filter(l=>l.listing_type==='BUY_GIFT_CARD'||l.listing_type==='SELL_GIFT_CARD'));
    } catch { toast.error('Failed to load gift card marketplace'); }
    finally { setLoading(false); }
  };

  const getFiltered = () => {
    let list=[...listings];
    if(selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if(selBrand!=='All Brands') list=list.filter(l=>(getBrand(l)||'').toLowerCase().includes(selBrand.toLowerCase()));
    if(selPayment!=='All Payments') list=list.filter(l=>(l.payment_method||'').toLowerCase().includes(selPayment.toLowerCase()));
    if(selFaceValue>0) list=list.filter(l=>getFaceVal(l)===selFaceValue);
    if(sortBy==='rate_low')  list.sort((a,b)=>parseFloat(a.margin||0)-parseFloat(b.margin||0));
    if(sortBy==='rate_high') list.sort((a,b)=>parseFloat(b.margin||0)-parseFloat(a.margin||0));
    if(sortBy==='rating')    list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    if(sortBy==='trades')    list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));
    return list;
  };

  const handleTrade = (id) => {
    if(!user){ navigate('/login?message=Please log in to start trading'); return; }
    navigate(`/listing/${id}`);
  };

  const filtered   = getFiltered();
  const cur        = selCurrency.code||'GHS';
  const sym        = selCurrency.symbol||'₵';
  const usdRate    = USD_RATES[cur]||1;
  const btcLocal   = btcPrice*usdRate;
  const onlineCnt  = listings.filter(l=>(Date.now()-new Date(l.users?.last_login||0))/1000<300).length;
  const hasFilters = selPayment!=='All Payments'||selFaceValue>0||sortBy!=='rate_low';

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.g100}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:C.mint,borderTopColor:'transparent'}}/>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 overflow-x-hidden"
      style={{backgroundColor:C.g100,fontFamily:"'DM Sans',sans-serif"}}>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        body{overflow-x:hidden}
        .dropdown-panel{max-width:calc(100vw - 24px)}
      `}</style>

      {/* ══════════════════════════════════════════════════
          1. RATE BAR
      ══════════════════════════════════════════════════ */}
      <div style={{backgroundColor:C.forest}} className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-xl md:text-3xl font-black text-white leading-tight mb-1.5">
                Gift Card <span style={{color:C.gold}}>Marketplace</span>
              </p>
              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.5)'}}>
                  1 USD = <span className="font-black" style={{color:'rgba(255,255,255,0.75)'}}>{sym}{fmt(usdRate,2)} {cur}</span>
                </span>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:10}}>|</span>
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

      {/* ══════════════════════════════════════════════════
          2. TAB NAVIGATION
      ══════════════════════════════════════════════════ */}
      <div className="bg-white border-b sticky top-0 z-30" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3">
          <div className="flex items-center">
            <div className="flex items-center">
              {[
                {label:'Buy BTC',    path:'/buy-bitcoin',  active:false},
                {label:'Sell BTC',   path:'/sell-bitcoin', active:false},
                {label:'Gift Cards', path:'/gift-cards',   active:true},
              ].map(tab=>(
                <Link key={tab.path} to={tab.path}
                  className="px-3 sm:px-4 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor:tab.active?C.forest:'transparent',
                    color:tab.active?C.forest:C.g500,
                  }}>
                  {tab.label}
                </Link>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 py-2 pl-4 flex-shrink-0">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
              <span className="text-xs font-semibold" style={{color:C.g400}}>{onlineCnt} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          4. FILTER BAR
      ══════════════════════════════════════════════════ */}
      <div className="bg-white border-b" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3 py-2.5">

          {/* Row — 2×2 on mobile, 4-col on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {/* Country selector */}
            <div className="relative" ref={countryRef}>
              <button onClick={()=>{setShowCountry(!showCountry);setShowCurrency(false);}}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                style={{
                  borderColor:selCountry.code!=='ALL'?C.forest:C.g200,
                  color:selCountry.code!=='ALL'?C.forest:C.g600,
                  backgroundColor:selCountry.code!=='ALL'?`${C.forest}08`:'transparent'
                }}>
                <span className="text-base leading-none">{selCountry.flag}</span>
                <span className="text-xs font-black truncate">{selCountry.code==='ALL'?'Country':selCountry.name.split(' ')[0]}</span>
                <ChevronDown size={12} className={`transition-transform flex-shrink-0 ${showCountry?'rotate-180':''}`}
                  style={{color:selCountry.code!=='ALL'?C.forest:C.g400}}/>
              </button>
              {showCountry&&(
                <div className="dropdown-panel absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                  style={{borderColor:C.g100,maxHeight:300,overflowY:'auto',minWidth:'200px',width:'max-content'}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code} onClick={()=>{setSelCountry(c);setShowCountry(false);}}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 border-b last:border-0 transition"
                      style={{borderColor:C.g50}}>
                      <span className="text-base">{c.flag}</span>
                      <span className="font-bold text-xs flex-1 text-left" style={{color:C.g800}}>{c.name}</span>
                      {selCountry.code===c.code&&<CheckCircle size={13} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency selector */}
            <div className="relative" ref={currencyRef}>
              <button onClick={()=>{setShowCurrency(!showCurrency);setShowCountry(false);}}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                style={{
                  borderColor:selCurrency.code!=='GHS'?C.forest:C.g200,
                  color:selCurrency.code!=='GHS'?C.forest:C.g600,
                  backgroundColor:selCurrency.code!=='GHS'?`${C.forest}08`:'transparent'
                }}>
                <span className="text-xs font-black">{selCurrency.symbol}</span>
                <span className="text-xs font-black">{selCurrency.code}</span>
                <ChevronDown size={12} className={`transition-transform flex-shrink-0 ${showCurrency?'rotate-180':''}`}
                  style={{color:C.g400}}/>
              </button>
              {showCurrency&&(
                <div className="dropdown-panel absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                  style={{borderColor:C.g100,maxHeight:300,overflowY:'auto',minWidth:'200px',width:'max-content'}}>
                  {CURRENCIES.map(c=>(
                    <button key={c.code} onClick={()=>{setSelCurrency(c);setShowCurrency(false);}}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 border-b last:border-0 transition"
                      style={{borderColor:C.g50}}>
                      <span className="text-sm font-black w-6 text-center flex-shrink-0" style={{color:C.forest}}>{c.symbol}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-xs" style={{color:C.g800}}>{c.code}</p>
                        <p className="text-xs" style={{color:C.g400}}>{c.name}</p>
                      </div>
                      {selCurrency.code===c.code&&<CheckCircle size={13} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gift Card Brand selector */}
            <div className="relative" ref={brandRef}>
              <button onClick={()=>{setShowBrand(!showBrand);setShowCountry(false);setShowCurrency(false);setShowPayment(false);}}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                style={{
                  borderColor:selBrand!=='All Brands'?C.forest:C.g200,
                  color:selBrand!=='All Brands'?C.forest:C.g600,
                  backgroundColor:selBrand!=='All Brands'?`${C.forest}08`:'transparent'
                }}>
                <span className="text-xs font-black truncate">{selBrand==='All Brands'?'Gift Cards':selBrand.split(' ')[0]}</span>
                <ChevronDown size={12} className={`transition-transform flex-shrink-0 ${showBrand?'rotate-180':''}`}
                  style={{color:selBrand!=='All Brands'?C.forest:C.g400}}/>
              </button>
              {showBrand&&(
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                  style={{borderColor:C.g100,maxHeight:260,overflowY:'auto'}}>
                  {GC_BRANDS.map(b=>(
                    <button key={b} onClick={()=>{setSelBrand(b);setShowBrand(false);}}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 transition"
                      style={{borderColor:C.g50}}>
                      <span className="font-semibold" style={{color:C.g800}}>{b}</span>
                      {selBrand===b&&<CheckCircle size={11} style={{color:C.green}}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={()=>setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-xs font-black transition"
              style={{
                borderColor:showFilters||hasFilters?C.forest:C.g200,
                color:showFilters||hasFilters?C.forest:C.g600,
                backgroundColor:showFilters||hasFilters?`${C.forest}08`:'transparent'
              }}>
              <Filter size={13}/>
              Filter
              {hasFilters&&<span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{backgroundColor:C.forest}}/>}
            </button>
          </div>

          {/* Expanded filter panel */}
          {showFilters&&(
            <div className="mt-2.5 pt-2.5 border-t space-y-3" style={{borderColor:C.g100}}>

              {/* Payment method */}
              <div ref={paymentRef} className="relative">
                <p className="text-xs font-bold mb-1.5" style={{color:C.g500}}>Payment Method</p>
                <button onClick={()=>setShowPayment(!showPayment)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition"
                  style={{
                    borderColor:selPayment!=='All Payments'?C.forest:C.g200,
                    color:selPayment!=='All Payments'?C.forest:C.g600,
                    backgroundColor:selPayment!=='All Payments'?`${C.forest}08`:'transparent'
                  }}>
                  <span>💳</span>
                  <span className="flex-1 text-left truncate">{selPayment}</span>
                  <ChevronDown size={12} style={{color:C.g400}}/>
                </button>
                {showPayment&&(
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                    style={{borderColor:C.g100,maxHeight:240,overflowY:'auto'}}>
                    {PAYMENT_OPTIONS.map(p=>(
                      <button key={p} onClick={()=>{setSelPayment(p);setShowPayment(false);}}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 transition"
                        style={{borderColor:C.g50}}>
                        <span className="font-semibold" style={{color:C.g800}}>{p}</span>
                        {selPayment===p&&<CheckCircle size={11} style={{color:C.green}}/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Face value */}
              <div>
                <p className="text-xs font-bold mb-1.5" style={{color:C.g500}}>Card Denomination (USD)</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={()=>setSelFaceValue(0)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border-2 transition"
                    style={{borderColor:selFaceValue===0?C.forest:C.g200,backgroundColor:selFaceValue===0?C.forest:'transparent',color:selFaceValue===0?'#fff':C.g700}}>
                    All
                  </button>
                  {GC_FACE_VALUES.map(v=>(
                    <button key={v} onClick={()=>setSelFaceValue(v)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black border-2 transition"
                      style={{borderColor:selFaceValue===v?C.forest:C.g200,backgroundColor:selFaceValue===v?C.forest:'transparent',color:selFaceValue===v?'#fff':C.g700}}>
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold mb-1" style={{color:C.g500}}>Sort By</p>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border-2 rounded-xl focus:outline-none"
                    style={{borderColor:C.g200,color:C.g800}}>
                    <option value="rate_low">Best Rate ↑</option>
                    <option value="rate_high">Highest Rate</option>
                    <option value="rating">Top Rated</option>
                    <option value="trades">Most Trades</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={()=>navigate('/create-offer')}
                    className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition hover:opacity-90"
                    style={{backgroundColor:C.gold,color:C.forest}}>
                    <PlusCircle size={13}/> Post Offer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          5. OFFER GRID
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-3 py-3 space-y-3">

        {/* ── Inline active trade cards ── */}
        {activeTrades.length > 0 && (
          <div className="mb-2">
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

        {/* Count row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{color:C.g500}}>
            <span className="font-black text-sm" style={{color:C.g800}}>{filtered.length}</span>{' '}
            offers
            {selBrand!=='All Brands'&&` · ${selBrand}`}
            {selFaceValue>0&&` · $${selFaceValue}`}
            {selCountry.code!=='ALL'&&` · ${selCountry.flag} ${selCountry.name}`}
          </p>
          <button onClick={()=>navigate('/create-offer')}
            className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{backgroundColor:`${C.forest}12`,color:C.forest}}>
            <PlusCircle size={12}/> Post Offer
          </button>
        </div>

        {filtered.length===0?(
          <div className="bg-white rounded-2xl border p-10 text-center" style={{borderColor:C.g200}}>
            <p className="text-5xl mb-4">🎁</p>
            <p className="font-black text-base mb-1" style={{color:C.g800}}>No gift card offers found</p>
            <p className="text-sm" style={{color:C.g400}}>Try a different brand or be the first to post</p>
            <button onClick={()=>navigate('/create-offer')}
              className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90 transition"
              style={{backgroundColor:C.forest}}>
              Post Offer
            </button>
          </div>
        ):(
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map(l=>(
              <GCCard
                key={l.id}
                listing={l}
                btcPriceUSD={btcPrice}
                onViewSeller={()=>setModal({seller:l.users||{},listing:l})}
                onTrade={()=>handleTrade(l.id)}
              />
            ))}
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.mist,borderColor:`${C.green}30`}}>
          <Shield size={13} className="flex-shrink-0 mt-0.5" style={{color:C.green}}/>
          <p className="text-xs leading-relaxed" style={{color:C.g700}}>
            <strong>Trade Safely:</strong> Only share gift card codes inside the active escrow trade.
            Never send codes before the trade is confirmed locked. Every trade is platform-protected.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          6. BOTTOM NAVIGATION (mobile only)
      ══════════════════════════════════════════════════ */}
      <BottomNav/>

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
