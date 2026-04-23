import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, Info,
  ArrowRight, BadgeCheck, RefreshCw,
  Lock, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import CountryFlag from '../components/CountryFlag';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g300:'#CBD5E1', g400:'#94A3B8', g500:'#64748B',
  g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', online:'#22C55E',
  warn:'#F59E0B', paid:'#3B82F6', teal:'#0D9488',
};


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
  const t = parseInt(u?.total_trades ?? 0), r = parseFloat(u?.average_rating ?? 0);
  if (t >= 500 && r >= 4.8) return TRUST_MAP.LEGEND;
  if (t >= 200 && r >= 4.5) return TRUST_MAP.EXPERT;
  if (t >= 50  && r >= 4.0) return TRUST_MAP.PRO;
  if (t >= 5)               return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

// USD_RATES is now provided by RatesContext — do NOT define a static object here
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',TZS:'TSh',USD:'$',GBP:'£',EUR:'€',XAF:'CFA',XOF:'CFA'};
const fmt    = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc = n => parseFloat(n||0).toFixed(8);

function fmtAge(d) {
  if (!d) return '—';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return 'Active now';
  if (s < 3600)  return `${~~(s/60)}m ago`;
  if (s < 86400) return `${~~(s/3600)}h ago`;
  return `${~~(s/86400)}d ago`;
}

