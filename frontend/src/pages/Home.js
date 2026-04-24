import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, Users, TrendingUp, Bitcoin, Globe,
  MessageCircle, Star, CheckCircle, ChevronDown, X, Send,
  Clock, Lock, CreditCard, Smartphone, Building2, Gift,
  BarChart2, HeadphonesIcon, BookOpen, Award, Flame,
  Play, ChevronRight, ExternalLink, Mail, Twitter,
  Facebook, Instagram, Youtube, Phone
} from 'lucide-react';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6', online:'#22C55E',
};

// ── Live ticker data ──────────────────────────────────────────────────────────
const STATS = [
  { value:'2.4M+', label:'Trades Completed' },
  { value:'180+', label:'Countries Supported' },
  { value:'$1.2B+', label:'Volume Traded' },
  { value:'99.8%', label:'Dispute Resolution Rate' },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Smart Escrow Protection',
    desc: 'Bitcoin is automatically locked in escrow the moment a trade starts. Released only when both parties confirm. Zero risk of fraud.',
    color: C.green, bg: `${C.green}12`,
  },
  {
    icon: Globe,
    title: 'Multiple Payment Methods',
    desc: 'MTN Mobile Money, Vodafone Cash, Bank Transfer, PayPal, M-Pesa, OPay, PalmPay and 50+ more — local and international.',
    color: C.paid, bg: `${C.paid}12`,
  },
  {
    icon: Zap,
    title: 'Trade in Minutes',
    desc: 'No intermediaries. No complicated restrictions. Match with a trader and complete your transaction in under 15 minutes.',
    color: C.gold, bg: `${C.gold}12`,
  },
  {
    icon: MessageCircle,
    title: 'Smart Dispute Protection',
    desc: 'A fast and neutral dispute system that protects your rights. Every trade resolved safely and transparently within minutes.',
    color: C.success, bg: `${C.success}12`,
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Live Support',
    desc: 'Real humans. Real solutions. Reach our global support team any time. Your trading experience is our top priority.',
    color: '#8B5CF6', bg: '#8B5CF612',
  },
  {
    icon: Lock,
    title: 'No Hidden Charges',
    desc: 'Transparent flat fee on completed trades only. See exactly what you pay before you start. Zero surprises.',
    color: C.danger, bg: `${C.danger}12`,
  },
];

const PRODUCTS = [
  {
    icon: Bitcoin, title: 'Buy & Sell Bitcoin',
    desc: 'Access the best peer-to-peer Bitcoin rates with thousands of offers across all African and global markets.',
    link: '/buy-bitcoin', label: 'Browse Offers', color: C.gold,
  },
  {
    icon: Gift, title: 'Gift Card Trading',
    desc: 'Convert gift cards to Bitcoin instantly. Amazon, iTunes, Steam, Google Play and 100+ more brands accepted.',
    link: '/marketplace', label: 'Trade Gift Cards', color: '#8B5CF6',
  },
  {
    icon: CreditCard, title: 'Create an Offer',
    desc: 'Set your own rate, payment method, and trade limits. Your offer, your rules. Join thousands of active traders.',
    link: '/create-offer', label: 'Create Offer', color: C.green,
  },
];

const HOW_STEPS = [
  { n:1, icon:'🔐', title:'Create Account', desc:'Sign up free. Verify your email. Get your secure wallet in seconds.' },
  { n:2, icon:'🔍', title:'Find or Create Offer', desc:'Browse thousands of live offers or post your own with your terms.' },
  { n:3, icon:'🔒', title:'Trade in Escrow', desc:'BTC is locked safely. Pay or receive via your preferred local method.' },
  { n:4, icon:'✅', title:'Confirm & Receive', desc:'Both parties confirm. Bitcoin is released instantly. Trade done!' },
];

