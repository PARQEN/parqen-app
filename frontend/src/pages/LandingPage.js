import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Zap, Globe, ArrowRight, ChevronDown,
  Bitcoin, Gift, Home, Wallet, LogIn, Lock,
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C',
  gold:'#F4A422', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g700:'#334155', g800:'#1E293B',
  success:'#10B981', online:'#22C55E',
};

// ── Live trade ticker ─────────────────────────────────────────────────────────
const TRADES = [
  { user:'Samuel K.',  flag:'🇬🇭', method:'MTN MoMo',      amount:'₵12,500', ago:'2s ago' },
  { user:'Amina T.',   flag:'🇳🇬', method:'OPay',           amount:'₦850,000', ago:'18s ago' },
  { user:'Kofi B.',    flag:'🇬🇭', method:'Vodafone Cash',  amount:'₵4,200',   ago:'34s ago' },
  { user:'Fatima S.',  flag:'🇸🇳', method:'Wave',           amount:'CFA 45k',  ago:'1m ago' },
  { user:'James O.',   flag:'🇰🇪', method:'M-Pesa',         amount:'KSh 8,200', ago:'1m ago' },
  { user:'Ama D.',     flag:'🇬🇭', method:'Bank Transfer',  amount:'₵22,000',  ago:'2m ago' },
];
function Ticker() {
  const [i, setI] = useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setI(x=>(x+1)%TRADES.length),2600); return()=>clearInterval(iv); },[]);
  const t = TRADES[i];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs"
      style={{backgroundColor:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',animation:'fadeIn .35s ease'}}>
      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{backgroundColor:C.online}}/>
      <span style={{color:'rgba(255,255,255,0.45)'}}>Live</span>
      <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 text-white"
        style={{backgroundColor:C.green}}>{t.user[0]}</div>
      <span className="font-bold text-white flex-shrink-0">{t.user}</span>
      <span style={{color:'rgba(255,255,255,0.45)'}} className="hidden sm:inline">
        {t.flag} bought BTC via {t.method}
      </span>
      <span className="font-black flex-shrink-0 ml-auto" style={{color:C.gold}}>{t.amount}</span>
      <span className="flex-shrink-0 hidden sm:block" style={{color:'rgba(255,255,255,0.3)'}}>{t.ago}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({value, label}) {
  return (
    <div className="text-center px-4">
      <p className="text-2xl md:text-3xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs" style={{color:'rgba(255,255,255,0.5)'}}>{label}</p>
    </div>
  );
}

// ── Bottom nav (mobile, guest) ────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate();
  const items = [
    {icon:Home,    label:'Home',       path:'/'},
    {icon:Bitcoin, label:'P2P',        path:'/buy-bitcoin'},
    {icon:Gift,    label:'Gift Cards', path:'/gift-cards'},
    {icon:Wallet,  label:'Wallet',     path:'/login?message=Please log in to access your wallet'},
    {icon:LogIn,   label:'Login',      path:'/login'},
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden"
      style={{borderColor:C.g200, paddingBottom:'env(safe-area-inset-bottom)'}}>
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map(({icon:Icon,label,path})=>(
          <button key={label} onClick={()=>navigate(path)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl"
            style={{color: label==='Home' ? C.forest : C.g400}}>
            <Icon size={20} strokeWidth={label==='Home'?2.5:1.8}/>
            <span className="text-xs font-bold">{label}</span>
            {label==='Home' && <span className="w-1 h-1 rounded-full" style={{backgroundColor:C.forest}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

const PAYMENTS = [
  'MTN Mobile Money','Vodafone Cash','M-Pesa','OPay','PalmPay',
  'Bank Transfer','PayPal','Wave','Orange Money','Zelle','Wise','Revolut',
];

const HOW = [
  {n:'01', icon:'🔐', title:'Create Free Account', desc:'Sign up in 30 seconds. Email or phone. No bank needed.'},
  {n:'02', icon:'🔍', title:'Browse Live Offers',  desc:'Filter by payment method, country, and rate.'},
  {n:'03', icon:'🔒', title:'Escrow Locks BTC',    desc:"Seller's Bitcoin is secured automatically before you pay."},
  {n:'04', icon:'💰', title:'Pay & Receive BTC',   desc:'Send payment, confirm — BTC lands in your wallet instantly.'},
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [faq, setFaq] = useState(null);

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 md:pb-0"
      style={{fontFamily:"'DM Sans',sans-serif", backgroundColor:C.white}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .reveal{animation:slideUp .55s ease both}
        .delay1{animation-delay:.1s}.delay2{animation-delay:.2s}.delay3{animation-delay:.3s}
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden"
        style={{background:`linear-gradient(140deg,${C.forest} 0%,#122b1e 55%,${C.green} 100%)`}}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'56px 56px'}}/>
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{backgroundColor:C.gold}}/>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
          style={{backgroundColor:C.mint}}/>

        <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-16 text-center">

          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 reveal"
            style={{backgroundColor:'rgba(244,164,34,0.14)',border:'1px solid rgba(244,164,34,0.3)',color:C.gold}}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
            2.4M+ traders · Africa's #1 P2P Bitcoin platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-5 reveal delay1"
            style={{fontFamily:"'Syne',sans-serif"}}>
            Buy & Sell Bitcoin<br/>
            <span style={{color:C.gold}}>Safely. Instantly.</span>
          </h1>

          {/* Tagline */}
          <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-8 reveal delay2">
            Trade directly with verified sellers using MTN MoMo, M-Pesa, bank transfer and 40+ payment methods.
            Every trade is escrow-protected.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 reveal delay3">
            <button onClick={()=>navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base transition hover:opacity-90 hover:shadow-2xl"
              style={{backgroundColor:C.gold, color:C.forest}}>
              Get Started Free <ArrowRight size={16}/>
            </button>
            <button onClick={()=>navigate('/buy-bitcoin')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base transition"
              style={{backgroundColor:'rgba(255,255,255,0.1)',color:'#fff',border:'1.5px solid rgba(255,255,255,0.2)'}}>
              Browse Marketplace
            </button>
          </div>

          {/* Live trade feed */}
          <div className="max-w-lg mx-auto reveal delay3">
            <Ticker/>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <Stat value="2.4M+"  label="Active Traders"/>
            <Stat value="180+"   label="Countries"/>
            <Stat value="0.5%"   label="Flat Fee Only"/>
            <Stat value="< 15m"  label="Avg Trade Time"/>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4" style={{backgroundColor:C.g50}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Simple Process</p>
            <h2 className="text-2xl md:text-3xl font-black" style={{color:C.g800,fontFamily:"'Syne',sans-serif"}}>
              Trade in 4 easy steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW.map(({n,icon,title,desc})=>(
              <div key={n} className="bg-white rounded-2xl p-5 border" style={{borderColor:C.g200}}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-black" style={{color:C.g300}}>{n}</span>
                </div>
                <p className="font-black text-sm mb-1.5" style={{color:C.g800}}>{title}</p>
                <p className="text-xs leading-relaxed" style={{color:C.g500}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHY PRAQEN
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Why PRAQEN</p>
            <h2 className="text-2xl md:text-3xl font-black" style={{color:C.g800,fontFamily:"'Syne',sans-serif"}}>
              Built for African traders
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {icon:Shield, title:'Escrow on Every Trade',   desc:"Bitcoin locks automatically before any money moves. You're always protected.",  color:C.green},
              {icon:Zap,    title:'Complete in Minutes',     desc:'No banks, no delays. Trade directly with verified sellers and receive instantly.', color:C.gold},
              {icon:Globe,  title:'Your Local Currency',     desc:'GHS, NGN, KES, ZAR, EUR, USD and 50+ more. Trade in the money you use daily.', color:'#3B82F6'},
            ].map(({icon:Icon,title,desc,color})=>(
              <div key={title} className="p-5 rounded-2xl border" style={{borderColor:C.g200}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{backgroundColor:`${color}15`}}>
                  <Icon size={18} style={{color}}/>
                </div>
                <p className="font-black text-sm mb-1.5" style={{color:C.g800}}>{title}</p>
                <p className="text-xs leading-relaxed" style={{color:C.g500}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PAYMENT METHODS STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-10 px-4 border-y" style={{backgroundColor:C.g50,borderColor:C.g200}}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{color:C.g400}}>
            40+ Payment Methods Accepted
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PAYMENTS.map(p=>(
              <span key={p} className="px-3 py-1.5 text-xs font-bold rounded-lg border"
                style={{borderColor:C.g200,color:C.g600,backgroundColor:C.white}}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black" style={{color:C.g800,fontFamily:"'Syne',sans-serif"}}>
              Common Questions
            </h2>
          </div>
          <div className="space-y-2">
            {[
              {q:'Is PRAQEN safe for beginners?',          a:"Absolutely. Every trade is escrow-protected. Bitcoin is locked before money changes hands. Our team resolves any dispute within 24 hours."},
              {q:'What payment methods can I use?',         a:'MTN Mobile Money, Vodafone Cash, M-Pesa, OPay, PalmPay, Bank Transfer, PayPal, Wave and 40+ more across Africa, Europe and North America.'},
              {q:'How long does a trade take?',             a:'Mobile money trades complete in 5–10 minutes. Bank transfers take 15–30 minutes depending on the seller.'},
              {q:'What are the fees?',                      a:'0.5% flat fee on completed trades only. No listing fees, no withdrawal fees, no subscriptions. Pay nothing until a trade succeeds.'},
              {q:'What if there is a problem with my trade?',a:'Open a dispute inside the trade chat. Our neutral team reviews both sides and resolves it quickly. Your Bitcoin stays locked safe throughout.'},
            ].map(({q,a},i)=>(
              <div key={i} className="border rounded-2xl overflow-hidden" style={{borderColor:C.g200}}>
                <button onClick={()=>setFaq(faq===i?null:i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
                  <span className="font-bold text-sm" style={{color:C.g800}}>{q}</span>
                  <ChevronDown size={16} className={`transition-transform flex-shrink-0 ml-3 ${faq===i?'rotate-180':''}`} style={{color:C.g400}}/>
                </button>
                {faq===i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{color:C.g600,borderTop:`1px solid ${C.g100}`}}>
                    <p className="pt-3">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4"
        style={{background:`linear-gradient(135deg,${C.forest},${C.green})`}}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3" style={{fontFamily:"'Syne',sans-serif"}}>
            Ready to start trading?
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
            Join millions of traders across Africa. Create your free account in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={()=>navigate('/register')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base hover:opacity-90 transition"
              style={{backgroundColor:C.gold,color:C.forest}}>
              Create Free Account <ArrowRight size={16}/>
            </button>
            <button onClick={()=>navigate('/buy-bitcoin')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base transition"
              style={{backgroundColor:'rgba(255,255,255,0.1)',color:'#fff',border:'1.5px solid rgba(255,255,255,0.25)'}}>
              Browse Marketplace
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-xs" style={{color:'rgba(255,255,255,0.35)'}}>
            <Lock size={11}/> 256-bit SSL encrypted · Escrow-protected · Zero fraud guarantee
          </div>
        </div>
      </section>

      {/* Mobile bottom nav */}
      <BottomNav/>
    </div>
  );
}
