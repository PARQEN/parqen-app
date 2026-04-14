import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bitcoin, Shield, Clock, TrendingUp, ArrowRight,
  Star, CheckCircle, Globe, Lock, Zap, Users,
  ChevronDown, Play, Award, MessageCircle,
  Smartphone, Building2, CreditCard, Gift,
  BarChart2, Eye, Flame, ChevronRight
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6', online:'#22C55E',
};

// ── Counter hook ──────────────────────────────────────────────────────────────
function useCounter(target, duration = 2000, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(iv); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(iv);
  }, [target, duration, trigger]);
  return count;
}

// ── Intersection observer hook ────────────────────────────────────────────────
function useVisible(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Animated stat ─────────────────────────────────────────────────────────────
function AnimStat({ value, suffix, label, color }) {
  const [ref, visible] = useVisible();
  const count = useCounter(value, 2000, visible);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-black mb-1" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</p>
    </div>
  );
}

// ── Live trade feed ────────────────────────────────────────────────────────────
const LIVE_TRADES = [
  { user:'Samuel K.', country:'🇬🇭', method:'MTN MoMo',   amount:'₵12,500', badge:'Pro Trader', bc:'#10B981', ago:'2s ago' },
  { user:'Amina T.',  country:'🇳🇬', method:'OPay',         amount:'₦850,000', badge:'Expert',    bc:'#0EA5E9', ago:'18s ago' },
  { user:'Kofi B.',   country:'🇬🇭', method:'Vodafone',    amount:'₵4,200',   badge:'Active',    bc:'#F59E0B', ago:'34s ago' },
  { user:'Fatima S.', country:'🇸🇳', method:'Wave',         amount:'CFA 45k',  badge:'Legend',    bc:'#7C3AED', ago:'1m ago' },
  { user:'James O.',  country:'🇰🇪', method:'M-Pesa',       amount:'KSh 8,200',badge:'Pro Trader', bc:'#10B981', ago:'1m ago' },
  { user:'Ama D.',    country:'🇬🇭', method:'Bank Transfer',amount:'₵22,000', badge:'Expert',    bc:'#0EA5E9', ago:'2m ago' },
];

function LiveFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % LIVE_TRADES.length), 2800);
    return () => clearInterval(iv);
  }, []);
  const t = LIVE_TRADES[idx];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', animation: 'fadeIn .4s ease' }}>
      <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: C.online }}/>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Live</span>
      <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
        style={{ backgroundColor: C.green, color: C.white }}>{t.user[0]}</div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-white">{t.user}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}> {t.country} bought BTC via {t.method}</span>
      </div>
      <span className="font-black flex-shrink-0" style={{ color: C.gold }}>{t.amount}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)' }} className="flex-shrink-0">{t.ago}</span>
    </div>
  );
}

const FEATURES = [
  { icon: Shield,     title: 'Escrow Protection',     desc: 'Bitcoin locked automatically until payment is confirmed. Zero fraud. Zero risk.', color: C.green },
  { icon: Zap,        title: 'Complete in Minutes',   desc: 'No banks. No delays. Trade directly with verified sellers and receive instantly.', color: C.gold },
  { icon: Globe,      title: '180+ Countries',        desc: 'Trade in your local currency — GHS, NGN, KES, ZAR, EUR, USD and 50+ more.', color: C.paid },
  { icon: Lock,       title: 'No Hidden Fees',        desc: 'Flat 0.5% fee only on completed trades. No listing fees, no subscriptions.', color: '#8B5CF6' },
  { icon: Users,      title: '24/7 Real Support',     desc: 'Live agents. Real humans. Disputes resolved in minutes, not days.', color: C.success },
  { icon: TrendingUp, title: 'Best Market Rates',     desc: 'Thousands of competing offers mean you always find the sharpest price.', color: C.danger },
];

