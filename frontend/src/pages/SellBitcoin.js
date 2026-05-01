import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Bitcoin, CheckCircle, RefreshCw,
  AlertTriangle, BadgeCheck, Timer,
  X, Info, ArrowRight, PlusCircle,
  Filter, Home, Wallet, User, Gift, Shield,
  ChevronDown, ThumbsUp, ThumbsDown, Repeat2,
  Phone, Mail, Ban
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';
import { TRUST_MAP, deriveBadge } from '../lib/badge';
import ActiveTradeCard from '../components/ActiveTradeCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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


const CUR_SYM = {
  GHS:'₵', NGN:'₦', KES:'KSh', ZAR:'R', UGX:'USh', TZS:'TSh',
  USD:'$', GBP:'£', EUR:'€', XAF:'CFA', XOF:'CFA', RWF:'RF',
  MZN:'MT', ZMW:'ZK', CDF:'FC', EGP:'E£', MAD:'MAD',
  INR:'₹', CNY:'¥', PHP:'₱', IDR:'Rp', PKR:'₨', BDT:'৳',
  VND:'₫', THB:'฿', MYR:'RM', SGD:'S$', AED:'AED', SAR:'SR',
  BRL:'R$', MXN:'MX$', COP:'COP$', TRY:'₺', PLN:'zł', UAH:'₴',
};

const COUNTRY_REGIONS = {
  Africa:'#10B981', Asia:'#3B82F6', 'Middle East':'#F97316',
  Americas:'#EC4899', Europe:'#7C3AED',
};

const COUNTRIES = [
  {code:'ALL', name:'All Countries',  flag:'🌍', currency:'USD', symbol:'$',    region:null},
  // Africa
  {code:'GH',  name:'Ghana',          flag:'🇬🇭', currency:'GHS', symbol:'₵',    region:'Africa'},
  {code:'NG',  name:'Nigeria',        flag:'🇳🇬', currency:'NGN', symbol:'₦',    region:'Africa'},
  {code:'KE',  name:'Kenya',          flag:'🇰🇪', currency:'KES', symbol:'KSh',  region:'Africa'},
  {code:'TZ',  name:'Tanzania',       flag:'🇹🇿', currency:'TZS', symbol:'TSh',  region:'Africa'},
  {code:'UG',  name:'Uganda',         flag:'🇺🇬', currency:'UGX', symbol:'USh',  region:'Africa'},
  {code:'RW',  name:'Rwanda',         flag:'🇷🇼', currency:'RWF', symbol:'RF',   region:'Africa'},
  {code:'CI',  name:"Côte d'Ivoire",  flag:'🇨🇮', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'CM',  name:'Cameroon',       flag:'🇨🇲', currency:'XAF', symbol:'CFA',  region:'Africa'},
  {code:'SN',  name:'Senegal',        flag:'🇸🇳', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'ML',  name:'Mali',           flag:'🇲🇱', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'BF',  name:'Burkina Faso',   flag:'🇧🇫', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'BJ',  name:'Benin',          flag:'🇧🇯', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'TG',  name:'Togo',           flag:'🇹🇬', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'NE',  name:'Niger',          flag:'🇳🇪', currency:'XOF', symbol:'CFA',  region:'Africa'},
  {code:'CD',  name:'DR Congo',       flag:'🇨🇩', currency:'CDF', symbol:'FC',   region:'Africa'},
  {code:'ZM',  name:'Zambia',         flag:'🇿🇲', currency:'ZMW', symbol:'ZK',   region:'Africa'},
  {code:'ZW',  name:'Zimbabwe',       flag:'🇿🇼', currency:'USD', symbol:'$',    region:'Africa'},
  {code:'MZ',  name:'Mozambique',     flag:'🇲🇿', currency:'MZN', symbol:'MT',   region:'Africa'},
  {code:'ZA',  name:'South Africa',   flag:'🇿🇦', currency:'ZAR', symbol:'R',    region:'Africa'},
  {code:'EG',  name:'Egypt',          flag:'🇪🇬', currency:'EGP', symbol:'E£',   region:'Africa'},
  {code:'MA',  name:'Morocco',        flag:'🇲🇦', currency:'MAD', symbol:'MAD',  region:'Africa'},
  // Asia
  {code:'IN',  name:'India',          flag:'🇮🇳', currency:'INR', symbol:'₹',    region:'Asia'},
  {code:'CN',  name:'China',          flag:'🇨🇳', currency:'CNY', symbol:'¥',    region:'Asia'},
  {code:'PH',  name:'Philippines',    flag:'🇵🇭', currency:'PHP', symbol:'₱',    region:'Asia'},
  {code:'ID',  name:'Indonesia',      flag:'🇮🇩', currency:'IDR', symbol:'Rp',   region:'Asia'},
  {code:'PK',  name:'Pakistan',       flag:'🇵🇰', currency:'PKR', symbol:'₨',    region:'Asia'},
  {code:'BD',  name:'Bangladesh',     flag:'🇧🇩', currency:'BDT', symbol:'৳',    region:'Asia'},
  {code:'VN',  name:'Vietnam',        flag:'🇻🇳', currency:'VND', symbol:'₫',    region:'Asia'},
  {code:'TH',  name:'Thailand',       flag:'🇹🇭', currency:'THB', symbol:'฿',    region:'Asia'},
  {code:'MY',  name:'Malaysia',       flag:'🇲🇾', currency:'MYR', symbol:'RM',   region:'Asia'},
  {code:'SG',  name:'Singapore',      flag:'🇸🇬', currency:'SGD', symbol:'S$',   region:'Asia'},
  // Middle East
  {code:'AE',  name:'UAE',            flag:'🇦🇪', currency:'AED', symbol:'AED',  region:'Middle East'},
  {code:'SA',  name:'Saudi Arabia',   flag:'🇸🇦', currency:'SAR', symbol:'SR',   region:'Middle East'},
  // Americas
  {code:'US',  name:'United States',  flag:'🇺🇸', currency:'USD', symbol:'$',    region:'Americas'},
  {code:'BR',  name:'Brazil',         flag:'🇧🇷', currency:'BRL', symbol:'R$',   region:'Americas'},
  {code:'MX',  name:'Mexico',         flag:'🇲🇽', currency:'MXN', symbol:'MX$',  region:'Americas'},
  {code:'CO',  name:'Colombia',       flag:'🇨🇴', currency:'COP', symbol:'COP$', region:'Americas'},
  // Europe
  {code:'GB',  name:'United Kingdom', flag:'🇬🇧', currency:'GBP', symbol:'£',    region:'Europe'},
  {code:'TR',  name:'Turkey',         flag:'🇹🇷', currency:'TRY', symbol:'₺',    region:'Europe'},
  {code:'PL',  name:'Poland',         flag:'🇵🇱', currency:'PLN', symbol:'zł',   region:'Europe'},
  {code:'UA',  name:'Ukraine',        flag:'🇺🇦', currency:'UAH', symbol:'₴',    region:'Europe'},
  {code:'EU',  name:'Europe (EUR)',   flag:'🇪🇺', currency:'EUR', symbol:'€',    region:'Europe'},
];

