import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocalUser } from '../hooks/useLocalUser';
import {
  Wallet, TrendingUp, Clock, CheckCircle, AlertCircle,
  Star, DollarSign, ArrowRight, Shield, Activity, MapPin,
  Calendar, BadgeCheck, Send, Eye, EyeOff, Bitcoin,
  MessageCircle, Gift, Copy, RefreshCw, Users,
  Medal, Crown, Zap, BarChart3, ChevronRight,
  PlusCircle, X, Link, TrendingDown, Award, Flame,
  UserCheck, UserX, Target, Percent, Lock, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Color palette ─────────────────────────────────────────────────────────────
const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
  online:'#22C55E', purple:'#8B5CF6',
};

// ─── Badge config ──────────────────────────────────────────────────────────────
const BADGES = {
  BEGINNER:   { label:'NEW ✦',     icon:'🌱', bg:'linear-gradient(135deg,#EDE9FE,#F5F3FF)', text:'#7C3AED', borderColor:'#C4B5FD', next:'PRO',        nextLabel:'Pro Trader' },
  PRO:        { label:'PRO',       icon:'●',  bg:'linear-gradient(135deg,#D1FAE5,#A7F3D0)', text:'#065F46', borderColor:'#34D399', next:'EXPERT',     nextLabel:'Expert' },
  EXPERT:     { label:'EXPERT',    icon:'▲',  bg:'linear-gradient(135deg,#1E3A5F,#1E40AF)', text:'#FFFFFF', borderColor:'#3B82F6', next:'AMBASSADOR', nextLabel:'Ambassador' },
  AMBASSADOR: { label:'AMBASSADOR',icon:'◈',  bg:'linear-gradient(135deg,#0D9488,#2D6A4F)', text:'#FFFFFF', borderColor:'#0D9488', next:'LEGEND',     nextLabel:'Legend' },
  LEGEND:     { label:'LEGEND',    icon:'♛',  bg:'linear-gradient(135deg,#FEF3C7,#FDE68A)', text:'#78350F', borderColor:'#F59E0B', next:null,         nextLabel:null },
};

// Badge thresholds — trades needed + referrals needed
const BADGE_THRESHOLDS = {
  PRO:        { trades:10,  referrals:0 },
  EXPERT:     { trades:50,  referrals:3 },
  AMBASSADOR: { trades:500, referrals:25 },
  LEGEND:     { trades:1000, referrals:50 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n, d=2) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc  = (n)     => parseFloat(n||0).toFixed(8);
const fmtPct  = (n)     => `${Math.min(100,Math.max(0,parseFloat(n||0))).toFixed(1)}%`;

const isOnline = (lastSeen) => {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen)) / 1000 < 300; // < 5 min
};

const getStatusBadge = (status) => {
  const map = {
    COMPLETED:    { text:'Completed',       color:C.success, icon:CheckCircle },
    PAID:         { text:'Awaiting Release',color:C.warn,    icon:Clock },
    FUNDS_LOCKED: { text:'Escrow Active',   color:C.paid,    icon:Shield },
    PAYMENT_SENT: { text:'Payment Sent',    color:C.purple,  icon:Send },
    DISPUTED:     { text:'Disputed',        color:C.danger,  icon:AlertCircle },
    CANCELLED:    { text:'Cancelled',       color:C.g400,    icon:X },
  };
  return map[status] || { text:status||'Active', color:C.g400, icon:Clock };
};

