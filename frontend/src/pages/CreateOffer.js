import React, { useState, useEffect, useRef } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import {
  Bitcoin, TrendingUp, Check, Info, AlertTriangle, Clock,
  DollarSign, Shield, ArrowRight, RefreshCw, Plus, Minus,
  Eye, ChevronRight, ChevronLeft, ShoppingCart, Tag,
  BarChart2, Settings2, FileText, ArrowUpRight,
  Gift, Search, ChevronDown, X,
  Smartphone, Banknote, Zap, Star, Wallet
} from 'lucide-react';
import { toast } from 'react-toastify';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6', purple:'#8B5CF6',
  orange:'#F97316',
};

const fmt = (n, d = 2) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n || 0);

const COUNTRIES = [
  { code:'GH', name:'Ghana',          currency:'GHS', symbol:'₵',   flag:'🇬🇭' },
  { code:'NG', name:'Nigeria',        currency:'NGN', symbol:'₦',   flag:'🇳🇬' },
  { code:'KE', name:'Kenya',          currency:'KES', symbol:'KSh', flag:'🇰🇪' },
  { code:'ZA', name:'South Africa',   currency:'ZAR', symbol:'R',   flag:'🇿🇦' },
  { code:'UG', name:'Uganda',         currency:'UGX', symbol:'USh', flag:'🇺🇬' },
  { code:'TZ', name:'Tanzania',       currency:'TZS', symbol:'TSh', flag:'🇹🇿' },
  { code:'US', name:'United States',  currency:'USD', symbol:'$',   flag:'🇺🇸' },
  { code:'GB', name:'United Kingdom', currency:'GBP', symbol:'£',   flag:'🇬🇧' },
  { code:'EU', name:'Europe',         currency:'EUR', symbol:'€',   flag:'🇪🇺' },
  { code:'CM', name:'Cameroon',       currency:'XAF', symbol:'CFA', flag:'🇨🇲' },
  { code:'SN', name:'Senegal',        currency:'XOF', symbol:'CFA', flag:'🇸🇳' },
  { code:'CI', name:"Côte d'Ivoire",  currency:'XOF', symbol:'CFA', flag:'🇨🇮' },
  { code:'RW', name:'Rwanda',         currency:'RWF', symbol:'RF',  flag:'🇷🇼' },
  { code:'ET', name:'Ethiopia',       currency:'ETB', symbol:'Br',  flag:'🇪🇹' },
  { code:'AU', name:'Australia',      currency:'AUD', symbol:'A$',  flag:'🇦🇺' },
  { code:'CA', name:'Canada',         currency:'CAD', symbol:'C$',  flag:'🇨🇦' },
  { code:'SG', name:'Singapore',      currency:'SGD', symbol:'S$',  flag:'🇸🇬' },
  { code:'IN', name:'India',          currency:'INR', symbol:'₹',   flag:'🇮🇳' },
];

// USD_RATES is now provided by RatesContext — do NOT define a static object here

// ── Payment methods — comprehensive list with categories ──────────────────────
const PAYMENT_METHODS = [
  // Mobile Money
  { id:'mtn_momo',    name:'MTN Mobile Money',     icon:'📱', cat:'Mobile Money',   countries:['GH','NG','UG','CM','RW','CI'] },
  { id:'vodafone',    name:'Vodafone Cash',         icon:'📱', cat:'Mobile Money',   countries:['GH'] },
  { id:'airteltigo',  name:'AirtelTigo Money',      icon:'📱', cat:'Mobile Money',   countries:['GH'] },
  { id:'mpesa',       name:'M-Pesa',                icon:'📱', cat:'Mobile Money',   countries:['KE','TZ'] },
  { id:'airtel_money',name:'Airtel Money',          icon:'📱', cat:'Mobile Money',   countries:['UG','TZ','KE'] },
  { id:'orange_money',name:'Orange Money',          icon:'📱', cat:'Mobile Money',   countries:['CM','SN','CI'] },
  { id:'wave',        name:'Wave',                  icon:'🌊', cat:'Mobile Money',   countries:['SN','CI'] },
  { id:'chipper',     name:'Chipper Cash',          icon:'💚', cat:'Mobile Money',   countries:[] },
  { id:'ecocash',     name:'EcoCash',               icon:'📱', cat:'Mobile Money',   countries:[] },
  { id:'tigo_pesa',   name:'Tigo Pesa',             icon:'📱', cat:'Mobile Money',   countries:['TZ'] },
  // Digital Wallets
  { id:'paypal',      name:'PayPal',                icon:'💰', cat:'Digital Wallet', countries:['US','GB','EU','AU','CA'] },
  { id:'cash_app',    name:'Cash App',              icon:'💸', cat:'Digital Wallet', countries:['US','GB'] },
  { id:'apple_pay',   name:'Apple Pay',             icon:'🍎', cat:'Digital Wallet', countries:['US','GB','EU','AU','CA'] },
  { id:'alipay',      name:'Alipay',                icon:'💙', cat:'Digital Wallet', countries:[] },
  { id:'venmo',       name:'Venmo',                 icon:'🔵', cat:'Digital Wallet', countries:['US'] },
  { id:'zelle',       name:'Zelle',                 icon:'💜', cat:'Digital Wallet', countries:['US'] },
  { id:'revolut',     name:'Revolut',               icon:'🔷', cat:'Digital Wallet', countries:['GB','EU'] },
  { id:'wise',        name:'Wise',                  icon:'🌍', cat:'Digital Wallet', countries:['US','GB','EU','AU','CA'] },
  { id:'moneypay',    name:'MoneyPay',              icon:'💳', cat:'Digital Wallet', countries:[] },
  // FinTech / Neobank
  { id:'opay',        name:'OPay',                  icon:'🟢', cat:'FinTech',        countries:['NG'] },
  { id:'palmpay',     name:'PalmPay',               icon:'🌴', cat:'FinTech',        countries:['NG'] },
  { id:'kuda',        name:'Kuda Bank',             icon:'🏦', cat:'FinTech',        countries:['NG'] },
  { id:'moniepoint',  name:'Moniepoint',            icon:'🏦', cat:'FinTech',        countries:['NG'] },
  { id:'gtbank',      name:'GTBank',                icon:'🏦', cat:'FinTech',        countries:['NG'] },
  { id:'access',      name:'Access Bank',           icon:'🏦', cat:'FinTech',        countries:['NG'] },
  // Bank
  { id:'bank_transfer',name:'Bank Transfer',        icon:'🏦', cat:'Bank',           countries:[] },
  { id:'wire_transfer',name:'Wire Transfer',        icon:'🔗', cat:'Bank',           countries:[] },
  // Gift Card / Voucher payment
  { id:'pls_gc',      name:'PLS Gift Card',         icon:'🎁', cat:'Gift Card Pay',  countries:[] },
  { id:'vanilla',     name:'Vanilla Card',          icon:'🎁', cat:'Gift Card Pay',  countries:[] },
  { id:'razer_gold',  name:'Razer Gold',            icon:'🎮', cat:'Gift Card Pay',  countries:[] },
  { id:'walmart_w2w', name:'Walmart to Walmart',    icon:'🛒', cat:'Gift Card Pay',  countries:['US'] },
  { id:'psn_pay',     name:'PlayStation Gift Card', icon:'🎮', cat:'Gift Card Pay',  countries:[] },
];