const HOW_STEPS = [
  { n:1, icon:'🔐', title:'Create Free Account',   desc:'Sign up in 30 seconds. No bank needed. Email only.', time:'30 sec' },
  { n:2, icon:'🔍', title:'Browse Offers',          desc:'Filter by payment method, country, and rate. Pick your best deal.', time:'2 min' },
  { n:3, icon:'🔒', title:'BTC Locks in Escrow',    desc:'Seller\'s Bitcoin is automatically secured — safe for everyone.', time:'Auto' },
  { n:4, icon:'💰', title:'Pay & Receive BTC',      desc:'Send payment, click confirmed. BTC released instantly to your wallet.', time:'< 15 min' },
];

const PAYMENTS = [
  ['📱','MTN Mobile Money','🇬🇭'], ['📱','Vodafone Cash','🇬🇭'],
  ['📱','M-Pesa','🇰🇪'],           ['💳','OPay','🇳🇬'],
  ['💳','PalmPay','🇳🇬'],          ['💰','PayPal','🌍'],
  ['🏦','Bank Transfer','🏦'],     ['📱','Wave','🇸🇳'],
  ['📱','Orange Money','🇨🇲'],     ['💸','Wise','🌍'],
  ['🏦','SEPA','🇪🇺'],             ['💳','Zelle','🇺🇸'],
];

const REVIEWS = [
  { name:'Samuel K.', country:'🇬🇭 Ghana',   rating:5, text:'Sent ₵5000 via MTN MoMo and received BTC in under 8 minutes. The escrow gave me total confidence.', badge:'Pro Trader', bc:'#10B981' },
  { name:'Amina T.',  country:'🇳🇬 Nigeria', rating:5, text:'Tried 4 other platforms before PRAQEN. The dispute resolution team sorted my issue in 20 minutes flat.', badge:'Expert', bc:'#0EA5E9' },
  { name:'James O.',  country:'🇰🇪 Kenya',   rating:5, text:'As a first-time buyer, I was nervous. The interface walked me through every step. Flawless experience.', badge:'Active', bc:'#F59E0B' },
];