const PAYMENT_OPTIONS = [
  {value:'all',            label:'All Methods',                   icon:'💳', cat:null},
  // Mobile Money
  {value:'mtn',            label:'MTN Mobile Money',              icon:'📱', cat:'Mobile Money'},
  {value:'vodafone',       label:'Vodafone Cash',                 icon:'📱', cat:'Mobile Money'},
  {value:'airteltigo',     label:'AirtelTigo Money',              icon:'📱', cat:'Mobile Money'},
  {value:'mpesa',          label:'M-Pesa',                        icon:'📱', cat:'Mobile Money'},
  {value:'airtel money',   label:'Airtel Money',                  icon:'📱', cat:'Mobile Money'},
  {value:'orange money',   label:'Orange Money',                  icon:'📱', cat:'Mobile Money'},
  {value:'wave',           label:'Wave',                          icon:'🌊', cat:'Mobile Money'},
  {value:'chipper',        label:'Chipper Cash',                  icon:'💚', cat:'Mobile Money'},
  {value:'ecocash',        label:'EcoCash',                       icon:'📱', cat:'Mobile Money'},
  {value:'tigo pesa',      label:'Tigo Pesa / Mixx',              icon:'📱', cat:'Mobile Money'},
  {value:'moov money',     label:'Moov Money',                    icon:'📱', cat:'Mobile Money'},
  {value:'africell',       label:'Africell Money',                icon:'📱', cat:'Mobile Money'},
  {value:'paga',           label:'Paga',                          icon:'🟢', cat:'Mobile Money'},
  // Digital Wallet
  {value:'paypal',         label:'PayPal',                        icon:'💰', cat:'Digital Wallet'},
  {value:'cash app',       label:'Cash App',                      icon:'💸', cat:'Digital Wallet'},
  {value:'apple pay',      label:'Apple Pay',                     icon:'🍎', cat:'Digital Wallet'},
  {value:'alipay',         label:'Alipay',                        icon:'💙', cat:'Digital Wallet'},
  {value:'wechat',         label:'WeChat Pay',                    icon:'💬', cat:'Digital Wallet'},
  {value:'venmo',          label:'Venmo',                         icon:'🔵', cat:'Digital Wallet'},
  {value:'zelle',          label:'Zelle',                         icon:'💜', cat:'Digital Wallet'},
  {value:'revolut',        label:'Revolut',                       icon:'🔷', cat:'Digital Wallet'},
  {value:'skrill',         label:'Skrill',                        icon:'💳', cat:'Digital Wallet'},
  {value:'neteller',       label:'Neteller',                      icon:'💳', cat:'Digital Wallet'},
  {value:'payeer',         label:'Payeer',                        icon:'💳', cat:'Digital Wallet'},
  {value:'perfect money',  label:'Perfect Money',                 icon:'💳', cat:'Digital Wallet'},
  // Remittance
  {value:'wise',           label:'Wise',                          icon:'🌍', cat:'Remittance'},
  {value:'worldremit',     label:'WorldRemit',                    icon:'🌐', cat:'Remittance'},
  {value:'remitly',        label:'Remitly',                       icon:'🚀', cat:'Remittance'},
  {value:'western union',  label:'Western Union',                 icon:'🏢', cat:'Remittance'},
  {value:'moneygram',      label:'MoneyGram',                     icon:'🏢', cat:'Remittance'},
  // Bank
  {value:'bank transfer',  label:'Bank Transfer',                 icon:'🏦', cat:'Bank'},
  {value:'wire transfer',  label:'Wire Transfer',                 icon:'🔗', cat:'Bank'},
  {value:'mobile banking', label:'Mobile Banking App',            icon:'📲', cat:'Bank'},
  {value:'interbank',      label:'Interbank (GhIPSS/NIBSS/EFT)',  icon:'🏦', cat:'Bank'},
  {value:'ussd',           label:'USSD Bank Transfer',            icon:'📞', cat:'Bank'},
  {value:'instant eft',    label:'Instant EFT (South Africa)',    icon:'🏦', cat:'Bank'},
  {value:'cash deposit',   label:'Cash Deposit (Bank Counter)',   icon:'🏦', cat:'Bank'},
  // FinTech
  {value:'opay',           label:'OPay',                          icon:'🟢', cat:'FinTech'},
  {value:'palmpay',        label:'PalmPay',                       icon:'🌴', cat:'FinTech'},
  {value:'kuda',           label:'Kuda Bank',                     icon:'🏦', cat:'FinTech'},
  {value:'moniepoint',     label:'Moniepoint',                    icon:'🏦', cat:'FinTech'},
  {value:'paystack',       label:'Paystack',                      icon:'💚', cat:'FinTech'},
  {value:'flutterwave',    label:'Flutterwave (Barter)',           icon:'🦋', cat:'FinTech'},
  // Cash
  {value:'cash in person', label:'Cash in Person (Face-to-Face)', icon:'💵', cat:'Cash'},
  {value:'cash out',       label:'Cash Out',                      icon:'💵', cat:'Cash'},
  // Crypto
  {value:'usdt',           label:'USDT (Tether – TRC20)',          icon:'💵', cat:'Crypto'},
  {value:'binance pay',    label:'Binance Pay',                   icon:'🟡', cat:'Crypto'},
  {value:'bitcoin',        label:'Bitcoin (BTC)',                  icon:'₿',  cat:'Crypto'},
  {value:'ethereum',       label:'Ethereum (ETH)',                icon:'⬡',  cat:'Crypto'},
  {value:'luno',           label:'Luno Wallet',                   icon:'🌙', cat:'Crypto'},
  {value:'yellow card',    label:'Yellow Card Wallet',            icon:'💛', cat:'Crypto'},
];

