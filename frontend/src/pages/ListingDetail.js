import { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BadgeCheck, RefreshCw, Lock, ChevronRight } from 'lucide-react';
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
  const [quote,             setQuote]             = useState(null);
  const [quoteFetching,     setQuoteFetching]     = useState(false);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [popupOpen,         setPopupOpen]         = useState(false);

  // Slide up after listing loads
  useEffect(() => {
    if (!loading && listing) {
      const t = setTimeout(() => setPopupOpen(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading, listing]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', background: `linear-gradient(160deg, #061208 0%, #0f2318 50%, #1B4332 100%)` }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Styles */}
      <style>{`
        * { box-sizing: border-box; }

        .prq-backdrop {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 100;
          background: rgba(5, 18, 10, 0.45);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          transition: opacity 0.3s ease;
        }

        /* ── MOBILE first — full-width bottom sheet ── */
        .prq-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 101;
          height: 88vh;
          display: flex;
          flex-direction: column;
          border-radius: 20px 20px 0 0;
          background: #f1f5f2;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.3);
          transition: transform 0.4s cubic-bezier(0.32,0.72,0,1);
          overflow: hidden;
        }
        .prq-sheet.open   { transform: translateY(0); }
        .prq-sheet.closed { transform: translateY(100%); }

        .prq-sheet-scroll {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          padding: 6px 16px 32px;
        }
        .prq-sheet-scroll::-webkit-scrollbar { display: none; }
        .prq-sheet-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── TABLET & DESKTOP ── */
        @media (min-width: 640px) {
          .prq-sheet {
            top: 50%;
            left: 50%;
            bottom: auto;
            width: 92%;
            max-width: 500px;
            height: auto;
            max-height: 88vh;
            border-radius: 24px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.45);
            transition: transform 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease;
          }
          .prq-sheet.open   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
          .prq-sheet.closed { transform: translate(-50%, -46%) scale(0.95); opacity: 0; }
          .prq-sheet-scroll { padding: 6px 20px 32px; }
        }
      `}</style>

      {/* Backdrop — semi-transparent so marketplace shows through */}
      <div
        className="prq-backdrop"
        style={{ opacity: popupOpen ? 1 : 0, pointerEvents: popupOpen ? 'auto' : 'none' }}
        onClick={() => navigate(-1)}
      />

      {/* Sheet */}
      <div className={`prq-sheet ${popupOpen ? 'open' : 'closed'}`}>

        {/* Drag handle — fixed, never scrolls */}
        <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0, background: '#f1f5f2' }}>
          <div style={{ width: 34, height: 4, borderRadius: 4, background: '#c4d0ca' }} />
        </div>

        {/* Scrollable content */}
        <div className="prq-sheet-scroll">

        {/* ── Back button ── */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.g500, fontSize: 13, fontWeight: 700, marginBottom: 20, padding: 0 }}>
          <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
        </button>

        {/* ── Seller card ── */}
        <div style={{ background: '#fff', borderRadius: 18, marginBottom: 14, border: `1px solid ${C.g200}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(27,67,50,0.06)' }}>

          {/* Green header bar */}
          <div style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.green})`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>SELLER</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: isOnline ? '#6EE7B7' : 'rgba(255,255,255,0.5)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isOnline ? '#6EE7B7' : 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
              {isOnline ? 'Online Now' : `Seen ${lastSeen}`}
            </span>
          </div>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 12px' }}>
            <button onClick={() => setShowSellerProfile(true)}
              style={{ position: 'relative', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Avatar user={seller} size={50} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', backgroundColor: isOnline ? C.online : C.g300 }} />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <button onClick={() => setShowSellerProfile(true)}
                  style={{ fontSize: 15, fontWeight: 900, color: C.forest, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                  {seller?.username || 'Seller'}
                </button>
                {seller?.kyc_verified && <BadgeCheck size={13} color={C.paid} />}
                <span style={{ fontSize: 10, fontWeight: 800, color: badge.textColor, background: badge.bg, border: `1px solid ${badge.borderColor}`, borderRadius: 4, padding: '2px 7px' }}>
                  {badge.icon} {badge.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.g400, fontWeight: 600 }}>
                <CountryFlag countryCode={countryCode} className="w-4 h-3" />
                <span>{seller?.country || ''}</span>
              </div>
            </div>

            {/* Tap to view profile */}
            <button onClick={() => setShowSellerProfile(true)}
              style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: C.green, background: C.mist, border: `1px solid ${C.green}30`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer' }}>
              View Profile
            </button>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.g100}` }}>
            {[
              { icon: '🔄', value: fmt(trades),                       label: 'Trades'   },
              { icon: '',   value: `👍${posFeedback} · 👎${negFeedback}`, label: 'Feedback' },
              { icon: '⚡', value: responseTime,                       label: 'Response' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '10px 8px', textAlign: 'center',
                borderRight: i < 2 ? `1px solid ${C.g100}` : 'none',
                background: i === 1 ? C.g50 : '#fff',
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: C.forest, marginBottom: 2 }}>{s.icon} {s.value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Seller profile popup ── */}
        {showSellerProfile && (
          <div onClick={() => setShowSellerProfile(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

              {/* Popup header — brand green */}
              <div style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.green})`, padding: '14px 16px 16px', textAlign: 'center' }}>
                <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 4, margin: '0 auto 12px' }} />
                <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 8px' }}>
                  <Avatar user={seller} size={52} />
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', backgroundColor: isOnline ? C.online : C.g300 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{seller?.username || 'Seller'}</span>
                  {seller?.kyc_verified && <BadgeCheck size={14} color="#6EE7B7" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: badge.textColor, background: badge.bg, borderRadius: 4, padding: '2px 8px' }}>
                    {badge.icon} {badge.label}
                  </span>
                  <span style={{ fontSize: 11, color: isOnline ? '#6EE7B7' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                    {isOnline ? '● Online' : `Seen ${lastSeen}`}
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: `1px solid ${C.g100}` }}>
                {[
                  { label: 'Trades',   value: fmt(trades) },
                  { label: '👍 Pos',   value: posFeedback },
                  { label: '👎 Neg',   value: negFeedback },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.g100}` : 'none' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.forest }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                {[
                  { label: 'Response', value: responseTime },
                  { label: 'Country',  value: seller?.country || '—' },
                  { label: 'KYC',      value: seller?.kyc_verified ? '✓ Verified' : 'Unverified' },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.g100}` : 'none', background: C.g50 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: C.g800 }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Close */}
              <div style={{ padding: '12px 16px 28px' }}>
                <button onClick={() => setShowSellerProfile(false)}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, background: C.forest, color: '#fff', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {isOwner ? (
          /* ── Owner view ── */
          <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.g200}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.g100}`, background: C.mist }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: C.forest, margin: 0 }}>Your Listing</p>
              <p style={{ fontSize: 12, color: C.g400, margin: '2px 0 0' }}>This offer is live and visible to buyers</p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: `${C.success}10`, border: `1px solid ${C.success}25`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.success }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.success }}>Active — visible to buyers</span>
              </div>
              {[
                ['Rate',       `${sym}${fmt(sellerRateLocal, 0)} per BTC`],
                ['Range',      `${sym}${fmt(minLocal, 0)} – ${sym}${fmt(maxLocal, 0)}`],
                ['Payment',    pmRaw || '—'],
                ['Margin',     margin === 0 ? 'Market rate' : margin > 0 ? `+${margin}%` : `${margin}%`],
                ['Time limit', `${listing.time_limit || 30} min`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.g100}`, fontSize: 13 }}>
                  <span style={{ color: C.g500 }}>{l}</span>
                  <span style={{ fontWeight: 800, color: C.g800 }}>{v}</span>
                </div>
              ))}
              <button onClick={() => navigate('/my-listings')}
                style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, background: C.green, color: '#fff', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Manage My Listings →
              </button>
            </div>
          </div>
        ) : (
          /* ── Trade box ── */
          <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.g200}`, overflow: 'hidden' }}>

            {/* Payment method + range */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.g100}`, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: C.g400, fontWeight: 700, marginBottom: 2 }}>PAY WITH</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.g800 }}>{pm.icon} {pm.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.g400, fontWeight: 700, marginBottom: 2 }}>LIMIT</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.forest }}>{sym}{fmt(minLocal, 0)} – {sym}{fmt(maxLocal, 0)}</div>
              </div>
            </div>

            <div style={{ padding: 20 }}>

              {/* Amount input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: C.g600, marginBottom: 8 }}>
                  YOU PAY ({cur})
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 900, color: C.g400 }}>{sym}</span>
                  <input
                    type="number"
                    value={payAmt}
                    onChange={e => setPayAmt(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      paddingLeft: 36, paddingRight: 56, paddingTop: 16, paddingBottom: 16,
                      fontSize: 22, fontWeight: 900,
                      border: `2px solid ${payAmtNum > 0 && (payAmtNum < minLocal || payAmtNum > maxLocal) ? C.danger : payAmtNum > 0 ? C.green : C.g200}`,
                      borderRadius: 14, outline: 'none', color: C.g800,
                    }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 800, color: C.g500, background: C.g100, padding: '3px 7px', borderRadius: 6 }}>{cur}</span>
                </div>
                {payAmtNum > 0 && payAmtNum < minLocal && <p style={{ fontSize: 11, color: C.danger, marginTop: 6, fontWeight: 700 }}>Minimum is {sym}{fmt(minLocal, 0)}</p>}
                {payAmtNum > maxLocal && <p style={{ fontSize: 11, color: C.danger, marginTop: 6, fontWeight: 700 }}>Maximum is {sym}{fmt(maxLocal, 0)}</p>}
              </div>

              {/* You receive */}
              <div style={{ background: C.mist, borderRadius: 14, padding: '14px 16px', marginBottom: 16, border: `1px solid ${C.green}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.g500 }}>YOU RECEIVE</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: margin > 0 ? C.danger : margin < 0 ? C.success : C.g400, borderRadius: 20, padding: '2px 8px' }}>
                    {margin === 0 ? 'Market' : margin > 0 ? `+${margin}%` : `${margin}%`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>₿</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.forest, lineHeight: 1 }}>
                      {btcAfterFee > 0 ? fmtBtc(btcAfterFee) : <span style={{ color: C.g300 }}>0.00000000</span>}
                    </div>
                    {fiatEquivalent > 0 && <div style={{ fontSize: 11, color: C.g400, fontWeight: 600, marginTop: 2 }}>≈ {sym}{fmt(fiatEquivalent, 2)} {cur}</div>}
                  </div>
                  {quoteFetching && <RefreshCw size={13} color={C.g300} style={{ marginLeft: 'auto' }} className="animate-spin" />}
                </div>
              </div>

              {/* Trade terms (if any) */}
              {(listing.trade_instructions || listing.description) && (
                <div style={{ background: C.g50, borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: `1px solid ${C.g200}`, fontSize: 12, color: C.g600, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 800, color: C.g700, display: 'block', marginBottom: 4 }}>Seller's instructions</span>
                  {listing.trade_instructions || listing.description}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleStartTrade}
                disabled={submitting || !payAmt || payAmtNum <= 0 || payAmtNum < minLocal || payAmtNum > maxLocal}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: submitting || !payAmt || payAmtNum <= 0 || payAmtNum < minLocal || payAmtNum > maxLocal
                    ? C.g200 : `linear-gradient(135deg, ${C.forest}, ${C.green})`,
                  color: submitting || !payAmt || payAmtNum <= 0 || payAmtNum < minLocal || payAmtNum > maxLocal
                    ? C.g400 : '#fff',
                  boxShadow: (!submitting && payAmt && payAmtNum >= minLocal && payAmtNum <= maxLocal)
                    ? '0 6px 24px rgba(27,67,50,0.4)' : 'none',
                  fontWeight: 900, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}>
                {submitting
                  ? <><RefreshCw size={15} className="animate-spin" /> Opening trade…</>
                  : <><Lock size={14} /> Proceed to Payment <ArrowRight size={14} /></>}
              </button>

              {/* Simple steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.g100}` }}>
                {[['🔒','Escrow locks'],['💬','Chat opens'],['💸','Send payment'],['✅','BTC released']].map(([e,t])=>(
                  <div key={t} style={{ textAlign:'center', flex:1 }}>
                    <div style={{ fontSize:18, marginBottom:3 }}>{e}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.g400, lineHeight:1.3 }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Safety notice ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20, padding:'10px 14px', borderRadius:12, background:`${C.green}10`, border:`1px solid ${C.green}20` }}>
          <Lock size={11} color={C.green} style={{ flexShrink:0 }}/>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.green, textAlign:'center', lineHeight:1.5 }}>
            Your funds are protected by escrow — trade safely on <strong>PRAQEN.com</strong>
          </p>
        </div>

        </div>{/* end prq-sheet-scroll */}
      </div>{/* end prq-sheet */}
    </div>
  );
}
