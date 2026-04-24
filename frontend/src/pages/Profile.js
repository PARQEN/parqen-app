import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../App';
import { supabase } from '../lib/supabaseClient';
import ProfileFlag from '../components/ProfileFlag';
import CountryFlag from '../components/CountryFlag';
import {
  Star, MapPin, Calendar, Award, Shield, CheckCircle,
  Users, Clock, MessageCircle, Camera, Copy, Globe,
  Zap, Medal, Crown, RefreshCw, Edit2, Save, X,
  BadgeCheck, AlertTriangle, TrendingUp, Lock,
  ChevronRight, Phone, Mail, FileText, ThumbsUp,
  ThumbsDown, Target, Smartphone, Info, ArrowRight,
  Bitcoin, Flame, Eye, Settings
} from 'lucide-react';
import { toast } from 'react-toastify';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
  online:'#22C55E', purple:'#8B5CF6',
};

const BADGE_DEFS = [
  { id:'verified_identity', label:'Verified Identity', icon:'🪪', color:'#3B82F6', bg:'#EFF6FF',
    desc:'Completed full KYC identity verification.', check:(u)=>!!(u?.kyc_verified||u?.is_id_verified) },
  { id:'top_trader', label:'Top Trader', icon:'🏆', color:'#F4A422', bg:'#FFFBEB',
    desc:'Completed 100+ successful trades.', check:(u)=>parseInt(u?.total_trades||0)>=100 },
  { id:'high_volume', label:'High Volume', icon:'📈', color:'#10B981', bg:'#ECFDF5',
    desc:'Traded over $10,000 in total volume.', check:(u)=>parseInt(u?.total_trades||0)*100>=10000 },
  { id:'fast_responder', label:'Fast Responder', icon:'⚡', color:'#8B5CF6', bg:'#F5F3FF',
    desc:'Average reply time under 5 minutes.', check:(u)=>parseInt(u?.avg_reply_minutes||99)<5 },
  { id:'trusted_seller', label:'Trusted Seller', icon:'🔒', color:'#EF4444', bg:'#FEF2F2',
    desc:'98%+ positive feedback with 20+ trades.', check:(u)=>parseInt(u?.total_trades||0)>=20&&parseFloat(u?.completion_rate||0)>=98 },
  { id:'veteran', label:'Veteran Trader', icon:'🎖️', color:'#6D28D9', bg:'#F5F3FF',
    desc:'Account older than 1 year.', check:(u)=>u?.created_at&&(Date.now()-new Date(u.created_at))/(1000*60*60*24*365)>=1 },
];