const FAQS = [
  { q:'Is PRAQEN safe for beginners?',        a:'Absolutely. Every trade is escrow-protected. Bitcoin is locked before money changes hands. You can\'t lose funds — if anything goes wrong, our team steps in.' },
  { q:'What payment methods can I use?',       a:'MTN Mobile Money, Vodafone Cash, M-Pesa, OPay, PalmPay, Bank Transfer, PayPal, Zelle, Wave, and 40+ more across Africa, Europe, and North America.' },
  { q:'How long does a trade take?',           a:'Mobile money trades complete in 5–10 minutes. Bank transfers take 15–30 minutes. It depends on your payment method and the seller.' },
  { q:'What are the fees?',                    a:'0.5% flat fee on completed trades only. No listing fees, no withdrawal fees, no monthly subscription. You pay nothing until a trade succeeds.' },
  { q:'What if there\'s a problem with my trade?', a:'Open a dispute inside the trade chat. Our neutral team reviews both sides and resolves it within 24 hours. Your Bitcoin stays locked safe throughout.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState(null);
  const [statsRef, statsVisible] = useVisible(0.3);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily:"'DM Sans',sans-serif", backgroundColor: C.white }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .float{animation:float 5s ease-in-out infinite}
        .card-hover{transition:transform .2s,box-shadow .2s}
        .card-hover:hover{transform:translateY(-5px);box-shadow:0 20px 50px rgba(0,0,0,.13)}
        .gold-text{background:linear-gradient(90deg,#F4A422,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .green-text{background:linear-gradient(90deg,#52B788,#40916C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .glow-btn:hover{box-shadow:0 0 30px rgba(244,164,34,.4)}
        .reveal{animation:slideUp .6s ease both}
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-screen flex items-center"
        style={{ background:`linear-gradient(135deg,${C.forest} 0%,#122b1e 50%,${C.green} 100%)` }}>

        {/* Grid background */}
        <div className="absolute inset-0"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>

        {/* Gold glow top-right */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundColor: C.gold }}/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: C.mint }}/>

        <div className="relative max-w-7xl mx-auto px-4 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="reveal">
              {/* Trust chip */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 border"
                style={{ backgroundColor:'rgba(244,164,34,0.12)', borderColor:'rgba(244,164,34,0.3)', color:C.gold }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.online }}/>
                2.4M+ traders trust PRAQEN worldwide
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.0] mb-6"
                style={{ fontFamily:"'Syne',sans-serif" }}>
                <span className="text-white">Buy & Sell</span><br/>
                <span className="gold-text">Bitcoin P2P</span><br/>
                <span className="text-white text-4xl lg:text-5xl font-bold">in Africa & Beyond</span>
              </h1>

              <p className="text-white/65 text-lg leading-relaxed mb-8 max-w-lg">
                The most trusted peer-to-peer Bitcoin platform. Pay with MTN MoMo, M-Pesa, Bank Transfer, OPay and 50+ local methods.
                <strong className="text-white"> Escrow-protected. Zero fraud. 0.5% fee only.</strong>
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <button onClick={() => navigate('/register')}
                  className="glow-btn flex items-center gap-2 px-7 py-4 rounded-xl font-black text-sm transition-all active:scale-95"
                  style={{ backgroundColor: C.gold, color: C.forest }}>
                  Get Started Free <ArrowRight size={16}/>
                </button>
                <button onClick={() => navigate('/buy-bitcoin')}
                  className="flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
                  style={{ borderColor:'rgba(255,255,255,0.25)', color: C.white }}>
                  <Play size={14} className="fill-white"/> Browse Live Offers
                </button>
              </div>

              {/* Micro trust row */}
              <div className="flex flex-wrap gap-5 mb-8">
                {[
                  { icon:'🔒', text:'Escrow on every trade' },
                  { icon:'⚡', text:'< 15 min average' },
                  { icon:'🌍', text:'180+ countries' },
                  { icon:'💸', text:'0.5% flat fee only' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.55)' }}>
                    <span>{icon}</span>{text}
                  </div>
                ))}
              </div>

              {/* Live feed */}
              <LiveFeed/>
            </div>

            {/* Right — floating card */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Main floating card */}
                <div className="float bg-white rounded-3xl shadow-2xl w-80 p-6"
                  style={{ border:`1px solid ${C.g200}` }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.g400 }}>BTC / GHS Live</p>
                      <p className="text-3xl font-black" style={{ color: C.forest }}>₵808,425</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold" style={{ color: C.success }}>▲ +2.4% today</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor:`${C.gold}18` }}>
                      <Bitcoin size={28} style={{ color: C.gold }}/>
                    </div>
                  </div>

                  {/* Mini offers */}
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: C.g400 }}>🟢 Live Offers</p>
                  <div className="space-y-2 mb-4">
                    {[
                      { user:'Samuel K.', rate:'₵808,850', method:'📱 MTN MoMo', badge:'Pro', bc:'#10B981' },
                      { user:'Ama D.',    rate:'₵809,200', method:'📱 Vodafone',  badge:'Expert', bc:'#0EA5E9' },
                      { user:'Kofi B.',   rate:'₵807,900', method:'🏦 Bank',       badge:'👑', bc:'#7C3AED' },
                    ].map(({ user, rate, method, badge, bc }) => (
                      <div key={user} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: C.g50 }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                          style={{ backgroundColor: C.green }}>{user[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black" style={{ color: C.forest }}>{user}</span>
                            <span className="text-[8px] font-black px-1 py-0.5 rounded-full text-white" style={{ backgroundColor: bc }}>{badge}</span>
                          </div>
                          <p className="text-[10px]" style={{ color: C.g500 }}>{method}</p>
                        </div>
                        <span className="text-xs font-black" style={{ color: C.green }}>{rate}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate('/register')}
                    className="w-full py-3 rounded-xl text-white font-black text-sm"
                    style={{ background:`linear-gradient(135deg,${C.green},${C.mint})` }}>
                    Start Trading Free →
                  </button>
                </div>

                {/* Floating pills */}
                <div className="absolute -top-5 -left-8 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center gap-2"
                  style={{ border:`1px solid ${C.success}20` }}>
                  <Shield size={14} style={{ color: C.success }}/> 
                  <span className="text-xs font-bold" style={{ color: C.success }}>Escrow Safe</span>
                </div>
                <div className="absolute -bottom-5 -right-8 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center gap-2"
                  style={{ border:`1px solid ${C.paid}20` }}>
                  <Zap size={14} style={{ color: C.paid }}/>
                  <span className="text-xs font-bold" style={{ color: C.paid }}>Instant Release</span>
                </div>
                <div className="absolute top-1/2 -right-12 bg-white rounded-2xl px-3 py-2 shadow-xl flex items-center gap-1.5"
                  style={{ border:`1px solid ${C.gold}20` }}>
                  <span className="text-xs font-black" style={{ color: C.gold }}>0.5%</span>
                  <span className="text-[10px]" style={{ color: C.g500 }}>fee only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown size={16} className="animate-bounce"/>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <div ref={statsRef} style={{ backgroundColor: C.forest }}>
        <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimStat value={2400000} suffix="+"  label="Trades Completed"          color={C.gold} />
          <AnimStat value={180}     suffix="+"  label="Countries Supported"        color={C.sage} />
          <AnimStat value={99}      suffix=".8%" label="Dispute Resolution Rate"   color={C.success} />
          <AnimStat value={50}      suffix="+"  label="Payment Methods"            color={C.paid} />
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ backgroundColor: C.mist }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: C.mint }}>Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily:"'Syne',sans-serif", color: C.forest }}>
              Trade Bitcoin in 4 Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_STEPS.map(({ n, icon, title, desc, time }, i) => (
              <div key={n} className="relative">
                {/* Connector */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[70%] w-full h-0.5"
                    style={{ backgroundColor: C.g200, zIndex:0 }}/>
                )}
                <div className="card-hover bg-white rounded-2xl p-5 border relative z-10" style={{ borderColor: C.g200 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor:`${C.gold}15` }}>
                      {icon}
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 rounded-full"
                      style={{ backgroundColor:`${C.green}12`, color: C.green }}>
                      {time}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mb-2"
                    style={{ backgroundColor: C.gold, color: C.forest }}>{n}</div>
                  <h3 className="font-black text-sm mb-1" style={{ color: C.forest }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.g500 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition"
              style={{ backgroundColor: C.green, color: C.white }}>
              Start Trading Free <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ backgroundColor: C.white }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: C.mint }}>Why PRAQEN?</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily:"'Syne',sans-serif", color: C.forest }}>
              Built for Traders Who Need<br/>
              <span className="green-text">Safety, Speed & Trust</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon:Icon, title, desc, color }) => (
              <div key={title} className="card-hover rounded-2xl p-6 border" style={{ borderColor: C.g100, backgroundColor: C.g50 }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor:`${color}15` }}>
                  <Icon size={20} style={{ color }}/>
                </div>
                <h3 className="font-black text-sm mb-2" style={{ color: C.forest }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.g500 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: C.mist }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: C.mint }}>Payment Methods</p>
            <h2 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily:"'Syne',sans-serif", color: C.forest }}>
              Pay Your Way — Local & Global
            </h2>
            <p className="text-sm" style={{ color: C.g500 }}>
              Mobile money, bank transfer, e-wallet or gift card — we support 50+ options.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {PAYMENTS.map(([icon, name, flag]) => (
              <div key={name} className="card-hover flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border text-center"
                style={{ borderColor: C.g200 }}>
                <span className="text-xl">{icon}</span>
                <span className="text-[9px] font-bold leading-tight" style={{ color: C.forest }}>{name}</span>
                <span className="text-sm">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / REVIEWS ────────────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ backgroundColor: C.white }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: C.mint }}>Real Traders</p>
            <h2 className="text-3xl font-black" style={{ fontFamily:"'Syne',sans-serif", color: C.forest }}>
              Loved by Our Community
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {REVIEWS.map(({ name, country, rating, text, badge, bc }) => (
              <div key={name} className="card-hover bg-white rounded-2xl p-6 border" style={{ borderColor: C.g200, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                <div className="flex items-center gap-1 mb-3">
                  {Array(rating).fill(0).map((_, i) => (
                    <Star key={i} size={12} className="fill-yellow-400 text-yellow-400"/>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: C.g600 }}>"{text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
                    style={{ backgroundColor: C.green }}>{name[0]}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black" style={{ color: C.forest }}>{name}</span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: bc }}>{badge}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: C.g400 }}>{country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── URGENCY CTA BANNER ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden"
        style={{ background:`linear-gradient(135deg,${C.forest},${C.green})` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize:'28px 28px' }}/>
        <div className="absolute right-0 top-0 w-96 h-96 opacity-10 blur-3xl rounded-full pointer-events-none"
          style={{ backgroundColor: C.gold }}/>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 border"
            style={{ backgroundColor:'rgba(244,164,34,.15)', borderColor:'rgba(244,164,34,.3)', color: C.gold }}>
            <Flame size={12}/> Join 2.4M+ traders — it's free
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily:"'Syne',sans-serif" }}>
            Ready to Trade Honestly?<br/>
            <span className="gold-text">Start in 30 Seconds.</span>
          </h2>
          <p className="text-white/65 text-base mb-8">
            No bank account needed. No complicated forms. Just sign up and start trading Bitcoin safely — right now.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/register')}
              className="glow-btn flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm hover:opacity-95 transition shadow-lg"
              style={{ backgroundColor: C.gold, color: C.forest }}>
              Create Free Account <ArrowRight size={16}/>
            </button>
            <button onClick={() => navigate('/buy-bitcoin')}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
              style={{ borderColor:'rgba(255,255,255,0.25)', color: C.white }}>
              Browse Offers First
            </button>
          </div>
          <div className="flex justify-center flex-wrap gap-6 mt-10 pt-8 border-t border-white/10">
            {[
              { icon:'🔒', text:'Escrow on every trade' },
              { icon:'💸', text:'0.5% fee — never more' },
              { icon:'🕐', text:'24/7 live support' },
              { icon:'🌍', text:'Works in 180+ countries' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs" style={{ color:'rgba(255,255,255,0.55)' }}>
                <span>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: C.g50 }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: C.mint }}>FAQ</p>
            <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily:"'Syne',sans-serif", color: C.forest }}>
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: C.g200 }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-bold text-sm pr-4" style={{ color: C.forest }}>{q}</span>
                  <ChevronDown size={15} style={{
                    color: C.g400, flexShrink:0,
                    transform: faqOpen===i ? 'rotate(180deg)' : 'none',
                    transition:'transform .2s',
                  }}/>
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-xs leading-relaxed border-t"
                    style={{ borderColor: C.g100, color: C.g600 }}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm"
              style={{ backgroundColor: C.green, color: C.white }}>
              Get Started Free <ArrowRight size={15}/>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: C.forest }}>
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">

          {/* Top grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand col */}
            <div className="lg:col-span-1">
              {/* Logo */}
              <div className="mb-4">
                <span className="text-2xl font-black" style={{ fontFamily:"'Syne',sans-serif" }}>
                  <span className="text-white">PRA</span><span style={{ color: C.gold }}>QEN</span>
                </span>
                <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full align-middle"
                  style={{ backgroundColor:'#EF4444', color:'#fff' }}>BETA</span>
              </div>
              <p className="text-xs leading-relaxed mb-5" style={{ color:'rgba(255,255,255,0.45)' }}>
                Africa's most trusted peer-to-peer Bitcoin trading platform. Escrow-protected. Zero fraud. 0.5% fee only.
              </p>
              {/* Social icons */}
              <div className="flex gap-2.5 flex-wrap">
                {[
                  { href:'https://x.com/praqenapp?s=21',              label:'𝕏',  title:'Twitter / X',   bg:'rgba(255,255,255,0.1)' },
                  { href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr', label:'📸', title:'Instagram',   bg:'rgba(255,255,255,0.1)' },
                  { href:'https://www.linkedin.com/in/pra-qen-045373402/', label:'💼', title:'LinkedIn',  bg:'rgba(255,255,255,0.1)' },
                  { href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t', label:'💬', title:'WhatsApp',bg:'rgba(37,211,102,0.25)' },
                  { href:'https://discord.gg/V6zCZxfdy',               label:'🎮', title:'Discord',      bg:'rgba(88,101,242,0.35)' },
                ].map(({ href, label, title, bg }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base hover:scale-110 transition-transform"
                    style={{ backgroundColor: bg }}>
                    <span className="text-white">{label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Trade col */}
            <div>
              <p className="text-white font-black text-sm mb-4 uppercase tracking-wider">Trade</p>
              <div className="space-y-2.5">
                {[
                  { label:'Buy Bitcoin',   href:'/buy-bitcoin' },
                  { label:'Sell Bitcoin',  href:'/sell-bitcoin' },
                  { label:'Gift Cards',    href:'/gift-cards', badge:'BETA' },
                  { label:'Create Offer',  href:'/create-offer' },
                  { label:'My Trades',     href:'/my-trades' },
                  { label:'My Listings',   href:'/my-listings' },
                ].map(({ label, href, badge }) => (
                  <a key={label} href={href}
                    className="flex items-center gap-2 text-xs hover:text-white transition"
                    style={{ color:'rgba(255,255,255,0.45)' }}>
                    {label}
                    {badge && (
                      <span className="text-[8px] font-black px-1 py-0 rounded-full"
                        style={{ backgroundColor:'#EF4444', color:'#fff' }}>{badge}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Account col */}
            <div>
              <p className="text-white font-black text-sm mb-4 uppercase tracking-wider">Account</p>
              <div className="space-y-2.5">
                {[
                  { label:'Register',       href:'/register' },
                  { label:'Login',          href:'/login' },
                  { label:'Dashboard',      href:'/dashboard' },
                  { label:'Profile',        href:'/profile' },
                  { label:'Wallet',         href:'/wallet' },
                  { label:'Settings',       href:'/settings' },
                ].map(({ label, href }) => (
                  <a key={label} href={href}
                    className="block text-xs hover:text-white transition"
                    style={{ color:'rgba(255,255,255,0.45)' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Community + Contact col */}
            <div>
              <p className="text-white font-black text-sm mb-4 uppercase tracking-wider">Community</p>
              <div className="space-y-2.5 mb-7">
                {[
                  { label:'💬 WhatsApp Community', href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t' },
                  { label:'🎮 Discord Server',     href:'https://discord.gg/V6zCZxfdy' },
                  { label:'𝕏 Twitter / X',         href:'https://x.com/praqenapp?s=21' },
                  { label:'📸 Instagram',           href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr' },
                  { label:'💼 LinkedIn',            href:'https://www.linkedin.com/in/pra-qen-045373402/' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="block text-xs hover:text-white transition"
                    style={{ color:'rgba(255,255,255,0.45)' }}>
                    {label}
                  </a>
                ))}
              </div>

              {/* Email support */}
              <div className="p-3 rounded-2xl border" style={{ backgroundColor:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color:'rgba(255,255,255,0.3)' }}>Support</p>
                <a href="mailto:support@praqen.com"
                  className="text-xs font-bold hover:text-white transition flex items-center gap-1.5"
                  style={{ color: C.gold }}>
                  📧 support@praqen.com
                </a>
                <p className="text-[10px] mt-1" style={{ color:'rgba(255,255,255,0.3)' }}>Response within 24 hours</p>
              </div>
            </div>
          </div>

          {/* Trust badges row */}
          <div className="flex flex-wrap justify-center gap-4 py-8 border-y" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            {[
              { icon:'🔒', label:'Escrow on every trade' },
              { icon:'💸', label:'0.5% fee — nothing more' },
              { icon:'⚡', label:'< 15 min average trade' },
              { icon:'🌍', label:'180+ countries' },
              { icon:'🛡️', label:'99.8% dispute resolution' },
              { icon:'🕐', label:'24/7 live support' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs"
                style={{ color:'rgba(255,255,255,0.4)' }}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6">
            <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.25)' }}>
              © {new Date().getFullYear()} PRAQEN. All rights reserved. Not a financial advisor.
            </p>
            <div className="flex items-center gap-4">
              {['Privacy Policy','Terms of Service','Cookie Policy'].map(l=>(
                <a key={l} href="#" className="text-[10px] hover:text-white transition"
                  style={{ color:'rgba(255,255,255,0.25)' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
