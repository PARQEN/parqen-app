import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Shield, Clock, AlertTriangle, Info, Bitcoin,
  CheckCircle, ArrowRight, BadgeCheck, RefreshCw,
  Lock, MessageCircle, Eye, CreditCard, Smartphone,
  Building2, ChevronRight, X, Timer, Copy, Gift,
  TrendingUp, DollarSign, MapPin, Calendar, Zap
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B', paid:'#3B82F6', purple:'#8B5CF6',
  teal:'#0D9488', coral:'#E85D4A',
};

// ─── ISO → emoji flag ─────────────────────────────────────────────────────────
function isoToFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  );
}

// ─── Trust badge ──────────────────────────────────────────────────────────────
const TRUST_MAP = {
  LEGEND:     {label:'LEGEND',    icon:'👑', color:'#7C3AED'},
  AMBASSADOR: {label:'AMBASSADOR',icon:'🌟', color:'#8B5CF6'},
  EXPERT:     {label:'EXPERT',    icon:'💎', color:'#0EA5E9'},
  PRO:        {label:'PRO',       icon:'⭐', color:'#10B981'},
  ACTIVE:     {label:'ACTIVE',    icon:'🔥', color:'#F59E0B'},
  BEGINNER:   {label:'NEW',       icon:'🆕', color:'#94A3B8'},
};
function deriveBadge(u) {
  if (u?.badge && TRUST_MAP[u.badge]) return TRUST_MAP[u.badge];
  const t = parseInt(u?.total_trades ?? 0), r = parseFloat(u?.average_rating ?? 0);
  if (t >= 500 && r >= 4.8) return TRUST_MAP.LEGEND;
  if (t >= 200 && r >= 4.5) return TRUST_MAP.EXPERT;
  if (t >= 50  && r >= 4.0) return TRUST_MAP.PRO;
  if (t >= 5)               return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

const USD_RATES = {GHS:11.85,NGN:1580,KES:130,ZAR:18.5,UGX:3720,USD:1,GBP:0.79,EUR:0.92};
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',USD:'$',GBP:'£',EUR:'€'};
const fmt = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc = (n) => parseFloat(n||0).toFixed(8);
const fmtAge = (d) => {
  if (!d) return '—';
  const s=(Date.now()-new Date(d))/1000;
  if(s<300) return 'Active now';
  if(s<3600) return `${~~(s/60)}m ago`;
  if(s<86400) return `${~~(s/3600)}h ago`;
  return `${~~(s/86400)}d ago`;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({user, size=48, radius='rounded-2xl'}) {
  const [err,setErr]=useState(false);
  if(user?.avatar_url&&!err) return(
    <img src={user.avatar_url} alt={user.username||'user'} onError={()=>setErr(true)}
      className={`object-cover flex-shrink-0 ${radius}`} style={{width:size,height:size}}/>
  );
  return(
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.green,fontSize:size*0.38}}>
      {(user?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Payment icon resolver ────────────────────────────────────────────────────
function getPaymentIcon(method) {
  const m = String(method||'').toLowerCase();
  if(m.includes('mtn')||m.includes('mobile')) return {icon:Smartphone,label:method,color:C.warn};
  if(m.includes('vodafone'))                   return {icon:Smartphone,label:method,color:'#E50914'};
  if(m.includes('mpesa')||m.includes('m-pesa'))return {icon:Smartphone,label:method,color:'#27AE60'};
  if(m.includes('bank'))                       return {icon:Building2, label:method,color:C.paid};
  if(m.includes('paypal'))                     return {icon:CreditCard, label:method,color:'#003087'};
  if(m.includes('card')||m.includes('visa')||m.includes('physical'))
                                               return {icon:CreditCard, label:method,color:C.purple};
  return {icon:CreditCard,label:method||'Payment',color:C.g500};
}

// ─── Listing type config ──────────────────────────────────────────────────────
function getListingConfig(listing) {
  const type = listing?.listing_type||'';
  const brand= listing?.gift_card_brand||listing?.giftCardBrand||'';
  if(type.includes('GIFT')||brand) return {
    label:'Gift Card Trade', color:C.teal, bg:C.tealLight||'#CCFBF1', icon:'🎁',
    action:'Trade Gift Card', isBtcBuy:false,
    tealLight:'#CCFBF1',
  };
  if(type==='SELL'||type==='SELL_BITCOIN') return {
    label:'Buy Bitcoin', color:C.green, bg:C.mist, icon:'₿',
    action:'Buy BTC', isBtcBuy:true,
    tealLight:C.mist,
  };
  return {
    label:'Sell Bitcoin', color:'#D97706', bg:'#FFFBEB', icon:'💰',
    action:'Sell BTC', isBtcBuy:false,
    tealLight:'#FFFBEB',
  };
}

export default function ListingDetail({user}) {
  const {id}      = useParams();
  const navigate  = useNavigate();
  const [listing, setListing]     = useState(null);
  const [seller,  setSeller]      = useState(null);
  const [btcPrice,setBtcPrice]    = useState(68000);
  const [loading, setLoading]     = useState(true);
  const [payAmt,  setPayAmt]      = useState('');
  const [submitting,setSubmitting]= useState(false);
  const [showRules,setShowRules]  = useState(false);

  const isOwner = user && listing && user.id === listing.seller_id;

  useEffect(()=>{ loadAll(); },[id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Load listing
      const r = await axios.get(`${API_URL}/listings/${id}`);
      const l = r.data.listing;
      setListing(l);

      // Load seller profile
      if (l?.seller_id) {
        try {
          const sr = await axios.get(`${API_URL}/users/${l.seller_id}`);
          setSeller(sr.data.user);
        } catch {}
      }

      // Fetch live BTC price
      try {
        const bp = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        setBtcPrice(bp.data.bitcoin.usd);
      } catch {}
    } catch(e) {
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{borderColor:C.sage,borderTopColor:'transparent'}}/>
    </div>
  );
  if(!listing) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-black text-sm mb-3" style={{color:C.g800}}>Listing not found</p>
        <button onClick={()=>navigate('/buy-bitcoin')} className="px-5 py-2 rounded-xl text-white font-bold text-sm" style={{backgroundColor:C.green}}>Browse Offers</button>
      </div>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const cfg       = getListingConfig(listing);
  const badge     = deriveBadge(seller);
  const flag      = isoToFlag(listing.country||seller?.country||'');

  // Listing currency (what the seller priced in)
  const cur       = listing.currency||'USD';
  const sym       = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate   = USD_RATES[cur]||1; // how many local = 1 USD

  // Always show GHS equivalent for African users
  const GHS_RATE  = 11.85; // 1 USD = 11.85 GHS
  const ghsSym    = '₵';

  const margin    = parseFloat(listing.margin||0);

  // ── CORRECT RATE: seller's rate ALWAYS includes margin ─────────────────────
  // market: live_price × (1 + margin/100)
  // fixed:  listing.bitcoin_price × (1 + margin/100)  ← margin still applies!
  const basePriceUSD = (listing.pricing_type==='fixed' && parseFloat(listing.bitcoin_price||0) > 100)
    ? parseFloat(listing.bitcoin_price)
    : btcPrice;
  const sellerRateUSD   = basePriceUSD * (1 + margin / 100); // USD per BTC at seller's rate
  const sellerRateLocal = sellerRateUSD * usdRate;            // local currency per BTC

  // Limits — convert to BOTH local currency and USD for display
  const minLocal  = listing.min_limit_local || (listing.min_limit_usd ? listing.min_limit_usd * usdRate : 10 * usdRate);
  const maxLocal  = listing.max_limit_local || (listing.max_limit_usd ? listing.max_limit_usd * usdRate : 1000 * usdRate);
  const minUSD    = listing.min_limit_usd   || Math.round(minLocal / usdRate);
  const maxUSD    = listing.max_limit_usd   || Math.round(maxLocal / usdRate);

  // ── AMOUNT INPUT ────────────────────────────────────────────────────────────
  // User types in the LISTING currency (USD if listing.currency = 'USD')
  const payAmtNum = parseFloat(payAmt) || 0;

  // BTC = localAmount ÷ sellerRate  (DIVIDE, never multiply)
  // e.g. $100 ÷ $85,084/BTC = 0.001175 BTC ✓  (at +5% margin)
  const btcGross    = payAmtNum > 0 && sellerRateLocal > 0 ? payAmtNum / sellerRateLocal : 0;
  const feeBtc      = btcGross * 0.005;
  const btcAfterFee = btcGross - feeBtc;

  // Dual-currency conversions for display
  const payInUSD  = cur === 'USD' ? payAmtNum : payAmtNum / usdRate; // convert local → USD
  const payInGHS  = payInUSD * GHS_RATE;                              // USD → GHS
  const recvInUSD = btcAfterFee * sellerRateUSD;                      // BTC → USD at seller rate
  const recvInGHS = recvInUSD * GHS_RATE;                             // USD → GHS

  // Payment method
  const pmRaw  = listing.payment_method||(Array.isArray(listing.payment_methods)?listing.payment_methods[0]:'')||'';
  const pmInfo = getPaymentIcon(pmRaw);
  const PmIcon = pmInfo.icon;

  // Seller stats
  const sellerTrades   = parseInt(seller?.total_trades||0);
  const sellerRating   = parseFloat(seller?.average_rating||0);
  const completionRate = parseFloat(seller?.completion_rate||98);
  const lastSeen       = fmtAge(seller?.last_login||seller?.updated_at);
  const isOnline       = seller?.last_login && (Date.now()-new Date(seller.last_login))/1000 < 300;
  const positivePct    = Math.round(completionRate);

  const handleStartTrade = async () => {
    if (!user) { toast.info('Please login to start trading'); navigate('/login'); return; }
    if (isOwner) { toast.info('This is your listing'); return; }
    if (!payAmt || payAmtNum <= 0) { toast.error('Enter an amount to trade'); return; }
    if (payAmtNum < minLocal) { toast.error(`Minimum is ${sym}${fmt(minLocal)}`); return; }
    if (payAmtNum > maxLocal) { toast.error(`Maximum is ${sym}${fmt(maxLocal)}`); return; }
    if (user.id === listing.seller_id) { toast.error('You cannot trade with yourself'); return; }
    if (btcGross <= 0 || !isFinite(btcGross)) { toast.error('Invalid amount — please try again'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.post(`${API_URL}/trades`, {
        listingId:     listing.id || id,
        amountBtc:     parseFloat(btcGross.toFixed(8)),
        paymentMethod: pmRaw,
        trade_type:    listing.listing_type?.includes('BUY') ? 'SELL' : 'BUY',
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (r.data.success || r.data.trade) {
        toast.success('Trade opened! Escrow activated.');
        navigate(`/trade/${r.data.trade.id}`);
      }
    } catch(e) {
      toast.error(e.response?.data?.error || 'Failed to create trade');
    } finally { setSubmitting(false); }
  };

  const marginColor = margin>0?C.danger:margin<0?C.success:C.g500;
  const marginLabel = margin===0?'Market rate':margin>0?`+${margin}% above market`:`${margin}% below market`;

  return(
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      <div className="flex-1 max-w-6xl mx-auto w-full px-3 py-4 space-y-4">

        {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-[11px]" style={{color:C.g400}}>
          <button onClick={()=>navigate('/')} className="hover:underline">Home</button>
          <ChevronRight size={10}/>
          <button onClick={()=>navigate('/buy-bitcoin')} className="hover:underline">Marketplace</button>
          <ChevronRight size={10}/>
          <span style={{color:C.g700}} className="font-semibold">Listing #{String(listing.id||id).slice(0,8).toUpperCase()}</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* ── LEFT (3/5) ────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* ── SELLER CARD ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{borderColor:C.g200}}>
              {/* Header bar */}
              <div className="px-5 py-3 border-b flex items-center justify-between"
                style={{borderColor:C.g100, background:`linear-gradient(90deg,${C.g50},${C.white})`}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{cfg.icon}</span>
                  <p className="font-black text-xs" style={{color:C.forest}}>{cfg.label}</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white"
                  style={{backgroundColor:cfg.color}}>
                  🟢 Active
                </span>
              </div>

              <div className="p-5">
                {/* Avatar + name + stats */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <Avatar user={seller} size={60}/>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                      style={{backgroundColor:isOnline?C.online:C.g400}}/>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-black text-xl" style={{color:C.forest,fontFamily:"'Syne',sans-serif"}}>
                        {seller?.username||'Seller'}
                      </h2>
                      {seller?.kyc_verified&&<BadgeCheck size={16} style={{color:C.paid}}/>}
                      {/* Real badge */}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                        style={{backgroundColor:badge.color}}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{color:C.g500}}>
                      <span>{flag} {seller?.country||listing.country_name||''}</span>
                      {seller?.location&&<span className="flex items-center gap-0.5"><MapPin size={10}/>{seller.location}</span>}
                      <span className="flex items-center gap-0.5"><Calendar size={10}/>Joined {fmtAge(seller?.created_at)?.replace(' ago','')}</span>
                    </div>
                  </div>
                </div>

                {/* Trader stats grid — matches your spec */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    {label:'Trading Score',    value:`${positivePct.toFixed(2)}%`, sub:'positive',        color:C.success, note:'👍'},
                    {label:'Response Time',     value:lastSeen,                     sub:isOnline?'Online':'Last seen', color:isOnline?C.online:C.g500, note:'⏱'},
                    {label:'Trades',           value:fmt(sellerTrades),            sub:'completed',       color:C.paid, note:'🔄'},
                  ].map(s=>(
                    <div key={s.label} className="text-center p-3 rounded-xl border" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                      <p className="text-[8px] text-gray-400 uppercase mb-0.5">{s.note} {s.label}</p>
                      <p className="font-black text-sm" style={{color:s.color}}>{s.value}</p>
                      <p className="text-[9px]" style={{color:C.g400}}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Rating stars */}
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{backgroundColor:C.g50}}>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i=>(
                      <Star key={i} size={13} className={i<=Math.round(sellerRating)?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>
                    ))}
                  </div>
                  <span className="font-black text-sm" style={{color:C.g800}}>{sellerRating.toFixed(1)}</span>
                  <span className="text-xs" style={{color:C.g400}}>/5.0 rating</span>
                  <span className="ml-auto text-xs font-bold" style={{color:isOnline?C.online:C.g400}}>
                    <span className="w-2 h-2 rounded-full inline-block mr-1" style={{backgroundColor:isOnline?C.online:C.g400}}/>
                    {isOnline?'Active Online':lastSeen}
                  </span>
                </div>
              </div>
            </div>

            {/* ── OFFER DETAILS ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
              <div className="px-5 py-3 border-b" style={{borderColor:C.g100}}>
                <p className="font-black text-base" style={{color:C.forest}}>Offer Details</p>
              </div>
              <div className="p-5 space-y-3">

                {/* Seller rate — compact, not giant */}
                <div className="flex items-center justify-between p-3 rounded-xl border" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                  <div className="flex items-center gap-2">
                    <Bitcoin size={14} style={{color:C.gold}}/>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500">Seller's Rate (with {margin>0?`+${margin}%`:margin<0?`${margin}%`:'0%'} margin)</p>
                      <p className="text-sm font-black" style={{color:C.forest}}>
                        1 BTC = ${fmt(sellerRateUSD)} USD
                      </p>
                      <p className="text-[10px]" style={{color:C.g400}}>
                        ≈ {ghsSym}{fmt(sellerRateUSD * GHS_RATE)} GHS
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full"
                    style={{color:marginColor,backgroundColor:`${marginColor}12`}}>
                    {margin===0?'Market':margin>0?`+${margin}%`:`${margin}% off`}
                  </span>
                </div>

                {/* YOU PAY → YOU RECEIVE — the most important block */}
                <div className="rounded-2xl overflow-hidden border-2" style={{borderColor:C.g200}}>
                  {/* You Pay */}
                  <div className="px-4 py-3 border-b" style={{borderColor:C.g200,backgroundColor:'#FFFBEB'}}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PmIcon size={13} style={{color:pmInfo.color}}/>
                      <p className="text-xs font-black uppercase tracking-wide" style={{color:'#92400E'}}>
                        You Pay via {pmRaw||'Mobile Money'}
                      </p>
                    </div>
                    {payAmtNum > 0 ? (
                      <>
                        <p className="text-2xl font-black" style={{color:C.g800}}>
                          {sym}{fmt(payAmtNum,2)} <span className="text-base font-bold text-gray-400">{cur}</span>
                        </p>
                        <p className="text-sm font-bold mt-0.5" style={{color:C.g500}}>
                          ≈ {ghsSym}{fmt(payInGHS,0)} GHS &nbsp;·&nbsp; ${fmt(payInUSD,2)} USD
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">Enter amount in the trade box →</p>
                    )}
                  </div>
                  {/* You Receive */}
                  <div className="px-4 py-3" style={{backgroundColor:C.mist}}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bitcoin size={13} style={{color:C.gold}}/>
                      <p className="text-xs font-black uppercase tracking-wide" style={{color:C.green}}>
                        You Receive (Bitcoin)
                      </p>
                    </div>
                    {btcAfterFee > 0 ? (
                      <>
                        <p className="text-2xl font-black" style={{color:C.forest}}>
                          ₿ {btcAfterFee.toFixed(8)}
                        </p>
                        <p className="text-sm font-bold mt-0.5" style={{color:C.g500}}>
                          ≈ {ghsSym}{fmt(recvInGHS,0)} GHS &nbsp;·&nbsp; ${fmt(recvInUSD,2)} USD
                        </p>
                        <p className="text-[10px] mt-0.5" style={{color:C.g400}}>After 0.5% platform fee</p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">—</p>
                    )}
                  </div>
                </div>

                {/* Trade limits + time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border" style={{borderColor:C.g100}}>
                    <p className="text-[10px] font-bold text-gray-500 mb-0.5">Trade Range</p>
                    <p className="text-sm font-black" style={{color:C.forest}}>{sym}{fmt(minLocal)} – {sym}{fmt(maxLocal)}</p>
                    <p className="text-[10px] font-semibold" style={{color:C.g400}}>${fmt(minUSD)} – ${fmt(maxUSD)} USD</p>
                  </div>
                  <div className="p-3 rounded-xl border" style={{borderColor:C.g100}}>
                    <p className="text-[10px] font-bold text-gray-500 mb-0.5">Payment Window</p>
                    <p className="text-sm font-black flex items-center gap-1" style={{color:C.forest}}>
                      <Timer size={11}/> {listing.time_limit||30} minutes
                    </p>
                    <p className="text-[10px] font-semibold" style={{color:C.g400}}>Auto-cancels after</p>
                  </div>
                </div>

                {/* Gift card brand */}
                {listing.gift_card_brand && (
                  <div className="p-3 rounded-xl border flex items-center gap-3" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500">Gift Card Brand</p>
                      <p className="font-black text-sm" style={{color:C.forest}}>{listing.gift_card_brand}</p>
                      {listing.card_value&&<p className="text-[10px] font-semibold" style={{color:C.g400}}>Value: ${listing.card_value}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── TRADE RULES ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
              <button
                onClick={()=>setShowRules(!showRules)}
                className="w-full px-5 py-3 flex items-center justify-between border-b hover:bg-gray-50 transition"
                style={{borderColor:C.g100}}>
                <div className="flex items-center gap-2">
                  <Info size={13} style={{color:C.green}}/>
                  <p className="font-black text-sm" style={{color:C.forest}}>Trade Rules & Instructions</p>
                </div>
                <ChevronRight size={14} style={{color:C.g400, transform:showRules?'rotate(90deg)':'none', transition:'transform .2s'}}/>
              </button>
              {showRules&&(
                <div className="p-5 space-y-3">
                  {/* Real trade instructions */}
                  <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={{backgroundColor:C.mist,color:C.g700,border:`1px solid ${C.g200}`}}>
                    {listing.trade_instructions||listing.description||
                      'No special instructions — standard trade rules apply. Chat is available during the trade.'}
                  </div>

                  {listing.listing_terms&&(
                    <div className="p-3 rounded-xl text-xs leading-relaxed"
                      style={{backgroundColor:'#F0F9FF',color:C.g600,border:`1px solid ${C.paid}20`}}>
                      <p className="font-bold mb-1" style={{color:C.paid}}>Terms</p>
                      {listing.listing_terms}
                    </div>
                  )}

                  {/* Receipt */}
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{backgroundColor:`${C.success}10`,border:`1px solid ${C.success}20`}}>
                    <CheckCircle size={13} style={{color:C.success,flexShrink:0}}/>
                    <p className="text-[11px] font-semibold" style={{color:C.green}}>
                      No receipt needed — escrow auto-confirms on payment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── GIFT CARD WARNING ────────────────────────────────────── */}
            {listing.gift_card_brand && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border"
                style={{backgroundColor:'#FFFBEB',borderColor:'#FDE68A'}}>
                <AlertTriangle size={15} style={{color:C.warn,flexShrink:0,marginTop:1}}/>
                <div>
                  <p className="text-xs font-black mb-0.5" style={{color:'#92400E'}}>Gift Card Trading Warning</p>
                  <p className="text-[11px] leading-relaxed" style={{color:'#B45309'}}>
                    Trading gift cards can be risky. Always keep proof of purchase, verify who you're dealing with, and trade carefully. PRAQEN isn't responsible for gift card losses — escrow only protects Bitcoin payments.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT (2/5) — Trade Box ─────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-3">

              {/* ── OWNER VIEW ─────────────────────────────────────────── */}
              {isOwner ? (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
                  <div className="px-5 py-3 border-b" style={{borderColor:C.g100,backgroundColor:`${C.green}08`}}>
                    <p className="font-black text-sm" style={{color:C.forest}}>Your Listing</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="p-3 rounded-xl" style={{backgroundColor:`${C.success}10`,border:`1px solid ${C.success}20`}}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.success}}/>
                        <p className="text-xs font-black" style={{color:C.success}}>Active — visible to buyers</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-2 border-b" style={{borderColor:C.g100}}>
                        <span style={{color:C.g500}}>Rate</span>
                        <span className="font-bold" style={{color:C.g800}}>${fmt(sellerRateUSD)} USD</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b" style={{borderColor:C.g100}}>
                        <span style={{color:C.g500}}>Range</span>
                        <span className="font-bold" style={{color:C.g800}}>{sym}{fmt(minLocal)} – {sym}{fmt(maxLocal)}</span>
                      </div>
                      <div className="flex justify-between text-xs py-2 border-b" style={{borderColor:C.g100}}>
                        <span style={{color:C.g500}}>Payment</span>
                        <span className="font-bold" style={{color:C.g800}}>{pmRaw||'—'}</span>
                      </div>
                      <div className="flex justify-between text-xs py-2" style={{borderColor:C.g100}}>
                        <span style={{color:C.g500}}>Time limit</span>
                        <span className="font-bold" style={{color:C.g800}}>{listing.time_limit||30} min</span>
                      </div>
                    </div>
                    <button onClick={()=>navigate('/my-listings')}
                      className="w-full py-3 rounded-xl font-black text-sm text-white hover:opacity-90 transition"
                      style={{backgroundColor:C.green}}>
                      Manage My Listings →
                    </button>
                  </div>
                </div>
              ) : (
                /* ── TRADE BOX ─────────────────────────────────────────── */
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
                  {/* Box header */}
                  <div className="px-5 py-3 border-b" style={{borderColor:C.g100}}>
                    <p className="font-black text-sm" style={{color:C.forest}}>Start a Trade</p>
                    <p className="text-[10px]" style={{color:C.g400}}>Funds held in escrow until confirmed</p>
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Seller quick info */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{backgroundColor:C.g50}}>
                      <Avatar user={seller} size={32}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs truncate" style={{color:C.forest}}>{seller?.username||'Seller'}</p>
                        <p className="text-[9px]" style={{color:isOnline?C.online:C.g400}}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{backgroundColor:isOnline?C.online:C.g400}}/>
                          {isOnline?'Active Now':lastSeen}
                        </p>
                      </div>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm text-white flex-shrink-0"
                        style={{backgroundColor:badge.color}}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Pay row */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-black" style={{color:C.g700}}>
                          You Pay ({cur}) via {pmRaw||'Mobile Money'}
                        </label>
                        <span className="text-xs font-bold" style={{color:C.g400}}>
                          {sym}{fmt(minLocal)} – {sym}{fmt(maxLocal)} {cur}
                        </span>
                      </div>
                      {cur !== 'GHS' && payAmtNum > 0 && (
                        <p className="text-xs font-bold mb-1" style={{color:C.g500}}>
                          ≈ {ghsSym}{fmt(payInGHS,0)} GHS
                        </p>
                      )}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{color:C.g400}}>{sym}</span>
                        <input
                          type="number"
                          value={payAmt}
                          onChange={e=>setPayAmt(e.target.value)}
                          placeholder={fmt(minLocal)}
                          className="w-full pl-7 pr-20 py-3 text-sm font-black border-2 rounded-xl focus:outline-none"
                          style={{
                            borderColor: payAmtNum>0&&(payAmtNum<minLocal||payAmtNum>maxLocal)?C.danger:payAmtNum>0?C.green:C.g200,
                            color:C.g800,
                          }}/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black" style={{color:C.g400}}>{cur}</span>
                      </div>
                      {payAmtNum>0&&payAmtNum<minLocal&&(
                        <p className="text-[10px] mt-0.5" style={{color:C.danger}}>Minimum is {sym}{fmt(minLocal)}</p>
                      )}
                      {payAmtNum>maxLocal&&(
                        <p className="text-[10px] mt-0.5" style={{color:C.danger}}>Maximum is {sym}{fmt(maxLocal)}</p>
                      )}
                    </div>

                    {/* Receive row */}
                    <div className="p-3 rounded-xl border" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-0.5">You Receive (Bitcoin)</p>
                          <p className="font-black text-xl" style={{color:C.forest}}>
                            ₿ {btcAfterFee > 0 ? btcAfterFee.toFixed(8) : '0.00000000'}
                          </p>
                          {btcAfterFee > 0 && (
                            <>
                              <p className="text-sm font-bold mt-0.5" style={{color:C.g500}}>≈ {ghsSym}{fmt(recvInGHS,0)} GHS</p>
                              <p className="text-xs font-semibold" style={{color:C.g400}}>≈ ${fmt(recvInUSD,2)} USD</p>
                            </>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-500 mb-0.5">Seller Rate</p>
                          <p className="font-black text-sm" style={{color:C.g700}}>${fmt(sellerRateUSD)} USD/BTC</p>
                          <p className="text-xs font-semibold" style={{color:C.g400}}>{ghsSym}{fmt(sellerRateUSD*GHS_RATE)} GHS/BTC</p>
                          <p className="text-xs font-black" style={{color:marginColor}}>
                            {margin===0?'Market':margin>0?`+${margin}%`:`${margin}% off`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trade summary — visible when amount is valid */}
                    {payAmtNum >= minLocal && payAmtNum <= maxLocal && btcGross > 0 && (
                      <div className="p-3 rounded-xl border" style={{backgroundColor:`${C.green}06`,borderColor:`${C.green}25`}}>
                        <p className="text-xs font-black mb-2" style={{color:C.forest}}>🔒 Your Trade Summary</p>
                        <div className="space-y-2">
                          {[
                            {label:'You pay',            value:`${sym}${fmt(payAmtNum,2)} ${cur} ≈ ${ghsSym}${fmt(payInGHS,0)} GHS`, color:C.g800},
                            {label:'BTC at seller rate',  value:`₿ ${btcGross.toFixed(8)}`,                                           color:C.g700},
                            {label:'Platform fee (0.5%)',value:`− ₿ ${feeBtc.toFixed(8)}`,                                            color:C.g500},
                            {label:'✅ You receive',     value:`₿ ${btcAfterFee.toFixed(8)} ≈ ${ghsSym}${fmt(recvInGHS,0)} GHS`,      color:C.forest, bold:true},
                          ].map(row=>(
                            <div key={row.label} className="flex justify-between gap-2 text-xs">
                              <span className="font-semibold flex-shrink-0" style={{color:C.g500}}>{row.label}</span>
                              <span className={row.bold?'font-black':'font-semibold'} style={{color:row.color,textAlign:'right'}}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Escrow protection note */}
                    <div className="flex items-start gap-2 p-3 rounded-xl"
                      style={{backgroundColor:`${C.green}08`,border:`1px solid ${C.green}20`}}>
                      <Lock size={12} style={{color:C.green,flexShrink:0,marginTop:1}}/>
                      <p className="text-[10px] leading-relaxed" style={{color:C.green}}>
                        <strong>Your funds are protected by escrow</strong> — Bitcoin is locked the moment the trade starts. Released only when both parties confirm.
                      </p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleStartTrade}
                      disabled={submitting||!payAmt||payAmtNum<=0||payAmtNum<minLocal||payAmtNum>maxLocal}
                      className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 shadow-sm"
                      style={{backgroundColor:cfg.color}}>
                      {submitting
                        ? <><RefreshCw size={15} className="animate-spin"/>Opening Trade…</>
                        : <><Lock size={14}/> Proceed with Payment <ArrowRight size={14}/></>}
                    </button>

                    {/* Trade steps */}
                    <div className="p-3 rounded-xl border" style={{borderColor:C.g100}}>
                      <p className="text-[10px] font-black mb-2" style={{color:C.g700}}>What Happens Next</p>
                      <div className="space-y-1.5">
                        {[
                          ['🔒','BTC locked in escrow automatically'],
                          ['💬','Trade chat opens with seller'],
                          ['💰','Send payment — click "I Have Paid"'],
                          ['✅','Seller confirms — BTC released to you'],
                          ['⭐','Leave feedback when done'],
                        ].map(([e,t])=>(
                          <div key={t} className="flex items-center gap-2 text-[10px]" style={{color:C.g600}}>
                            <span className="text-sm flex-shrink-0">{e}</span>{t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Safe trading notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl border"
                style={{backgroundColor:'#FFFBEB',borderColor:'#FDE68A'}}>
                <Shield size={13} className="flex-shrink-0 mt-0.5" style={{color:C.warn}}/>
                <p className="text-[10px] leading-relaxed" style={{color:'#92400E'}}>
                  <strong>Trade Safe:</strong> Never pay outside an active trade chat. All trades are escrow-protected. 0.5% fee on completion only.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-5">
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
                  {href:'https://x.com/praqenapp?s=21',label:'𝕏',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',label:'📸',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',label:'💼',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',label:'💬',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://discord.gg/V6zCZxfdy',label:'🎮',bg:'rgba(88,101,242,0.4)'},
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
                {[['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Gift Cards','/gift-cards'],['Create Offer','/create-offer'],['My Trades','/my-trades']].map(([l,h])=>(
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
    </div>
  );
}