const FLAGS = {GH:'🇬🇭',NG:'🇳🇬',KE:'🇰🇪',ZA:'🇿🇦',UG:'🇺🇬',TZ:'🇹🇿',US:'🇺🇸',GB:'🇬🇧',EU:'🇪🇺',CM:'🇨🇲',SN:'🇸🇳'};
const fmt    = (n,d=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtAge = (d)=>{
  if(!d)return'Recently';
  const diff=Math.floor((Date.now()-new Date(d))/(1000*60*60*24));
  if(diff<1)return'Today';if(diff<30)return`${diff}d ago`;
  if(diff<365)return`${Math.floor(diff/30)}mo ago`;return`${Math.floor(diff/365)}y ago`;
};

function calcTrust(u,reviews){
  let s=0;
  if(u?.is_email_verified||u?.email_verified)s+=10;
  if(u?.is_phone_verified||u?.phone_verified)s+=15;
  if(u?.kyc_verified||u?.is_id_verified)s+=15;
  s+=Math.min(30,Math.floor(parseInt(u?.total_trades||0)/2));
  s+=Math.floor(parseFloat(u?.average_rating||0)/5*20);
  if(u?.created_at)s+=Math.min(10,Math.floor((Date.now()-new Date(u.created_at))/(1000*60*60*24*36)));
  return Math.min(100,s);
}
const trustLvl=(s)=>s>=71?{label:'High Trust',color:C.success,bg:'#ECFDF5'}:s>=41?{label:'Medium Trust',color:C.warn,bg:'#FFFBEB'}:{label:'Low Trust',color:C.danger,bg:'#FEF2F2'};

const TIERS=[
  {label:'Basic',    limit:500,   color:C.g400,  requires:[]},
  {label:'Standard', limit:2000,  color:C.paid,  requires:['email','phone']},
  {label:'Advanced', limit:10000, color:C.success,requires:['email','phone','kyc']},
  {label:'VIP',      limit:50000, color:C.gold,  requires:['email','phone','kyc','50trades']},
];
function getTier(u){
  const e=!!(u?.is_email_verified||u?.email_verified),p=!!(u?.is_phone_verified||u?.phone_verified),k=!!(u?.kyc_verified||u?.is_id_verified),t=parseInt(u?.total_trades||0);
  if(e&&p&&k&&t>=50)return 3;if(e&&p&&k)return 2;if(e&&p)return 1;return 0;
}

function VerifRow({icon:Icon,label,desc,status,color,onVerify}){
  const cfg={verified:{text:'Verified',bg:'#ECFDF5',tc:C.success,Ic:CheckCircle},pending:{text:'Pending',bg:'#FFFBEB',tc:C.warn,Ic:Clock},not_submitted:{text:'Not Submitted',bg:'#FEF2F2',tc:C.danger,Ic:AlertTriangle}};
  const c=cfg[status]||cfg.not_submitted; const Ic=c.Ic;
  return(
    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{borderColor:C.g100}}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:`${color}15`}}>
        <Icon size={16} style={{color}}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black" style={{color:C.forest}}>{label}</p>
        <p className="text-xs" style={{color:C.g400}}>{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full" style={{backgroundColor:c.bg,color:c.tc}}>
          <Ic size={10}/>{c.text}
        </span>
        {status!=='verified'&&onVerify&&<button onClick={onVerify} className="text-xs font-black px-2.5 py-1 rounded-xl text-white" style={{backgroundColor:C.green}}>Verify</button>}
      </div>
    </div>
  );
}