const PAYMENTS = [
  { name:'MTN MoMo', flag:'🇬🇭', icon:'📱' }, { name:'Vodafone Cash', flag:'🇬🇭', icon:'📱' },
  { name:'M-Pesa', flag:'🇰🇪', icon:'📱' },   { name:'OPay', flag:'🇳🇬', icon:'💳' },
  { name:'PalmPay', flag:'🇳🇬', icon:'💳' },  { name:'PayPal', flag:'🌍', icon:'💰' },
  { name:'Bank Transfer', flag:'🏦', icon:'🏦' }, { name:'Zelle', flag:'🇺🇸', icon:'💳' },
  { name:'Wave', flag:'🇸🇳', icon:'📱' },     { name:'Orange Money', flag:'🇨🇲', icon:'📱' },
  { name:'Wise', flag:'🌍', icon:'💸' },       { name:'SEPA', flag:'🇪🇺', icon:'🏦' },
];

const FAQS = [
  { q:'Is PRAQEN safe to use?', a:'Yes. Every trade uses our escrow system — Bitcoin is locked before any money changes hands. Neither party can disappear with funds.' },
  { q:'What are the fees?', a:'We charge a flat 0.5% fee on completed trades only. No listing fees, no withdrawal fees, no hidden charges.' },
  { q:'How long does a trade take?', a:'Most trades complete in 5–30 minutes depending on the payment method. Mobile money trades are typically the fastest.' },
  { q:'What if there\'s a dispute?', a:'Our neutral support team reviews evidence from both sides and resolves disputes within 24 hours. Your funds are always protected.' },
  { q:'Which countries are supported?', a:'PRAQEN supports 180+ countries. We specialise in Africa, with deep support for Ghana, Nigeria, Kenya, South Africa, and more.' },
];