const PM_CAT_COLORS = {
  'Mobile Money':'#10B981','Digital Wallet':'#3B82F6','Remittance':'#0D9488',
  'Bank':'#7C3AED','FinTech':'#F59E0B','Cash':'#F4A422','Crypto':'#F97316',
};

const fmt  = (n, d=0) => new Intl.NumberFormat('en-US', {minimumFractionDigits:0, maximumFractionDigits:d}).format(n||0);
const fBtc = (n)      => parseFloat(n||0).toFixed(8);

const getUser     = (u) => Array.isArray(u) ? u[0] : (u||{});
const isVerified  = (u) => !!(u?.kyc_verified||u?.is_verified||u?.is_id_verified||u?.is_email_verified);
const getTrades   = (u) => parseInt(u?.total_trades ?? u?.trade_count ?? 0);
const getLastSeen = (u) => {
  const d = u?.last_seen_at||u?.last_login||u?.updated_at||u?.created_at;
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

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({user, size=48, radius='rounded-xl'}) {
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

// ── Offer Card (Sell side) ────────────────────────────────────────────────────
function OfferCard({listing, btcPriceUSD, onViewBuyer, onSell}) {
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

  const exampleRecv = minLocal || Math.round(100*usdRate);
  const exampleBtc  = rateLocal > 0 ? exampleRecv / rateLocal : 0.001;

  const marginLabel = margin===0 ? 'Market rate' : margin>0 ? `+${margin}% above market` : `${Math.abs(margin)}% below market`;
  const marginBg    = margin>0 ? C.success : margin<0 ? C.danger : C.g400;

  const pos  = parseInt(u.positive_feedback||0);
  const neg  = parseInt(u.negative_feedback||0);

  const pmLabel = listing.payment_method || 'Payment';

  return (
    <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all w-full"
      style={{borderColor:C.g200}}>

      {/* ─ Header ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">

          <div className="relative flex-shrink-0">
            <button onClick={onViewBuyer}>
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CountryFlag
                countryCode={(u?.country_code||u?.country||'gh').toLowerCase()}
                className="w-4 h-3 rounded-sm flex-shrink-0"/>
              <button onClick={onViewBuyer}
                className="font-black text-sm hover:underline leading-tight truncate"
                style={{color:C.g800, maxWidth:'130px'}}>
                {u.username||'Buyer'}
              </button>
              {isVerified(u) && <BadgeCheck size={14} style={{color:'#3B82F6', flexShrink:0}}/>}
              <span className={`inline-flex items-center gap-px font-medium px-1 py-0 rounded-full border flex-shrink-0 ${badge.animate ? 'shadow-md' : ''}`}
                style={{background:badge.bg, borderColor:badge.borderColor, fontSize:'8px', boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
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
            <span className="text-xs font-normal leading-tight" style={{color:C.g400}}>Buyer pays via:</span>
            <span className="text-xs font-black leading-tight tracking-wide" style={{color:C.g700}}>{pmLabel.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* ─ Divider ───────────────────────────────────────────── */}
      <div style={{height:1, backgroundColor:C.g100}}/>

      {/* ─ You Send / You Receive ────────────────────────────── */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:C.g500}}>YOU SEND</p>
          <p className="font-black leading-tight" style={{color:C.gold, fontSize: exampleBtc < 0.001 ? '14px' : '20px'}}>
            ₿{fBtc(exampleBtc)}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>Bitcoin</p>
        </div>
        <div className="border-l pl-3" style={{borderColor:C.g100}}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:C.g500}}>YOU RECEIVE</p>
          <p className="text-2xl font-black leading-tight truncate" style={{color:C.g800}}>
            {sym}{fmt(exampleRecv)}
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{color:C.g400}}>{cur}</p>
        </div>
      </div>

      {/* ─ Rate + margin ─────────────────────────────────────── */}
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold truncate" style={{color:C.g600}}>
          Rate: {sym}{fmt(rateLocal)}/BTC
        </p>
        <span className="font-semibold px-2 py-0.5 rounded flex-shrink-0"
          style={{backgroundColor:marginBg, color:'#fff', fontSize:'10px'}}>
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
        <button onClick={onViewBuyer}
          className="w-10 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition"
          style={{borderColor:C.g200}}>
          <Info size={15} style={{color:C.g400}}/>
        </button>
        <button onClick={onSell}
          className="flex-1 h-11 rounded-xl text-white font-black text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition"
          style={{backgroundColor:C.sell}}>
          SELL BTC <ArrowRight size={15}/>
        </button>
      </div>
    </div>
  );
}

