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
import { BadgeChip } from '../lib/badge';

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

// FLAGS object for real country emoji flags
const FLAGS = {
  GH:'🇬🇭', NG:'🇳🇬', KE:'🇰🇪', ZA:'🇿🇦', UG:'🇺🇬', TZ:'🇹🇿', 
  US:'🇺🇸', GB:'🇬🇧', EU:'🇪🇺', CM:'🇨🇲', SN:'🇸🇳', ZM:'🇿🇲', 
  MZ:'🇲🇿', MW:'🇲🇼', RW:'🇷🇼', BI:'🇧🇮', DJ:'🇩🇯', ER:'🇪🇷',
  ET:'🇪🇹', SO:'🇸🇴', SS:'🇸🇸', SD:'🇸🇩', TD:'🇹🇩', CF:'🇨🇫',
  CD:'🇨🇩', CG:'🇨🇬', GA:'🇬🇦', GQ:'🇬🇶', AO:'🇦🇴', NA:'🇳🇦',
  BW:'🇧🇼', ZW:'🇿🇼', LS:'🇱🇸', SZ:'🇸🇿'
};

const fmt = (n,d=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
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
  const [userCountry, setUserCountry] = useState('GH');

  // Detect user country by IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await axios.get('https://ipapi.co/json/');
        const countryCode = response.data.country_code || 'GH';
        setUserCountry(countryCode.toUpperCase());
      } catch (error) {
        // Fallback to GH if detection fails
        setUserCountry('GH');
      }
    };
    detectCountry();
  }, []);

  useEffect(()=>{
    if(!userId){const cu=JSON.parse(localStorage.getItem('user')||'{}');cu.id?navigate(`/profile/${cu.id}`):navigate('/login');return;}
    const cu=JSON.parse(localStorage.getItem('user')||'{}'); setOwn(cu.id===userId);
  },[userId]);
  useEffect(()=>{if(userId)load();},[userId,own]);

  const load=async()=>{
    setLoading(true);
    try{
      const tk=localStorage.getItem('token');
      // Re-derive isOwn here so the first call is always correct,
      // regardless of whether the `own` state has been set yet.
      const cu=JSON.parse(localStorage.getItem('user')||'{}');
      const isOwn=!!(tk&&cu.id&&cu.id===userId);
      if(isOwn!==own) setOwn(isOwn);

      if(isOwn){
        // Always fetch fresh authenticated data — never read from localStorage cache
        const r=await axios.get(`${API_URL}/users/profile`,{headers:{Authorization:`Bearer ${tk}`}});
        const u=r.data.user; setUser(u); localStorage.setItem('user',JSON.stringify(u));
        setForm({username:u.username||'',full_name:u.full_name||'',bio:u.bio||'',location:u.location||'Ghana',website:u.website||''});
      } else {
        // Viewing another user's profile — fetch public data
        const r=await axios.get(`${API_URL}/users/${userId}`);
        setUser(r.data.user); setReviews(r.data.reviews||[]);
      }

      if (isOwn) {
        try {
          const badgeRes = await axios.post(`${API_URL}/users/check-badges`, {}, { headers: { Authorization: `Bearer ${tk}` } });
          setBadges(badgeRes.data.badges || []);
        } catch {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { data: badgesData } = await supabase.from('user_badges').select('badge_name, is_unlocked').eq('user_id', currentUser.id);
            setBadges(badgesData || []);
          }
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

  // Country codes — uppercase for FLAGS lookup
  const userCC  = (user.country||userCountry||'GH').toUpperCase().slice(0,2);
  const phoneCC = (user.phone_country||user.country||userCountry||'GH').toUpperCase().slice(0,2);
  const kycCC   = (user.kyc_country||user.country||userCountry||'GH').toUpperCase().slice(0,2);

  const score=calcTrust(user,reviews); const trust=trustLvl(score);
  const tierIdx=getTier(user); const tier=TIERS[tierIdx]; const nextTier=TIERS[tierIdx+1];
  const emailOk=!!(user.is_email_verified||user.email_verified);
  const phoneOk=!!(user.is_phone_verified||user.phone_verified||user.phone);
  const kycOk=!!(user.kyc_verified||user.is_id_verified);
  const verifPct=Math.round([emailOk,phoneOk,kycOk].filter(Boolean).length/3*100);
  const earned=BADGE_DEFS.filter(b=>badges.some(badge=>badge.badge_name===b.label&&badge.is_unlocked)||b.check(user));
  const trades=parseInt(user.total_trades||0); const rating=parseFloat(user.average_rating||0);
  const posPct=reviews.length?Math.round(reviews.filter(r=>r.rating>=4).length/reviews.length*100):100;
  const status=trades>=50?'Active Trader':trades>=5?'Growing Trader':trades>=1?'New Trader':'Unverified';
  const statusColor=trades>=50?C.success:trades>=5?C.paid:trades>=1?C.warn:C.danger;

  const TABS=[
    {id:'overview',      label:'Overview'},
    {id:'verification',  label:`Verification ${verifPct<100?`(${verifPct}%)`:''}`},
    {id:'reputation',    label:`Reputation (${reviews.length})`},
    {id:'badges',        label:`🏅 Badges (${earned.length}/${BADGE_DEFS.length})`},
    ...(own?[{id:'settings',label:'Settings'}]:[]),
  ];

  // Force Ghana flag for demonstration if user is from Ghana
  const displayFlag = userCC === 'GH' ? '🇬🇭' : (FLAGS[userCC] || '🌍');

  return(
    <div className="min-h-screen pb-0" style={{backgroundColor:C.mist,fontFamily:"'DM Sans',sans-serif",overflowX:'hidden',width:'100%',maxWidth:'100vw'}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      {/* ── PROFILE CARD ──────────────────────────────────────────────────── */}
      <div className="pt-4 pb-0 px-3 sm:px-5 lg:px-8" style={{backgroundColor:C.mist,boxSizing:'border-box'}}>
        <div style={{maxWidth:'100%',width:'100%',margin:'0 auto'}} className="lg:max-w-5xl">
          <div className="rounded-2xl sm:rounded-3xl bg-white" style={{border:'3px solid #8B5CF6',boxShadow:'0 4px 24px rgba(139,92,246,0.14)',overflow:'hidden',width:'100%',boxSizing:'border-box'}}>

            {/* ── Profile Header ── */}
            <div className="px-3 sm:px-5 lg:px-8 pt-4 pb-4 border-b" style={{borderColor:C.g100,boxSizing:'border-box',width:'100%'}}>

              {/* Row 1: Username + flag (same line) */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 style={{
                  color:'#111827', fontFamily:"'Syne',sans-serif",
                  fontSize:'clamp(1.4rem,5vw,2.2rem)', fontWeight:900,
                  letterSpacing:'0.08em', textTransform:'uppercase', lineHeight:1,
                }}>
                  {user.username}
                </h1>
                <span style={{fontSize:'clamp(1.4rem,5vw,2rem)',lineHeight:1}}>{displayFlag}</span>
              </div>

              {/* Row 2: Avatar + Info + Verifications */}
              <div className="flex gap-3 sm:gap-4 items-start">

                {/* Avatar — fixed width, no flex shrink issues */}
                <div className="relative" style={{flexShrink:0,width:80}}>
                  <div className="rounded-full overflow-hidden shadow-lg" style={{width:80,height:80,backgroundColor:'#0f172a',border:'3px solid #E2E8F0'}}>
                    {user.avatar_url
                      ?<img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
                      :<div className="w-full h-full flex items-center justify-center font-black text-3xl" style={{color:'#F4A422'}}>{user.username?.charAt(0)?.toUpperCase()||'?'}</div>}
                  </div>
                  {own&&(
                    <button onClick={()=>fileRef.current?.click()} disabled={uploading}
                      className="absolute rounded-full shadow-md flex items-center justify-center"
                      style={{bottom:-4,right:-4,width:28,height:28,backgroundColor:'white',border:'1.5px solid #E2E8F0'}}>
                      {uploading?<RefreshCw size={12} className="animate-spin" style={{color:C.green}}/>:<Camera size={12} style={{color:C.green}}/>}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden"/>
                </div>

                {/* Info block — takes remaining width */}
                <div style={{flex:1,minWidth:0}}>

                  {/* Badge — full width row, no overflow */}
                  <div className="mb-2" style={{display:'inline-block',maxWidth:'100%'}}>
                    <BadgeChip user={user}/>
                  </div>

                  {/* ID + Location inline */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2" style={{fontSize:12}}>
                    <span className="font-mono font-bold flex items-center gap-1" style={{color:'#6B7280'}}>
                      ID: #{String(user.id||'').slice(0,8).toUpperCase()}
                      <button onClick={()=>{navigator.clipboard.writeText(user.id||'');toast.success('ID copied!');}} className="hover:opacity-70"><Copy size={10}/></button>
                    </span>
                    <span style={{color:'#D1D5DB'}}>·</span>
                    <span className="font-bold" style={{color:'#6B7280'}}>
                      Location: {user.location||'Unknown'} {displayFlag}
                    </span>
                  </div>

                  {/* Verification rows */}
                  <div className="flex flex-col gap-1 mb-2">
                    {[
                      {ok:emailOk, label:'Email'},
                      {ok:phoneOk, label:'Phone', flag:true},
                      {ok:kycOk,   label:'ID',    flag:true},
                    ].map(({ok,label,flag})=>(
                      <div key={label} className="flex items-center gap-2">
                        {ok
                          ?<CheckCircle size={14} style={{color:'#10B981',flexShrink:0}}/>
                          :<div style={{width:14,height:14,borderRadius:'50%',border:'2px solid #D1D5DB',flexShrink:0}}/>}
                        <span style={{fontSize:12,fontWeight:500,color:ok?'#374151':'#9CA3AF'}}>
                          {label} {ok?'verified':'unverified'}{flag?` ${displayFlag}`:''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bio — below verifications */}
                  {user.bio&&<p style={{color:C.g500,fontSize:12,lineHeight:1.5}}>{user.bio}</p>}

                </div>

              </div>
            </div>

            {/* Row 2: Stats section - Full width */}
            <div className="px-3 py-4 sm:px-5 lg:px-8 lg:py-5" style={{boxSizing:'border-box',width:'100%'}}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* FEEDBACK Card */}
                <div className="rounded-2xl overflow-hidden" style={{backgroundColor:'#FEFCE8',border:'2px solid #FDE68A'}}>
                  <p className="text-xs font-black text-center pt-2 uppercase tracking-wider" style={{color:'#78350F'}}>FEEDBACK</p>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:'rgba(22,163,74,0.12)'}}>
                        <ThumbsUp size={18} style={{color:'#166534'}}/>
                      </div>
                      <div>
                        <p className="text-2xl lg:text-3xl font-black leading-none" style={{color:'#16A34A'}}>{fmt(user.positive_feedback||0)}</p>
                        <p className="text-xs font-bold" style={{color:'#166534'}}>Positive</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:'rgba(239,68,68,0.1)'}}>
                        <ThumbsDown size={18} style={{color:'#991B1B'}}/>
                      </div>
                      <div>
                        <p className="text-2xl lg:text-3xl font-black leading-none" style={{color:'#EF4444'}}>{fmt(user.negative_feedback||0)}</p>
                        <p className="text-xs font-bold" style={{color:'#991B1B'}}>Negative</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Green Stats Card */}
                <div className="rounded-2xl overflow-hidden" style={{backgroundColor:'#16A34A'}}>
                  <div className="grid grid-cols-3 divide-x divide-white/20">
                    {[
                      ['Trades', fmt(user.total_trades||0)],
                      ['Rating', parseFloat(user.average_rating||0).toFixed(1)],
                      ['Trust Score', String(score)],
                    ].map(([label,value],i)=>(
                      <div key={i} className="text-center px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide leading-none mb-1" style={{color:'rgba(255,255,255,0.72)'}}>{label}</p>
                        <p className="text-xl lg:text-2xl font-black leading-none text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-white/20 border-t border-white/20">
                    {[
                      ['Trusted By', fmt(user.trusted_by_count||user.trust_count||0)],
                      ['Blocked By', fmt(user.blocked_by_count||0)],
                    ].map(([label,value],i)=>(
                      <div key={i} className="text-center px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide leading-none mb-0.5" style={{color:'rgba(255,255,255,0.72)'}}>{label}</p>
                        <p className="text-lg font-black leading-none text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Joined + Edit Profile row */}
              <div className="flex items-center justify-between flex-wrap gap-y-2 mt-4 pt-3 border-t" style={{borderColor:C.g100}}>
                <div className="flex items-center flex-wrap gap-y-1" style={{fontSize:12}}>
                  <div className="flex items-center gap-1 pr-2">
                    <Clock size={12} style={{color:C.g400}}/>
                    <span className="font-bold" style={{color:C.g600}}>Joined:</span>
                    <span style={{color:C.g700}}>{fmtAge(user.created_at)}</span>
                  </div>
                  {user.created_at&&(
                    <>
                      <span className="px-1.5" style={{color:C.g300}}>|</span>
                      <span className="pr-2" style={{color:C.g400}}>
                        {new Date(user.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </span>
                    </>
                  )}
                  <span className="px-1.5" style={{color:C.g300}}>|</span>
                  <span className="font-bold" style={{color:C.g500}}>
                    Has blocked: {fmt(user.blocked_count||user.blocks_count||0)}
                  </span>
                </div>
                {own&&!editing&&(
                  <button onClick={()=>setEditing(true)}
                    className="flex items-center gap-1 rounded-xl font-black transition hover:opacity-80"
                    style={{padding:'5px 12px',backgroundColor:`${C.green}12`,color:C.green,border:`1.5px solid ${C.sage}`,fontSize:11,whiteSpace:'nowrap'}}>
                    <Edit2 size={11}/>Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* ── Edit Form (below stats) ── */}
            {own&&editing&&(
              <div className="px-4 sm:px-6 lg:px-8 py-5 border-t" style={{borderColor:C.g100,backgroundColor:C.g50}}>
                <p className="text-xs font-black uppercase tracking-wider mb-3" style={{color:C.forest}}>Edit Profile</p>
                <form onSubmit={saveProfile} className="space-y-3 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Username — locked after first change */}
                    <div>
                      <label className="text-xs font-bold mb-1 flex items-center gap-1" style={{color:C.g600}}>
                        Username
                        {user.username_changed&&<Lock size={10} style={{color:C.g400}}/>}
                      </label>
                      <input
                        value={form.username}
                        onChange={e=>setForm({...form,username:e.target.value})}
                        placeholder="Username"
                        disabled={!!user.username_changed}
                        className="w-full px-3 py-2 rounded-xl text-sm font-bold border-2 focus:outline-none"
                        style={{borderColor:user.username_changed?C.g200:C.sage,backgroundColor:user.username_changed?C.g100:'white',color:user.username_changed?C.g400:C.g800,cursor:user.username_changed?'not-allowed':'text'}}
                      />
                      {user.username_changed&&<p className="text-xs mt-0.5" style={{color:C.g400}}>Username can only be changed once.</p>}
                    </div>
                    {/* Full name — locked after KYC */}
                    <div>
                      <label className="text-xs font-bold mb-1 flex items-center gap-1" style={{color:C.g600}}>
                        Full Name
                        {kycOk&&<Lock size={10} style={{color:C.g400}}/>}
                      </label>
                      <input
                        value={form.full_name}
                        onChange={e=>setForm({...form,full_name:e.target.value})}
                        placeholder="Full Name"
                        disabled={kycOk}
                        className="w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none"
                        style={{borderColor:kycOk?C.g200:C.sage,backgroundColor:kycOk?C.g100:'white',color:kycOk?C.g400:C.g800,cursor:kycOk?'not-allowed':'text'}}
                      />
                      {kycOk&&<p className="text-xs mt-0.5" style={{color:C.g400}}>Locked after ID verification.</p>}
                    </div>
                  </div>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Location"
                    className="w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none" style={{borderColor:C.sage}}/>
                  <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Bio" rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm border-2 focus:outline-none resize-none" style={{borderColor:C.sage}}/>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs text-white"
                      style={{backgroundColor:C.green}}>
                      {saving?<RefreshCw size={11} className="animate-spin"/>:<Save size={11}/>}{saving?'Saving…':'Save'}
                    </button>
                    <button type="button" onClick={()=>setEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs border" style={{borderColor:C.g200,color:C.g600}}>
                      <X size={11}/>Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── REFERRAL LINK (own profile only) ─────────────────────────────── */}
      {own && user && (
        <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-8 mt-3" style={{boxSizing:'border-box',width:'100%'}}>
          <div className="rounded-2xl border overflow-hidden" style={{backgroundColor:'#FFFBEB',borderColor:'#FDE68A'}}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{borderColor:'#FDE68A'}}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{backgroundColor:'rgba(244,164,34,0.15)'}}>
                  <span style={{fontSize:14}}>🔗</span>
                </div>
                <p className="font-black text-sm" style={{color:'#92400E'}}>Your Referral Link</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-black text-sm leading-none" style={{color:'#1B4332'}}>{user.total_referrals||0}</p>
                  <p className="text-gray-400 leading-none mt-0.5" style={{fontSize:9}}>Referrals</p>
                </div>
                <div className="w-px h-6 bg-amber-200"/>
                <div className="text-center">
                  <p className="font-black text-sm leading-none" style={{color:'#F4A422'}}>
                    ₿{(user.referral_earnings_btc||0).toFixed(6)}
                  </p>
                  <p className="text-gray-400 leading-none mt-0.5" style={{fontSize:9}}>Earned</p>
                </div>
              </div>
            </div>

            {/* Link row */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={`https://praqen.com/ref/${user.referral_code||user.username}`}
                  className="flex-1 min-w-0 text-xs font-medium rounded-xl border px-3 py-2 focus:outline-none truncate"
                  style={{backgroundColor:'white',borderColor:'#FDE68A',color:'#78350F'}}
                />
                <button
                  onClick={()=>{
                    navigator.clipboard.writeText(`https://praqen.com/ref/${user.referral_code||user.username}`);
                    toast.success('Referral link copied!');
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white hover:opacity-90 active:scale-95 transition"
                  style={{backgroundColor:'#F4A422',whiteSpace:'nowrap'}}>
                  📋 Copy
                </button>
                <button
                  onClick={()=>{
                    const link=`https://praqen.com/ref/${user.referral_code||user.username}`;
                    if(navigator.share){navigator.share({title:'Join PRAQEN',text:'Trade Bitcoin safely with me on PRAQEN!',url:link});}
                    else{navigator.clipboard.writeText(link);toast.success('Link copied!');}
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white hover:opacity-90 active:scale-95 transition"
                  style={{backgroundColor:'#1B4332',whiteSpace:'nowrap'}}>
                  ↑ Share
                </button>
              </div>
              <p className="text-xs mt-2" style={{color:'#92400E'}}>
                Earn <strong>0.1% BTC commission</strong> on every trade your referrals complete.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB NAV ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm mt-3" style={{borderColor:C.g200,width:'100%',overflowX:'hidden'}}>
        <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-8 flex gap-0" style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition"
              style={{color:tab===t.id?C.green:C.g500,borderColor:tab===t.id?C.green:'transparent',backgroundColor:tab===t.id?`${C.green}06`:'transparent'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-5 lg:px-8 py-4 space-y-4" style={{boxSizing:'border-box',width:'100%'}}>

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {tab==='overview'&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-5 lg:col-span-1">
              {/* Trust score card */}
              <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
                <div className="flex items-center gap-2 mb-3"><Shield size={14} style={{color:C.green}}/><p className="font-black text-sm" style={{color:C.forest}}>Trust Score</p></div>

                <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl" style={{background:'linear-gradient(135deg,rgba(134,239,172,0.12),rgba(252,165,165,0.08))',border:`1.5px solid ${C.g100}`}}>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ThumbsUp size={16} style={{color:C.success}}/>
                      <p className="text-2xl lg:text-3xl font-black leading-none" style={{color:C.success}}>{fmt(user.positive_feedback||0)}</p>
                    </div>
                    <p className="text-xs font-semibold" style={{color:C.g500}}>Positive</p>
                  </div>
                  <div className="w-px self-stretch" style={{backgroundColor:C.g200}}/>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ThumbsDown size={16} style={{color:C.danger}}/>
                      <p className="text-2xl lg:text-3xl font-black leading-none" style={{color:C.danger}}>{fmt(user.negative_feedback||0)}</p>
                    </div>
                    <p className="text-xs font-semibold" style={{color:C.g500}}>Negative</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-4xl lg:text-5xl font-black" style={{color:trust.color}}>{score}</p>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl" style={{backgroundColor:trust.bg,color:trust.color}}>{trust.label}</span>
                </div>
                <div className="h-3 rounded-full mb-3" style={{backgroundColor:C.g200}}>
                  <div className="h-3 rounded-full" style={{width:`${score}%`,backgroundColor:trust.color}}/>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl px-3 py-2 text-center" style={{backgroundColor:C.g50,border:`1px solid ${C.g100}`}}>
                    <p className="font-black text-lg leading-none" style={{color:C.forest}}>{fmt(user.total_trades||0)}</p>
                    <p className="text-xs mt-0.5" style={{color:C.g400}}>Trades</p>
                  </div>
                  <div className="rounded-xl px-3 py-2 text-center" style={{backgroundColor:C.g50,border:`1px solid ${C.g100}`}}>
                    <div className="flex items-center justify-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400"/>
                      <p className="font-black text-lg leading-none" style={{color:C.gold}}>{parseFloat(user.average_rating||0).toFixed(1)}</p>
                    </div>
                    <p className="text-xs mt-0.5" style={{color:C.g400}}>Rating</p>
                  </div>
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
              <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Award size={14} style={{color:C.gold}}/><p className="font-black text-sm" style={{color:C.forest}}>Badge Collection</p></div>
                  <button onClick={()=>setTab('badges')} className="text-xs font-bold" style={{color:C.green}}>View all →</button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 rounded-full" style={{backgroundColor:C.g100}}>
                    <div className="h-2 rounded-full transition-all" style={{width:`${(earned.length/BADGE_DEFS.length)*100}%`,background:`linear-gradient(90deg,${C.gold},${C.amber})`}}/>
                  </div>
                  <span className="text-xs font-black" style={{color:C.gold}}>{earned.length}/{BADGE_DEFS.length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {BADGE_DEFS.map(b=>{
                    const unlocked=badges.some(ba=>ba.badge_name===b.label&&ba.is_unlocked)||b.check(user);
                    return(
                      <div key={b.id} title={b.label}
                        className="aspect-square rounded-xl flex items-center justify-center text-base cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          backgroundColor:unlocked?`${b.color}15`:'rgba(0,0,0,0.04)',
                          filter:unlocked?'none':'grayscale(1)',
                          opacity:unlocked?1:0.35,
                          border:`1.5px solid ${unlocked?b.color+'40':C.g100}`,
                        }}>
                        {b.icon}
                      </div>
                    );
                  })}
                </div>
                {earned.length===0&&<p className="text-xs text-center mt-3" style={{color:C.g400}}>Complete tasks to unlock your first badge</p>}
                {earned.length>0&&earned.length<BADGE_DEFS.length&&(
                  <p className="text-xs text-center mt-3" style={{color:C.g400}}>{BADGE_DEFS.length-earned.length} more badge{BADGE_DEFS.length-earned.length!==1?'s':''} to unlock</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              {/* Trade limit */}
              <div className="bg-white rounded-2xl border shadow-sm p-5" style={{borderColor:C.g200}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Lock size={14} style={{color:C.green}}/><p className="font-black text-sm" style={{color:C.forest}}>Trade Limits</p></div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{backgroundColor:tier.color}}>{tier.label} Tier</span>
                </div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-3xl lg:text-4xl font-black" style={{color:tier.color}}>${fmt(tier.limit)}</p>
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

              {/* Recent Reviews */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-sm" style={{color:C.forest}}>Recent Reviews</p>
                  {reviews.length>3&&<button onClick={()=>setTab('reputation')} className="text-xs font-bold" style={{color:C.green}}>View all →</button>}
                </div>
                <div className="space-y-3">
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
                  {reviews.length===0&&(
                    <div className="bg-white rounded-2xl border shadow-sm p-8 text-center" style={{borderColor:C.g200}}>
                      <MessageCircle size={32} className="mx-auto mb-2 opacity-20" style={{color:C.g400}}/>
                      <p className="text-xs" style={{color:C.g400}}>No reviews yet. Complete trades to get feedback.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VERIFICATION ────────────────────────────────────────────── */}
        {tab==='verification'&&(
          <div className="space-y-4 max-w-3xl">
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
                  {icon:MapPin,     label:'Registered Country', value:`${displayFlag} ${user.country||'Ghana'}`, color:C.paid},
                  {icon:Clock,      label:'Last Login',          value:fmtAge(user.last_login||user.updated_at),            color:C.success},
                  {icon:Smartphone, label:'Device Access',       value:'Mobile & Web Browser',                              color:C.purple},
                  {icon:Globe,      label:'Language',            value:'English',                                            color:C.g500},
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
          <div className="space-y-4 max-w-3xl">
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
          <div className="space-y-5 max-w-3xl">
            <div className="rounded-2xl p-5 text-white relative overflow-hidden"
              style={{background:`linear-gradient(135deg,${C.forest} 0%,${C.mint} 100%)`}}>
              <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'20px 20px'}}/>
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 blur-3xl" style={{backgroundColor:C.gold}}/>
              <div className="relative flex items-center justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="font-black text-xl" style={{fontFamily:"'Syne',sans-serif"}}>🏅 Badge Collection</p>
                  <p className="text-white/70 text-sm mt-0.5">
                    {earned.length===0?'Complete tasks below to start earning badges':
                     earned.length===BADGE_DEFS.length?'🎉 All badges earned — legendary status!':
                     `${earned.length} earned · ${BADGE_DEFS.length-earned.length} more to unlock`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-4xl font-black leading-none">{earned.length}<span className="text-white/40 text-2xl">/{BADGE_DEFS.length}</span></p>
                  <p className="text-white/50 text-xs mt-1">badges earned</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-3 rounded-full" style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{width:`${(earned.length/BADGE_DEFS.length)*100}%`,background:`linear-gradient(90deg,${C.gold},${C.amber})`}}/>
                </div>
                <div className="flex mt-2 gap-1.5">
                  {BADGE_DEFS.map(b=>{
                    const unlocked=badges.some(ba=>ba.badge_name===b.label&&ba.is_unlocked)||b.check(user);
                    return(
                      <div key={b.id} title={b.label} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                        style={{backgroundColor:unlocked?C.gold:'rgba(255,255,255,0.2)'}}/>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BADGE_DEFS.map(b=>{
                const has=badges.some(ba=>ba.badge_name===b.label&&ba.is_unlocked)||b.check(user);
                const daysOld=user?.created_at?Math.floor((Date.now()-new Date(user.created_at))/(1000*60*60*24)):0;
                const daysLeft=Math.max(0,365-daysOld);
                return(
                  <div key={b.id} className="rounded-2xl border-2 overflow-hidden transition-all duration-300"
                    style={{
                      borderColor:has?b.color:C.g200,
                      backgroundColor:has?b.bg:'#FAFAFA',
                      boxShadow:has?`0 4px 24px ${b.color}20`:'none',
                    }}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{
                            backgroundColor:has?`${b.color}20`:'rgba(0,0,0,0.05)',
                            filter:has?'none':'grayscale(1)',
                            opacity:has?1:0.45,
                          }}>
                          {b.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="font-black text-sm" style={{color:has?b.color:C.g500}}>{b.label}</p>
                            {has
                              ?<span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{backgroundColor:b.color}}>✓ EARNED</span>
                              :<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:C.g100,color:C.g400}}>🔒 LOCKED</span>
                            }
                          </div>
                          <p className="text-xs leading-relaxed" style={{color:has?C.g700:C.g400}}>{b.desc}</p>
                        </div>
                      </div>

                      {!has&&b.id==='top_trader'&&(
                        <div className="mt-4 p-3 rounded-xl" style={{backgroundColor:'rgba(244,164,34,0.08)'}}>
                          <div className="flex justify-between text-xs mb-2">
                            <span style={{color:C.g500}} className="font-bold">Progress</span>
                            <span className="font-black" style={{color:b.color}}>{Math.min(100,trades)}/100 trades</span>
                          </div>
                          <div className="h-2.5 rounded-full" style={{backgroundColor:C.g200}}>
                            <div className="h-2.5 rounded-full" style={{width:`${Math.min(100,trades)}%`,backgroundColor:b.color}}/>
                          </div>
                          <p className="text-xs mt-1.5" style={{color:C.g400}}>{Math.max(0,100-trades)} more trades needed</p>
                        </div>
                      )}
                      {!has&&b.id==='high_volume'&&(
                        <div className="mt-4 p-3 rounded-xl" style={{backgroundColor:'rgba(16,185,129,0.08)'}}>
                          <div className="flex justify-between text-xs mb-2">
                            <span style={{color:C.g500}} className="font-bold">Volume traded</span>
                            <span className="font-black" style={{color:b.color}}>${fmt(Math.min(trades*100,10000))}/$10,000</span>
                          </div>
                          <div className="h-2.5 rounded-full" style={{backgroundColor:C.g200}}>
                            <div className="h-2.5 rounded-full" style={{width:`${Math.min(100,(trades*100/10000)*100)}%`,backgroundColor:b.color}}/>
                          </div>
                          <p className="text-xs mt-1.5" style={{color:C.g400}}>${fmt(Math.max(0,10000-trades*100))} more volume needed</p>
                        </div>
                      )}
                      {!has&&b.id==='trusted_seller'&&(
                        <div className="mt-4 p-3 rounded-xl" style={{backgroundColor:'rgba(239,68,68,0.06)'}}>
                          <div className="flex justify-between text-xs mb-2">
                            <span style={{color:C.g500}} className="font-bold">Trades toward goal</span>
                            <span className="font-black" style={{color:b.color}}>{Math.min(20,trades)}/20</span>
                          </div>
                          <div className="h-2.5 rounded-full" style={{backgroundColor:C.g200}}>
                            <div className="h-2.5 rounded-full" style={{width:`${Math.min(100,(trades/20)*100)}%`,backgroundColor:b.color}}/>
                          </div>
                          <p className="text-xs mt-1.5" style={{color:C.g400}}>Also requires 98%+ positive feedback</p>
                        </div>
                      )}
                      {!has&&b.id==='veteran'&&(
                        <div className="mt-4 p-3 rounded-xl" style={{backgroundColor:'rgba(109,40,217,0.06)'}}>
                          <div className="flex justify-between text-xs mb-2">
                            <span style={{color:C.g500}} className="font-bold">Account age</span>
                            <span className="font-black" style={{color:b.color}}>{Math.min(365,daysOld)}/365 days</span>
                          </div>
                          <div className="h-2.5 rounded-full" style={{backgroundColor:C.g200}}>
                            <div className="h-2.5 rounded-full" style={{width:`${Math.min(100,(daysOld/365)*100)}%`,backgroundColor:b.color}}/>
                          </div>
                          <p className="text-xs mt-1.5" style={{color:C.g400}}>{daysLeft>0?`${daysLeft} more day${daysLeft!==1?'s':''} to go`:'Unlock is imminent!'}</p>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 border-t flex items-start gap-2.5"
                      style={{borderColor:has?`${b.color}25`:C.g100,backgroundColor:has?`${b.color}06`:'rgba(0,0,0,0.02)'}}>
                      {has?(
                        <><CheckCircle size={13} style={{color:b.color,flexShrink:0,marginTop:1}}/><p className="text-xs font-bold" style={{color:b.color}}>Achievement unlocked · Badge visible on your public profile</p></>
                      ):(
                        <>
                          <ArrowRight size={13} style={{color:C.g400,flexShrink:0,marginTop:1}}/>
                          <div>
                            <p className="text-xs font-black mb-0.5" style={{color:C.g500}}>HOW TO EARN</p>
                            <p className="text-xs leading-relaxed" style={{color:C.g400}}>
                              {b.id==='verified_identity'&&<span>Go to the <button onClick={()=>setTab('verification')} style={{color:C.green,fontWeight:700,textDecoration:'underline',background:'none',border:'none',cursor:'pointer',padding:0}}>Verification tab</button> and complete KYC identity check.</span>}
                              {b.id==='top_trader'&&`Complete ${Math.max(0,100-trades)} more successful trades to reach 100 total.`}
                              {b.id==='high_volume'&&`Trade $${fmt(Math.max(0,10000-trades*100))} more in total volume across all trades.`}
                              {b.id==='fast_responder'&&'Consistently respond to trade requests within 5 minutes of receiving them.'}
                              {b.id==='trusted_seller'&&'Reach 20 completed trades while keeping 98%+ positive feedback.'}
                              {b.id==='veteran'&&(daysLeft>0?`Account must be 1+ year old. Keep trading — ${daysLeft} day${daysLeft!==1?'s':''} remaining.`:'Your veteran badge is nearly ready — keep trading!')}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {earned.length<BADGE_DEFS.length&&own&&(
              <div className="rounded-2xl p-5 border" style={{borderColor:`${C.gold}50`,background:'linear-gradient(135deg,#FFFBEB,#FFF7ED)'}}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <div>
                    <p className="font-black text-sm mb-3" style={{color:'#92400E'}}>Tips to earn badges faster</p>
                    <div className="space-y-2">
                      {[
                        ['✅','Start with Verification — completing KYC unlocks the Verified Identity badge immediately.'],
                        ['📈','Every completed trade counts toward Top Trader (100 trades) and High Volume ($10k).'],
                        ['⚡','Reply to trade requests in under 5 minutes consistently to earn Fast Responder.'],
                        ['🔒','Complete 20+ trades with 98%+ positive feedback to unlock Trusted Seller.'],
                        ['🎖️','Veteran badge is time-based — it unlocks automatically after your account turns 1 year old.'],
                      ].map(([icon,tip],i)=>(
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
                          <p className="text-xs leading-relaxed" style={{color:'#B45309'}}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {earned.length===BADGE_DEFS.length&&(
              <div className="rounded-2xl p-6 text-center relative overflow-hidden"
                style={{background:`linear-gradient(135deg,${C.forest},${C.gold})`}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'16px 16px'}}/>
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-black text-xl text-white mb-1" style={{fontFamily:"'Syne',sans-serif"}}>Legendary Status!</p>
                <p className="text-white/70 text-sm">You've earned all 6 badges. You're among the most trusted traders on PRAQEN.</p>
              </div>
            )}
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
            <div>
              <p className="text-white font-black text-sm mb-3">Legal</p>
              <div className="space-y-2">
                {[['Terms of Service','/terms'],['Privacy Policy','/privacy'],['Cookie Policy','/cookies'],['Contact','mailto:support@praqen.com']].map(([l,h])=>(
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.45)'}}>{l}</a>
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