// ── Live Support Chat ──────────────────────────────────────────────────────────
function LiveChat() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([
    { from:'agent', text:'👋 Hi! Welcome to PRAQEN. How can I help you today?', time:'Now' },
  ]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [unread, setUnread]   = useState(1);
  const bottomRef             = useRef(null);

  const QUICK = ['How do I buy Bitcoin?', 'What are the fees?', 'Is my money safe?', 'How does escrow work?'];

  const ANSWERS = {
    'how do i buy bitcoin': 'To buy Bitcoin: 1) Browse offers on our Buy page, 2) Choose a seller with your preferred payment method, 3) Start a trade — BTC is locked in escrow, 4) Send payment and click "I Have Paid", 5) Seller confirms and you receive BTC! 🎉',
    'what are the fees': 'PRAQEN charges a flat 0.5% fee on completed trades only. No hidden fees, no listing fees, no subscription. You only pay when a trade is successfully completed! ✅',
    'is my money safe': 'Absolutely! All trades use our escrow system. Bitcoin is locked before payment is made. If anything goes wrong, our dispute team protects you 24/7. Your funds are always safe. 🔒',
    'how does escrow work': 'When a trade starts, the seller\'s Bitcoin is automatically locked in our escrow. You then send payment. Once confirmed, the BTC is instantly released to you. Neither party can touch the funds until both agree. 🛡️',
  };

  const getReply = (msg) => {
    const key = Object.keys(ANSWERS).find(k => msg.toLowerCase().includes(k.split(' ')[0]) || msg.toLowerCase().includes(k.split(' ')[2]));
    return ANSWERS[key] || "Thanks for reaching out! A support agent will respond shortly. In the meantime, check our Help Center for instant answers. 😊";
  };

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { from:'user', text, time:'Now' };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from:'agent', text: getReply(text), time:'Now' }]);
    }, 1400);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  return (
    <>
      {/* Chat bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background:`linear-gradient(135deg,${C.forest},${C.mint})` }}>
        {open ? <X size={22} className="text-white"/> : <MessageCircle size={22} className="text-white"/>}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center"
            style={{backgroundColor:C.danger}}>{unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden border"
          style={{borderColor:C.g200, animation:'slideUp .25s ease'}}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3"
            style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{backgroundColor:C.gold}}>🛡️</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{backgroundColor:C.online}}/>
            </div>
            <div>
              <p className="text-white font-black text-sm">PRAQEN Support</p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                Online · Replies in &lt;2 min
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/60 hover:text-white">
              <X size={16}/>
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3" style={{backgroundColor:C.g50}}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.from==='user'
                    ? 'text-white rounded-br-sm'
                    : 'text-gray-800 rounded-bl-sm'
                }`}
                  style={{
                    backgroundColor: m.from==='user' ? C.green : C.white,
                    boxShadow:'0 1px 4px rgba(0,0,0,.08)',
                  }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1"
                  style={{boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                  {[0,1,2].map(i=>(
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{backgroundColor:C.g400, animationDelay:`${i*0.15}s`}}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t" style={{backgroundColor:C.white, borderColor:C.g100}}>
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs font-semibold px-2 py-1 rounded-full border hover:bg-gray-50 transition truncate max-w-[48%]"
                style={{borderColor:C.g200, color:C.green}}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t" style={{backgroundColor:C.white, borderColor:C.g100}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&send(input)}
              placeholder="Type a message…"
              className="flex-1 text-xs border-0 outline-none bg-transparent"
              style={{color:C.g800}}/>
            <button onClick={() => send(input)}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:C.green}}>
              <Send size={13} className="text-white"/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home({ user }) {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{fontFamily:"'DM Sans',sans-serif", backgroundColor:C.white}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .float{animation:float 4s ease-in-out infinite}
        .card-hover{transition:transform .2s,box-shadow .2s}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.12)}
        .gradient-text{background:linear-gradient(90deg,#F4A422,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .green-gradient-text{background:linear-gradient(90deg,#52B788,#40916C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      `}</style>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{background:`linear-gradient(135deg,${C.forest} 0%,#1a3a2a 40%,${C.green} 100%)`}}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'32px 32px'}}/>
        {/* Glow */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{backgroundColor:C.gold}}/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{backgroundColor:C.mint}}/>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border"
                style={{backgroundColor:`${C.gold}20`, borderColor:`${C.gold}40`, color:C.gold}}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                Trusted by 2.4M+ traders worldwide
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-6"
                style={{fontFamily:"'Syne',sans-serif"}}>
                <span className="text-white">Buy & Sell</span><br/>
                <span className="gradient-text">Crypto & Gift Cards</span><br/>
                <span className="text-white/80 text-3xl md:text-4xl font-bold">Peer-to-Peer</span>
              </h1>

              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                Peer-to-peer crypto payments give you access to bank accounts and mobile wallets worldwide.
                Remittances, invoices, no limits, and complete privacy — trusted by a community built on honesty and escrow.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                {!user ? (
                  <>
                    <Link to="/register"
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition shadow-lg"
                      style={{backgroundColor:C.gold, color:C.forest}}>
                      Get Started Free <ArrowRight size={16}/>
                    </Link>
                    <Link to="/buy-bitcoin"
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
                      style={{borderColor:'rgba(255,255,255,0.3)', color:C.white}}>
                      <Play size={14}/> Browse Offers
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/buy-bitcoin"
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition shadow-lg"
                      style={{backgroundColor:C.gold, color:C.forest}}>
                      Buy BTC <ArrowRight size={16}/>
                    </Link>
                    <Link to="/sell-bitcoin"
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
                      style={{borderColor:'rgba(255,255,255,0.3)', color:C.white}}>
                      Sell BTC
                    </Link>
                  </>
                )}
              </div>

              {/* Trust micro-badges */}
              <div className="flex flex-wrap gap-4">
                {[
                  {icon:'🔒', text:'Escrow Protected'},
                  {icon:'⚡', text:'< 15 min trades'},
                  {icon:'🌍', text:'180+ countries'},
                ].map(({icon,text}) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-white/60">
                    <span>{icon}</span>{text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual — floating card */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                {/* Main card */}
                <div className="float bg-white rounded-3xl p-6 shadow-2xl w-72" style={{border:`1px solid ${C.g200}`}}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold" style={{color:C.g400}}>Live Rate</p>
                      <p className="text-2xl font-black" style={{color:C.forest}}>₵808,425</p>
                      <p className="text-xs" style={{color:C.success}}>▲ +2.4% today</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{backgroundColor:`${C.gold}20`}}>
                      <Bitcoin size={24} style={{color:C.gold}}/>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      {user:'Samuel K.', method:'📱 MTN MoMo', amount:'₵5,000', badge:'Legend', bc:'#7C3AED'},
                      {user:'Amina T.', method:'🏦 Bank Transfer', amount:'₵12,500', badge:'Expert', bc:'#0EA5E9'},
                      {user:'Kofi B.', method:'📱 Vodafone', amount:'₵2,800', badge:'Pro', bc:'#10B981'},
                    ].map(({user,method,amount,badge,bc}) => (
                      <div key={user} className="flex items-center justify-between p-2 rounded-xl" style={{backgroundColor:C.g50}}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                            style={{backgroundColor:C.green}}>
                            {user[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold" style={{color:C.forest}}>{user}</span>
                              <span className="text-xs font-black px-1 py-0.5 rounded-full text-white"
                                style={{backgroundColor:bc}}>{badge}</span>
                            </div>
                            <p style={{color:C.g500}}>{method}</p>
                          </div>
                        </div>
                        <span className="font-black text-xs" style={{color:C.green}}>{amount}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-3 py-2.5 rounded-xl text-white font-black text-sm"
                    style={{background:`linear-gradient(135deg,${C.green},${C.mint})`}}>
                    Buy BTC Now →
                  </button>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-bold"
                  style={{color:C.success, border:`1px solid ${C.success}20`}}>
                  <Shield size={12}/> Escrow Safe
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-bold"
                  style={{color:C.paid, border:`1px solid ${C.paid}20`}}>
                  <Zap size={12}/> Instant Release
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────────── */}
      <div className="py-10 border-b" style={{backgroundColor:C.forest, borderColor:`${C.mint}30`}}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({value,label}) => (
            <div key={label} className="text-center">
              <p className="text-3xl md:text-4xl font-black mb-1 gradient-text">{value}</p>
              <p className="text-white/50 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── OUR PRODUCTS ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{backgroundColor:C.mist}}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Our Products</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{fontFamily:"'Syne',sans-serif", color:C.forest}}>
              Discover Our Full Range of Tools
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{color:C.g500}}>
              Designed to make crypto easy and accessible for every trader.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PRODUCTS.map(({icon:Icon,title,desc,link,label,color}) => (
              <Link key={title} to={link}
                className="card-hover bg-white rounded-2xl p-6 border block"
                style={{borderColor:C.g200}}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{backgroundColor:`${color}15`}}>
                  <Icon size={22} style={{color}}/>
                </div>
                <h3 className="font-black text-base mb-2" style={{color:C.forest}}>{title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{color:C.g500}}>{desc}</p>
                <div className="flex items-center gap-1 font-bold text-sm" style={{color}}>
                  {label} <ChevronRight size={14}/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PRAQEN ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{backgroundColor:C.white}}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Why PRAQEN?</p>
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{fontFamily:"'Syne',sans-serif", color:C.forest}}>
              Safe, Easy, and Reliable Trading<br/>
              <span className="green-gradient-text">for Everyone</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{color:C.g500}}>
              Peer-to-peer freedom. No hidden charges. Trade with thousands of global offers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({icon:Icon,title,desc,color,bg}) => (
              <div key={title} className="card-hover rounded-2xl p-5 border" style={{borderColor:C.g100, backgroundColor:C.g50}}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{backgroundColor:bg}}>
                  <Icon size={20} style={{color}}/>
                </div>
                <h3 className="font-black text-sm mb-2" style={{color:C.forest}}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{color:C.g500}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{backgroundColor:C.mist}}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{fontFamily:"'Syne',sans-serif", color:C.forest}}>
              Trade in 4 Easy Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_STEPS.map(({n,icon,title,desc}, i) => (
              <div key={n} className="text-center relative">
                {i < HOW_STEPS.length-1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px"
                    style={{backgroundColor:C.g200, zIndex:0}}/>
                )}
                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm"
                  style={{backgroundColor:C.white, border:`2px solid ${C.gold}30`}}>
                  {icon}
                </div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2"
                  style={{backgroundColor:C.gold, color:C.forest}}>{n}</div>
                <h3 className="font-black text-sm mb-1.5" style={{color:C.forest}}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{color:C.g500}}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to={user?'/buy-bitcoin':'/register'}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition shadow-lg"
              style={{backgroundColor:C.green, color:C.white}}>
              {user ? 'Start Trading Now' : 'Join Us Now'} <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{backgroundColor:C.white}}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Payment Methods</p>
            <h2 className="text-2xl md:text-3xl font-black mb-2" style={{fontFamily:"'Syne',sans-serif", color:C.forest}}>
              Multiple Local & International Options
            </h2>
            <p className="text-sm" style={{color:C.g500}}>
              Bank transfers, mobile money, e-wallets, gift cards and more — local and global.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {PAYMENTS.map(({name,flag,icon}) => (
              <div key={name} className="card-hover flex flex-col items-center gap-2 p-3 rounded-2xl border text-center"
                style={{borderColor:C.g200, backgroundColor:C.g50}}>
                <div className="text-xl">{icon}</div>
                <div className="text-xs font-bold" style={{color:C.forest}}>{name}</div>
                <div className="text-sm">{flag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRADING HUB / CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-20 px-4 relative overflow-hidden"
        style={{background:`linear-gradient(135deg,${C.forest},${C.green})`}}>
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px'}}/>
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{backgroundColor:C.gold}}/>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{backgroundColor:`${C.gold}20`, color:C.gold, border:`1px solid ${C.gold}30`}}>
            <Flame size={12}/> PRAQEN TRADING HUB
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{fontFamily:"'Syne',sans-serif"}}>
            Join Millions of Traders.<br/>Learn by Trading P2P.
          </h2>
          <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
            A worldwide platform with real-time customer support to guarantee a smooth and reliable trading experience with a real community.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to={user?'/buy-bitcoin':'/register'}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm hover:opacity-90 transition shadow-lg"
              style={{backgroundColor:C.gold, color:C.forest}}>
              Join Us Now <ArrowRight size={16}/>
            </Link>
            <Link to="/help"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
              style={{borderColor:'rgba(255,255,255,0.3)', color:C.white}}>
              <BookOpen size={14}/> Help Center
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-10 pt-8 border-t border-white/10">
            {[
              {icon:Users, label:'2.4M+ Active Traders'},
              {icon:Globe, label:'180+ Countries'},
              {icon:HeadphonesIcon, label:'24/7 Live Support'},
            ].map(({icon:Icon,label}) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                <Icon size={15}/>{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{backgroundColor:C.g50}}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:C.mint}}>Help Center</p>
            <h2 className="text-3xl font-black" style={{fontFamily:"'Syne',sans-serif", color:C.forest}}>
              Find Guides, Answers & Support
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({q,a}, i) => (
              <div key={i} className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>
                <button onClick={() => setFaqOpen(faqOpen===i?null:i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{color:C.forest}}>
                  <span className="font-bold text-sm">{q}</span>
                  <ChevronDown size={15} style={{
                    color:C.g400,
                    transform: faqOpen===i?'rotate(180deg)':'none',
                    transition:'transform .2s'
                  }}/>
                </button>
                {faqOpen===i && (
                  <div className="px-5 pb-4 text-xs leading-relaxed border-t"
                    style={{borderColor:C.g100, color:C.g600}}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{backgroundColor:C.forest}}>
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <span className="text-2xl font-black" style={{fontFamily:"'Syne',sans-serif"}}>
                  <span className="text-white">PRA</span><span style={{color:C.gold}}>QEN</span>
                </span>
                <span className="ml-2 text-xs font-black px-1.5 py-0.5 rounded-full align-middle"
                  style={{backgroundColor:'#EF4444', color:'#fff'}}>BETA</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed mb-5">
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Zero fraud. 0.5% fee only. Built with honesty.
              </p>
              {/* Real social links */}
              <div className="flex gap-2.5 flex-wrap">
                {[
                  {href:'https://x.com/praqenapp?s=21',                                                                              label:'𝕏',  title:'Twitter / X',  bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',                              label:'📸', title:'Instagram',    bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',                                                             label:'💼', title:'LinkedIn',     bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',                                                label:'💬', title:'WhatsApp',    bg:'rgba(37,211,102,0.25)'},
                  {href:'https://discord.gg/V6zCZxfdy',                                                                              label:'🎮', title:'Discord',      bg:'rgba(88,101,242,0.35)'},
                ].map(({href,label,title,bg})=>(
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base hover:scale-110 transition-transform"
                    style={{backgroundColor:bg}}>
                    <span className="text-white">{label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Trade */}
            <div>
              <p className="text-white font-black text-sm mb-4">Trade</p>
              <div className="space-y-2.5">
                {[
                  {label:'Buy Bitcoin',  to:'/buy-bitcoin',  badge:'BETA'},
                  {label:'Sell Bitcoin', to:'/sell-bitcoin', badge:'BETA'},
                  {label:'Gift Cards',   to:'/gift-cards',   badge:'BETA'},
                  {label:'Create Offer', to:'/create-offer'},
                  {label:'My Trades',    to:'/my-trades'},
                  {label:'My Listings',  to:'/my-listings'},
                ].map(({label,to,badge})=>(
                  <Link key={label} to={to}
                    className="flex items-center gap-2 text-xs hover:text-white transition"
                    style={{color:'rgba(255,255,255,0.5)'}}>
                    {label}
                    {badge&&(
                      <span className="text-xs font-black px-1 py-0 rounded-full"
                        style={{backgroundColor:'#EF4444',color:'#fff'}}>{badge}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-white font-black text-sm mb-4">Account</p>
              <div className="space-y-2.5 mb-6">
                {[
                  {label:'Register',  to:'/register'},
                  {label:'Login',     to:'/login'},
                  {label:'Dashboard', to:'/dashboard'},
                  {label:'Profile',   to:'/profile'},
                  {label:'Wallet',    to:'/wallet'},
                  {label:'Settings',  to:'/settings'},
                ].map(({label,to})=>(
                  <Link key={label} to={to}
                    className="block text-xs hover:text-white transition"
                    style={{color:'rgba(255,255,255,0.5)'}}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Community + Support */}
            <div>
              <p className="text-white font-black text-sm mb-4">Community</p>
              <div className="space-y-2.5 mb-6">
                {[
                  {label:'💬 WhatsApp Community', href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'},
                  {label:'🎮 Discord Server',     href:'https://discord.gg/V6zCZxfdy'},
                  {label:'𝕏 Twitter / X',         href:'https://x.com/praqenapp?s=21'},
                  {label:'📸 Instagram',           href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr'},
                  {label:'💼 LinkedIn',            href:'https://www.linkedin.com/in/pra-qen-045373402/'},
                ].map(({label,href})=>(
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="block text-xs hover:text-white transition"
                    style={{color:'rgba(255,255,255,0.5)'}}>
                    {label}
                  </a>
                ))}
              </div>

              {/* Support email box */}
              <div className="p-3 rounded-2xl border" style={{backgroundColor:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)'}}>
                <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{color:'rgba(255,255,255,0.3)'}}>Support</p>
                <a href="mailto:support@praqen.com"
                  className="text-xs font-bold hover:text-white transition flex items-center gap-1.5"
                  style={{color:C.gold}}>
                  <Mail size={11}/> support@praqen.com
                </a>
                <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.3)'}}>Response within 24 hours</p>
                <button onClick={()=>document.querySelector('.chat-btn')?.click()}
                  className="text-xs mt-0.5 hover:text-white transition flex items-center gap-1"
                  style={{color:'rgba(255,255,255,0.4)'}}>
                  <MessageCircle size={10}/> Live Chat — Online 24/7
                </button>
              </div>
            </div>
          </div>

          {/* Trust badges row */}
          <div className="flex flex-wrap justify-center gap-5 py-7 border-y" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            {[
              {icon:'🔒', label:'Escrow on every trade'},
              {icon:'💸', label:'0.5% fee — nothing more'},
              {icon:'⚡', label:'< 15 min average trade'},
              {icon:'🌍', label:'180+ countries'},
              {icon:'🛡️', label:'99.8% dispute resolution'},
              {icon:'🕐', label:'24/7 live support'},
            ].map(({icon,label})=>(
              <div key={label} className="flex items-center gap-2 text-xs" style={{color:'rgba(255,255,255,0.4)'}}>
                <span>{icon}</span>{label}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-3">
            <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
              © {new Date().getFullYear()} PRAQEN. All rights reserved. Not financial advice.
            </p>
            <div className="flex items-center gap-1 text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </div>
          </div>
        </div>
      </footer>

      {/* ── LIVE CHAT ──────────────────────────────────────────────────────────── */}
      <LiveChat/>
    </div>
  );
}