const CAT_COLORS = {
  'Mobile Money':  C.success,
  'Digital Wallet':C.paid,
  'FinTech':       C.amber,
  'Bank':          C.purple,
  'Gift Card Pay': C.orange,
};

// ── Gift card brands ──────────────────────────────────────────────────────────
const GC_BRANDS = [
  { name:'Amazon',              icon:'📦', color:'#FF9900' },
  { name:'Apple / iTunes',      icon:'🍎', color:'#555555' },
  { name:'Google Play',         icon:'▶️',  color:'#34A853' },
  { name:'Steam',               icon:'🎮', color:'#1B2838' },
  { name:'eBay',                icon:'🛍️', color:'#E53238' },
  { name:'Walmart',             icon:'🛒', color:'#0071CE' },
  { name:'Target',              icon:'🎯', color:'#CC0000' },
  { name:'Visa Gift Card',      icon:'💳', color:'#1A1F71' },
  { name:'Mastercard GC',       icon:'💳', color:'#EB001B' },
  { name:'Amex Gift Card',      icon:'💳', color:'#007BC1' },
  { name:'Netflix',             icon:'🎬', color:'#E50914' },
  { name:'Spotify',             icon:'🎵', color:'#1DB954' },
  { name:'Xbox',                icon:'🎮', color:'#107C10' },
  { name:'PlayStation',         icon:'🎮', color:'#003087' },
  { name:'Nintendo',            icon:'🎮', color:'#E4000F' },
  { name:'Razer Gold',          icon:'🟡', color:'#44D62C' },
  { name:'PLS Gift Card',       icon:'🎁', color:'#FF6B6B' },
  { name:'Vanilla Card',        icon:'🎁', color:'#8B4513' },
  { name:'Roblox',              icon:'🟥', color:'#E62E2E' },
  { name:'Fortnite V-Bucks',    icon:'🎮', color:'#1D76DB' },
  { name:'Other',               icon:'🎁', color:'#94A3B8' },
];

const GC_FACE_VALUES = [10, 20, 25, 50, 100, 200, 500, 1000];
const TIME_LIMITS = [15, 30, 45, 60, 90, 120];

// ── Step configs ──────────────────────────────────────────────────────────────
const BTC_STEPS  = [
  { id:1, label:'Type',    icon:Tag },
  { id:2, label:'Payment', icon:DollarSign },
  { id:3, label:'Pricing', icon:BarChart2 },
  { id:4, label:'Limits',  icon:Settings2 },
  { id:5, label:'Review',  icon:FileText },
];
const GC_STEPS = [
  { id:1, label:'Type',    icon:Tag },
  { id:2, label:'Card',    icon:Gift },
  { id:3, label:'Payment', icon:DollarSign },
  { id:4, label:'Rate',    icon:BarChart2 },
  { id:5, label:'Review',  icon:FileText },
];