export default function Profile({userId:propUserId}){
  const {id:urlId}=useParams(); const navigate=useNavigate(); const fileRef=useRef(null);
  const userId=urlId||propUserId;
  const [user,setUser]=useState(null); const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true); const [tab,setTab]=useState('overview');
  const [uploading,setUploading]=useState(false); const [own,setOwn]=useState(false);
  const [editing,setEditing]=useState(false); const [saving,setSaving]=useState(false);
  const [badges,setBadges]=useState([]);
  const [form,setForm]=useState({username:'',full_name:'',bio:'',location:'Ghana',website:''});

  useEffect(()=>{
    if(!userId){const cu=JSON.parse(localStorage.getItem('user')||'{}');cu.id?navigate(`/profile/${cu.id}`):navigate('/login');return;}
    const cu=JSON.parse(localStorage.getItem('user')||'{}'); setOwn(cu.id===userId);
  },[userId]);
  useEffect(()=>{if(userId)load();},[userId,own]);

  const load=async()=>{
    setLoading(true);
    try{
      const tk=localStorage.getItem('token');
      if(own){
        const r=await axios.get(`${API_URL}/users/profile`,{headers:{Authorization:`Bearer ${tk}`}});
        const u=r.data.user; setUser(u); localStorage.setItem('user',JSON.stringify(u));
        setForm({username:u.username||'',full_name:u.full_name||'',bio:u.bio||'',location:u.location||'Ghana',website:u.website||''});
      } else {
        const r=await axios.get(`${API_URL}/users/${userId}`);
        setUser(r.data.user); setReviews(r.data.reviews||[]);
      }

      // Fetch badges using logged-in user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.id === userId) {
        const { data: badgesData, error } = await supabase
          .from('user_badges')
          .select('badge_name, is_unlocked')
          .eq('user_id', currentUser.id);
        if (!error) {
          setBadges(badgesData || []);
        }
      }
    }catch(e){toast.error('Failed to load profile');}
    finally{setLoading(false);}
  };

  const upload=async(e)=>{
    const f=e.target.files[0]; if(!f||!f.type.startsWith('image/'))return;
    if(f.size>2*1024*1024){toast.error('Image must be under 2MB');return;}
    setUploading(true);
    try{
      const b64=await new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.onerror=rej;rd.readAsDataURL(f);});
      const tk=localStorage.getItem('token');
      const r=await axios.post(`${API_URL}/users/upload-avatar`,{image:b64,userId},{headers:{Authorization:`Bearer ${tk}`}});
      if(r.data.success){const url=r.data.avatar_url;if(url){setUser(p=>({...p,avatar_url:url}));const cu=JSON.parse(localStorage.getItem('user')||'{}');cu.avatar_url=url;localStorage.setItem('user',JSON.stringify(cu));window.dispatchEvent(new Event('userUpdated'));}toast.success('Photo updated!');}
    }catch(e){toast.error('Upload failed');}
    finally{setUploading(false);if(fileRef.current)fileRef.current.value='';}
  };

  const saveProfile=async(e)=>{
    e.preventDefault();setSaving(true);
    try{
      const tk=localStorage.getItem('token');
      const r=await axios.put(`${API_URL}/users/profile`,form,{headers:{Authorization:`Bearer ${tk}`}});
      if(r.data.success){const u=r.data.user||{...user,...form};setUser(u);const cu=JSON.parse(localStorage.getItem('user')||'{}');Object.assign(cu,form);localStorage.setItem('user',JSON.stringify(cu));window.dispatchEvent(new Event('userUpdated'));toast.success('Profile updated!');setEditing(false);}
    }catch(e){toast.error('Update failed');}
    finally{setSaving(false);}
  };

  if(loading)return(<div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}><div className="w-12 h-12 border-4 rounded-full animate-spin" style={{borderColor:C.sage,borderTopColor:'transparent'}}/></div>);
  if(!user)return(<div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}><div className="text-center"><p className="text-sm mb-4" style={{color:C.g500}}>Profile not found</p><button onClick={()=>navigate('/buy-bitcoin')} className="px-5 py-2 rounded-xl text-white font-bold" style={{backgroundColor:C.green}}>Go Home</button></div></div>);

  const flag=FLAGS[user.country?.toUpperCase()]||'🌍';
  const score=calcTrust(user,reviews); const trust=trustLvl(score);
  const tierIdx=getTier(user); const tier=TIERS[tierIdx]; const nextTier=TIERS[tierIdx+1];
  const emailOk=!!(user.is_email_verified||user.email_verified);
  const phoneOk=!!(user.is_phone_verified||user.phone_verified);
  const kycOk=!!(user.kyc_verified||user.is_id_verified);
  const verifPct=Math.round([emailOk,phoneOk,kycOk].filter(Boolean).length/3*100);
  const earned=BADGE_DEFS.filter(b=>badges.some(badge=>badge.badge_name===b.label&&badge.is_unlocked));
  const trades=parseInt(user.total_trades||0); const rating=parseFloat(user.average_rating||0);
  const posPct=reviews.length?Math.round(reviews.filter(r=>r.rating>=4).length/reviews.length*100):100;
  const status=trades>=50?'Active Trader':trades>=5?'Growing Trader':trades>=1?'New Trader':'Unverified';
  const statusColor=trades>=50?C.success:trades>=5?C.paid:trades>=1?C.warn:C.danger;

  const TABS=[
    {id:'overview',      label:'Overview'},
    {id:'verification',  label:`Verification ${verifPct<100?`(${verifPct}%)`:''}`},
    {id:'reputation',    label:`Reputation (${reviews.length})`},
    {id:'badges',        label:`Badges (${earned.length}/${BADGE_DEFS.length})`},
    ...(own?[{id:'settings',label:'Settings'}]:[]),
  ];

  return(
    <div className="min-h-screen pb-0" style={{backgroundColor:C.mist,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="relative" style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'24px 24px'}}/>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{backgroundColor:C.gold}}/>

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-0">
          <div className="flex flex-col md:flex-row md:items-end gap-5 pb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden" style={{backgroundColor:C.gold}}>
                {user.avatar_url
                  ?<img src={user.avatar_url} alt="av" className="w-full h-full object-cover"/>
                  :<div className="w-full h-full flex items-center justify-center font-black text-3xl" style={{color:C.forest}}>{user.username?.charAt(0)?.toUpperCase()||'?'}</div>}
              </div>
              {own&&<button onClick={()=>fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white shadow-md flex items-center justify-center hover:scale-110 transition">
                {uploading?<RefreshCw size={13} className="animate-spin" style={{color:C.green}}/>:<Camera size={13} style={{color:C.green}}/>}
              </button>}
              <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden"/>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing?(
                <form onSubmit={saveProfile} className="space-y-2 pb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Username"
                      className="px-3 py-2 rounded-xl text-sm font-bold border-2 focus:outline-none bg-white" style={{borderColor:C.sage}}/>
                    <input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Full Name"
                      className="px-3 py-2 rounded-xl text-sm border-2 focus:outline-none bg-white" style={{borderColor:C.sage}}/>
                  </div>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Location"
                    className="w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none bg-white" style={{borderColor:C.sage}}/>
                  <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Bio" rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none bg-white resize-none" style={{borderColor:C.sage}}/>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs"
                      style={{backgroundColor:C.gold,color:C.forest}}>
                      {saving?<RefreshCw size={11} className="animate-spin"/>:<Save size={11}/>}{saving?'Saving…':'Save'}
                    </button>
                    <button type="button" onClick={()=>setEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs border border-white/30 text-white hover:bg-white/10">
                      <X size={11}/>Cancel
                    </button>
                  </div>
                </form>
              ):(
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-black text-white" style={{fontFamily:"'Syne',sans-serif"}}>{user.username}</h1>
                      <CountryFlag className="w-5 h-4" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{backgroundColor:statusColor}}>{status}</span>
                    {kycOk&&<BadgeCheck size={20} style={{color:'#93C5FD'}} title="KYC Verified"/>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-white/65 mb-2">
                    <span className="flex items-center gap-1 font-mono">
                      ID: #{String(user.id||'').slice(0,8).toUpperCase()}
                      <button onClick={()=>{navigator.clipboard.writeText(user.id||'');toast.success('ID copied!');}} className="hover:text-white"><Copy size={10}/></button>
                    </span>
                    <div className="flex items-center gap-1">
                      <ProfileFlag />
                    </div>
                    <span className="flex items-center gap-1"><MapPin size={11}/>{user.location||'Ghana'}</span>
                    <span className="flex items-center gap-1"><Calendar size={11}/>Joined {fmtAge(user.created_at)}</span>
                  </div>
                  {user.bio&&<p className="text-sm text-white/70 max-w-lg">{user.bio}</p>}
                </>
              )}
            </div>

            {/* Trust score + edit */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center px-4 py-3 rounded-2xl" style={{backgroundColor:'rgba(255,255,255,0.12)'}}>
                <p className="text-3xl font-black text-white">{score}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider">Trust Score</p>
                <span className="text-xs font-black mt-1 px-2 py-0.5 rounded-full" style={{backgroundColor:trust.bg,color:trust.color}}>{trust.label}</span>
              </div>
              {own&&!editing&&<button onClick={()=>setEditing(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/20 transition"
                style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                <Edit2 size={15} className="text-white"/>
              </button>}
            </div>
          </div>

          {/* Stats Grid with REAL Feedback Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{borderColor:'rgba(255,255,255,0.15)'}}>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-white">{fmt(user.total_trades || 0)}</p>
              <p className="text-xs text-white/60 mt-0.5">Trades</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <p className="text-xl sm:text-2xl font-black" style={{color:C.gold}}>{parseFloat(user.average_rating || 0).toFixed(1)}</p>
              </div>
              <p className="text-xs text-white/60 mt-0.5">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-white">{fmt(user.total_feedback_count || ((user.positive_feedback||0) + (user.negative_feedback||0)))}</p>
              <p className="text-xs text-white/60 mt-0.5">Feedback</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-white">{parseFloat(user.completion_rate || 0).toFixed(0)}%</p>
              <p className="text-xs text-white/60 mt-0.5">Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAV ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm" style={{borderColor:C.g200}}>
        <div className="max-w-5xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition"
              style={{color:tab===t.id?C.green:C.g500,borderColor:tab===t.id?C.green:'transparent',backgroundColor:tab===t.id?`${C.green}06`:'transparent'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {tab==='overview'&&(
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-4">
              {/* Trust score card */}
              <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
                <div className="flex items-center gap-2 mb-3"><Shield size={13} style={{color:C.green}}/><p className="font-black text-sm" style={{color:C.forest}}>Trust Score</p></div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-4xl font-black" style={{color:trust.color}}>{score}</p>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl" style={{backgroundColor:trust.bg,color:trust.color}}>{trust.label}</span>
                </div>
                <div className="h-3 rounded-full mb-3" style={{backgroundColor:C.g200}}>
                  <div className="h-3 rounded-full" style={{width:`${score}%`,backgroundColor:trust.color}}/>
                </div>
                <div className="space-y-1.5">
                  {[
                    {label:'Email verified', done:emailOk, pts:10},
                    {label:'Phone verified', done:phoneOk, pts:15},
                    {label:'KYC completed',  done:kycOk,   pts:15},
                    {label:'Trade activity', done:trades>0,pts:30},
                    {label:'Rating score',   done:rating>0,pts:20},
                    {label:'Account age',    done:true,    pts:10},
                  ].map(({label,done,pts})=>(
                    <div key={label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {done?<CheckCircle size={10} style={{color:C.success}}/>:<div className="w-2.5 h-2.5 rounded-full border" style={{borderColor:C.g300}}/>}
                        <span style={{color:done?C.g700:C.g400}}>{label}</span>
                      </div>
                      <span className="font-bold" style={{color:done?C.success:C.g400}}>+{pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges preview */}
              <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Award size={13} style={{color:C.gold}}/><p className="font-black text-sm" style={{color:C.forest}}>Badges</p></div>
                  <button onClick={()=>setTab('badges')} className="text-xs font-bold" style={{color:C.green}}>All →</button>
                </div>
                {earned.length===0?<p className="text-xs text-center py-3" style={{color:C.g400}}>No badges earned yet</p>:
                  <div className="flex flex-wrap gap-2">
                    {earned.map(b=>(
                      <span key={b.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                        style={{backgroundColor:b.bg,color:b.color}}>{b.icon}{b.label}</span>
                    ))}
                  </div>}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              {/* Trade limit */}
              <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Lock size={13} style={{color:C.green}}/><p className="font-black text-sm" style={{color:C.forest}}>Trade Limits</p></div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{backgroundColor:tier.color}}>{tier.label} Tier</span>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-3xl font-black" style={{color:tier.color}}>${fmt(tier.limit)}</p>
                    <p className="text-xs" style={{color:C.g400}}>Per transaction limit</p>
                  </div>
                  {nextTier&&<div className="text-right"><p className="text-sm font-black" style={{color:C.g600}}>${fmt(nextTier.limit)}</p><p className="text-xs" style={{color:C.g400}}>Next tier</p></div>}
                </div>
                <div className="flex gap-1 mb-3">
                  {TIERS.map((t,i)=><div key={i} className="flex-1 h-2 rounded-full" style={{backgroundColor:i<=tierIdx?t.color:C.g200}}/>)}
                </div>
                {nextTier&&own&&(
                  <div className="p-3 rounded-xl border" style={{backgroundColor:`${C.gold}08`,borderColor:`${C.gold}30`}}>
                    <p className="text-xs font-black mb-2" style={{color:C.forest}}>🎯 Unlock {nextTier.label} — ${fmt(nextTier.limit)}/trade</p>
                    <div className="space-y-1 mb-2">
                      {nextTier.requires.map(req=>{
                        const done=req==='email'?emailOk:req==='phone'?phoneOk:req==='kyc'?kycOk:trades>=50;
                        return(
                          <div key={req} className="flex items-center gap-1.5 text-xs">
                            {done?<CheckCircle size={10} style={{color:C.success}}/>:<div className="w-2.5 h-2.5 rounded-full border-2" style={{borderColor:C.warn}}/>}
                            <span style={{color:done?C.success:C.g600}}>{req==='email'?'Verify email':req==='phone'?'Verify phone':req==='kyc'?'Complete KYC':'Complete 50+ trades'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={()=>setTab('verification')}
                      className="w-full py-2 rounded-xl text-white text-xs font-black hover:opacity-90 transition"
                      style={{backgroundColor:C.green}}>
                      Upgrade Account → Increase Trade Limits
                    </button>
                  </div>
                )}
              </div>

              {/* Last 3 reviews */}
              {reviews.slice(0,3).map(r=>(
                <div key={r.id} className="bg-white rounded-2xl border shadow-sm p-4 flex gap-3" style={{borderColor:C.g200}}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{backgroundColor:C.green}}>
                    {r.reviewer?.username?.charAt(0)?.toUpperCase()||'?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-black text-xs" style={{color:C.forest}}>{r.reviewer?.username||'Trader'}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={9} className={i<=r.rating?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>)}</div>
                      {r.is_verified_trade&&<span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{backgroundColor:`${C.success}15`,color:C.success}}>✓ Verified</span>}
                    </div>
                    {r.comment&&<p className="text-xs" style={{color:C.g600}}>{r.comment}</p>}
                    <p className="text-xs mt-1" style={{color:C.g400}}>{fmtAge(r.created_at)}</p>
                  </div>
                </div>
              ))}
              {reviews.length>3&&<button onClick={()=>setTab('reputation')} className="w-full py-2.5 rounded-xl border text-xs font-bold hover:bg-gray-50 transition" style={{borderColor:C.g200,color:C.green}}>View all {reviews.length} reviews →</button>}
            </div>
          </div>
        )}

        {/* ── VERIFICATION ────────────────────────────────────────────── */}
        {tab==='verification'&&(
          <div className="space-y-4 max-w-2xl">
            <div className="rounded-2xl p-5 text-white"
              style={{background:verifPct===100?`linear-gradient(135deg,${C.success},${C.mint})`:`linear-gradient(135deg,${C.forest},${C.green})`}}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-lg" style={{fontFamily:"'Syne',sans-serif"}}>{verifPct===100?'✅ Fully Verified!':'Complete Verification'}</p>
                  <p className="text-white/70 text-xs mt-0.5">{[emailOk,phoneOk,kycOk].filter(Boolean).length}/3 steps completed — unlock higher trade limits</p>
                </div>
                <div className="text-right"><p className="text-3xl font-black">{verifPct}%</p><p className="text-white/50 text-xs">Complete</p></div>
              </div>
              <div className="h-2.5 rounded-full bg-white/20"><div className="h-2.5 rounded-full" style={{width:`${verifPct}%`,backgroundColor:C.gold}}/></div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3" style={{borderColor:C.g200}}>
              <p className="font-black text-sm" style={{color:C.forest}}>Verification Steps</p>
              <VerifRow icon={Mail} label="Email Verification" desc="Verify your email to secure your account and enable notifications."
                status={emailOk?'verified':'not_submitted'} color={C.paid}
                onVerify={own?()=>toast.info('Check your inbox for a verification email'):null}/>
              <VerifRow icon={Phone} label="Phone Verification" desc="Add your phone number for SMS alerts and two-factor authentication."
                status={phoneOk?'verified':user.phone?'pending':'not_submitted'} color={C.success}
                onVerify={own?()=>toast.info('Go to Settings to add your phone number'):null}/>
              <VerifRow icon={FileText} label="KYC Identity Verification" desc="Upload government ID to unlock Advanced ($10,000) and VIP ($50,000) trade limits."
                status={kycOk?'verified':user.kyc_status==='pending'?'pending':'not_submitted'} color={C.gold}
                onVerify={own?()=>toast.info('Contact support@praqen.com to start KYC verification'):null}/>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
              <div className="flex items-center gap-2 mb-3"><Shield size={13} style={{color:C.green}}/><p className="font-black text-sm" style={{color:C.forest}}>Account Security</p></div>
              <div className="space-y-2.5">
                {[
                  {icon:MapPin,     label:'Registered Country', value:`${flag} ${user.country||'Ghana'}`,          color:C.paid},
                  {icon:Clock,      label:'Last Login',          value:fmtAge(user.last_login||user.updated_at),    color:C.success},
                  {icon:Smartphone, label:'Device Access',       value:'Mobile & Web Browser',                      color:C.purple},
                  {icon:Globe,      label:'Language',            value:'English',                                    color:C.g500},
                ].map(({icon:Icon,label,value,color})=>(
                  <div key={label} className="flex items-center justify-between py-2 border-b last:border-0 text-xs" style={{borderColor:C.g100}}>
                    <div className="flex items-center gap-2"><Icon size={12} style={{color}}/><span style={{color:C.g500}}>{label}</span></div>
                    <span className="font-bold" style={{color:C.g700}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {verifPct<100&&own&&(
              <div className="p-4 rounded-2xl border-2 flex items-start gap-3" style={{borderColor:C.warn,backgroundColor:'#FFFBEB'}}>
                <AlertTriangle size={16} style={{color:C.warn,flexShrink:0,marginTop:1}}/>
                <div>
                  <p className="text-sm font-black mb-0.5" style={{color:'#92400E'}}>Verification Incomplete</p>
                  <p className="text-xs leading-relaxed" style={{color:'#B45309'}}>
                    Complete all 3 steps to unlock <strong>High Trust Score</strong>, <strong>Advanced trade limits ($10,000+)</strong>, and the <strong>Verified Identity badge</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REPUTATION ──────────────────────────────────────────────── */}
        {tab==='reputation'&&(
          <div className="space-y-4 max-w-2xl">
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
              <p className="font-black text-sm mb-4" style={{color:C.forest}}>Reputation Summary</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  {label:'Avg Rating',value:rating.toFixed(1),sub:'out of 5.0',color:C.amber},
                  {label:'Positive',  value:`${posPct}%`,     sub:`${reviews.filter(r=>r.rating>=4).length} reviews`,color:C.success},
                  {label:'Negative',  value:`${100-posPct}%`, sub:`${reviews.filter(r=>r.rating<4).length} reviews`,color:C.danger},
                ].map(({label,value,sub,color})=>(
                  <div key={label} className="text-center p-3 rounded-xl" style={{backgroundColor:C.g50}}>
                    <p className="text-2xl font-black" style={{color}}>{value}</p>
                    <p className="text-xs font-bold mt-0.5" style={{color:C.g500}}>{label}</p>
                    <p className="text-xs" style={{color:C.g400}}>{sub}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-0.5 mb-5">
                {[1,2,3,4,5].map(i=><Star key={i} size={18} className={i<=Math.round(rating)?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>)}
              </div>
              {[5,4,3,2,1].map(n=>{
                const cnt=reviews.filter(r=>r.rating===n).length;
                const pct=reviews.length?Math.round(cnt/reviews.length*100):0;
                return(
                  <div key={n} className="flex items-center gap-2 text-xs mb-1.5">
                    <span className="w-4 font-bold text-right" style={{color:C.g500}}>{n}</span>
                    <Star size={10} className="fill-yellow-400 text-yellow-400 flex-shrink-0"/>
                    <div className="flex-1 h-2 rounded-full" style={{backgroundColor:C.g200}}>
                      <div className="h-2 rounded-full" style={{width:`${pct}%`,backgroundColor:C.amber}}/>
                    </div>
                    <span className="w-8 text-right font-semibold" style={{color:C.g400}}>{cnt}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
              <div className="px-4 py-3 border-b" style={{borderColor:C.g100}}>
                <p className="font-black text-sm" style={{color:C.forest}}>All Reviews ({reviews.length})</p>
              </div>
              {reviews.length===0?(
                <div className="p-8 text-center">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-20" style={{color:C.g400}}/>
                  <p className="text-xs" style={{color:C.g400}}>No reviews yet. Complete trades to get feedback.</p>
                </div>
              ):reviews.map(r=>(
                <div key={r.id} className="flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50" style={{borderColor:C.g50}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0" style={{backgroundColor:C.green}}>
                    {r.reviewer?.username?.charAt(0)?.toUpperCase()||'?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-xs" style={{color:C.forest}}>{r.reviewer?.username||'Trader'}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={9} className={i<=r.rating?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>)}</div>
                      {r.is_verified_trade&&<span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{backgroundColor:`${C.success}15`,color:C.success}}>✓ Verified Trade</span>}
                    </div>
                    {r.comment&&<p className="text-xs" style={{color:C.g600}}>{r.comment}</p>}
                    <p className="text-xs mt-1" style={{color:C.g400}}>{fmtAge(r.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BADGES ──────────────────────────────────────────────────── */}
        {tab==='badges'&&(
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
              <div className="flex items-center gap-2 mb-1"><Award size={14} style={{color:C.gold}}/><p className="font-black text-sm" style={{color:C.forest}}>Badge Collection</p></div>
              <p className="text-xs mb-4" style={{color:C.g400}}>{earned.length}/{BADGE_DEFS.length} badges earned</p>
              <div className="space-y-3">
                {BADGE_DEFS.map(b=>{
                  const has=badges.some(badge=>badge.badge_name===b.label&&badge.is_unlocked);
                  return(
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border transition"
                      style={{borderColor:has?b.color+'40':C.g100,backgroundColor:has?b.bg:C.g50,opacity:has?1:0.6}}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{backgroundColor:has?`${b.color}20`:'rgba(0,0,0,0.04)'}}>
                        {b.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black" style={{color:has?b.color:C.g500}}>
                          {b.label}
                          {has&&<span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">EARNED</span>}
                        </p>
                        <p className="text-xs" style={{color:C.g400}}>{b.desc}</p>
                      </div>
                      {has?<CheckCircle size={16} style={{color:b.color,flexShrink:0}}/>:<Lock size={14} style={{color:C.g300,flexShrink:0}}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────── */}
        {tab==='settings'&&own&&(
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
              <p className="font-black text-sm mb-4" style={{color:C.forest}}>Edit Profile</p>
              <form onSubmit={saveProfile} className="space-y-3">
                {[
                  {field:'username', label:'Username', type:'text', ph:'johndoe'},
                  {field:'full_name',label:'Full Name', type:'text', ph:'John Doe'},
                  {field:'location', label:'Location',  type:'text', ph:'Accra, Ghana'},
                  {field:'website',  label:'Website',   type:'url',  ph:'https://yoursite.com'},
                ].map(({field,label,type,ph})=>(
                  <div key={field}>
                    <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>{label}</label>
                    <input type={type} value={form[field]||''} onChange={e=>setForm({...form,[field]:e.target.value})} placeholder={ph}
                      className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none"
                      style={{borderColor:form[field]?C.green:C.g200}}/>
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>Bio</label>
                  <textarea value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Tell traders about yourself…" rows={3}
                    className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none resize-none"
                    style={{borderColor:form.bio?C.green:C.g200}}/>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{backgroundColor:C.green}}>
                  {saving?<><RefreshCw size={14} className="animate-spin"/>Saving…</>:<><Save size={14}/>Save Changes</>}
                </button>
              </form>
            </div>
          </div>
        )}
        {tab==='settings'&&!own&&(
          <div className="max-w-2xl"><div className="bg-white rounded-2xl border shadow-sm p-8 text-center" style={{borderColor:C.g200}}><Lock size={32} className="mx-auto mb-3 opacity-20" style={{color:C.g400}}/><p className="text-sm" style={{color:C.g400}}>Settings are only visible to the account owner.</p></div></div>
        )}

      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="mt-10" style={{backgroundColor:C.forest}}>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xl" style={{backgroundColor:C.gold,color:C.forest}}>P</div>
                <span className="text-white font-black text-lg" style={{fontFamily:"'Syne',sans-serif"}}>PRAQEN</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.45)'}}>Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://x.com/praqenapp?s=21" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition font-black text-white text-sm" style={{backgroundColor:'rgba(255,255,255,0.1)'}} title="Twitter/X">𝕏</a>
                <a href="https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base" style={{backgroundColor:'rgba(255,255,255,0.1)'}} title="Instagram">📸</a>
                <a href="https://www.linkedin.com/in/pra-qen-045373402/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base" style={{backgroundColor:'rgba(255,255,255,0.1)'}} title="LinkedIn">💼</a>
                <a href="https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base" style={{backgroundColor:'rgba(255,255,255,0.1)'}} title="WhatsApp">💬</a>
                <a href="https://discord.gg/V6zCZxfdy" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition text-base" style={{backgroundColor:'rgba(88,101,242,0.4)'}} title="Discord">🎮</a>
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Trade</p>
              <div className="space-y-2">
                {[['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Create Offer','/create-offer'],['My Trades','/my-trades'],['My Listings','/my-listings']].map(([l,h])=>(
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.45)'}}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Community & Support</p>
              <div className="space-y-2">
                {[
                  ['💬 WhatsApp Community','https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
                  ['🎮 Discord Server','https://discord.gg/V6zCZxfdy'],
                  ['𝕏 Twitter / X','https://x.com/praqenapp?s=21'],
                  ['📸 Instagram','https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr'],
                  ['💼 LinkedIn','https://www.linkedin.com/in/pra-qen-045373402/'],
                  ['📧 support@praqen.com','mailto:support@praqen.com'],
                ].map(([l,h])=>(
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.45)'}}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-5 border-t" style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-xs flex items-center gap-1.5" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={11}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