// ── Buyer Modal ───────────────────────────────────────────────────────────────
function BuyerModal({buyer, listing, onClose, onTrade, btcPriceUSD}) {
  const [tab, setTab] = useState('rules');
  const { rates: USD_RATES } = useRates();
  if (!buyer) return null;
  const u         = getUser(buyer);
  const badge     = deriveBadge(u);
  const seen      = getLastSeen(u);
  const trades    = getTrades(u);
  const rating    = parseFloat(u.average_rating||0);
  const fb        = parseInt(u.total_feedback_count ?? u.feedback_count ?? 0);
  const margin    = parseFloat(listing?.margin||0);
  const cur       = listing?.currency||'GHS';
  const sym       = listing?.currency_symbol || CUR_SYM[cur] || '₵';
  const usdRate   = USD_RATES[cur]||1;
  const rateLocal = getRateUSD(listing||{}, btcPriceUSD||68000) * usdRate;
  const ccCode    = (u?.country_code||u?.country||'gh').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-md max-h-[90vh] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{border:`1px solid ${C.g200}`, animation:'slideUp .25s ease'}}>

        {/* Header */}
        <div className="relative p-4 sm:p-5 text-white flex-shrink-0"
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
                <h3 className="font-black text-base leading-tight truncate">{u.username||'Buyer'}</h3>
                {isVerified(u) && <BadgeCheck size={14} style={{color:'#93C5FD'}}/>}
                <CountryFlag countryCode={ccCode} className="w-4 h-3 rounded-sm"/>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-px font-medium px-1 py-0 rounded-full border ${badge.animate ? 'shadow-md' : ''}`}
                  style={{background:badge.bg, borderColor:badge.borderColor, fontSize:'8px', boxShadow: badge.glow ? `0 0 8px ${badge.glow}` : undefined}}>
                  <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                  <span style={{color:badge.textColor}}>{badge.label}</span>
                </span>
                <span className="text-xs text-white/60">{seen.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
                  style={{backgroundColor:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.85)'}}>
                  <Repeat2 size={9} strokeWidth={2.5}/>{fmt(trades)} Trades
                </span>
              </div>
            </div>
          </div>

          {(()=>{
            const phoneOk = !!(u.is_phone_verified||u.phone_verified||u.phone);
            const emailOk = !!(u.is_email_verified||u.email_verified||u.email);
            const pos = parseInt(u.positive_feedback||0);
            const neg = parseInt(u.negative_feedback||0);
            const total = pos + neg;
            const trust = total > 0 ? Math.round(pos/total*100) : trades > 0 ? 100 : 0;
            const blocks = parseInt(u.blocks_count||u.blocked_count||0);
            const trustColor = trust>=80?'#86EFAC':trust>=50?'#FDE68A':'#FCA5A5';
            const items = [
              {icon:Phone,  value:phoneOk?'✓ Verified':'✗ Not set', label:'Phone',       color:phoneOk?'#86EFAC':'#FCA5A5'},
              {icon:Mail,   value:emailOk?'✓ Verified':'✗ Not set', label:'Email',       color:emailOk?'#86EFAC':'#FCA5A5'},
              {icon:Shield, value:`${trust}%`,                       label:'Trust Score', color:trustColor},
              {icon:Ban,    value:fmt(blocks),                       label:'Blocks',      color:blocks>0?'#FCA5A5':'rgba(255,255,255,0.65)'},
            ];
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20">
                {items.map(({icon:Icon,value,label,color})=>(
                  <div key={label} className="flex items-center gap-2 bg-white/10 rounded-xl px-2.5 py-2.5 min-w-0 overflow-hidden">
                    <Icon size={13} style={{color,flexShrink:0}}/>
                    <div className="min-w-0">
                      <p className="text-white font-black text-xs leading-tight truncate">{value}</p>
                      <p className="text-white/50 text-xs mt-0.5 leading-tight truncate">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{borderColor:C.g200}}>
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

        <div className="p-4 overflow-y-auto flex-1" style={{WebkitOverflowScrolling:'touch'}}>
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
            style={{backgroundColor:C.sell}}>
            <Bitcoin size={14}/> Sell BTC
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border animate-pulse w-full" style={{borderColor:C.g200}}>
      <div className="px-4 pt-4 pb-3 flex gap-3">
        <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{backgroundColor:C.g200}}/>
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 rounded-lg w-2/3" style={{backgroundColor:C.g200}}/>
          <div className="h-2.5 rounded-lg w-1/2" style={{backgroundColor:C.g100}}/>
        </div>
      </div>
      <div style={{height:1, backgroundColor:C.g100}}/>
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <div className="h-2 rounded w-1/2" style={{backgroundColor:C.g100}}/>
          <div className="h-7 rounded-lg w-3/4" style={{backgroundColor:C.g200}}/>
        </div>
        <div className="space-y-1.5 pl-3">
          <div className="h-2 rounded w-1/2" style={{backgroundColor:C.g100}}/>
          <div className="h-7 rounded-lg w-3/4" style={{backgroundColor:C.g200}}/>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="h-11 rounded-xl" style={{backgroundColor:C.g200}}/>
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
  const activeId = path.includes('sell-bitcoin') ? 'p2p'
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

// ── Main SellBitcoin Page ─────────────────────────────────────────────────────
export default function SellBitcoin({user}) {
  const navigate = useNavigate();
  const { rates: USD_RATES, btcUsd: contextBtcUsd } = useRates();
  const _cache = () => { try{const c=JSON.parse(sessionStorage.getItem('praqen_sell')||'null');return c&&Date.now()-c.ts<120000?c.data:null;}catch{return null;} };
  const [offers,       setOffers]       = useState(()=>_cache()||[]);
  const [loading,      setLoading]      = useState(()=>!_cache());
  const [btcPrice,     setBtcPrice]     = useState(68000);
  const [selCountry,    setSelCountry]    = useState(COUNTRIES[0]);
  const [countrySearch, setCountrySearch] = useState('');
  const [selPayment,    setSelPayment]    = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [showCountry,   setShowCountry]   = useState(false);
  const [showPayment,   setShowPayment]   = useState(false);
  const [sortBy,       setSortBy]       = useState('rate_high');
  const [modal,        setModal]        = useState(null);
  const [sellAmt,      setSellAmt]      = useState('');
  const [activeTrades, setActiveTrades] = useState([]);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const countryRef = useRef(null);
  const paymentRef = useRef(null);

  useEffect(()=>{ if(contextBtcUsd>0) setBtcPrice(contextBtcUsd); },[contextBtcUsd]);
  useEffect(()=>{
    loadOffers();
    const interval = setInterval(loadOffers, 60000);
    return () => clearInterval(interval);
  },[]);
  useEffect(()=>{
    const tk = localStorage.getItem('token');
    if (!tk) return;
    axios.post(`${API_URL}/users/heartbeat`, {}, { headers: { Authorization: `Bearer ${tk}` } }).catch(()=>{});
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
    const h = e => {
      if(countryRef.current&&!countryRef.current.contains(e.target)) setShowCountry(false);
      if(paymentRef.current&&!paymentRef.current.contains(e.target)) { setShowPayment(false); setPaymentSearch(''); }
    };
    document.addEventListener('mousedown',h);
    return () => document.removeEventListener('mousedown',h);
  },[]);

  const loadOffers = async () => {
    try {
      const res = await axios.get(`${API_URL}/listings`);
      const all = (res.data.listings||[]).map(l=>({...l, users:Array.isArray(l.users)?l.users[0]:l.users}));
      const data = all.filter(l=>l.listing_type==='BUY'||l.listing_type==='BUY_BITCOIN');
      setOffers(data);
      try { sessionStorage.setItem('praqen_sell', JSON.stringify({data, ts:Date.now()})); } catch {}
    } catch { if (!offers.length) toast.error('Failed to load marketplace'); }
    finally { setLoading(false); }
  };

  const getFiltered = () => {
    let list = [...offers];
    if (selCountry.code!=='ALL') list=list.filter(l=>l.country===selCountry.code);
    if (selPayment!=='all')      list=list.filter(l=>String(l.payment_method||'').toLowerCase().includes(selPayment));
    if (sellAmt && parseFloat(sellAmt)>0) {
      const a = parseFloat(sellAmt);
      const _cur  = selCountry.currency || 'GHS';
      const _rate = USD_RATES[_cur] || 1;
      list=list.filter(l=>{
        if (l.min_limit_local && l.max_limit_local && l.currency===_cur) {
          return a>=(l.min_limit_local) && a<=(l.max_limit_local);
        }
        const aUsd = _rate>0 ? a/_rate : a;
        return aUsd>=(l.min_limit_usd||0) && aUsd<=(l.max_limit_usd||999999);
      });
    }
    if (sortBy==='rate_high') list.sort((a,b)=>parseFloat(b.margin||0)-parseFloat(a.margin||0));
    else if (sortBy==='rating') list.sort((a,b)=>(b.users?.average_rating||0)-(a.users?.average_rating||0));
    else if (sortBy==='trades') list.sort((a,b)=>getTrades(b.users)-getTrades(a.users));

    // One offer per buyer per payment method
    const seen = new Set();
    list = list.filter(l => {
      const key = `${l.seller_id}:${String(l.payment_method||'').toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

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
  const onlineCnt   = offers.filter(l=>(Date.now()-new Date(l.users?.last_seen_at||l.users?.last_login||0))/1000<300).length;
  const buyerCount  = new Set(offers.map(l=>l.seller_id)).size;
  const hasFilters  = selPayment!=='all' || sellAmt || selCountry.code!=='ALL';

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 overflow-x-hidden"
      style={{backgroundColor:C.g100, fontFamily:"'DM Sans',sans-serif"}}>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html, body { overscroll-behavior: none; }
      `}</style>

      {/* ══ 1. RATE BAR ════════════════════════════════════════ */}
      <div style={{backgroundColor:C.forest}} className="w-full flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-xl md:text-3xl font-black text-white leading-tight mb-1.5">
                Sell Bitcoin for{' '}
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
            <button onClick={loadOffers}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/20 flex-shrink-0"
              style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <RefreshCw size={15} className={`text-white ${loading?'animate-spin':''}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* ══ 2. TAB NAVIGATION ══════════════════════════════════ */}
      <div className="bg-white border-b sticky top-0 z-30 flex-shrink-0" style={{borderColor:C.g200}}>
        {/* 3 equal tabs — always fits any phone */}
        <div className="flex w-full">
          {[
            {label:'Buy BTC',    path:'/buy-bitcoin',  active:false, color:'#1B4332'},
            {label:'Sell BTC',   path:'/sell-bitcoin', active:true,  color:'#D97706'},
            {label:'Gift Cards', path:'/gift-cards',   active:false, color:'#0D9488'},
          ].map(tab=>(
            <Link key={tab.path} to={tab.path}
              className="flex-1 text-center py-3 text-xs font-black border-b-2 transition-all"
              style={{
                borderColor:     tab.active ? tab.color : 'transparent',
                color:           tab.active ? tab.color : C.g400,
                backgroundColor: tab.active ? tab.color+'18' : 'transparent',
              }}>
              {tab.label}
            </Link>
          ))}
        </div>
        {/* Stats row — always visible below tabs */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{borderColor:C.g100, backgroundColor:C.g50}}>
          <span className="text-xs font-semibold" style={{color:C.g400}}>
            {buyerCount} buyer{buyerCount!==1?'s':''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{backgroundColor: onlineCnt>0 ? C.online : C.g300,
                      boxShadow: onlineCnt>0 ? `0 0 0 3px ${C.online}30` : 'none'}}/>
            <span className="text-xs font-semibold"
              style={{color: onlineCnt>0 ? C.online : C.g400}}>
              {onlineCnt>0 ? `${onlineCnt} online` : 'offline — offers still active'}
            </span>
          </span>
        </div>
      </div>

      {/* ══ 3. FILTER BAR ══════════════════════════════════════ */}
      <div className="bg-white border-b flex-shrink-0" style={{borderColor:C.g200}}>
        <div className="max-w-7xl mx-auto px-3 py-3 space-y-3">

          {/* AMOUNT — full width */}
          <div>
            <p className="text-xs font-black mb-1 tracking-wide" style={{color:C.g500}}>AMOUNT</p>
            <div className="flex items-center border-2 rounded-xl overflow-hidden"
              style={{borderColor:sellAmt ? C.sell : C.g200}}>
              <input
                type="number"
                value={sellAmt}
                onChange={e=>setSellAmt(e.target.value)}
                placeholder="e.g. 500"
                className="flex-1 pl-3 pr-1 py-2.5 font-bold focus:outline-none bg-transparent min-w-0"
                style={{color:C.g800, fontSize:'16px'}}/>
              <span className="pr-3 text-xs font-black flex-shrink-0" style={{color:C.g400}}>{cur}</span>
            </div>
          </div>

          {/* CURRENCY + PAYMENT grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* CURRENCY (country) dropdown */}
            <div>
              <p className="text-xs font-black mb-1 tracking-wide" style={{color:C.g500}}>CURRENCY</p>
              <div className="relative" ref={countryRef}>
                <button
                  onClick={()=>{setShowCountry(!showCountry);setShowPayment(false);}}
                  className="w-full flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                  style={{
                    borderColor:     selCountry.code!=='ALL' ? C.sell : C.g200,
                    color:           selCountry.code!=='ALL' ? C.sell : C.g600,
                    backgroundColor: selCountry.code!=='ALL' ? `${C.sell}08` : 'transparent',
                  }}>
                  <span className="text-sm leading-none flex-shrink-0">{selCountry.flag}</span>
                  <span className="text-xs font-black truncate flex-1 text-left">{selCountry.name}</span>
                  <ChevronDown size={11} className={`transition-transform flex-shrink-0 ${showCountry?'rotate-180':''}`}
                    style={{color:selCountry.code!=='ALL' ? C.sell : C.g400}}/>
                </button>
                {showCountry && (
                  <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                    style={{borderColor:C.g100,minWidth:'240px',right:'auto',maxWidth:'calc(100vw - 24px)'}}>
                    <div className="p-2 border-b sticky top-0 bg-white" style={{borderColor:C.g100}}>
                      <input type="text" placeholder="🔍  Search country…"
                        value={countrySearch} onChange={e=>setCountrySearch(e.target.value)}
                        className="w-full px-3 py-1.5 font-semibold rounded-xl border focus:outline-none"
                        style={{borderColor:C.g200,color:C.g800,fontSize:'16px'}}/>
                    </div>
                    <div className="overflow-y-auto max-h-60">
                      {(() => {
                        const q = countrySearch.toLowerCase();
                        const filtered = COUNTRIES.filter(c=>!q||c.name.toLowerCase().includes(q));
                        let lastReg = null;
                        return filtered.map(c=>{
                          const regHdr = !q && c.region && c.region!==lastReg
                            ? (lastReg=c.region, <div key={`r-${c.region}`} className="px-3 py-1" style={{backgroundColor:'#F8FAFC'}}>
                                <span className="text-xs font-black uppercase tracking-wider" style={{color:COUNTRY_REGIONS[c.region]||C.g500}}>{c.region}</span>
                              </div>)
                            : (c.region&&(lastReg=c.region), null);
                          return [regHdr,
                            <button key={c.code} onClick={()=>{setSelCountry(c);setShowCountry(false);setCountrySearch('');}}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition"
                              style={{backgroundColor:selCountry.code===c.code?`${C.sell}08`:'transparent'}}>
                              <span className="text-base flex-shrink-0">{c.flag}</span>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-bold text-xs truncate" style={{color:C.g800}}>{c.name}</p>
                                {c.currency&&<p className="text-xs" style={{color:C.g400}}>{c.symbol} {c.currency}</p>}
                              </div>
                              {selCountry.code===c.code&&<CheckCircle size={11} style={{color:C.sell,flexShrink:0}}/>}
                            </button>
                          ];
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT dropdown */}
            <div>
              <p className="text-xs font-black mb-1 tracking-wide" style={{color:C.g500}}>PAYMENT</p>
              <div className="relative" ref={paymentRef}>
                <button
                  onClick={()=>{setShowPayment(!showPayment);setShowCountry(false);}}
                  className="w-full flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border-2 font-bold transition"
                  style={{
                    borderColor:     selPayment!=='all' ? C.sell : C.g200,
                    color:           selPayment!=='all' ? C.sell : C.g600,
                    backgroundColor: selPayment!=='all' ? `${C.sell}08` : 'transparent',
                  }}>
                  <span className="text-sm leading-none flex-shrink-0">{PAYMENT_OPTIONS.find(p=>p.value===selPayment)?.icon||'💳'}</span>
                  <span className="text-xs font-black truncate flex-1 text-left">
                    {PAYMENT_OPTIONS.find(p=>p.value===selPayment)?.label||'All Methods'}
                  </span>
                  <ChevronDown size={11} className={`transition-transform flex-shrink-0 ${showPayment?'rotate-180':''}`}
                    style={{color:selPayment!=='all' ? C.sell : C.g400}}/>
                </button>
                {showPayment && (
                  <div className="absolute top-full right-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
                    style={{borderColor:C.g100,minWidth:'220px',maxWidth:'calc(100vw - 24px)'}}>
                    <div className="p-2 border-b sticky top-0 bg-white" style={{borderColor:C.g100}}>
                      <input type="text" placeholder="🔍  Search payment…"
                        value={paymentSearch} onChange={e=>setPaymentSearch(e.target.value)}
                        className="w-full px-3 py-1.5 font-semibold rounded-xl border focus:outline-none"
                        style={{borderColor:C.g200,color:C.g800,fontSize:'16px'}}/>
                    </div>
                    <div className="overflow-y-auto max-h-56">
                    {(() => {
                      const q = paymentSearch.toLowerCase();
                      let lastCat = null;
                      return PAYMENT_OPTIONS.filter(p=>!q||p.label.toLowerCase().includes(q)||p.value.toLowerCase().includes(q)).map(p => {
                        const catHeader = !q && p.cat && p.cat !== lastCat ? (lastCat = p.cat, (
                          <div key={`h-${p.cat}`} className="px-3 py-1 sticky top-0" style={{backgroundColor:'#F8FAFC'}}>
                            <span className="text-xs font-black uppercase tracking-wider" style={{color:PM_CAT_COLORS[p.cat]||C.g500}}>{p.cat}</span>
                          </div>
                        )) : (lastCat = p.cat || lastCat, null);
                        return [catHeader, (
                          <button key={p.value} onClick={()=>{setSelPayment(p.value);setShowPayment(false);setPaymentSearch('');}}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition"
                            style={{backgroundColor:selPayment===p.value?`${C.sell}08`:'transparent'}}>
                            <span className="text-sm flex-shrink-0">{p.icon}</span>
                            <span className="flex-1 text-left font-semibold text-xs leading-tight" style={{color:C.g800}}>{p.label}</span>
                            {selPayment===p.value && <CheckCircle size={11} style={{color:C.sell,flexShrink:0}}/>}
                          </button>
                        )];
                      });
                    })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sort + Create Offer row */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black flex-shrink-0" style={{color:C.g500}}>Sort:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-2 font-bold border-2 rounded-xl focus:outline-none"
              style={{borderColor:sortBy!=='rate_high'?C.sell:C.g200, color:C.g800, fontSize:'16px'}}>
              <option value="rate_high">Best Rate</option>
              <option value="rating">Top Rated</option>
              <option value="trades">Most Trades</option>
            </select>
            <button onClick={()=>navigate('/create-offer')}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white font-black text-xs transition hover:opacity-90 active:scale-[0.97]"
              style={{backgroundColor:C.sell, whiteSpace:'nowrap'}}>
              <PlusCircle size={13}/> + Create
            </button>
            {hasFilters && (
              <button onClick={()=>{setSellAmt('');setSelPayment('all');setSelCountry(COUNTRIES[0]);setSortBy('rate_high');setPaymentSearch('');}}
                className="flex-shrink-0 px-2.5 py-2 rounded-xl text-xs font-black border-2 transition"
                style={{borderColor:C.danger, color:C.danger, backgroundColor:'#FEF2F2'}}>
                ✕
              </button>
            )}
          </div>

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
            buyers{selCountry.code!=='ALL' ? ` · ${selCountry.flag} ${selCountry.name}` : ''}
          </p>
          <button onClick={()=>navigate('/create-offer')}
            className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{backgroundColor:`${C.sell}12`, color:C.sell}}>
            <PlusCircle size={12}/> Post Offer
          </button>
        </div>

        {loading && !offers.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
            {Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : filtered.length===0 ? (
          <div className="bg-white rounded-2xl border p-6 sm:p-10 text-center" style={{borderColor:C.g200}}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
            {filtered.map(l=>(
              <div key={l.id} className="w-full">
                <OfferCard
                  listing={l}
                  btcPriceUSD={btcPrice}
                  onViewBuyer={()=>{
                    setModal({buyer:l.users||{}, listing:l});
                    axios.post(`${API_URL}/listings/${l.id}/view`).catch(()=>{});
                  }}
                  onSell={()=>handleSell(l.id)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{backgroundColor:C.sellBg, borderColor:'#FDE68A'}}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{color:C.sell}}/>
          <p className="text-xs leading-relaxed" style={{color:'#92400E'}}>
            <strong>Sell Safely:</strong> Never release Bitcoin before confirming payment received.
            All trades are escrow-protected. Report suspicious buyers immediately.
          </p>
        </div>
      </div>

      {/* ══ 5. BOTTOM NAV ══════════════════════════════════════ */}
      <BottomNav/>

      {modal && (
        <BuyerModal
          buyer={modal.buyer}
          listing={modal.listing}
          btcPriceUSD={btcPrice}
          onClose={()=>setModal(null)}
          onTrade={()=>handleSell(modal.listing?.id)}
        />
      )}
    </div>
  );
}