export default function CreateOffer() {
  const navigate = useNavigate();
  const { rates: USD_RATES, btcUsd: contextBtcUsd } = useRates();
  const payRef = useRef(null);

  const [step,         setStep]         = useState(1);
  const [submitting,   setSubmitting]   = useState(false);
  const [btcPrice,     setBtcPrice]     = useState(68000);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [walletBal,    setWalletBal]    = useState({ btc: 0, usd: 0 });

  // Step 1
  const [offerType, setOfferType] = useState('sell'); // sell | buy | gc_buy

  // Step 2 – GC
  const [gcBrand,     setGcBrand]     = useState('Amazon');
  const [gcFaceValue, setGcFaceValue] = useState(50);
  const [gcSearch,    setGcSearch]    = useState('');

  // Step 2/3 – Country + Payment
  const [country,       setCountry]       = useState('GH');
  const [countrySearch, setCountrySearch] = useState('');
  const [payMethod,     setPayMethod]     = useState('');
  const [paySearch,     setPaySearch]     = useState('');
  const [showPayMenu,   setShowPayMenu]   = useState(false);

  // Step 3/4 – Pricing
  const [pricingType, setPricingType] = useState('market');
  const [margin,      setMargin]      = useState(5);
  const [fixedPrice,  setFixedPrice]  = useState('');

  // Step 4 – Limits (BTC only)
  const [minLimit,  setMinLimit]  = useState('');
  const [maxLimit,  setMaxLimit]  = useState('');
  const [timeLimit, setTimeLimit] = useState(30);

  // Step 5 – Text
  const [instructions, setInstructions] = useState('');
  const [terms,        setTerms]        = useState('');

  const isGC = offerType === 'gc_buy';
  const steps = isGC ? GC_STEPS : BTC_STEPS;

  // Derived values
  const curr       = COUNTRIES.find(c => c.code === country);
  const localRate  = USD_RATES[curr?.currency] || 1;
  const btcLocal   = btcPrice * localRate;
  const effectiveRate = pricingType === 'fixed' && fixedPrice
    ? parseFloat(fixedPrice)
    : btcLocal * (1 + margin / 100);
  const sym = curr?.symbol || '$';
  const cur = curr?.currency || 'USD';

  // Grouped payment methods for dropdown
  const matchesPay = (m) => {
    if (!paySearch) return true;
    return m.name.toLowerCase().includes(paySearch.toLowerCase()) ||
           m.cat.toLowerCase().includes(paySearch.toLowerCase());
  };
  const localMethods = PAYMENT_METHODS.filter(m =>
    (m.countries.length === 0 || m.countries.includes(country)) && matchesPay(m)
  );
  const otherMethods = paySearch
    ? PAYMENT_METHODS.filter(m => m.countries.length > 0 && !m.countries.includes(country) && matchesPay(m))
    : [];
  const selectedPay = PAYMENT_METHODS.find(m => m.id === payMethod);

  // Filtered GC brands
  const filteredBrands = GC_BRANDS.filter(b =>
    b.name.toLowerCase().includes(gcSearch.toLowerCase())
  );

  // BTC amounts
  const minLocalVal = isGC ? gcFaceValue : (parseFloat(minLimit) || 0);
  const maxLocalVal = isGC ? gcFaceValue : (parseFloat(maxLimit) || 0);
  const minUSDVal   = isGC ? gcFaceValue : (minLocalVal / localRate);
  const maxUSDVal   = isGC ? gcFaceValue : (maxLocalVal / localRate);

  // Wallet capacity in local currency
  // SELL/gc_buy: user locks BTC → capacity = BTC balance × local BTC price
  // BUY: user pays cash → capacity = USD balance converted to local
  const walletCapacityLocal = (() => {
    if (offerType === 'sell' || offerType === 'gc_buy') {
      return walletBal.btc * effectiveRate;
    }
    return walletBal.usd * localRate;
  })();
  const walletCapacityUSD = offerType === 'sell' || offerType === 'gc_buy'
    ? walletBal.btc * btcPrice
    : walletBal.usd;
  const maxExceedsWallet = parseFloat(maxLimit) > 0 && walletCapacityLocal > 0 && parseFloat(maxLimit) > walletCapacityLocal;

  // Sync BTC price from RatesContext (already auto-refreshed by rateService)
  useEffect(() => { if (contextBtcUsd > 0) { setBtcPrice(contextBtcUsd); setLoadingPrice(false); } }, [contextBtcUsd]);

  useEffect(() => {
    const iv = setInterval(() => {}, 60000); // kept to preserve cleanup shape

    // Fetch wallet balance so we can enforce limits
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/user/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => setWalletBal({ btc: parseFloat(r.data.balance_btc||0), usd: parseFloat(r.data.balance_usd||0) }))
        .catch(() => {});
    }

    return () => clearInterval(iv);
  }, []);

  // Close payment dropdown on outside click
  useEffect(() => {
    const h = e => { if (payRef.current && !payRef.current.contains(e.target)) setShowPayMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Reset payment when country changes
  useEffect(() => { setPayMethod(''); }, [country]);

  const canNext = () => {
    if (step === 1) return !!offerType;
    if (step === 2) {
      if (isGC) return !!gcBrand;
      return !!country && !!payMethod;
    }
    if (step === 3) {
      if (isGC) return !!country && !!payMethod;
      if (pricingType === 'fixed') return !!fixedPrice && parseFloat(fixedPrice) > 0;
      return true;
    }
    if (step === 4) {
      if (isGC) return true;
      const mn = parseFloat(minLimit), mx = parseFloat(maxLimit);
      if (!(mn > 0 && mx > 0 && mx >= mn)) return false;
      if (maxExceedsWallet) return false;
      return true;
    }
    return true;
  };

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 5)); else toast.warn('Please complete all required fields'); };
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user  = JSON.parse(localStorage.getItem('user')  || '{}');
      const token = localStorage.getItem('token');
      if (!user.id) { toast.error('Please login to create an offer'); navigate('/login'); return; }

      const listingTypeMap = { sell:'SELL', buy:'BUY', gc_buy:'BUY_GIFT_CARD' };

      const rateUSD = pricingType === 'fixed' && fixedPrice
        ? parseFloat(fixedPrice)
        : btcPrice * (1 + margin / 100);

      const payload = {
        seller_id:         user.id,
        listing_type:      listingTypeMap[offerType],
        gift_card_brand:   isGC ? gcBrand : null,
        face_value:        isGC ? gcFaceValue : null,
        amount_usd:        isGC ? gcFaceValue : minUSDVal,
        bitcoin_price:     rateUSD,
        margin:            pricingType === 'market' ? margin : 0,
        payment_method:    selectedPay?.name || payMethod,
        country:           country,
        country_name:      curr?.name,
        currency:          cur,
        currency_symbol:   sym,
        min_limit_usd:     minUSDVal,
        max_limit_usd:     maxUSDVal,
        min_limit_local:   minLocalVal,
        max_limit_local:   maxLocalVal,
        time_limit:        timeLimit,
        status:            'ACTIVE',
        pricing_type:      pricingType,
        description:       instructions,
        terms:             terms,
        trade_instructions:instructions,
        listing_terms:     terms,
        created_at:        new Date().toISOString(),
      };

      const r = await axios.post(`${API_URL}/listings`, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (r.data.success || r.data.listing) {
        toast.success('🎉 Offer published successfully!');
        if (offerType === 'sell') navigate('/buy-bitcoin');
        else if (offerType === 'buy') navigate('/sell-bitcoin');
        else navigate('/gift-cards');
      } else {
        toast.error(r.data.error || 'Failed to publish offer');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to publish offer');
    } finally { setSubmitting(false); }
  };

  // ── Payment method dropdown ───────────────────────────────────────────────
  const PayDropdown = () => {
    const cats = [...new Set(localMethods.map(m => m.cat))];
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl z-50 border overflow-hidden"
        style={{ borderColor: C.g200, maxHeight: 340 }}>
        {/* Search */}
        <div className="p-2.5 border-b sticky top-0 bg-white" style={{ borderColor: C.g100 }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.g400 }} />
            <input autoFocus type="text" value={paySearch} onChange={e => setPaySearch(e.target.value)}
              placeholder="Search payment method…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none"
              style={{ borderColor: C.g200 }} />
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
          {/* Country-specific methods */}
          {localMethods.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest"
                style={{ color: C.g400 }}>
                {curr?.flag} Available in {curr?.name}
              </p>
              {cats.map(cat => {
                const items = localMethods.filter(m => m.cat === cat);
                if (!items.length) return null;
                return (
                  <div key={cat}>
                    <p className="px-3 py-1 text-[9px] font-bold uppercase"
                      style={{ color: CAT_COLORS[cat] || C.g500 }}>
                      {cat}
                    </p>
                    {items.map(m => (
                      <button key={m.id} onClick={() => { setPayMethod(m.id); setShowPayMenu(false); setPaySearch(''); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition"
                        style={{ backgroundColor: payMethod === m.id ? `${C.green}08` : undefined }}>
                        <span className="text-base w-5 text-center flex-shrink-0">{m.icon}</span>
                        <span className="text-xs font-semibold flex-1" style={{ color: C.g800 }}>{m.name}</span>
                        {payMethod === m.id && <Check size={12} style={{ color: C.green }} />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {/* Other / global methods shown when searching */}
          {otherMethods.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest"
                style={{ color: C.g400 }}>Other Methods</p>
              {otherMethods.map(m => (
                <button key={m.id} onClick={() => { setPayMethod(m.id); setShowPayMenu(false); setPaySearch(''); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition">
                  <span className="text-base w-5 text-center flex-shrink-0">{m.icon}</span>
                  <span className="text-xs font-semibold flex-1" style={{ color: C.g800 }}>{m.name}</span>
                  <span className="text-[9px]" style={{ color: C.g400 }}>{m.cat}</span>
                  {payMethod === m.id && <Check size={12} style={{ color: C.green }} />}
                </button>
              ))}
            </div>
          )}
          {localMethods.length === 0 && otherMethods.length === 0 && (
            <p className="text-center text-xs py-6" style={{ color: C.g400 }}>No methods found</p>
          )}
        </div>
      </div>
    );
  };

  // ── Market card preview ───────────────────────────────────────────────────
  const MarketCardPreview = () => (
    <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: C.g200, maxWidth: 280 }}>
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: C.g100 }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
            style={{ backgroundColor: C.green }}>You</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black" style={{ color: C.g800 }}>Your Offer</span>
              <span className="text-xs">{curr?.flag}</span>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm text-white"
                style={{ backgroundColor: C.green }}>⭐ Pro</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] mt-0.5 font-black" style={{ color: C.g500 }}>
              <span style={{ color: C.success }}>👍 0</span>
              <span>·</span><span>0 Trades</span>
              <span>·</span><span style={{ color: C.success }}>● Active</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 border-b grid grid-cols-2 gap-2" style={{ borderColor: C.g100 }}>
        {isGC ? (
          <>
            <div>
              <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{ color: C.g500 }}>
                {offerType === 'gc_buy' ? 'Pay BTC' : 'Receive BTC'}
              </p>
              <p className="text-xs font-black" style={{ color: C.g800 }}>
                {gcFaceValue > 0 && effectiveRate > 0
                  ? `₿${(gcFaceValue / effectiveRate * localRate).toFixed(6)}`
                  : '₿ —'}
              </p>
            </div>
            <div className="border-l pl-2" style={{ borderColor: C.g100 }}>
              <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{ color: C.g500 }}>
                {gcBrand}
              </p>
              <p className="text-xs font-black" style={{ color: C.g800 }}>${gcFaceValue} USD</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{ color: C.g500 }}>
                {offerType === 'sell' ? 'BTC Amount' : 'You Pay'}
              </p>
              <p className="text-xs font-black" style={{ color: C.g800 }}>
                {minLimit ? `₿${(parseFloat(minLimit) / effectiveRate).toFixed(5)}` : '₿ —'}
              </p>
            </div>
            <div className="border-l pl-2" style={{ borderColor: C.g100 }}>
              <p className="text-[8px] font-black uppercase tracking-wide mb-0.5" style={{ color: C.g500 }}>
                {selectedPay?.name || 'Payment'}
              </p>
              <p className="text-xs font-black" style={{ color: C.g800 }}>
                {minLimit ? `${sym}${fmt(parseFloat(minLimit))} ${cur}` : `${sym}— ${cur}`}
              </p>
            </div>
          </>
        )}
      </div>
      <div className="px-3 py-2 border-b" style={{ borderColor: C.g100 }}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-black" style={{ color: C.danger }}>
            ₿ {sym}{fmt(effectiveRate)} {cur}
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
            style={{ color: C.success, backgroundColor: `${C.success}15` }}>
            +{margin}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]" style={{ color: C.g400 }}>
          {isGC ? (
            <span>Gift Card: ${gcFaceValue}</span>
          ) : (
            <span>{minLimit && maxLimit
              ? `${sym}${fmt(parseFloat(minLimit))} – ${sym}${fmt(parseFloat(maxLimit))} ${cur}`
              : 'Set limits in previous step'}</span>
          )}
          <span>⏱ {timeLimit}min</span>
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="w-full py-1.5 rounded-lg text-white text-[10px] font-black text-center"
          style={{ backgroundColor: offerType === 'sell' ? C.green : offerType === 'buy' ? C.paid : C.purple }}>
          {offerType === 'sell' ? 'Buy BTC →' : offerType === 'buy' ? 'Sell BTC →' : offerType === 'gc_buy' ? 'Sell Gift Card →' : 'Buy Gift Card →'}
        </div>
      </div>
    </div>
  );

  // ── Offer type config ─────────────────────────────────────────────────────
  const OFFER_TYPES = [
    {
      id: 'sell',
      title: 'Sell Bitcoin',
      subtitle: 'I have BTC, I want local currency',
      icon: Bitcoin,
      color: C.green,
      badge: '🟢 Listed on Buy Bitcoin page',
      badgeColor: C.success,
      desc: 'You own Bitcoin and want to sell it. Buyers pay you in local cash via MTN, bank, PayPal, etc.',
    },
    {
      id: 'buy',
      title: 'Buy Bitcoin',
      subtitle: 'I have cash, I want BTC',
      icon: ShoppingCart,
      color: C.paid,
      badge: '🔵 Listed on Sell Bitcoin page',
      badgeColor: C.paid,
      desc: 'Post your buy offer. Bitcoin sellers come to you and you pay them in local currency.',
    },
    {
      id: 'gc_buy',
      title: 'Buy Gift Card',
      subtitle: 'I have BTC, I want a gift card',
      icon: Gift,
      color: C.purple,
      badge: '💜 Listed on Gift Cards page',
      badgeColor: C.purple,
      desc: 'Spend your Bitcoin on gift cards. Users with unused gift cards come to trade with you — you pay in BTC.',
    },
  ];

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-6 px-3 sm:px-4" style={{ backgroundColor: C.mist, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div className="max-w-2xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg"
              style={{ background: `linear-gradient(135deg,${C.forest},${C.mint})`, color: C.white }}>P</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black leading-none" style={{ color: C.forest, fontFamily:"'Syne',sans-serif" }}>
                Create an Offer
              </h1>
              <p className="text-xs mt-0.5" style={{ color: C.g500 }}>
                Live BTC price: <span className="font-black" style={{ color: C.forest }}>
                  {loadingPrice ? '…' : `$${fmt(btcPrice, 0)}`}
                </span>
                {!loadingPrice && <span style={{ color: C.g400 }}> USD</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Step progress bar ────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center flex-shrink-0 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: done ? C.success : active ? C.green : C.g100,
                      color: (done || active) ? C.white : C.g400,
                    }}>
                    {done ? <Check size={15} /> : <Icon size={15} />}
                  </div>
                  <p className="text-[9px] mt-0.5 font-black hidden sm:block text-center"
                    style={{ color: active ? C.green : done ? C.success : C.g400 }}>
                    {s.label}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full"
                    style={{ backgroundColor: step > s.id ? C.success : C.g200 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mb-4" style={{ borderColor: C.g200 }}>

          {/* ━━ STEP 1: Offer Type ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>What would you like to do?</h2>
                <p className="text-xs" style={{ color: C.g500 }}>Your offer will appear in the matching marketplace.</p>
              </div>

              {/* BTC section */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: C.g400 }}>
                  <Bitcoin size={10} /> Bitcoin Offers
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OFFER_TYPES.filter(t => !t.id.startsWith('gc')).map(ot => {
                    const Icon = ot.icon;
                    const active = offerType === ot.id;
                    return (
                      <button key={ot.id} onClick={() => setOfferType(ot.id)}
                        className="relative p-4 rounded-2xl text-left border-2 transition-all duration-200 hover:shadow-sm"
                        style={{
                          borderColor: active ? ot.color : C.g200,
                          backgroundColor: active ? `${ot.color}08` : C.white,
                        }}>
                        {active && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: ot.color }}>
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                          style={{ backgroundColor: active ? ot.color : C.g100 }}>
                          <Icon size={18} style={{ color: active ? C.white : C.g400 }} />
                        </div>
                        <p className="font-black text-sm mb-0.5" style={{ color: C.forest }}>{ot.title}</p>
                        <p className="text-[11px] mb-2 leading-relaxed" style={{ color: C.g500 }}>{ot.desc}</p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${ot.badgeColor}15`, color: ot.badgeColor }}>
                          {ot.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gift Card section — single option, full-width card */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: C.g400 }}>
                  <Gift size={10} /> Gift Card Offers
                </p>
                {(() => {
                  const ot = OFFER_TYPES.find(t => t.id === 'gc_buy');
                  if (!ot) return null;
                  const Icon = ot.icon;
                  const active = offerType === ot.id;
                  return (
                    <button onClick={() => setOfferType(ot.id)}
                      className="relative w-full p-4 rounded-2xl text-left border-2 transition-all duration-200 hover:shadow-sm"
                      style={{
                        borderColor: active ? ot.color : C.g200,
                        backgroundColor: active ? `${ot.color}08` : C.white,
                      }}>
                      {active && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: ot.color }}>
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: active ? ot.color : C.g100 }}>
                          <Icon size={22} style={{ color: active ? C.white : C.g400 }} />
                        </div>
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-base mb-0.5" style={{ color: C.forest }}>{ot.title}</p>
                          <p className="text-xs mb-2 leading-relaxed" style={{ color: C.g500 }}>{ot.desc}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${ot.badgeColor}15`, color: ot.badgeColor }}>
                              {ot.badge}
                            </div>
                            <span className="text-[10px]" style={{ color: C.g400 }}>
                              Supported: Amazon · Apple · Steam · Google Play · Visa + more
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-2xl flex items-start gap-2.5"
                style={{ backgroundColor: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
                <Shield size={13} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs leading-relaxed" style={{ color: C.g700 }}>
                  <strong>Escrow Protected:</strong> Bitcoin is automatically locked in escrow when a trade starts.
                  PRAQEN charges <strong>0.5% fee</strong> only on completed trades.
                </p>
              </div>
            </div>
          )}

          {/* ━━ STEP 2 (GC): Gift Card Brand + Face Value ━━━━━━━━━━━━━━━━━━━ */}
          {step === 2 && isGC && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>
                  {offerType === 'gc_buy' ? 'Which gift card do you want?' : 'Which gift card do you have?'}
                </h2>
                <p className="text-xs" style={{ color: C.g500 }}>Select the brand and face value.</p>
              </div>

              {/* Brand search */}
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: C.g700 }}>
                  Gift Card Brand <span style={{ color: C.danger }}>*</span>
                </label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.g400 }} />
                  <input type="text" placeholder="Search brand…" value={gcSearch}
                    onChange={e => setGcSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 text-sm focus:outline-none"
                    style={{ borderColor: C.g200 }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {filteredBrands.map(b => {
                    const active = gcBrand === b.name;
                    return (
                      <button key={b.name} onClick={() => setGcBrand(b.name)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                        style={{
                          borderColor: active ? C.purple : C.g200,
                          backgroundColor: active ? `${C.purple}10` : C.white,
                        }}>
                        <span className="text-lg flex-shrink-0">{b.icon}</span>
                        <span className="text-xs font-bold truncate" style={{ color: C.g800 }}>{b.name}</span>
                        {active && <Check size={12} style={{ color: C.purple, marginLeft: 'auto', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Face Value */}
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: C.g700 }}>
                  Face Value (USD) <span style={{ color: C.danger }}>*</span>
                </label>
                <p className="text-xs mb-2" style={{ color: C.g500 }}>
                  Select the denomination of the gift card.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {GC_FACE_VALUES.map(v => (
                    <button key={v} onClick={() => setGcFaceValue(v)}
                      className="py-3 rounded-xl font-black text-sm transition-all border-2"
                      style={{
                        borderColor: gcFaceValue === v ? C.purple : C.g200,
                        backgroundColor: gcFaceValue === v ? C.purple : C.white,
                        color: gcFaceValue === v ? C.white : C.g700,
                      }}>
                      ${v}
                    </button>
                  ))}
                </div>

                {/* BTC equivalent */}
                {gcFaceValue > 0 && (
                  <div className="mt-3 p-3 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: `${C.purple}08`, border: `1px solid ${C.purple}20` }}>
                    <div>
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: C.g500 }}>
                        BTC equivalent at market price
                      </p>
                      <p className="text-base font-black" style={{ color: C.forest }}>
                        ₿{(gcFaceValue / btcPrice).toFixed(6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: C.g400 }}>Face value</p>
                      <p className="text-sm font-black" style={{ color: C.purple }}>${gcFaceValue} USD</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ━━ STEP 2 (BTC) / STEP 3 (GC): Country + Payment ━━━━━━━━━━━━━━ */}
          {((step === 2 && !isGC) || (step === 3 && isGC)) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>Location & Payment</h2>
                <p className="text-xs" style={{ color: C.g500 }}>
                  {offerType === 'sell' ? 'Where should buyers pay you?' :
                   offerType === 'buy'  ? 'Where will you pay sellers?' :
                   'Where are you located?'}
                </p>
              </div>

              {/* Country selector */}
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: C.g700 }}>
                  Your Country <span style={{ color: C.danger }}>*</span>
                </label>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.g400 }} />
                  <input type="text" placeholder="Search country or currency…"
                    value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 text-sm focus:outline-none"
                    style={{ borderColor: C.g200 }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {COUNTRIES.filter(c =>
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    c.currency.toLowerCase().includes(countrySearch.toLowerCase())
                  ).map(c => (
                    <button key={c.code}
                      onClick={() => { setCountry(c.code); setCountrySearch(''); }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                      style={{
                        borderColor: country === c.code ? C.green : C.g200,
                        backgroundColor: country === c.code ? `${C.green}10` : C.white,
                      }}>
                      <span className="text-lg flex-shrink-0">{c.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate" style={{ color: C.g800 }}>{c.name}</p>
                        <p className="text-[10px] font-black" style={{ color: C.g400 }}>
                          {c.symbol} {c.currency}
                        </p>
                      </div>
                      {country === c.code && <Check size={12} style={{ color: C.green, flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method dropdown */}
              {curr && (
                <div ref={payRef} className="relative">
                  <label className="block text-sm font-bold mb-1.5" style={{ color: C.g700 }}>
                    Payment Method <span style={{ color: C.danger }}>*</span>
                  </label>
                  <p className="text-xs mb-2" style={{ color: C.g500 }}>
                    How {offerType === 'sell' ? 'buyers pay you' : offerType === 'buy' ? 'you pay sellers' : 'you want to transact'}
                  </p>

                  <button onClick={() => setShowPayMenu(!showPayMenu)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition"
                    style={{
                      borderColor: payMethod ? C.green : C.g200,
                      backgroundColor: payMethod ? `${C.green}05` : C.white,
                    }}>
                    {selectedPay ? (
                      <>
                        <span className="text-xl">{selectedPay.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: C.g800 }}>{selectedPay.name}</p>
                          <p className="text-[10px]" style={{ color: CAT_COLORS[selectedPay.cat] || C.g400 }}>
                            {selectedPay.cat}
                          </p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setPayMethod(''); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 flex-shrink-0">
                          <X size={11} style={{ color: C.g400 }} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: C.g100 }}>
                          <DollarSign size={15} style={{ color: C.g400 }} />
                        </div>
                        <span className="flex-1 text-sm" style={{ color: C.g400 }}>Select payment method…</span>
                        <ChevronDown size={15} style={{ color: C.g400 }} />
                      </>
                    )}
                  </button>
                  {showPayMenu && <PayDropdown />}

                  {/* Category legend */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(CAT_COLORS).map(([cat, color]) => (
                      <span key={cat} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ━━ STEP 3 (BTC) / STEP 4 (GC): Pricing / Rate ━━━━━━━━━━━━━━━━━ */}
          {((step === 3 && !isGC) || (step === 4 && isGC)) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>
                  {isGC ? 'Set BTC Rate' : 'Set Your Bitcoin Rate'}
                </h2>
                <p className="text-xs" style={{ color: C.g500 }}>
                  Control your price. Higher margin = more profit per trade.
                </p>
              </div>

              {/* Live price banner */}
              <div className="p-4 rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg,${C.forest},${C.green})` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/60 mb-0.5">Live Market Price</p>
                    <p className="text-2xl font-black">{loadingPrice ? '…' : `${sym}${fmt(btcLocal, 0)}`}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{cur} per 1 BTC · Refreshes every 60s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60 mb-0.5">USD price</p>
                    <p className="text-base font-black">${fmt(btcPrice, 0)}</p>
                    <button onClick={() => setLoadingPrice(true)}
                      className="mt-1 text-[10px] text-white/40 flex items-center gap-1 ml-auto hover:text-white/70">
                      <RefreshCw size={9} /> Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate type */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: C.g700 }}>Rate Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val:'market', icon:TrendingUp, title:'Market Rate', desc:'Auto-adjusts with BTC price. Always competitive.' },
                    { val:'fixed',  icon:Tag,        title:'Fixed Rate',  desc:'You lock a price. Stays constant even if BTC moves.' },
                  ].map(({ val, icon: Icon, title, desc }) => (
                    <button key={val} onClick={() => setPricingType(val)}
                      className="p-3.5 rounded-xl text-left border-2 transition-all"
                      style={{
                        borderColor: pricingType === val ? C.green : C.g200,
                        backgroundColor: pricingType === val ? `${C.green}08` : C.white,
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: pricingType === val ? C.green : C.g100 }}>
                          <Icon size={13} style={{ color: pricingType === val ? C.white : C.g400 }} />
                        </div>
                        {pricingType === val && <Check size={12} style={{ color: C.green }} />}
                      </div>
                      <p className="font-black text-sm mb-0.5" style={{ color: C.forest }}>{title}</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: C.g500 }}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Market margin — 1 to 100% */}
              {pricingType === 'market' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold" style={{ color: C.g700 }}>Your Margin</label>
                    <span className="text-xs" style={{ color: C.g500 }}>
                      Quick: {[1,3,5,8,10,15,20].map(v => (
                        <button key={v} onClick={() => setMargin(v)}
                          className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition"
                          style={{
                            backgroundColor: margin === v ? C.green : C.g100,
                            color: margin === v ? C.white : C.g600,
                          }}>+{v}%</button>
                      ))}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border-2" style={{ borderColor: C.g200 }}>
                    {/* Big margin display + stepper */}
                    <div className="flex items-center gap-3 mb-4">
                      <button onClick={() => setMargin(m => Math.max(1, parseFloat((m - 0.5).toFixed(1))))}
                        className="w-11 h-11 rounded-xl flex items-center justify-center border-2 active:scale-95 flex-shrink-0"
                        style={{ borderColor: C.danger, backgroundColor: `${C.danger}10` }}>
                        <Minus size={16} style={{ color: C.danger }} />
                      </button>
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-black" style={{ color: C.success }}>+{margin}%</span>
                          <ArrowUpRight size={22} style={{ color: C.success }} />
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: C.g400 }}>
                          Your markup rate above market
                        </p>
                      </div>
                      <button onClick={() => setMargin(m => Math.min(100, parseFloat((m + 0.5).toFixed(1))))}
                        className="w-11 h-11 rounded-xl flex items-center justify-center border-2 active:scale-95 flex-shrink-0"
                        style={{ borderColor: C.success, backgroundColor: `${C.success}10` }}>
                        <Plus size={16} style={{ color: C.success }} />
                      </button>
                    </div>

                    {/* Slider 1–100 */}
                    <input type="range" min="1" max="100" step="0.5"
                      value={margin} onChange={e => setMargin(parseFloat(e.target.value))}
                      className="w-full" style={{ accentColor: C.success }} />
                    <div className="flex justify-between text-[10px] mt-0.5" style={{ color: C.g400 }}>
                      <span>1% (competitive)</span>
                      <span>50%</span>
                      <span>100% (max profit)</span>
                    </div>

                    {/* Type exact margin */}
                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-xs font-bold flex-shrink-0" style={{ color: C.g500 }}>Custom:</label>
                      <div className="relative flex-1">
                        <input type="number" min="1" max="100" step="0.5"
                          value={margin} onChange={e => setMargin(Math.min(100, Math.max(1, parseFloat(e.target.value) || 1)))}
                          className="w-full pl-3 pr-7 py-2 text-xs border-2 rounded-xl focus:outline-none font-black"
                          style={{ borderColor: C.g200, color: C.forest }} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black" style={{ color: C.g400 }}>%</span>
                      </div>
                    </div>

                    {/* ── Trade Breakdown — crystal clear profit explanation ── */}
                    {curr && (() => {
                      // How margin works:
                      // Your offer rate = market × (1 + margin/100)
                      // Buyer pays $100 cash → receives BTC worth $100 ÷ (1 + margin/100) at market
                      // Your profit = $100 − buyer's BTC value
                      const exampleCash    = 100;                                             // $100 example trade
                      const buyerGetsUSD   = (exampleCash / (1 + margin / 100)) * 0.995;      // USD value of NET BTC buyer receives
                      const yourProfitUSD  = exampleCash - buyerGetsUSD;                 // your cash profit
                      const yourProfitPct  = (yourProfitUSD / exampleCash) * 100;        // real % of cash received
                      const buyerGetsLocal = buyerGetsUSD  * localRate;
                      const profitLocal    = yourProfitUSD * localRate;
                      return (
                        <div className="mt-3 rounded-xl overflow-hidden border-2"
                          style={{ borderColor: `${C.success}30` }}>
                          {/* Header */}
                          <div className="px-3 py-2 flex items-center justify-between"
                            style={{ backgroundColor: `${C.success}12` }}>
                            <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: C.success }}>
                              💡 Trade Breakdown — per $100 trade
                            </p>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: C.success, color: C.white }}>
                              {margin}% margin
                            </span>
                          </div>
                          {/* Rows */}
                          <div className="px-3 py-2 space-y-2" style={{ backgroundColor: `${C.success}05` }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                  style={{ backgroundColor: C.paid, color: C.white }}>1</span>
                                <span className="text-xs" style={{ color: C.g600 }}>
                                  {offerType === 'sell' ? 'Buyer pays you (cash)' : 'You pay seller (cash)'}
                                </span>
                              </div>
                              <span className="text-xs font-black" style={{ color: C.g800 }}>
                                ${fmt(exampleCash, 0)} USD
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                  style={{ backgroundColor: C.paid, color: C.white }}>2</span>
                                <span className="text-xs" style={{ color: C.g600 }}>
                                  {offerType === 'sell' ? 'Buyer receives BTC worth' : 'You receive BTC worth'}
                                </span>
                              </div>
                              <span className="text-xs font-black" style={{ color: C.paid }}>
                                ${fmt(buyerGetsUSD, 2)} USD
                                {cur !== 'USD' && <span style={{ color: C.g400 }}> ({sym}{fmt(buyerGetsLocal, 0)} {cur})</span>}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t"
                              style={{ borderColor: `${C.success}25` }}>
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                  style={{ backgroundColor: C.success, color: C.white }}>✓</span>
                                <span className="text-xs font-bold" style={{ color: C.g700 }}>Your profit</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black" style={{ color: C.success }}>
                                  +${fmt(yourProfitUSD, 2)} USD
                                </span>
                                {cur !== 'USD' && (
                                  <p className="text-[10px]" style={{ color: C.success }}>
                                    {sym}{fmt(profitLocal, 0)} {cur}
                                  </p>
                                )}
                                <p className="text-[9px]" style={{ color: C.g400 }}>
                                  ({fmt(yourProfitPct, 1)}% of cash received)
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Rate row */}
                          <div className="px-3 py-2 flex items-center justify-between border-t"
                            style={{ borderColor: `${C.success}20`, backgroundColor: C.white }}>
                            <div>
                              <p className="text-[10px]" style={{ color: C.g500 }}>Your offer rate</p>
                              <p className="text-sm font-black" style={{ color: C.forest }}>
                                {sym}{fmt(effectiveRate, 0)} {cur}/BTC
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px]" style={{ color: C.g400 }}>Market rate</p>
                              <p className="text-xs font-semibold" style={{ color: C.g500 }}>
                                {sym}{fmt(btcLocal, 0)} {cur}/BTC
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Fixed price */}
              {pricingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: C.g700 }}>
                    Fixed Price ({cur} per BTC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm" style={{ color: C.g500 }}>{sym}</span>
                    <input type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)}
                      placeholder={fmt(btcLocal, 0)}
                      className="w-full pl-10 pr-24 py-3.5 border-2 rounded-xl text-sm font-black focus:outline-none"
                      style={{ borderColor: fixedPrice ? C.green : C.g200, color: C.forest }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: C.g400 }}>
                      {cur}/BTC
                    </span>
                  </div>
                  {fixedPrice && btcLocal > 0 && (
                    <p className="text-xs mt-1.5 font-semibold"
                      style={{ color: parseFloat(fixedPrice) >= btcLocal ? C.success : C.danger }}>
                      {parseFloat(fixedPrice) >= btcLocal
                        ? `✅ +${((parseFloat(fixedPrice) / btcLocal - 1) * 100).toFixed(1)}% above market`
                        : `⚠️ −${((1 - parseFloat(fixedPrice) / btcLocal) * 100).toFixed(1)}% below market`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ━━ STEP 4 (BTC): Limits + Time ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 4 && !isGC && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>Trade Limits & Timer</h2>
                <p className="text-xs" style={{ color: C.g500 }}>
                  Set min/max trade sizes in {cur} ({curr?.flag} {curr?.name}) and the payment window.
                </p>
              </div>

              {/* Wallet balance banner */}
              <div className="p-3 rounded-xl flex items-center justify-between border"
                style={{ backgroundColor: walletCapacityLocal > 0 ? '#F0FDF4' : '#FFFBEB',
                         borderColor: walletCapacityLocal > 0 ? '#A7F3D0' : '#FDE68A' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">💼</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide"
                      style={{ color: walletCapacityLocal > 0 ? C.forest : '#92400E' }}>
                      {offerType === 'sell' || offerType === 'gc_buy' ? 'BTC Wallet' : 'USD Wallet'}
                    </p>
                    <p className="text-xs font-black"
                      style={{ color: walletCapacityLocal > 0 ? C.forest : '#B45309' }}>
                      {offerType === 'sell' || offerType === 'gc_buy'
                        ? `₿${walletBal.btc.toFixed(6)} ≈ ${sym}${fmt(walletCapacityLocal, 0)} ${cur}`
                        : `$${fmt(walletBal.usd, 2)} ≈ ${sym}${fmt(walletCapacityLocal, 0)} ${cur}`}
                    </p>
                  </div>
                </div>
                <p className="text-[9px] font-black text-right" style={{ color: C.g500 }}>
                  Max you<br/>can offer
                </p>
              </div>

              {/* Min / Max in local currency */}
              <div className="p-4 rounded-2xl border-2 space-y-4" style={{ borderColor: C.g200 }}>
                <h3 className="font-black text-sm flex items-center gap-2" style={{ color: C.forest }}>
                  <BarChart2 size={14} style={{ color: C.green }} /> Trade Limits in {sym} {cur}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key:'min', label:'Minimum', val:minLimit, set:setMinLimit, ph:'e.g. 100' },
                    { key:'max', label:'Maximum', val:maxLimit, set:setMaxLimit, ph:'e.g. 5000' },
                  ].map(({ key, label, val, set, ph }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: C.g600 }}>
                        {label} per Trade <span style={{ color: C.danger }}>*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black"
                          style={{ color: C.g500 }}>{sym}</span>
                        <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                          className="w-full pl-8 pr-3 py-3 border-2 rounded-xl text-sm font-bold focus:outline-none"
                          style={{ borderColor: val ? C.green : C.g200, color: C.forest }} />
                      </div>
                      {val && effectiveRate > 0 && (
                        <p className="text-[10px] mt-0.5 font-semibold" style={{ color: C.g400 }}>
                          ≈ ₿{(parseFloat(val) / effectiveRate).toFixed(6)}
                          <span className="ml-1">(${fmt(parseFloat(val) / localRate, 0)} USD)</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {minLimit && maxLimit && parseFloat(maxLimit) < parseFloat(minLimit) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ backgroundColor: `${C.danger}10` }}>
                    <AlertTriangle size={13} style={{ color: C.danger }} />
                    <p className="text-xs font-semibold" style={{ color: C.danger }}>Maximum must be higher than minimum</p>
                  </div>
                )}
                {maxExceedsWallet && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ backgroundColor: `${C.danger}10`, border: `1px solid ${C.danger}30` }}>
                    <AlertTriangle size={13} style={{ color: C.danger, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p className="text-xs font-black" style={{ color: C.danger }}>
                        Maximum exceeds your wallet balance
                      </p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: C.danger }}>
                        Your capacity: {sym}{fmt(walletCapacityLocal, 0)} {cur}. Please top up your wallet or lower the maximum.
                      </p>
                    </div>
                  </div>
                )}

                {minLimit && maxLimit && curr && parseFloat(maxLimit) >= parseFloat(minLimit) && (
                  <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: C.mist }}>
                    <p className="text-xs font-black mb-1" style={{ color: C.forest }}>📣 Market card will display:</p>
                    {[
                      { label:'Trade range', val:`${sym}${fmt(parseFloat(minLimit))} – ${sym}${fmt(parseFloat(maxLimit))} ${cur}` },
                      { label:'BTC range', val:`₿${(parseFloat(minLimit)/effectiveRate).toFixed(6)} – ₿${(parseFloat(maxLimit)/effectiveRate).toFixed(6)}` },
                      { label:'USD range', val:`$${fmt(parseFloat(minLimit)/localRate,0)} – $${fmt(parseFloat(maxLimit)/localRate,0)}` },
                      { label:'Your rate', val:`${sym}${fmt(effectiveRate,0)} ${cur}/BTC` },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span style={{ color: C.g500 }}>{label}</span>
                        <span className="font-bold" style={{ color: C.g800 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Time limit */}
              <div className="p-4 rounded-2xl border-2 space-y-3" style={{ borderColor: C.g200 }}>
                <h3 className="font-black text-sm flex items-center gap-2" style={{ color: C.forest }}>
                  <Clock size={14} style={{ color: C.green }} /> Payment Window
                </h3>
                <p className="text-xs" style={{ color: C.g500 }}>
                  How long your trade partner has to send payment before the trade auto-cancels.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TIME_LIMITS.map(t => (
                    <button key={t} onClick={() => setTimeLimit(t)}
                      className="py-2.5 rounded-xl font-black text-sm transition border-2"
                      style={{
                        borderColor: timeLimit === t ? C.green : C.g200,
                        backgroundColor: timeLimit === t ? C.green : C.white,
                        color: timeLimit === t ? C.white : C.g600,
                      }}>
                      {t}<span className="text-[9px] font-bold ml-0.5">m</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: `${C.success}10` }}>
                  <Clock size={13} style={{ color: C.success }} />
                  <p className="text-xs" style={{ color: C.g700 }}>
                    Trade partner has <strong>{timeLimit} minutes</strong> to pay after opening the trade.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ━━ STEP 5: Instructions + Review ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-0.5" style={{ color: C.forest }}>Instructions & Review</h2>
                <p className="text-xs" style={{ color: C.g500 }}>Add trade instructions then publish your offer.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-0.5" style={{ color: C.g700 }}>
                  Trade Instructions <span className="text-xs font-normal" style={{ color: C.g400 }}>(recommended)</span>
                </label>
                <p className="text-xs mb-2" style={{ color: C.g500 }}>
                  {offerType === 'sell' ? 'Tell buyers exactly how to pay you — MoMo number, bank details, etc.' :
                   offerType === 'buy'  ? 'Tell sellers how you will send payment and what info you need.' :
                   offerType === 'gc_buy' ? 'Tell gift card sellers how to send you the code and redemption steps.' :
                   'Tell BTC buyers how to pay you and what info you need to send the gift card code.'}
                </p>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
                  placeholder={
                    offerType === 'sell'
                      ? 'e.g. Send MTN MoMo to: 024-XXX-XXXX (Your Name). Include your username as reference. Send screenshot.'
                      : offerType === 'buy'
                      ? 'e.g. I will pay via MTN MoMo within 10 minutes. Share your number when trade starts.'
                      : 'e.g. Send gift card code and PIN photo. Code must be unused and unredeemed.'
                  }
                  className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ borderColor: instructions ? C.green : C.g200 }} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-0.5" style={{ color: C.g700 }}>
                  Offer Terms <span className="text-xs font-normal" style={{ color: C.g400 }}>(optional)</span>
                </label>
                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2}
                  placeholder="e.g. Verified traders only. No partial payments. Must confirm trade details before starting."
                  className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ borderColor: terms ? C.green : C.g200 }} />
              </div>

              {/* Full review + market card preview */}
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.g200 }}>
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg,${C.forest},${C.mint})` }}>
                  <Eye size={14} className="text-white" />
                  <p className="text-sm font-black text-white">Offer Preview</p>
                  <span className="ml-auto text-xs text-white/50">How it appears in market</span>
                </div>

                <div className="p-4 bg-white">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Details list */}
                    <div className="flex-1 space-y-1.5">
                      {[
                        { label:'Type',       val: OFFER_TYPES.find(o => o.id === offerType)?.title },
                        ...(isGC ? [
                          { label:'Brand',    val: gcBrand },
                          { label:'Value',    val: `$${gcFaceValue} USD` },
                        ] : []),
                        { label:'Country',    val: curr ? `${curr.flag} ${curr.name}` : '—' },
                        { label:'Currency',   val: curr ? `${curr.symbol} ${curr.currency}` : '—' },
                        { label:'Payment',    val: selectedPay?.name || '—' },
                        { label:'Rate',       val: curr ? `${sym}${fmt(effectiveRate, 0)} ${cur}/BTC` : '—' },
                        { label:'Margin',     val: pricingType === 'market' ? `+${margin}%` : 'Fixed' },
                        ...(!isGC ? [
                          { label:'Limits',   val: minLimit && maxLimit && curr
                            ? `${sym}${fmt(parseFloat(minLimit))} – ${sym}${fmt(parseFloat(maxLimit))} ${cur}`
                            : '—' },
                        ] : []),
                        { label:'Time limit', val: `${timeLimit} min` },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center justify-between text-xs py-1 border-b last:border-0"
                          style={{ borderColor: C.g100 }}>
                          <span style={{ color: C.g500 }}>{label}</span>
                          <span className="font-bold" style={{ color: C.g800 }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Market card preview */}
                    <div className="flex-shrink-0">
                      <p className="text-[9px] font-black uppercase mb-2" style={{ color: C.g400 }}>Market Card Preview</p>
                      <MarketCardPreview />
                    </div>
                  </div>
                </div>
              </div>

              {/* Publish warning */}
              <div className="p-3.5 rounded-2xl flex items-start gap-2.5"
                style={{ backgroundColor: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
                <Info size={13} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs leading-relaxed" style={{ color: C.g700 }}>
                  Your offer goes live immediately after publishing. You can edit or pause it anytime from your dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={back}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm border hover:bg-gray-50 transition"
              style={{ borderColor: C.g200, color: C.g600 }}>
              <ChevronLeft size={16} />Back
            </button>
          )}
          <button
            onClick={step < 5 ? next : handleSubmit}
            disabled={!canNext() || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition active:scale-[0.98] disabled:opacity-40"
            style={{
              backgroundColor: canNext() ? C.green : C.g300,
              color: C.white,
            }}>
            {submitting
              ? <><RefreshCw size={16} className="animate-spin" />Publishing…</>
              : step < 5
                ? <>Continue <ChevronRight size={16} /></>
                : <>🚀 Publish Offer <ArrowRight size={16} /></>}
          </button>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield size={12} style={{ color: C.g400 }} />
          <p className="text-xs text-center" style={{ color: C.g400 }}>
            All trades escrow-protected · 0.5% fee on completed trades only
          </p>
        </div>
      </div>
    </div>
  );
}
