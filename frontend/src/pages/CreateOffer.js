import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import {
  Bitcoin, TrendingUp, Check, Info, AlertTriangle, Clock,
  DollarSign, Shield, ArrowRight, RefreshCw, Plus, Minus,
  Eye, ChevronRight, ChevronLeft, ShoppingCart, Tag,
  BarChart2, Settings2, FileText, ArrowUpRight, ArrowDownRight,
  Gift, CreditCard
} from 'lucide-react';
import { toast } from 'react-toastify';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6', purple:'#8B5CF6',
};

const authH = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const fmt = (n, d = 2) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n || 0);

const COUNTRIES = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'EU', name: 'Europe', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', symbol: 'CFA', flag: '🇨🇲' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', symbol: 'CFA', flag: '🇸🇳' },
];

// Gift card brands
const GIFT_CARD_BRANDS = [
  'Amazon', 'Apple', 'Google Play', 'Steam', 'eBay', 'Walmart', 'Target',
  'Visa', 'Mastercard', 'American Express', 'Netflix', 'Spotify', 'Xbox',
  'PlayStation', 'Nintendo', 'Razer Gold', 'Other'
];

const PAYMENT_METHODS = {
  GH: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money', 'Bank Transfer', 'Ecobank', 'GCB Bank', 'Fidelity Bank'],
  NG: ['Opay', 'PalmPay', 'Kuda Bank', 'GTBank', 'Access Bank', 'First Bank', 'UBA', 'Moniepoint'],
  KE: ['M-Pesa', 'Airtel Money', 'Bank Transfer', 'Equity Bank', 'KCB Bank'],
  ZA: ['FNB', 'Capitec', 'Standard Bank', 'Absa', 'Nedbank', 'Bank Transfer'],
  UG: ['MTN Mobile Money', 'Airtel Uganda', 'Bank Transfer', 'Stanbic Uganda'],
  TZ: ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank Transfer'],
  US: ['PayPal', 'Cash App', 'Zelle', 'Venmo', 'Bank Wire'],
  GB: ['Bank Transfer', 'PayPal', 'Revolut', 'Monzo', 'Wise'],
  EU: ['Bank Transfer', 'PayPal', 'Revolut', 'SEPA Transfer', 'Wise'],
  CM: ['MTN Mobile Money', 'Orange Money', 'Bank Transfer'],
  SN: ['Wave', 'Orange Money', 'Bank Transfer'],
};

const USD_RATES = {
  GHS: 11.85, NGN: 1580, KES: 130, ZAR: 18.5, UGX: 3720,
  TZS: 2680, USD: 1, GBP: 0.79, EUR: 0.92, XAF: 612, XOF: 612,
};

const TIME_LIMITS = [15, 30, 45, 60, 90, 120];

const STEPS = [
  { id: 1, label: 'Offer Type', icon: Tag },
  { id: 2, label: 'Details', icon: Gift },
  { id: 3, label: 'Payment', icon: DollarSign },
  { id: 4, label: 'Pricing', icon: BarChart2 },
  { id: 5, label: 'Limits', icon: Settings2 },
  { id: 6, label: 'Review', icon: FileText },
];