function Avatar({ user, size=48 }) {
  const [err, setErr] = useState(false);
  if (user?.avatar_url && !err) return (
    <img src={user.avatar_url} alt={user.username||'user'} onError={()=>setErr(true)}
      className="object-cover flex-shrink-0 rounded-2xl" style={{width:size,height:size}}/>
  );
  return (
    <div className="flex-shrink-0 flex items-center justify-center font-black text-white rounded-2xl"
      style={{width:size,height:size,backgroundColor:C.green,fontSize:size*0.38}}>
      {(user?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

function getListingConfig(listing) {
  const type  = listing?.listing_type||'';
  const brand = listing?.gift_card_brand||'';
  if (type.includes('GIFT')||brand) return { label:'Gift Card Trade', color:C.teal,  bg:'#CCFBF1', icon:'🎁', action:'Trade Gift Card' };
  if (type==='SELL'||type==='SELL_BITCOIN') return { label:'Buy Bitcoin', color:C.green, bg:C.mist,    icon:'₿',   action:'Buy BTC' };
  return { label:'Sell Bitcoin', color:'#D97706', bg:'#FFFBEB', icon:'💰', action:'Sell BTC' };
}

function pmLabel(raw) {
  const m = String(raw||'').toLowerCase();
  if (m.includes('mtn'))           return { icon:'📱', label:raw||'MTN Mobile Money' };
  if (m.includes('vodafone'))      return { icon:'📱', label:raw||'Vodafone Cash' };
  if (m.includes('mpesa')||m.includes('m-pesa')) return { icon:'📱', label:raw||'M-Pesa' };
  if (m.includes('bank'))          return { icon:'🏦', label:raw||'Bank Transfer' };
  if (m.includes('paypal'))        return { icon:'💰', label:raw||'PayPal' };
  if (m.includes('opay'))          return { icon:'💳', label:'OPay' };
  if (m.includes('palmpay'))       return { icon:'💳', label:'PalmPay' };
  return { icon:'💳', label:raw||'Mobile Money' };
}

export default function ListingDetail({ user }) {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { rates: USD_RATES, btcUsd: contextBtcUsd } = useRates();
  const [listing,    setListing]    = useState(null);
  const [seller,     setSeller]     = useState(null);
  const [btcPrice,   setBtcPrice]   = useState(68000);
  const [loading,    setLoading]    = useState(true);
  const [payAmt,     setPayAmt]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quote,       setQuote]       = useState(null);  // { quoteId, executableRate, expiresAt }
  const [quoteFetching, setQuoteFetching] = useState(false);

  const isOwner = user && listing && user.id === listing.seller_id;

  useEffect(() => { if (contextBtcUsd > 0) setBtcPrice(contextBtcUsd); }, [contextBtcUsd]);
  useEffect(() => { loadAll(); }, [id]);

  // Debounce quote fetch whenever the user changes the amount
  useEffect(() => {
    const num = parseFloat(payAmt) || 0;
    if (!listing || num <= 0) { setQuote(null); return; }
    const t = setTimeout(async () => {
      setQuoteFetching(true);
      try {
        const r = await axios.post(`${API_URL}/quotes`, { listingId: listing.id || id });
        setQuote({ quoteId: r.data.quoteId, executableRate: r.data.executableRate, expiresAt: Date.now() + r.data.expiresIn * 1000 });
      } catch { setQuote(null); }
      finally { setQuoteFetching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [payAmt, listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/listings/${id}`);
      const l = r.data.listing;
      setListing(l);
      if (l?.seller_id) {
        try { const sr = await axios.get(`${API_URL}/users/${l.seller_id}`); setSeller(sr.data.user); } catch {}
      }
      // Track marketplace view (fire-and-forget — never blocks page load)
      axios.post(`${API_URL}/listings/${id}/view`).catch(() => {});
      // BTC price is now managed by RatesContext (Coinbase, auto-refreshed)
    } catch { toast.error('Failed to load listing'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{borderColor:C.sage,borderTopColor:'transparent'}}/>
    </div>
  );
  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-black text-sm mb-3" style={{color:C.g800}}>Listing not found</p>
        <button onClick={()=>navigate('/buy-bitcoin')} className="px-5 py-2 rounded-xl text-white font-bold text-sm" style={{backgroundColor:C.green}}>Browse Offers</button>
      </div>
    </div>
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const cfg    = getListingConfig(listing);
  const badge  = deriveBadge(seller);
  const countryCode = (seller?.country_code || seller?.country || 'gh').toLowerCase();

  const cur      = listing.currency || 'USD';
  const sym      = listing.currency_symbol || CUR_SYM[cur] || '$';
  const usdRate  = USD_RATES[cur] || 1;
  const margin   = parseFloat(listing.margin || 0);

  // Logic Sync: Calculate base price exactly as backend quotes endpoint should.
  // If fixed, use the fixed price. If market, use live btcPrice.
  const basePriceUSD    = (listing.pricing_type === 'fixed' && parseFloat(listing.bitcoin_price||0) > 100)
    ? parseFloat(listing.bitcoin_price) 
    : btcPrice;
  
  const sellerRateUSD   = basePriceUSD * (1 + margin / 100);
  const sellerRateLocal = sellerRateUSD * usdRate;

  const minLocal = listing.min_limit_local || (listing.min_limit_usd ? listing.min_limit_usd * usdRate : 10 * usdRate);
  const maxLocal = listing.max_limit_local || (listing.max_limit_usd ? listing.max_limit_usd * usdRate : 1000 * usdRate);

  const payAmtNum = parseFloat(payAmt) || 0;

  // Use the frozen quote rate when available; fall back to live rate for preview if no quote yet
  const activeRate   = quote ? quote.executableRate : sellerRateLocal;

  const btcGross    = payAmtNum > 0 && activeRate > 0 ? payAmtNum / activeRate : 0;
  const btcAfterFee = btcGross * 0.995;

  // CORRECT fiat equivalent calculation: localAmount / (1 + margin/100)
  const fiatEquivalent = payAmtNum > 0 ? payAmtNum / (1 + margin / 100) : 0;

  const pm       = pmLabel(listing.payment_method || (Array.isArray(listing.payment_methods) ? listing.payment_methods[0] : ''));
  const pmRaw    = listing.payment_method || (Array.isArray(listing.payment_methods) ? listing.payment_methods[0] : '') || '';

  const trades         = parseInt(seller?.total_trades || 0);
  const reviews        = parseInt(seller?.review_count || seller?.total_reviews || trades);
  const lastSeen       = fmtAge(seller?.last_login || seller?.updated_at);
  const isOnline       = seller?.last_login && (Date.now() - new Date(seller.last_login)) / 1000 < 300;
  const posFeedback    = parseInt(seller?.positive_feedback || 0);
  const negFeedback    = parseInt(seller?.negative_feedback || 0);
  const responseTime   = seller?.avg_response_time || '<1m';


  const handleStartTrade = async () => {
    if (!user)                           { toast.info('Please login to start trading'); navigate('/login'); return; }
    if (isOwner)                         { toast.info('This is your listing'); return; }
    if (!payAmt || payAmtNum <= 0)       { toast.error('Enter an amount to trade'); return; }
    if (payAmtNum < minLocal)            { toast.error(`Minimum is ${sym}${fmt(minLocal)}`); return; }
    if (payAmtNum > maxLocal)            { toast.error(`Maximum is ${sym}${fmt(maxLocal)}`); return; }
    if (btcGross <= 0 || !isFinite(btcGross)) { toast.error('Invalid amount'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // Ensure we have a fresh, valid quote before creating the trade
      let activeQuote = (quote && Date.now() < quote.expiresAt) ? quote : null;
      if (!activeQuote) {
        try {
          const qr = await axios.post(`${API_URL}/quotes`, { listingId: listing.id || id });
          activeQuote = { quoteId: qr.data.quoteId, executableRate: qr.data.executableRate, expiresAt: Date.now() + qr.data.expiresIn * 1000 };
          setQuote(activeQuote);
        } catch {
          toast.error('Could not fetch a rate quote. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      const lockedBtcGross    = payAmtNum / activeQuote.executableRate;
      const lockedBtcAfterFee = lockedBtcGross * 0.995;

      const r = await axios.post(`${API_URL}/trades`, {
        listingId:       listing.id || id,
        quoteId:         activeQuote.quoteId,
        amountBtc:       parseFloat(lockedBtcAfterFee.toFixed(8)),
        amountLocal:     payAmtNum,
        currency:        cur,
        currencySymbol:  sym,
        paymentMethod:   pmRaw,
        trade_type:      (listing.listing_type === 'SELL' || listing.listing_type === 'SELL_GIFT_CARD') ? 'BUY' : 'SELL',
        sellerRateLocal: parseFloat(activeQuote.executableRate.toFixed(2)),
        sellerRateUsd:   parseFloat(sellerRateUSD.toFixed(2)),
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (r.data.success || r.data.trade) {
        toast.success('Trade opened! Escrow activated.');
        navigate(`/trade/${r.data.trade.id}`);
      }
    } catch(e) {
      toast.error(e.response?.data?.error || 'Failed to create trade');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50, fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      <div className="flex-1 max-w-5xl mx-auto w-full px-3 py-4 space-y-3">

        {/* ── BREADCRUMB ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-[11px]" style={{color:C.g400}}>
          <button onClick={()=>navigate('/')} className="hover:underline">Home</button>
          <ChevronRight size={10}/>
          <button onClick={()=>navigate('/buy-bitcoin')} className="hover:underline">Marketplace</button>
          <ChevronRight size={10}/>
          <span style={{color:C.g700}} className="font-semibold">Listing #{String(listing.id||id).slice(0,8).toUpperCase()}</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-3">

          {/* ════════════════ LEFT COLUMN (3/5) ════════════════════════════ */}
          <div className="lg:col-span-3 space-y-3">

            {/* ── SELLER CARD ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>

              {/* Type strip */}
              <div className="px-4 py-2 flex items-center justify-between border-b"
                style={{borderColor:C.g100, background:`linear-gradient(90deg,${C.g50},${C.white})`}}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{cfg.icon}</span>
                  <p className="font-black text-xs tracking-wide" style={{color:C.forest}}>{cfg.label}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                  style={{backgroundColor:C.success}}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse"/>
                  Active
                </span>
              </div>

              <div className="p-4">
                {/* ── Profile row ─────────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <Avatar user={seller} size={52}/>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{backgroundColor:isOnline?C.online:C.g300}}/>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + badge + flag */}
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h2 className="font-black text-base leading-tight" style={{color:C.forest, fontFamily:"'Syne',sans-serif"}}>
                        {seller?.username || 'Seller'}
                      </h2>
                      {seller?.kyc_verified && <BadgeCheck size={14} style={{color:C.paid}}/>}
                      {/* Badge */}
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-sm border tracking-wide"
                        style={{background:badge.bg, borderColor:badge.borderColor}}>
                        <span style={{color:badge.iconColor||badge.textColor}}>{badge.icon}</span>
                        <span style={{color:badge.textColor}}>{badge.label}</span>
                        <BadgeCheck size={7} style={{color:badge.textColor,opacity:0.9}}/>
                      </span>
                    </div>

                    {/* Country + trades + reviews + online */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]" style={{color:C.g500}}>
                      <span className="flex items-center gap-1">
                        <CountryFlag countryCode={countryCode} className="w-4 h-3"/>
                        {seller?.country || listing?.country_name || ''}
                      </span>
                      <span className="text-[10px]" style={{color:C.g300}}>·</span>
                      <span className="font-bold" style={{color:C.g700}}>{fmt(trades)} Trades</span>
                      <span className="text-[10px]" style={{color:C.g300}}>·</span>
                      <span className="font-bold" style={{color:C.g700}}>{fmt(reviews)} Reviews</span>
                      <span className="text-[10px]" style={{color:C.g300}}>·</span>
                      <span className="font-bold flex items-center gap-1"
                        style={{color:isOnline?C.online:C.g400}}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{backgroundColor:isOnline?C.online:C.g400}}/>
                        {isOnline ? 'Online Now' : lastSeen}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Stats row ───────────────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { top:`👍${posFeedback} 👎${negFeedback}`, bot:'Feedback', color:C.success, icon:'💬' },
                    { top:responseTime,    bot:'Response',     color:C.paid,                  icon:'⚡' },
                    { top:fmt(trades),     bot:'Trades',       color:C.forest,                icon:'🔄' },
                    { top:lastSeen,        bot:'Last Seen',    color:isOnline?C.online:C.g500, icon:'👁' },
                  ].map(s => (
                    <div key={s.bot} className="text-center p-2 rounded-xl border" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                      <p className="text-[9px] mb-0.5" style={{color:C.g400}}>{s.icon}</p>
                      <p className="font-black text-sm leading-tight" style={{color:s.color}}>{s.top}</p>
                      <p className="text-[9px] font-semibold" style={{color:C.g400}}>{s.bot}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── TRADE TERMS — always visible ────────────────────────────── */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{borderColor:C.g100}}>
                <Info size={13} style={{color:C.green}}/>
                <p className="font-black text-sm" style={{color:C.forest}}>Trade Terms</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                  style={{backgroundColor:C.mist, color:C.g700, border:`1px solid ${C.g200}`}}>
                  {listing.trade_instructions || listing.description || 'No special instructions — standard trade rules apply.'}
                </div>
                {listing.listing_terms && (
                  <div className="p-3 rounded-xl text-[11px] leading-relaxed"
                    style={{backgroundColor:'#F0F9FF', color:C.g600, border:`1px solid ${C.paid}20`}}>
                    <p className="font-bold mb-1" style={{color:C.paid}}>Additional Terms</p>
                    {listing.listing_terms}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════════════ RIGHT COLUMN — Trade Box ══════════════════════ */}
          <div className="lg:col-span-2">
            <div className="sticky top-4 space-y-3">

              {isOwner ? (
                /* ── Owner view ──────────────────────────────────────────── */
                <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>
                  <div className="px-4 py-3 border-b" style={{borderColor:C.g100, backgroundColor:`${C.green}06`}}>
                    <p className="font-black text-sm" style={{color:C.forest}}>Your Listing</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 rounded-xl" style={{backgroundColor:`${C.success}10`, border:`1px solid ${C.success}20`}}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.success}}/>
                        <p className="text-xs font-black" style={{color:C.success}}>Active — visible to buyers</p>
                      </div>
                    </div>
                    {[
                      ['Rate',      `$${fmt(sellerRateUSD)} USD/BTC`],
                      ['Range',     `${sym}${fmt(minLocal)} – ${sym}${fmt(maxLocal)}`],
                      ['Payment',   pmRaw || '—'],
                      ['Margin',    margin===0?'Market rate':margin>0?`+${margin}%`:`${margin}%`],
                      ['Time limit',`${listing.time_limit||30} min`],
                    ].map(([l,v])=>(
                      <div key={l} className="flex justify-between text-xs py-1.5 border-b" style={{borderColor:C.g100}}>
                        <span style={{color:C.g500}}>{l}</span>
                        <span className="font-bold" style={{color:C.g800}}>{v}</span>
                      </div>
                    ))}
                    <button onClick={()=>navigate('/my-listings')}
                      className="w-full py-3 rounded-xl font-black text-sm text-white hover:opacity-90 transition"
                      style={{backgroundColor:C.green}}>
                      Manage My Listings →
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Trade box ────────────────────────────────────────────── */
                <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>
                  <div className="px-4 py-3 border-b" style={{borderColor:C.g100}}>
                    <p className="font-black text-sm" style={{color:C.forest}}>Start a Trade</p>
                    <p className="text-[10px]" style={{color:C.g400}}>Escrow locks BTC the moment you begin</p>
                  </div>

                  <div className="p-4 space-y-3">

                    {/* Seller mini row — avatar + name + online + range */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{backgroundColor:C.g50}}>
                      <Avatar user={seller} size={32}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs truncate" style={{color:C.forest}}>{seller?.username||'Seller'}</p>
                        <p className="text-[9px] flex items-center gap-1" style={{color:isOnline?C.online:C.g400}}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor:isOnline?C.online:C.g400}}/>
                          {isOnline ? 'Active Now' : lastSeen}
                        </p>
                      </div>
                      {/* Range pill instead of badge */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[8px] font-bold uppercase" style={{color:C.g400}}>Range</p>
                        <p className="text-[10px] font-black leading-tight" style={{color:C.forest}}>
                          {sym}{fmt(minLocal,0)}–{sym}{fmt(maxLocal,0)}
                        </p>
                        <p className="text-[8px]" style={{color:C.g400}}>{cur}</p>
                      </div>
                    </div>

                    {/* YOU PAY */}
                    <div>
                      <p className="text-sm font-black mb-1.5" style={{color:C.forest}}>
                        You Pay via <span style={{color:C.green}}>{pm.label}</span>
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black" style={{color:C.g500}}>{sym}</span>
                        <input
                          type="number"
                          value={payAmt}
                          onChange={e=>setPayAmt(e.target.value)}
                          placeholder="Enter amount…"
                          className="w-full pl-8 pr-16 py-3.5 text-lg font-black border-2 rounded-xl focus:outline-none"
                          style={{
                            borderColor: payAmtNum>0 && (payAmtNum<minLocal||payAmtNum>maxLocal) ? C.danger
                                       : payAmtNum>0 ? C.green : C.g200,
                            color: C.g800,
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black px-1.5 py-0.5 rounded"
                          style={{color:C.g500, backgroundColor:C.g100}}>{cur}</span>
                      </div>
                      {payAmtNum>0 && payAmtNum<minLocal && (
                        <p className="text-[10px] mt-1" style={{color:C.danger}}>Min {sym}{fmt(minLocal,0)} {cur}</p>
                      )}
                      {payAmtNum>maxLocal && (
                        <p className="text-[10px] mt-1" style={{color:C.danger}}>Max {sym}{fmt(maxLocal,0)} {cur}</p>
                      )}
                    </div>

                    {/* YOU RECEIVE — always visible, updates live */}
                    <div className="rounded-xl border overflow-hidden" style={{borderColor:C.g200}}>
                      {/* Header */}
                      <div className="px-3 py-2 border-b flex items-center justify-between"
                        style={{borderColor:C.g100, backgroundColor:C.g50}}>
                        <p className="text-xs font-black" style={{color:C.g700}}>Receive</p>
                        <div className="flex items-center gap-1.5">
                          {/* BTC rate */}
                          <p className="text-[10px] font-bold" style={{color:C.g500}}>
                            {sym}{fmt(sellerRateLocal,2)}
                          </p>
                          {/* Margin pill */}
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                            style={{backgroundColor:margin>0?C.danger:margin<0?C.success:C.g400}}>
                            {margin===0?'Market':margin>0?`+${margin}%`:`${margin}%`}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-3 py-3" style={{backgroundColor:C.mist}}>
                        {/* Bitcoin icon + label row */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{backgroundColor:C.gold}}>
                            <span className="text-white font-black text-[10px]">₿</span>
                          </div>
                          <p className="font-black text-xs" style={{color:C.forest}}>Bitcoin</p>
                        </div>

                        {/* BTC amount — big */}
                        <p className="font-black text-2xl leading-tight mb-0.5" style={{color:C.forest}}>
                          {btcAfterFee > 0 ? fmtBtc(btcAfterFee) : <span style={{color:C.g300}}>0.00000000</span>}
                        </p>

                        {/* Fiat equivalent at market rate */}
                        {fiatEquivalent > 0 && (
                          <p className="text-xs font-bold" style={{color:C.g500}}>
                            ≈ {sym}{fmt(fiatEquivalent, 2)} {cur} value
                          </p>
                        )}

                        {/* Quote lock indicator */}
                        {quoteFetching && (
                          <p className="text-[10px] mt-1 flex items-center gap-1" style={{color:C.g400}}>
                            <RefreshCw size={9} className="animate-spin"/> Locking rate…
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Escrow note */}
                    <div className="flex items-start gap-2 p-3 rounded-xl"
                      style={{backgroundColor:`${C.green}08`, border:`1px solid ${C.green}20`}}>
                      <Lock size={11} style={{color:C.green, flexShrink:0, marginTop:1}}/>
                      <p className="text-[10px] leading-relaxed" style={{color:C.green}}>
                        <strong>Your funds are protected by escrow</strong> for a secure trade. Released only when both parties confirm.
                      </p>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleStartTrade}
                      disabled={submitting || !payAmt || payAmtNum<=0 || payAmtNum<minLocal || payAmtNum>maxLocal}
                      className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40"
                      style={{backgroundColor:cfg.color}}>
                      {submitting
                        ? <><RefreshCw size={14} className="animate-spin"/>Opening…</>
                        : <><Lock size={13}/> Proceed with Payment <ArrowRight size={13}/></>}
                    </button>

                    {/* Steps */}
                    <div className="space-y-1.5">
                      {[
                        ['🔒','BTC locked in escrow'],
                        ['💬','Trade chat opens with seller'],
                        ['💰','Send payment → click "I Have Paid"'],
                        ['✅','Seller confirms → BTC released'],
                      ].map(([e,t])=>(
                        <div key={t} className="flex items-center gap-2 text-[10px]" style={{color:C.g500}}>
                          <span className="text-sm flex-shrink-0">{e}</span>{t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PRAQEN escrow banner */}
              <div className="flex items-start gap-3 p-3 rounded-xl border"
                style={{backgroundColor:`${C.green}08`, borderColor:`${C.green}25`}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{backgroundColor:C.green}}>
                  <Lock size={12} className="text-white"/>
                </div>
                <div>
                  <p className="text-[10px] font-black mb-0.5" style={{color:C.forest}}>PRAQEN Escrow Protection</p>
                  <p className="text-[10px] leading-relaxed" style={{color:C.g600}}>
                    Your funds are protected by escrow for a secure trade. Released only after both parties confirm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-5">
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
                  {href:'https://x.com/praqenapp?s=21',label:'𝕏'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',label:'📸'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',label:'💼'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',label:'💬'},
                  {href:'https://discord.gg/V6zCZxfdy',label:'🎮'},
                ].map(({href,label})=>(
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition"
                    style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
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
                  ['💬 WhatsApp','https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
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