const authH = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization:`Bearer ${t}` } : {};
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon:Icon, label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl p-4 border shadow-sm ${onClick?'cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5':''}`}
      style={{borderColor:C.g200}}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:`${color}15`}}>
          <Icon size={16} style={{color}}/>
        </div>
        {onClick && <ChevronRight size={14} style={{color:C.g400}}/>}
      </div>
      <p className="text-xl font-black" style={{color:C.g800}}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{color:C.g500}}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{color:C.g400}}>{sub}</p>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon:Icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={16} style={{color:C.green}}/>
        <h2 className="font-black text-sm" style={{color:C.forest}}>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="text-xs font-bold hover:underline flex items-center gap-1" style={{color:C.green}}>
          {action} <ChevronRight size={11}/>
        </button>
      )}
    </div>
  );
}

// ─── Profile Summary ───────────────────────────────────────────────────────────
function ProfileSummary({ user, profile, stats }) {
  const navigate = useNavigate();
  const badgeKey = (profile?.badge || 'BEGINNER').toUpperCase();
  const badge    = BADGES[badgeKey] || BADGES.BEGINNER;
  const online  = isOnline(profile?.last_seen_at);
  const nextKey = badge.next;
  const thresh  = nextKey ? BADGE_THRESHOLDS[nextKey] : null;
  const tradesProgress   = thresh ? Math.min(1, (stats.totalTrades||0) / thresh.trades) : 1;
  const referralProgress = thresh ? Math.min(1, (stats.totalReferrals||0) / (thresh.referrals||1)) : 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-4" style={{borderColor:C.g200}}>
      {/* Banner */}
      <div className="h-24 relative" style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'20px 20px'}}/>
      </div>

      <div className="px-5 pb-5">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center font-black text-2xl"
              style={{backgroundColor:C.gold, color:C.forest}}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                : (user?.username?.charAt(0)?.toUpperCase()||'?')}
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
              style={{backgroundColor:online?C.online:C.g400}}>
              <div className={`w-2 h-2 rounded-full ${online?'animate-pulse':''}`}
                style={{backgroundColor:online?'#fff':'#fff'}}/>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={()=>navigate('/profile')}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-50 transition"
              style={{borderColor:C.g200, color:C.g600}}>
              Edit Profile
            </button>
            <button onClick={()=>navigate('/create-offer')}
              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition"
              style={{backgroundColor:C.green}}>
              + New Offer
            </button>
          </div>
        </div>

        {/* Name + badge */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h2 className="font-black text-lg" style={{color:C.forest}}>{profile?.username || user?.username}</h2>
          <span className="inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full border"
            style={{background:badge.bg, borderColor:badge.borderColor}}>
            <span style={{color:badge.icon==='♛'?'#92400E':badge.text}}>{badge.icon}</span>
            <span style={{color:badge.text}}>{badge.label}</span>
          </span>
          {profile?.kyc_verified && <BadgeCheck size={16} style={{color:C.paid}} title="KYC Verified"/>}
        </div>

        {/* Online status + meta */}
        <div className="flex flex-wrap gap-3 text-xs mb-4" style={{color:C.g500}}>
          <span className="flex items-center gap-1" style={{color:online?C.online:C.g400}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:online?C.online:C.g400}}/>
            {online ? 'Online now' : 'Offline'}
          </span>
          {user?.created_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11}/>
              Joined {new Date(user.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
            </span>
          )}
          {profile?.country && (
            <span className="flex items-center gap-1"><MapPin size={11}/>{profile.country}</span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            {label:'Trades',   value:fmt(stats.totalTrades||0),                          color:C.green,   icon:null},
            {label:'Rating',   value:`${parseFloat(stats.averageRating||0).toFixed(1)}★`,color:C.amber,   icon:null},
            {label:'Positive', value:fmt(stats.positiveFeedback||0),                     color:C.success, icon:ThumbsUp},
            {label:'Negative', value:fmt(stats.negativeFeedback||0),                     color:C.danger,  icon:ThumbsDown},
          ].map(({label,value,color,icon:Icon})=>(
            <div key={label} className="text-center p-2.5 rounded-xl" style={{backgroundColor:C.g50}}>
              {Icon && (
                <div className="flex justify-center mb-0.5">
                  <Icon size={13} style={{color}}/>
                </div>
              )}
              <p className="font-black text-base" style={{color}}>{value}</p>
              <p className="text-xs font-semibold" style={{color:C.g400}}>{label}</p>
            </div>
          ))}
        </div>

        {/* Next badge progress */}
        {thresh && (
          <div className="p-3 rounded-xl border" style={{backgroundColor:`${C.gold}08`, borderColor:`${C.gold}30`}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black" style={{color:C.g700}}>
                Next: <span style={{color:C.amber}}>{badge.nextLabel} {BADGES[nextKey]?.icon}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              {thresh.trades > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-0.5" style={{color:C.g500}}>
                    <span>Trades</span>
                    <span>{stats.totalTrades||0} / {thresh.trades}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{backgroundColor:C.g200}}>
                    <div className="h-1.5 rounded-full transition-all" style={{width:`${tradesProgress*100}%`, backgroundColor:C.gold}}/>
                  </div>
                </div>
              )}
              {thresh.referrals > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-0.5" style={{color:C.g500}}>
                    <span>Referrals</span>
                    <span>{stats.totalReferrals||0} / {thresh.referrals}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{backgroundColor:C.g200}}>
                    <div className="h-1.5 rounded-full transition-all" style={{width:`${referralProgress*100}%`, backgroundColor:C.purple}}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {!thresh && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{backgroundColor:`${C.gold}12`}}>
            <Crown size={16} style={{color:C.gold}}/>
            <p className="text-xs font-black" style={{color:C.amber}}>You've reached the highest badge — LEGEND! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Affiliate Section — Premium Design ───────────────────────────────────────
function AffiliateSection({ user, profile, earnings, referralData, btcPrice, onWithdraw }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const referralLink = `https://praqen.com/signup?ref=${user?.referral_code || profile?.referral_code || 'PRAQEN'}`;

  const totalEarnings  = referralData?.totalEarned ?? earnings.reduce((s,e)=>s+parseFloat(e.commission_btc||0),0);
  const totalUsd       = totalEarnings * (btcPrice || 0);
  const totalReferrals = referralData?.referralCount ?? new Set(earnings.map(e=>e.referred_user_id)).size;
  const totalTrades    = referralData?.earnings?.length ?? earnings.length;
  const lastEarning    = earnings[0]?.commission_btc||0;

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied! Share it to earn BTC 🚀');
    setTimeout(()=>setCopied(false),2500);
  };

  const SHARE_LINKS = [
    {
      label:'WhatsApp', icon:'💬',
      color:'#25D366', bg:'#F0FFF4',
      url:`https://wa.me/?text=${encodeURIComponent(`Join PRAQEN — Africa's most trusted P2P Bitcoin platform! Use my link to get started: ${referralLink}`)}`,
    },
    {
      label:'Twitter/X', icon:'𝕏',
      color:'#000', bg:'#F8FAFC',
      url:`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Trading Bitcoin the safe way on @praqenapp 🔒 Join me and trade with full escrow protection. Sign up here:`)} ${referralLink}`,
    },
    {
      label:'Telegram', icon:'✈️',
      color:'#0088CC', bg:'#EFF6FF',
      url:`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join PRAQEN — secure P2P Bitcoin trading in Africa!')}`,
    },
  ];

  // Tier milestones
  const TIERS = [
    {trades:1,   label:'Starter',   reward:'0.1%',  color:'#94A3B8' },
    {trades:10,  label:'Active',    reward:'0.15%', color:'#3B82F6' },
    {trades:25,  label:'Builder',   reward:'0.2%',  color:'#10B981' },
    {trades:50,  label:'Champion',  reward:'0.25%', color:'#8B5CF6' },
    {trades:100, label:'Elite',     reward:'0.3%',  color:'#F4A422' },
  ];
  const currentTier = [...TIERS].reverse().find(t=>totalTrades>=t.trades)||TIERS[0];
  const nextTier    = TIERS.find(t=>t.trades>totalTrades);

  return (
    <div className="space-y-4">

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-md relative"
        style={{background:`linear-gradient(135deg,#4C1D95,#6D28D9,#8B5CF6)`}}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'20px 20px'}}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{backgroundColor:'#A78BFA'}}/>

        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-3"
                style={{backgroundColor:'rgba(255,255,255,0.15)', color:'#fff'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"/>
                AFFILIATE PROGRAM
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-1"
                style={{fontFamily:"'Syne',sans-serif"}}>
                Earn BTC for Every<br/>Referral You Make
              </h2>
              <p className="text-white/65 text-xs leading-relaxed">
                Share your link. Your friends sign up and trade. You earn{' '}
                <strong className="text-yellow-300">0.1–0.3% commission</strong> in Bitcoin — instantly, automatically.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
              🚀
            </div>
          </div>

          {/* 3 stat chips */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center p-3 rounded-xl" style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <p className="text-lg mb-0.5">💰</p>
              <p className="font-black text-sm text-white">₿ {fmtBtc(totalEarnings)}</p>
              {btcPrice > 0 && <p className="text-xs" style={{color:'#FDE68A'}}>≈ ${totalUsd.toFixed(2)}</p>}
              <p className="text-xs" style={{color:'rgba(255,255,255,0.55)'}}>Total Earned</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <p className="text-lg mb-0.5">👥</p>
              <p className="font-black text-sm text-white">{fmt(totalReferrals)}</p>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.55)'}}>Referrals</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <p className="text-lg mb-0.5">⚡</p>
              <p className="font-black text-sm text-white">{fmt(totalTrades)}</p>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.55)'}}>Ref. Trades</p>
            </div>
          </div>

          {/* Referral link box */}
          <div>
            <p className="text-xs font-bold text-white/60 mb-1.5 uppercase tracking-wider">Your Referral Link</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{backgroundColor:'rgba(255,255,255,0.12)'}}>
                <span className="text-white/50 text-sm">🔗</span>
                <p className="flex-1 text-xs font-mono text-white/80 truncate">{referralLink}</p>
              </div>
              <button onClick={copy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-xs transition flex-shrink-0"
                style={{backgroundColor:copied?'#10B981':C.gold, color:copied?'#fff':C.forest}}>
                {copied ? <><CheckCircle size={12}/>Copied!</> : <><Copy size={12}/>Copy</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SHARE SECTION ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black" style={{color:C.forest}}>📣 Share Your Link</p>
          <p className="text-xs" style={{color:C.g400}}>Tap to share on any platform</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {SHARE_LINKS.map(({label,icon,color,bg,url})=>(
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition hover:-translate-y-0.5 hover:shadow-sm"
              style={{borderColor:C.g200, backgroundColor:bg}}>
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-xs font-bold" style={{color}}>{label}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl border"
          style={{borderColor:`${C.gold}30`, backgroundColor:`${C.gold}08`}}>
          <Zap size={12} style={{color:C.amber, flexShrink:0}}/>
          <p className="text-xs" style={{color:C.g600}}>
            Commission is credited <strong style={{color:C.amber}}>instantly</strong> in BTC when your referral completes a trade.
          </p>
        </div>
      </div>

      {/* ── COMMISSION TIERS ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black" style={{color:C.forest}}>🏆 Commission Tiers</p>
          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
            style={{backgroundColor:currentTier.color}}>
            {currentTier.label} — {currentTier.reward}
          </span>
        </div>
        <div className="space-y-1.5">
          {TIERS.map((tier,i)=>{
            const active = currentTier.trades===tier.trades;
            const done   = totalTrades>=tier.trades;
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition"
                style={{
                  backgroundColor:active?`${tier.color}15`:done?`${tier.color}08`:C.g50,
                  border:`1px solid ${active?tier.color:done?`${tier.color}30`:C.g100}`,
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{backgroundColor:done||active?tier.color:C.g200}}>
                  {done||active
                    ? <CheckCircle size={12} className="text-white"/>
                    : <span className="text-xs font-black" style={{color:C.g500}}>{tier.trades}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black" style={{color:active?tier.color:done?C.g700:C.g400}}>
                    {tier.label}
                    {active && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full text-white font-bold"
                      style={{backgroundColor:tier.color}}>YOUR TIER</span>}
                  </p>
                  <p className="text-xs" style={{color:C.g400}}>{tier.trades} referral trades</p>
                </div>
                <span className="font-black text-xs flex-shrink-0" style={{color:active?tier.color:done?tier.color:C.g400}}>
                  {tier.reward}
                </span>
              </div>
            );
          })}
        </div>
        {nextTier && (
          <div className="mt-3 p-2.5 rounded-xl border"
            style={{borderColor:`${nextTier.color}30`, backgroundColor:`${nextTier.color}08`}}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{color:C.g500}}>Progress to <strong style={{color:nextTier.color}}>{nextTier.label}</strong></span>
              <span style={{color:nextTier.color}}>{totalTrades}/{nextTier.trades} trades</span>
            </div>
            <div className="h-2 rounded-full" style={{backgroundColor:C.g200}}>
              <div className="h-2 rounded-full transition-all"
                style={{width:`${Math.min(100,(totalTrades/nextTier.trades)*100)}%`, backgroundColor:nextTier.color}}/>
            </div>
          </div>
        )}
      </div>

      {/* ── WITHDRAWAL ──────────────────────────────────────────────── */}
      {btcPrice > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
          <p className="text-xs font-black mb-3" style={{color:C.forest}}>💸 Withdraw Earnings</p>
          <div className="flex justify-between text-xs mb-1">
            <span style={{color:C.g500}}>Progress to $10.00 minimum</span>
            <span className="font-bold" style={{color:C.forest}}>${totalUsd.toFixed(2)} / $10.00</span>
          </div>
          <div className="w-full rounded-full h-2.5 mb-3" style={{backgroundColor:C.g200}}>
            <div className="h-2.5 rounded-full transition-all"
              style={{width:`${Math.min(100,(totalUsd/10)*100)}%`, backgroundColor:C.success}}/>
          </div>
          <button
            onClick={onWithdraw}
            disabled={totalUsd < 10}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: totalUsd >= 10 ? C.forest : C.g400}}>
            {totalUsd >= 10
              ? `💰 Withdraw ₿ ${fmtBtc(totalEarnings)} to Wallet`
              : `⏳ Need $${(10 - totalUsd).toFixed(2)} more to withdraw`}
          </button>
        </div>
      )}

      {/* ── PEOPLE YOU REFERRED ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{borderColor:C.g100, backgroundColor:`${C.purple}08`}}>
          <div className="flex items-center gap-2">
            <Users size={14} style={{color:C.purple}}/>
            <p className="text-xs font-black" style={{color:C.forest}}>People You Referred</p>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
            style={{backgroundColor:C.purple}}>
            {totalReferrals} total
          </span>
        </div>
        {!referralData?.referredUsers?.length ? (
          <div className="p-6 text-center">
            <p className="text-2xl mb-2">👥</p>
            <p className="text-sm font-black mb-1" style={{color:C.forest}}>No referrals yet</p>
            <p className="text-xs" style={{color:C.g400}}>Share your link to start earning!</p>
          </div>
        ) : (
          <div className="divide-y max-h-64 overflow-y-auto" style={{borderColor:C.g50}}>
            {referralData.referredUsers.map((ru, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                  style={{backgroundColor:C.purple}}>
                  {ru.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black" style={{color:C.forest}}>{ru.username}</p>
                  <p className="text-xs" style={{color:C.g400}}>
                    {ru.total_trades || 0} trades
                    {ru.joined_at && ` · Joined ${new Date(ru.joined_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-xs" style={{color:C.success}}>+₿ {fmtBtc(ru.total_earned)}</p>
                  {btcPrice > 0 && (
                    <p className="text-xs" style={{color:C.g400}}>≈ ${(ru.total_earned * btcPrice).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RECENT EARNINGS ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{borderColor:C.g100, backgroundColor:`${C.success}08`}}>
          <div className="flex items-center gap-2">
            <Bitcoin size={14} style={{color:C.success}}/>
            <p className="text-xs font-black" style={{color:C.forest}}>Recent Earnings</p>
          </div>
          {totalEarnings > 0 && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
              style={{backgroundColor:C.success}}>
              ₿ {fmtBtc(totalEarnings)} total
            </span>
          )}
        </div>
        {earnings.length===0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-sm font-black mb-1" style={{color:C.forest}}>No earnings yet</p>
            <p className="text-xs mb-4" style={{color:C.g400}}>Share your referral link to start earning BTC commissions.</p>
            <button onClick={copy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white"
              style={{backgroundColor:C.purple}}>
              <Copy size={12}/>Copy Referral Link
            </button>
          </div>
        ) : (
          <div className="divide-y max-h-56 overflow-y-auto" style={{borderColor:C.g50}}>
            {earnings.slice(0,10).map((e,i)=>(
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{backgroundColor:`${C.success}12`}}>
                  <Bitcoin size={14} style={{color:C.success}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black" style={{color:C.forest}}>
                    Commission Earned
                  </p>
                  <p className="text-xs font-mono" style={{color:C.g400}}>
                    #{String(e.trade_id||'').slice(0,10).toUpperCase()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-xs" style={{color:C.success}}>+{fmtBtc(e.commission_btc)} BTC</p>
                  {e.created_at && (
                    <p className="text-xs" style={{color:C.g400}}>
                      {new Date(e.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short'})}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Withdraw Modal ────────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }) {
  const [address, setAddress] = useState('');
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!address.trim()) { toast.error('Enter a Bitcoin address'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (parseFloat(amount) > balance) { toast.error('Insufficient balance'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/wallet/withdraw`, { address, amount }, { headers:authH() });
      toast.success('Withdrawal request submitted!');
      onSuccess();
    } catch (e) { toast.error(e.response?.data?.error||'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:C.g100}}>
          <div className="flex items-center gap-2">
            <Bitcoin size={15} style={{color:C.gold}}/>
            <h3 className="font-black text-sm" style={{color:C.forest}}>Withdraw Bitcoin</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100"
            style={{color:C.g500}}><X size={14}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{color:C.g700}}>Bitcoin Address</label>
            <input value={address} onChange={e=>setAddress(e.target.value)}
              placeholder="bc1q..."
              className="w-full px-3 py-2.5 text-xs border-2 rounded-xl font-mono focus:outline-none"
              style={{borderColor:address?C.green:C.g200}}/>
          </div>
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{color:C.g700}}>Amount (BTC)</label>
            <div className="relative">
              <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" step="0.00000001"
                placeholder="0.00000000"
                className="w-full pl-3 pr-24 py-2.5 text-xs border-2 rounded-xl focus:outline-none"
                style={{borderColor:amount?C.green:C.g200}}/>
              <button onClick={()=>setAmount(balance.toFixed(8))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg"
                style={{backgroundColor:`${C.green}15`, color:C.green}}>MAX</button>
            </div>
            <p className="text-xs mt-1" style={{color:C.g400}}>Available: {fmtBtc(balance)} BTC</p>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{backgroundColor:'#FEF9C3'}}>
            <AlertCircle size={12} style={{color:C.warn, flexShrink:0, marginTop:1}}/>
            <p className="text-xs" style={{color:'#854D0E'}}>Double-check the address. Withdrawals are irreversible.</p>
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            style={{backgroundColor:C.green}}>
            {loading ? <><RefreshCw size={14} className="animate-spin"/>Processing…</> : <>Withdraw <Send size={14}/></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const displayUser = useLocalUser(user);

  const [profile, setProfile]       = useState(null);
  const [stats, setStats]           = useState({
    totalTrades:0, completedTrades:0, pendingTrades:0,
    totalVolume:0, activeListings:0, totalReferrals:0,
    totalFeedback:0, positiveFeedback:0, negativeFeedback:0,
  });
  const [recentTrades, setRecentTrades]   = useState([]);
  const [activeTrades, setActiveTrades]   = useState([]);
  const [earnings, setEarnings]           = useState([]);
  const [referralData, setReferralData]   = useState(null);
  const [btcPrice, setBtcPrice]           = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showBalance, setShowBalance]     = useState(true);
  const [showWithdraw, setShowWithdraw]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState(false);
  const [activeTab, setActiveTab]         = useState('overview');
  const [lastRefresh, setLastRefresh]     = useState(null);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  const applyUserData = (userData) => {
    setProfile(userData);
    setStats({
      totalTrades: userData.total_trades || 0,
      positiveFeedback: userData.positive_feedback || 0,
      negativeFeedback: userData.negative_feedback || 0,
      averageRating: userData.average_rating || 0,
      totalVolume: (userData.total_trades || 0) * 100,
      completionRate: userData.completion_rate || 100,
      rating: userData.average_rating || 0,
      referralCode: userData.referral_code || '',
      totalReferrals: userData.total_referrals || 0,
      referralEarnings: userData.referral_earnings_btc || 0,
      badge: userData.badge || 'BEGINNER'
    });
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoadError(false);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
      });
      applyUserData(response.data.user);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      if (!silent) setLoadError(true);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/users/heartbeat`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
      await loadDashboardData(true);
      await fetchWalletBalance();
      await fetchReferralData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchReferralData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/referral/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setReferralData(res.data);
    } catch (e) { /* silent */ }
  };

  const fetchBtcPrice = async () => {
    try {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      const data = await res.json();
      setBtcPrice(parseFloat(data.data.amount));
    } catch (e) { /* silent */ }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_URL}/hd-wallet/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bal = parseFloat(res.data?.balance_btc || 0);
      setWalletBalance(bal);
      localStorage.setItem('praqen_btc_balance', bal.toString());
    } catch (e) { /* silent */ }
  };

  const handleReferralWithdraw = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/referral/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'Withdrawal submitted!');
      fetchReferralData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    }
  };

  // Seed instantly from user prop (already fetched by App.js) — no API call needed
  useEffect(() => {
    if (user) {
      applyUserData(user);
      setLoading(false);
      // Background refresh + heartbeat so user shows as online immediately
      const token = localStorage.getItem('token');
      if (token) {
        axios.post(`${API_URL}/users/heartbeat`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      loadDashboardData(true);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchReferralData();
    fetchBtcPrice();
    fetchWalletBalance();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60s — heartbeat keeps user online, silent so no spinner flicker
  useEffect(() => {
    const iv = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.post(`${API_URL}/users/heartbeat`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      loadDashboardData(true);
      fetchWalletBalance();
    }, 60000);
    return () => clearInterval(iv);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{borderColor:C.sage, borderTopColor:'transparent'}}/>
        <p className="text-sm font-semibold" style={{color:C.green}}>Loading dashboard…</p>
      </div>
    </div>
  );

  if (loadError && !profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center px-6">
        <p className="text-4xl mb-3">📡</p>
        <p className="font-black text-sm mb-2" style={{color:C.g800}}>Could not load dashboard</p>
        <p className="text-xs mb-5" style={{color:C.g500}}>Check your connection and make sure the backend is running.</p>
        <button onClick={() => loadDashboardData(false)}
          className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
          style={{backgroundColor:C.green}}>
          Try Again
        </button>
      </div>
    </div>
  );

  const TABS = [
    {id:'overview',  label:'Overview',  icon:BarChart3},
    {id:'trades',    label:'Trades',    icon:Activity},
    {id:'wallet',    label:'Wallet',    icon:Wallet},
    {id:'affiliate', label:'Affiliate', icon:Users},
  ];

  return (
    <div className="min-h-screen pb-10" style={{backgroundColor:C.mist, fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      {/* Top bar */}
      <div className="border-b bg-white sticky top-0 z-30" style={{borderColor:C.g200}}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-black text-base" style={{color:C.forest, fontFamily:"'Syne',sans-serif"}}>
              Dashboard
            </h1>
            {lastRefresh && (
              <p className="text-xs flex items-center gap-1" style={{color:C.online}}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor:C.online}}/>
                Online · Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition disabled:opacity-60"
            style={{
              borderColor: isRefreshing ? C.online : C.g200,
              color: isRefreshing ? C.online : C.g600,
              backgroundColor: isRefreshing ? `${C.online}10` : 'transparent',
            }}>
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''}/>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {TABS.map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition"
              style={{
                color:       activeTab===id ? C.green     : C.g500,
                borderColor: activeTab===id ? C.green     : 'transparent',
                backgroundColor: activeTab===id ? `${C.green}06` : 'transparent',
              }}>
              <Icon size={12}/>{label}
              {id==='trades' && stats.pendingTrades > 0 && (
                <span className="w-4 h-4 rounded-full text-white text-xs font-black flex items-center justify-center"
                  style={{backgroundColor:C.danger}}>{stats.pendingTrades}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── ONLINE STATUS BANNER ──────────────────────────────────────────────── */}
      <div className="border-b" style={{borderColor:C.g100, backgroundColor: isRefreshing ? `${C.online}08` : lastRefresh ? `${C.online}05` : `${C.warn}05`}}>
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isRefreshing ? (
              <>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:C.online}}/>
                <span className="text-xs font-bold" style={{color:C.online}}>Syncing data…</span>
              </>
            ) : lastRefresh ? (
              <>
                <span className="w-2 h-2 rounded-full" style={{backgroundColor:C.online}}/>
                <span className="text-xs font-bold" style={{color:C.online}}>Active &amp; Online</span>
                <span className="text-xs" style={{color:C.g400}}>· Last synced {lastRefresh.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full" style={{backgroundColor:C.warn}}/>
                <span className="text-xs font-bold" style={{color:C.warn}}>Tap Refresh to go Online</span>
              </>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition disabled:opacity-50"
            style={{
              backgroundColor: isRefreshing ? `${C.online}20` : `${C.online}15`,
              color: C.online,
            }}>
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''}/>
            {isRefreshing ? 'Syncing' : 'Refresh Now'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">

        {/* Profile always visible */}
        <ProfileSummary user={displayUser||user} profile={profile} stats={stats}/>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab==='overview' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Activity}   label="Total Trades"    value={fmt(stats.totalTrades)}     color={C.green}   onClick={()=>setActiveTab('trades')}/>
              <StatCard icon={CheckCircle}label="Completed"       value={fmt(stats.completedTrades)} color={C.success} sub={`${stats.totalTrades>0?Math.round(stats.completedTrades/stats.totalTrades*100):0}% completion`}/>
              <StatCard icon={Clock}      label="Pending"         value={fmt(stats.pendingTrades)}   color={C.warn}    onClick={()=>setActiveTab('trades')}/>
              <StatCard icon={DollarSign} label="Volume Traded"   value={`$${fmt(stats.totalVolume,0)}`} color={C.paid}/>
            </div>

            {/* Active trades + Quick actions row */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Active trades */}
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
                <div className="px-4 py-3 border-b" style={{borderColor:C.g100}}>
                  <SectionHeader icon={Zap} title="Active Trades" action={activeTrades.length>0?'View All':undefined} onAction={()=>setActiveTab('trades')}/>
                </div>
                {activeTrades.length===0 ? (
                  <div className="p-8 text-center">
                    <Shield size={32} className="mx-auto mb-2 opacity-20" style={{color:C.g400}}/>
                    <p className="text-xs" style={{color:C.g400}}>No active trades right now</p>
                    <button onClick={()=>navigate('/buy-bitcoin')}
                      className="mt-3 px-4 py-2 rounded-xl text-white text-xs font-bold"
                      style={{backgroundColor:C.green}}>
                      Browse Offers →
                    </button>
                  </div>
                ) : activeTrades.map(trade=>{
                  const s = getStatusBadge(trade.status);
                  const SI = s.icon;
                  return (
                    <div key={trade.id} onClick={()=>navigate(`/trade/${trade.id}`)}
                      className="flex items-center gap-3 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition"
                      style={{borderColor:C.g50}}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{backgroundColor:`${s.color}15`}}>
                        <SI size={14} style={{color:s.color}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black" style={{color:C.forest}}>#{trade.id?.slice(0,8).toUpperCase()}</p>
                        <p className="text-xs" style={{color:C.g500}}>{s.text}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black" style={{color:C.forest}}>{fmtBtc(trade.amount_btc)} BTC</p>
                        <p className="text-xs" style={{color:C.g400}}>${fmt(trade.amount_usd,0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
                  <SectionHeader icon={Zap} title="Quick Actions"/>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {label:'Buy BTC',      icon:Bitcoin,    color:C.gold,    route:'/buy-bitcoin'},
                      {label:'Sell BTC',     icon:TrendingUp, color:C.amber,   route:'/sell-bitcoin'},
                      {label:'Create Offer', icon:PlusCircle, color:C.green,   route:'/create-offer'},
                      {label:'My Trades',    icon:Activity,   color:C.paid,    action:()=>setActiveTab('trades')},
                      {label:'My Offers',    icon:Gift,       color:C.purple,  route:'/my-listings'},
                      {label:'Withdraw',     icon:Send,       color:C.danger,  action:()=>setShowWithdraw(true)},
                    ].map(({label,icon:Icon,color,route,action})=>(
                      <button key={label} onClick={action||(()=>navigate(route))}
                        className="flex items-center gap-2.5 p-3 rounded-xl border hover:shadow-sm transition text-left"
                        style={{borderColor:C.g100}}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{backgroundColor:`${color}15`}}>
                          <Icon size={14} style={{color}}/>
                        </div>
                        <span className="text-xs font-bold" style={{color:C.g700}}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* My offers count */}
                <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between"
                  style={{borderColor:C.g200}}>
                  <div className="flex items-center gap-2">
                    <Gift size={14} style={{color:C.purple}}/>
                    <div>
                      <p className="text-xs font-black" style={{color:C.forest}}>Active Listings</p>
                      <p className="text-xs" style={{color:C.g400}}>Live on marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black" style={{color:C.purple}}>{stats.activeListings}</span>
                    <button onClick={()=>navigate('/create-offer')}
                      className="px-2.5 py-1.5 rounded-xl text-white text-xs font-bold"
                      style={{backgroundColor:C.purple}}>
                      + New
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── LAST VISITED ─────────────────────────────────────────────────────── */}
        {activeTab==='overview' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
            <div className="px-4 py-3 border-b" style={{borderColor:C.g100}}>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{color:C.paid}}/>
                <h2 className="font-black text-sm" style={{color:C.forest}}>Last Visited Pages</h2>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {label:'Buy Bitcoin',    icon:'₿',  route:'/buy-bitcoin',  color:C.gold,    sub:'Marketplace'},
                {label:'Sell Bitcoin',   icon:'💰', route:'/sell-bitcoin', color:C.amber,   sub:'Marketplace'},
                {label:'Create Offer',   icon:'➕', route:'/create-offer', color:C.green,   sub:'5-step wizard'},
                {label:'Trade Chat',     icon:'💬', route:'/my-trades',    color:C.paid,    sub:'Active trades'},
                {label:'Profile',        icon:'👤', route:'/profile',      color:C.purple,  sub:'Your settings'},
                {label:'My Listings',    icon:'📋', route:'/my-listings',  color:C.success, sub:'Your offers'},
                {label:'Affiliate',      icon:'🚀', tab:'affiliate',       color:'#8B5CF6', sub:'Earn BTC'},
                {label:'Wallet',         icon:'👜', tab:'wallet',          color:C.mint,    sub:'BTC balance'},
              ].map(({label,icon,route,tab,color,sub})=>(
                <button key={label}
                  onClick={()=>{ tab ? setActiveTab(tab) : navigate(route); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl border hover:shadow-sm transition hover:-translate-y-0.5 text-left"
                  style={{borderColor:C.g100}}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{backgroundColor:`${color}15`}}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate" style={{color:C.forest}}>{label}</p>
                    <p className="text-xs" style={{color:C.g400}}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TRADES TAB ────────────────────────────────────────────────────── */}
        {activeTab==='trades' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
            <div className="px-5 py-4 border-b" style={{borderColor:C.g100}}>
              <SectionHeader icon={Activity} title="All My Trades"/>
              <div className="flex gap-3 text-xs mt-2">
                {[
                  {label:`${stats.completedTrades} Completed`, color:C.success},
                  {label:`${stats.pendingTrades} Pending`,     color:C.warn},
                  {label:`${stats.totalTrades} Total`,         color:C.paid},
                ].map(({label,color})=>(
                  <span key={label} className="font-bold" style={{color}}>{label}</span>
                ))}
              </div>
            </div>
            {recentTrades.length===0 ? (
              <div className="p-10 text-center">
                <Activity size={36} className="mx-auto mb-3 opacity-20" style={{color:C.g400}}/>
                <p className="text-sm font-semibold" style={{color:C.g500}}>No trades yet</p>
                <button onClick={()=>navigate('/buy-bitcoin')}
                  className="mt-3 px-5 py-2 rounded-xl text-white text-xs font-bold"
                  style={{backgroundColor:C.green}}>
                  Start Your First Trade
                </button>
              </div>
            ) : recentTrades.map(trade=>{
              const s  = getStatusBadge(trade.status);
              const SI = s.icon;
              const isBuyer = trade.buyer_id === user?.id;
              return (
                <div key={trade.id} onClick={()=>navigate(`/trade/${trade.id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b hover:bg-gray-50 cursor-pointer transition"
                  style={{borderColor:C.g50}}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{backgroundColor:`${isBuyer?C.green:C.amber}15`}}>
                    <Bitcoin size={15} style={{color:isBuyer?C.green:C.amber}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black" style={{color:C.forest}}>#{trade.id?.slice(0,8).toUpperCase()}</p>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:isBuyer?C.green:C.amber}}>
                        {isBuyer?'BUYING':'SELLING'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{color:C.g400}}>
                      {new Date(trade.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black" style={{color:C.forest}}>{fmtBtc(trade.amount_btc)} BTC</p>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{backgroundColor:s.color}}>
                      <SI size={9} className="inline mr-0.5"/>{s.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── WALLET TAB ────────────────────────────────────────────────────── */}
        {activeTab==='wallet' && (
          <div className="space-y-4">
            {/* Balance card */}
            <div className="rounded-2xl text-white p-6 shadow-lg"
              style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-xs mb-1">Available Balance</p>
                  <div className="flex items-center gap-2">
                    {showBalance
                      ? <p className="text-3xl font-black">₿ {fmtBtc(walletBalance)}</p>
                      : <p className="text-3xl font-black">•••••••• BTC</p>}
                    <button onClick={()=>setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                      {showBalance ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {showBalance && btcPrice > 0 && (
                    <p className="text-white/70 text-sm mt-1">
                      ≈ ${fmt(walletBalance * btcPrice, 2)} USD
                    </p>
                  )}
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
                  <Bitcoin size={28} style={{color:C.gold}}/>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setShowWithdraw(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
                  style={{backgroundColor:C.gold, color:C.forest}}>
                  <Send size={14}/> Withdraw
                </button>
                <button onClick={()=>navigate('/wallet')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border hover:bg-white/10 transition"
                  style={{borderColor:'rgba(255,255,255,0.3)', color:C.white}}>
                  <Wallet size={14}/> Full Wallet
                </button>
              </div>
            </div>

            {/* Wallet stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={TrendingUp} label="Total Volume"  value={`$${fmt(stats.totalVolume,0)}`}         color={C.success}/>
              <StatCard icon={CheckCircle}label="Completed"     value={fmt(stats.completedTrades)}              color={C.paid}/>
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl border p-4 flex items-start gap-3" style={{borderColor:C.g200}}>
              <Lock size={14} style={{color:C.green, flexShrink:0, marginTop:2}}/>
              <div>
                <p className="text-xs font-black mb-0.5" style={{color:C.forest}}>How your wallet works</p>
                <p className="text-xs leading-relaxed" style={{color:C.g500}}>
                  When you sell Bitcoin, funds are held in escrow until the buyer confirms payment.
                  Once confirmed, Bitcoin is released to your wallet. Withdrawals are processed within 30 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── AFFILIATE TAB ─────────────────────────────────────────────────── */}
        {activeTab==='affiliate' && (
          <AffiliateSection user={displayUser} profile={profile} earnings={earnings} referralData={referralData} btcPrice={btcPrice} onWithdraw={handleReferralWithdraw}/>
        )}

      </div>

      {/* ── DASHBOARD FOOTER ──────────────────────────────────────────────────── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">

          {/* Top row */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xl"
                  style={{backgroundColor:C.gold, color:C.forest}}>P</div>
                <span className="text-white font-black text-lg" style={{fontFamily:"'Syne',sans-serif"}}>PRAQEN</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.45)'}}>
                Africa's most trusted peer-to-peer Bitcoin trading platform. Escrow-protected. Fast. Honest.
              </p>
              {/* Social icons */}
              <div className="flex gap-2 flex-wrap">
                {/* Twitter / X */}
                <a href="https://x.com/praqenapp?s=21" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-sm font-black text-white"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  𝕏
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr"
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  📸
                </a>
                {/* LinkedIn */}
                <a href="https://www.linkedin.com/in/pra-qen-045373402/"
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  💼
                </a>
                {/* WhatsApp Community */}
                <a href="https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t"
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  💬
                </a>
                {/* Discord */}
                <a href="https://discord.gg/V6zCZxfdy"
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base"
                  style={{backgroundColor:'rgba(88,101,242,0.35)'}}>
                  🎮
                </a>
              </div>
            </div>

            {/* Trade links */}
            <div>
              <p className="text-white font-black text-sm mb-3">Trade</p>
              <div className="space-y-2">
                {[
                  {label:'Buy Bitcoin',   route:'/buy-bitcoin'},
                  {label:'Sell Bitcoin',  route:'/sell-bitcoin'},
                  {label:'Create Offer',  route:'/create-offer'},
                  {label:'My Trades',     tab:'trades'},
                  {label:'My Offers',     route:'/my-listings'},
                ].map(({label,route,tab})=>(
                  <button key={label}
                    onClick={()=>{ if(tab){setActiveTab(tab)} else navigate(route); }}
                    className="block text-xs hover:text-white transition text-left"
                    style={{color:'rgba(255,255,255,0.45)'}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Community + support */}
            <div>
              <p className="text-white font-black text-sm mb-3">Community & Support</p>
              <div className="space-y-2">
                {[
                  {label:'💬 WhatsApp Community', href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'},
                  {label:'🎮 Discord Server',     href:'https://discord.gg/V6zCZxfdy'},
                  {label:'𝕏 Follow on Twitter/X', href:'https://x.com/praqenapp?s=21'},
                  {label:'📸 Instagram',           href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr'},
                  {label:'💼 LinkedIn',             href:'https://www.linkedin.com/in/pra-qen-045373402/'},
                  {label:'📧 support@praqen.com',   href:'mailto:support@praqen.com'},
                ].map(({label,href})=>(
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="block text-xs hover:text-white transition"
                    style={{color:'rgba(255,255,255,0.45)'}}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-5 border-t"
            style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
              © {new Date().getFullYear()} PRAQEN. All rights reserved. Built with honesty.
            </p>
            <p className="text-xs flex items-center gap-1.5" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={11}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>

      {/* Withdraw modal */}
      {showWithdraw && (
        <WithdrawModal
          balance={walletBalance}
          onClose={()=>setShowWithdraw(false)}
          onSuccess={()=>{ setShowWithdraw(false); loadDashboardData(true); }}
        />
      )}
    </div>
  );
}