export default function CreateOffer() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [btcPrice, setBtcPrice] = useState(68000);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [countrySearch, setCountrySearch] = useState('');

  // Form
  const [offerType, setOfferType] = useState('sell'); // 'sell', 'buy', 'giftcard'
  const [giftCardBrand, setGiftCardBrand] = useState('Amazon');
  const [country, setCountry] = useState('GH');
  const [paymentMethod, setPaymentMethod] = useState('MTN Mobile Money');
  const [pricingType, setPricingType] = useState('market');
  const [margin, setMargin] = useState(5);
  const [fixedPrice, setFixedPrice] = useState('');
  const [minLimit, setMinLimit] = useState('10');
  const [maxLimit, setMaxLimit] = useState('1000');
  const [timeLimit, setTimeLimit] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [terms, setTerms] = useState('');

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      try {
        const r = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        setBtcPrice(r.data.bitcoin.usd);
      } catch {
        try {
          const r2 = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
          setBtcPrice(r2.data.bpi.USD.rate_float);
        } catch {
          setBtcPrice(68000);
        }
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchBitcoinPrice();
    const iv = setInterval(fetchBitcoinPrice, 60000);
    return () => clearInterval(iv);
  }, []);

  const curr = COUNTRIES.find(c => c.code === country) || null;
  const localRate = curr ? (USD_RATES[curr.currency] || 1) : 1;
  const btcLocal = btcPrice * localRate;
  const effectiveRate = pricingType === 'fixed' && fixedPrice
    ? parseFloat(fixedPrice)
    : btcLocal * (1 + margin / 100);

  const minBtc = minLimit && effectiveRate ? parseFloat(minLimit) / effectiveRate : 0;
  const maxBtc = maxLimit && effectiveRate ? parseFloat(maxLimit) / effectiveRate : 0;
  const methods = country ? (PAYMENT_METHODS[country] || []) : [];
  const sym = curr?.symbol || '$';
  const cur = curr?.currency || 'USD';

  const canNext = () => {
    if (step === 1) return true;
    if (step === 2 && offerType === 'giftcard') return !!giftCardBrand;
    if (step === 2 && offerType !== 'giftcard') return true;
    if (step === 3) return !!country && !!paymentMethod;
    if (step === 4) {
      if (pricingType === 'fixed') return !!fixedPrice && parseFloat(fixedPrice) > 0;
      return true;
    }
    if (step === 5) {
      const mn = parseFloat(minLimit), mx = parseFloat(maxLimit);
      return mn > 0 && mx > 0 && mx >= mn;
    }
    return true;
  };

  const totalSteps = offerType === 'giftcard' ? 6 : 5;
  
  const next = () => { 
    if (canNext()) setStep(s => Math.min(s + 1, totalSteps)); 
    else toast.warn('Please fill in all required fields'); 
  };
  const back = () => setStep(s => Math.max(s - 1, 1));
  const adj = (d) => setMargin(p => Math.min(20, Math.max(-20, parseFloat((p + d).toFixed(1)))));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (!currentUser.id) {
        toast.error('Please login to create an offer');
        navigate('/login');
        return;
      }

      const rateUSD = pricingType === 'fixed' && fixedPrice
        ? parseFloat(fixedPrice)
        : btcPrice * (1 + margin / 100);

      // Determine listing type based on offerType
      let listingType;
      if (offerType === 'sell') listingType = 'SELL_GIFT_CARD';
      else if (offerType === 'buy') listingType = 'BUY_GIFT_CARD';
      else listingType = 'BUY_GIFT_CARD'; // giftcard is also BUY_GIFT_CARD

      const payload = {
        seller_id: currentUser.id,
        listing_type: listingType,
        gift_card_brand: offerType === 'giftcard' ? giftCardBrand : 'Bitcoin',
        amount_usd: parseFloat(minLimit) || 100,
        bitcoin_price: rateUSD,
        margin: margin,
        payment_method: paymentMethod,
        country: country,
        min_limit_usd: parseFloat(minLimit) || 20,
        max_limit_usd: parseFloat(maxLimit) || 2000,
        time_limit: timeLimit,
        status: 'ACTIVE',
        currency: cur,
        pricing_type: pricingType,
        description: instructions || '',
        terms: terms || '',
        created_at: new Date().toISOString()
      };

      console.log('📤 SENDING PAYLOAD:', payload);

      const r = await axios.post(`${API_URL}/listings`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ RESPONSE:', r.data);

      if (r.data.success || r.data.listing) {
        toast.success(`🎉 Offer published!`);
        if (offerType === 'sell') navigate('/buy-bitcoin');
        else if (offerType === 'buy') navigate('/sell-bitcoin');
        else navigate('/gift-cards');
      } else {
        toast.error(r.data.error || 'Failed to publish offer');
      }

    } catch (e) {
      console.error('❌ ERROR:', e.response?.data || e.message);
      toast.error(e.response?.data?.error || 'Failed to publish offer');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.currency.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get header description based on offer type
  const getHeaderDescription = () => {
    if (offerType === 'sell') return 'Sell your Bitcoin · Get paid in local currency';
    if (offerType === 'buy') return 'Post a buy request · Pay sellers in local currency';
    return 'Create an offer to buy gift cards with Bitcoin';
  };

  return (
    <div className="min-h-screen py-6 px-3 sm:px-4"
      style={{ backgroundColor: C.mist, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: C.forest }}>
            Create an Offer
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.g500 }}>
            {getHeaderDescription()}
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.filter(s => offerType !== 'giftcard' ? s.id !== 2 : true).map((s, i, arr) => {
            const Icon = s.icon;
            const done = step > s.id, active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: done ? C.success : active ? C.green : C.g100,
                      color: (done || active) ? C.white : C.g400,
                    }}>
                    {done ? <Check size={15} /> : <Icon size={15} />}
                  </div>
                  <p className="text-[9px] mt-0.5 font-bold hidden sm:block"
                    style={{ color: active ? C.green : done ? C.success : C.g400 }}>
                    {s.label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full min-w-3"
                    style={{ backgroundColor: step > s.id ? C.success : C.g200 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mb-4"
          style={{ borderColor: C.g200 }}>

          {/* STEP 1: Offer Type - NOW WITH 3 OPTIONS */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>What would you like to do?</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  Choose your offer type. It determines where your offer appears in the marketplace.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Sell Bitcoin */}
                <button onClick={() => setOfferType('sell')}
                  className="relative p-5 rounded-2xl text-left border-2 transition-all duration-200"
                  style={{
                    borderColor: offerType === 'sell' ? C.green : C.g200,
                    backgroundColor: offerType === 'sell' ? `${C.green}08` : C.white,
                  }}>
                  {offerType === 'sell' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: C.green }}>
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: offerType === 'sell' ? C.green : C.g100 }}>
                      <Bitcoin size={22} style={{ color: offerType === 'sell' ? C.white : C.g400 }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-base mb-1" style={{ color: C.forest }}>Sell Bitcoin</p>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: C.g500 }}>
                        You own Bitcoin and want to sell it. Buyers will pay you in local currency through your chosen payment method.
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${C.success}18`, color: C.success }}>
                        <Eye size={10} />Listed on Buy Bitcoin page
                      </div>
                    </div>
                  </div>
                </button>

                {/* Buy Bitcoin */}
                <button onClick={() => setOfferType('buy')}
                  className="relative p-5 rounded-2xl text-left border-2 transition-all duration-200"
                  style={{
                    borderColor: offerType === 'buy' ? C.paid : C.g200,
                    backgroundColor: offerType === 'buy' ? `${C.paid}08` : C.white,
                  }}>
                  {offerType === 'buy' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: C.paid }}>
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: offerType === 'buy' ? C.paid : C.g100 }}>
                      <ShoppingCart size={22} style={{ color: offerType === 'buy' ? C.white : C.g400 }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-base mb-1" style={{ color: C.forest }}>Buy Bitcoin</p>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: C.g500 }}>
                        You want to purchase Bitcoin using local currency. Sellers will come to your offer to sell their Bitcoin to you.
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${C.paid}18`, color: C.paid }}>
                        <Eye size={10} />Listed on Sell Bitcoin page
                      </div>
                    </div>
                  </div>
                </button>

                {/* ✨ NEW: Buy Gift Card */}
                <button onClick={() => setOfferType('giftcard')}
                  className="relative p-5 rounded-2xl text-left border-2 transition-all duration-200"
                  style={{
                    borderColor: offerType === 'giftcard' ? C.purple : C.g200,
                    backgroundColor: offerType === 'giftcard' ? `${C.purple}08` : C.white,
                  }}>
                  {offerType === 'giftcard' && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: C.purple }}>
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: offerType === 'giftcard' ? C.purple : C.g100 }}>
                      <Gift size={22} style={{ color: offerType === 'giftcard' ? C.white : C.g400 }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-base mb-1" style={{ color: C.forest }}>Buy Gift Card</p>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: C.g500 }}>
                        You want to purchase gift cards using Bitcoin. Sellers with gift cards will come to your offer.
                      </p>
                      <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${C.purple}18`, color: C.purple }}>
                        <Eye size={10} />Listed on Gift Cards page
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="p-4 rounded-2xl flex items-start gap-3"
                style={{ backgroundColor: `${C.gold}12`, border: `1px solid ${C.gold}30` }}>
                <Info size={14} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs leading-relaxed" style={{ color: C.g700 }}>
                  <strong>Escrow Protection:</strong> When a trade starts, Bitcoin is automatically locked in escrow.
                  The seller only releases Bitcoin after confirming payment. PRAQEN charges a flat
                  <strong> 0.5% fee</strong> only on completed trades.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Gift Card Details (only for giftcard type) */}
          {step === 2 && offerType === 'giftcard' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>Gift Card Details</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  Select the gift card brand you want to buy.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: C.g700 }}>
                  Gift Card Brand <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                  {GIFT_CARD_BRANDS.map(brand => (
                    <button key={brand} onClick={() => setGiftCardBrand(brand)}
                      className="p-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: giftCardBrand === brand ? C.purple : C.g200,
                        backgroundColor: giftCardBrand === brand ? `${C.purple}10` : C.white,
                      }}>
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} style={{ color: giftCardBrand === brand ? C.purple : C.g500 }} />
                        <span className="text-sm font-semibold truncate" style={{ color: C.g800 }}>{brand}</span>
                        {giftCardBrand === brand && <Check size={13} style={{ color: C.purple, marginLeft: 'auto' }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 for non-giftcard / STEP 3 for giftcard: Payment */}
          {((step === 2 && offerType !== 'giftcard') || (step === 3 && offerType === 'giftcard')) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>Location & Payment Method</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  Where are you located? How should {offerType === 'sell' ? 'buyers pay you' : 'you pay sellers'}?
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: C.g700 }}>
                  Your Country <span className="text-red-400">*</span>
                </label>
                <input type="text" placeholder="Search country or currency…"
                  value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none mb-2"
                  style={{ borderColor: C.g200 }} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {filtered.map(c => (
                    <button key={c.code}
                      onClick={() => { setCountry(c.code); setPaymentMethod(''); setCountrySearch(''); }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: country === c.code ? C.green : C.g200,
                        backgroundColor: country === c.code ? `${C.green}10` : C.white,
                      }}>
                      <span className="text-lg flex-shrink-0">{c.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate" style={{ color: C.g800 }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: C.g400 }}>{c.currency}</p>
                      </div>
                      {country === c.code && <Check size={12} style={{ color: C.green, flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {curr && (
                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: C.g700 }}>
                    Payment Method <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs mb-2" style={{ color: C.g500 }}>
                    How {offerType === 'sell' ? 'buyers will pay you' : 'you will send money to sellers'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {methods.map(m => (
                      <button key={m} onClick={() => setPaymentMethod(m)}
                        className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: paymentMethod === m ? C.green : C.g200,
                          backgroundColor: paymentMethod === m ? `${C.green}08` : C.white,
                        }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: paymentMethod === m ? C.green : C.g100 }}>
                          <DollarSign size={13} style={{ color: paymentMethod === m ? C.white : C.g500 }} />
                        </div>
                        <span className="text-sm font-semibold flex-1 truncate" style={{ color: C.g800 }}>{m}</span>
                        {paymentMethod === m && <Check size={13} style={{ color: C.green, flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3/4: Pricing */}
          {((step === 3 && offerType !== 'giftcard') || (step === 4 && offerType === 'giftcard')) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>Set Your Bitcoin Rate</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  This is the price per Bitcoin that will show in the marketplace. You control it.
                </p>
              </div>

              <div className="p-4 rounded-2xl"
                style={{ background: `linear-gradient(135deg,${C.forest},${C.green})` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Live Bitcoin Market Price</p>
                    <p className="text-2xl font-black text-white">
                      {loadingPrice ? '…' : `${sym}${fmt(btcLocal)}`}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{cur} per 1 BTC</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Bitcoin size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: C.g700 }}>
                  Choose Rate Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      val: 'market', icon: TrendingUp, title: 'Market Price',
                      desc: "Automatically adjusts as Bitcoin's market price changes. Always competitive."
                    },
                    {
                      val: 'fixed', icon: Tag, title: 'Fixed Price',
                      desc: 'You set an exact price. It stays locked even if the market moves up or down.'
                    },
                  ].map(({ val, icon: Icon, title, desc }) => (
                    <button key={val} onClick={() => setPricingType(val)}
                      className="p-4 rounded-2xl text-left border-2 transition-all"
                      style={{
                        borderColor: pricingType === val ? C.green : C.g200,
                        backgroundColor: pricingType === val ? `${C.green}08` : C.white,
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: pricingType === val ? C.green : C.g100 }}>
                          <Icon size={15} style={{ color: pricingType === val ? C.white : C.g500 }} />
                        </div>
                        {pricingType === val && <Check size={13} style={{ color: C.green }} />}
                      </div>
                      <p className="font-black text-sm mb-1" style={{ color: C.forest }}>{title}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: C.g500 }}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {pricingType === 'market' && (
                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: C.g700 }}>
                    Offer Margin
                  </label>
                  <p className="text-xs mb-3" style={{ color: C.g500 }}>
                    Set how much above or below market you want to trade.
                    <span style={{ color: C.success }}> + means more profit per trade.</span>
                    <span style={{ color: C.danger }}> − means lower price, attracts more buyers.</span>
                  </p>

                  <div className="p-4 rounded-2xl border-2" style={{ borderColor: C.g200 }}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => adj(-0.5)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition active:scale-95 flex-shrink-0"
                        style={{ borderColor: C.danger, backgroundColor: `${C.danger}10` }}>
                        <Minus size={18} style={{ color: C.danger }} />
                      </button>

                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-3xl font-black"
                            style={{ color: margin > 0 ? C.success : margin < 0 ? C.danger : C.g500 }}>
                            {margin > 0 ? '+' : ''}{margin}%
                          </span>
                          {margin > 0 && <ArrowUpRight size={20} style={{ color: C.success }} />}
                          {margin < 0 && <ArrowDownRight size={20} style={{ color: C.danger }} />}
                        </div>
                        <p className="text-xs mt-1" style={{ color: C.g400 }}>
                          {margin === 0 ? 'At market price (0% margin)'
                            : margin > 0 ? `You earn ${margin}% more per trade`
                              : `You trade ${Math.abs(margin)}% below market`}
                        </p>
                      </div>

                      <button onClick={() => adj(+0.5)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition active:scale-95 flex-shrink-0"
                        style={{ borderColor: C.success, backgroundColor: `${C.success}10` }}>
                        <Plus size={18} style={{ color: C.success }} />
                      </button>
                    </div>

                    <input type="range" min="-20" max="20" step="0.5"
                      value={margin} onChange={e => setMargin(parseFloat(e.target.value))}
                      className="w-full mt-4"
                      style={{ accentColor: margin >= 0 ? C.success : C.danger }} />
                    <div className="flex justify-between text-[10px] mt-0.5" style={{ color: C.g400 }}>
                      <span>−20% (low rate, more buyers)</span>
                      <span>+20% (high rate, more profit)</span>
                    </div>

                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {[-10, -5, -2, 0, 2, 5, 10].map(v => (
                        <button key={v} onClick={() => setMargin(v)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold transition"
                          style={{
                            backgroundColor: margin === v ? C.green : C.g100,
                            color: margin === v ? C.white : C.g600,
                          }}>
                          {v > 0 ? `+${v}%` : v === 0 ? '0%' : `${v}%`}
                        </button>
                      ))}
                    </div>

                    {curr && (
                      <div className="mt-4 p-3 rounded-xl flex items-center justify-between"
                        style={{ backgroundColor: C.mist }}>
                        <div>
                          <p className="text-[10px] font-semibold mb-0.5" style={{ color: C.g500 }}>
                            Your offer rate
                          </p>
                          <p className="text-base font-black" style={{ color: C.forest }}>
                            {sym}{fmt(effectiveRate)} {cur}/BTC
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px]" style={{ color: C.g400 }}>Market price</p>
                          <p className="text-sm font-semibold" style={{ color: C.g500 }}>
                            {sym}{fmt(btcLocal)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {curr && minLimit && (
                    <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed"
                      style={{ backgroundColor: `${C.paid}08`, border: `1px solid ${C.paid}20`, color: C.g700 }}>
                      <strong>Example:</strong> If a trade is made for <strong>{sym}{fmt(parseFloat(minLimit))} {cur}</strong>,
                      the Bitcoin amount will be <strong>{(parseFloat(minLimit) / effectiveRate).toFixed(6)} BTC</strong> at your rate
                      of {sym}{fmt(effectiveRate)} {cur}/BTC.
                    </div>
                  )}
                </div>
              )}

              {pricingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: C.g700 }}>
                    Your Fixed Price ({cur} per BTC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm"
                      style={{ color: C.g500 }}>{sym}</span>
                    <input type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)}
                      placeholder={fmt(btcLocal, 0)}
                      className="w-full pl-10 pr-24 py-3.5 border-2 rounded-xl text-sm font-black focus:outline-none"
                      style={{ borderColor: fixedPrice ? C.green : C.g200, color: C.forest }} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold"
                      style={{ color: C.g400 }}>{cur}/BTC</span>
                  </div>
                  {fixedPrice && btcLocal > 0 && (
                    <p className="text-xs mt-1.5 font-semibold"
                      style={{ color: parseFloat(fixedPrice) >= btcLocal ? C.success : C.danger }}>
                      {parseFloat(fixedPrice) >= btcLocal
                        ? `✅ +${((parseFloat(fixedPrice) / btcLocal - 1) * 100).toFixed(1)}% above market — you earn more per trade`
                        : `⚠️ −${((1 - parseFloat(fixedPrice) / btcLocal) * 100).toFixed(1)}% below market — attracts buyers quickly`}
                    </p>
                  )}
                  <div className="mt-2 p-3 rounded-xl text-xs"
                    style={{ backgroundColor: `${C.paid}08`, border: `1px solid ${C.paid}20`, color: C.g600 }}>
                    <strong>Locked — won't change:</strong> This price stays fixed even if Bitcoin goes up or down after you publish your offer.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4/5: Limits & Time */}
          {((step === 4 && offerType !== 'giftcard') || (step === 5 && offerType === 'giftcard')) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>Trade Limits & Time Limit</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  Set the smallest and largest trade amounts, and how long the trade partner has to complete.
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 space-y-4" style={{ borderColor: C.g200 }}>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.forest }}>
                  <BarChart2 size={15} style={{ color: C.green }} />
                  Offer Trade Limits
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'min', label: 'Minimum', val: minLimit, set: setMinLimit, ph: 'e.g. 100' },
                    { key: 'max', label: 'Maximum', val: maxLimit, set: setMaxLimit, ph: 'e.g. 5000' },
                  ].map(({ key, label, val, set, ph }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: C.g600 }}>
                        {label} per Trade <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black"
                          style={{ color: C.g500 }}>{sym}</span>
                        <input type="number" value={val} onChange={e => set(e.target.value)}
                          placeholder={ph}
                          className="w-full pl-8 pr-3 py-3 border-2 rounded-xl text-sm font-bold focus:outline-none"
                          style={{ borderColor: val ? C.green : C.g200, color: C.forest }} />
                      </div>
                      {val && effectiveRate > 0 && (
                        <p className="text-[10px] mt-1" style={{ color: C.g400 }}>
                          ≈ {(parseFloat(val) / effectiveRate).toFixed(6)} BTC
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {minLimit && maxLimit && parseFloat(maxLimit) < parseFloat(minLimit) && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: `${C.danger}10` }}>
                    <AlertTriangle size={13} style={{ color: C.danger }} />
                    <p className="text-xs font-semibold" style={{ color: C.danger }}>
                      Maximum must be higher than minimum
                    </p>
                  </div>
                )}

                {minLimit && maxLimit && curr && parseFloat(maxLimit) >= parseFloat(minLimit) && (
                  <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: C.mist }}>
                    <p className="text-xs font-bold" style={{ color: C.forest }}>📣 Your offer will display:</p>
                    {[
                      { label: 'Trade range', val: `${sym}${fmt(parseFloat(minLimit))} — ${sym}${fmt(parseFloat(maxLimit))} ${cur}` },
                      { label: 'BTC range', val: `${minBtc.toFixed(6)} — ${maxBtc.toFixed(6)} BTC` },
                      { label: 'Your rate', val: `${sym}${fmt(effectiveRate)} ${cur}/BTC` },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span style={{ color: C.g500 }}>{label}</span>
                        <span className="font-bold" style={{ color: C.g800 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl border-2 space-y-3" style={{ borderColor: C.g200 }}>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.forest }}>
                  <Clock size={15} style={{ color: C.green }} />
                  Offer Time Limit
                </h3>
                <p className="text-xs" style={{ color: C.g500 }}>
                  This is how long your trade partner has to send payment and click <strong>"I Have Paid"</strong>.
                  If they miss this window, the trade auto-cancels.
                </p>

                <div className="flex flex-wrap gap-2">
                  {TIME_LIMITS.map(t => (
                    <button key={t} onClick={() => setTimeLimit(t)}
                      className="px-4 py-2 rounded-xl font-black text-sm transition"
                      style={{
                        backgroundColor: timeLimit === t ? C.green : C.g100,
                        color: timeLimit === t ? C.white : C.g600,
                      }}>
                      {t} min
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: `${C.success}10` }}>
                  <Clock size={13} style={{ color: C.success }} />
                  <p className="text-xs" style={{ color: C.g700 }}>
                    Trade partner has <strong>{timeLimit} minutes</strong> to complete payment after starting the trade.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5/6: Instructions & Review */}
          {((step === 5 && offerType !== 'giftcard') || (step === 6 && offerType === 'giftcard')) && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: C.forest }}>Instructions & Final Review</h2>
                <p className="text-sm" style={{ color: C.g500 }}>
                  Add instructions for your trade partner, then review and publish your offer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: C.g700 }}>
                  Trade Instructions
                  <span className="ml-1 text-xs font-normal" style={{ color: C.g400 }}>(recommended)</span>
                </label>
                <p className="text-xs mb-2" style={{ color: C.g500 }}>
                  {offerType === 'sell'
                    ? 'Tell buyers exactly how to pay you — your account number, MoMo number, or bank details.'
                    : offerType === 'buy'
                    ? 'Tell sellers how you will send payment to them and what info you need from them.'
                    : 'Tell gift card sellers how you will pay and what info you need.'}
                </p>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                  placeholder={offerType === 'sell'
                    ? 'e.g. Send payment to MTN MoMo: 0244-XXX-XXX (John Doe). Use your username as reference. Send screenshot after paying.'
                    : 'e.g. I will send via MTN MoMo. Please share your number. I will pay within 10 minutes of starting the trade.'}
                  className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ borderColor: instructions ? C.green : C.g200 }} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: C.g700 }}>
                  Offer Terms
                  <span className="ml-1 text-xs font-normal" style={{ color: C.g400 }}>(optional)</span>
                </label>
                <p className="text-xs mb-2" style={{ color: C.g500 }}>
                  Any rules or conditions for trading with you. Trade partners must agree before starting a trade.
                </p>
                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3}
                  placeholder="e.g. Only verified traders. No chargeback risk. Must be ready to trade immediately. I will not accept partial payments."
                  className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ borderColor: terms ? C.green : C.g200 }} />
              </div>

              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: C.g200 }}>
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg,${C.forest},${C.mint})` }}>
                  <Eye size={14} className="text-white" />
                  <p className="text-sm font-black text-white">Offer Preview</p>
                  <span className="ml-auto text-xs text-white/50">What others will see</span>
                </div>
                <div className="p-4 bg-white space-y-2">
                  {[
                    { label: 'Type', val: offerType === 'sell' ? '🟢 Sell Bitcoin' : offerType === 'buy' ? '🔵 Buy Bitcoin' : '💜 Buy Gift Card' },
                    { label: 'Brand', val: offerType === 'giftcard' ? giftCardBrand : 'Bitcoin' },
                    { label: 'Country', val: curr ? `${curr.flag} ${curr.name}` : '—' },
                    { label: 'Payment', val: paymentMethod || '—' },
                    { label: 'Rate', val: curr ? `${sym}${fmt(effectiveRate)} ${cur}/BTC` : '—' },
                    { label: 'Margin', val: pricingType === 'market' ? (margin >= 0 ? `+${margin}%` : `${margin}%`) : 'Fixed price' },
                    { label: 'Trade range', val: minLimit && maxLimit && curr ? `${sym}${fmt(parseFloat(minLimit))} — ${sym}${fmt(parseFloat(maxLimit))} ${cur}` : '—' },
                    { label: 'Time limit', val: `${timeLimit} minutes` },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                      style={{ borderColor: C.g100 }}>
                      <span style={{ color: C.g500 }}>{label}</span>
                      <span className="font-bold" style={{ color: C.g800 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={back}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm border hover:bg-gray-50 transition"
              style={{ borderColor: C.g200, color: C.g600 }}>
              <ChevronLeft size={16} />Back
            </button>
          )}
          <button
            onClick={step < totalSteps ? next : handleSubmit}
            disabled={!canNext() || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition disabled:opacity-40 active:scale-[0.98]"
            style={{ backgroundColor: canNext() ? C.green : C.g300, color: C.white }}>
            {submitting
              ? <><RefreshCw size={16} className="animate-spin" />Publishing…</>
              : step < totalSteps
                ? <>Continue <ChevronRight size={16} /></>
                : <>Publish Offer <ArrowRight size={16} /></>}
          </button>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield size={12} style={{ color: C.g400 }} />
          <p className="text-xs text-center" style={{ color: C.g400 }}>
            All trades protected by Bitcoin escrow · 0.5% fee on completed trades only
          </p>
        </div>

      </div>
    </div>
  );
}