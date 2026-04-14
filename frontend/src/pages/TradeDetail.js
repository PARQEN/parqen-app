import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Send, Star, Clock, CheckCircle, AlertCircle, Lock,
  MessageCircle, Bitcoin, Shield, AlertTriangle,
  X, RefreshCw, Info, Check, Timer, ChevronRight,
  Paperclip, Flag, BadgeCheck, FileText, Copy,
  ChevronDown, ChevronUp, DollarSign, CreditCard,
  Smartphone, Building2, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0', g300:'#CBD5E1',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', paid:'#3B82F6', warn:'#F59E0B',
  online:'#22C55E', purple:'#8B5CF6',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBtc = (n,d=8) => parseFloat(n||0).toFixed(d);
const fmtUsd = (n)     => `$${parseFloat(n||0).toFixed(2)}`;
const fmt    = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const authH  = ()      => { const t=localStorage.getItem('token'); return t?{Authorization:`Bearer ${t}`}:{}; };

const USD_RATES = {GHS:11.85,NGN:1580,KES:130,ZAR:18.5,UGX:3720,USD:1,GBP:0.79,EUR:0.92};
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',UGX:'USh',USD:'$',GBP:'£',EUR:'€'};

function isoToFlag(code) {
  if(!code||code.length!==2)return'🌍';
  return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(0x1F1E0+c.charCodeAt(0)-65));
}

const TRUST_MAP = {
  LEGEND:    {label:'LEGEND',    icon:'👑', color:'#7C3AED'},
  AMBASSADOR:{label:'AMBASSADOR',icon:'🌟', color:'#8B5CF6'},
  EXPERT:    {label:'EXPERT',    icon:'💎', color:'#0EA5E9'},
  PRO:       {label:'PRO',       icon:'⭐', color:'#10B981'},
  ACTIVE:    {label:'ACTIVE',    icon:'🔥', color:'#F59E0B'},
  BEGINNER:  {label:'NEW',       icon:'🆕', color:'#94A3B8'},
};
function deriveBadge(u) {
  if(u?.badge&&TRUST_MAP[u.badge])return TRUST_MAP[u.badge];
  const t=parseInt(u?.total_trades??0),r=parseFloat(u?.average_rating??0);
  if(t>=500&&r>=4.8)return TRUST_MAP.LEGEND;
  if(t>=200&&r>=4.5)return TRUST_MAP.EXPERT;
  if(t>=50 &&r>=4.0)return TRUST_MAP.PRO;
  if(t>=5)           return TRUST_MAP.ACTIVE;
  return TRUST_MAP.BEGINNER;
}

const STATUS_CFG = {
  CREATED:     {label:'Escrow Active',  color:C.green,   bg:`${C.green}15`,  icon:Lock},
  FUNDS_LOCKED:{label:'Escrow Active',  color:C.green,   bg:`${C.green}15`,  icon:Lock},
  PAYMENT_SENT:{label:'Payment Sent',   color:C.paid,    bg:`${C.paid}15`,   icon:Clock},
  PAID:        {label:'Payment Sent',   color:C.paid,    bg:`${C.paid}15`,   icon:Clock},
  COMPLETED:   {label:'Completed ✅',  color:C.success, bg:`${C.success}15`,icon:CheckCircle},
  CANCELLED:   {label:'Cancelled',      color:C.g500,    bg:`${C.g500}15`,   icon:X},
  DISPUTED:    {label:'Disputed 🚨',    color:C.danger,  bg:`${C.danger}15`, icon:AlertTriangle},
};
const getS = s=>STATUS_CFG[s?.toUpperCase()]||STATUS_CFG.CREATED;
const fmtAge=d=>{if(!d)return'—';const s=(Date.now()-new Date(d))/1000;if(s<300)return'Online';if(s<3600)return`${~~(s/60)}m ago`;if(s<86400)return`${~~(s/3600)}h ago`;return`${~~(s/86400)}d ago`;};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({user,size=40,radius='rounded-full'}) {
  const [err,setErr]=useState(false);
  if(user?.avatar_url&&!err) return(
    <img src={user.avatar_url.startsWith('/')?`${API_URL}${user.avatar_url}`:user.avatar_url}
      onError={()=>setErr(true)} alt={user.username}
      className={`object-cover flex-shrink-0 ${radius}`} style={{width:size,height:size}}/>
  );
  return(
    <div className={`flex-shrink-0 flex items-center justify-center font-black text-white ${radius}`}
      style={{width:size,height:size,backgroundColor:C.green,fontSize:size*0.38}}>
      {(user?.username||'?').charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Feedback modal ───────────────────────────────────────────────────────────
function FeedbackModal({name,onClose,onSubmit,submitting}) {
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState('');
  const [hover,setHover]=useState(0);
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 text-white text-center"
          style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
          <Star size={36} className="mx-auto mb-2 fill-yellow-400 text-yellow-400"/>
          <h2 className="text-lg font-black">Rate Your Trade</h2>
          <p className="text-white/70 text-xs mt-1">How was trading with {name}?</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s=>(
              <button key={s} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(s)}
                className="transition transform hover:scale-110">
                <Star size={32} className={s<=(hover||rating)?'fill-yellow-400 text-yellow-400':'text-gray-200'}/>
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e=>setComment(e.target.value)}
            placeholder="Share your experience… (optional)" rows={3}
            className="w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none resize-none"
            style={{borderColor:C.g200}}/>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
              style={{borderColor:C.g200,color:C.g600}}>Skip</button>
            <button onClick={()=>onSubmit(rating,comment)} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-white font-black text-sm disabled:opacity-50"
              style={{backgroundColor:C.gold,color:C.forest}}>
              {submitting?'Submitting…':'Submit ✅'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────
function CancelModal({onClose,onConfirm,submitting}) {
  const [reason,setReason]=useState('');
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{color:C.danger}}/>
          <h2 className="text-base font-black">Cancel Trade?</h2>
        </div>
        <p className="text-xs text-gray-500">This will release the escrow back to the seller. Please provide a reason.</p>
        <textarea value={reason} onChange={e=>setReason(e.target.value)}
          placeholder="Reason for cancellation…" rows={3}
          className="w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none resize-none"
          style={{borderColor:C.g200}}/>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm border"
            style={{borderColor:C.g200,color:C.g600}}>Back</button>
          <button onClick={()=>onConfirm(reason)} disabled={!reason.trim()||submitting}
            className="flex-1 py-2.5 rounded-xl text-white font-black text-sm disabled:opacity-40"
            style={{backgroundColor:C.danger}}>
            {submitting?'Cancelling…':'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image viewer ─────────────────────────────────────────────────────────────
function ImgModal({src,onClose}) {
  return(
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <img src={src} alt="Proof" className="max-w-full max-h-screen object-contain rounded-xl"/>
      <button onClick={onClose} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"><X size={20}/></button>
    </div>
  );
}

// ─── User profile popup ───────────────────────────────────────────────────────
function ProfilePopup({user,label,onClose}) {
  if(!user) return null;
  const badge=deriveBadge(user);
  const flag=isoToFlag(user.country||'');
  const rating=parseFloat(user.average_rating||0);
  const seen=fmtAge(user.last_login||user.updated_at);
  const online=seen==='Online';
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={onClose}>
      <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="relative p-5 text-white"
          style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={13} className="text-white"/>
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar user={user} size={52} radius="rounded-2xl"/>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{backgroundColor:online?C.online:C.g400}}/>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-lg">{user.username}</h3>
                {user.kyc_verified&&<BadgeCheck size={14} style={{color:'#93C5FD'}}/>}
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{backgroundColor:badge.color,color:'#fff'}}>
                {badge.icon} {badge.label}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5 mb-1">
            {[1,2,3,4,5].map(s=><Star key={s} size={14} className={s<=Math.round(rating)?'fill-yellow-400 text-yellow-400':'text-white/30'}/>)}
            <span className="text-white font-bold text-xs ml-1">{rating.toFixed(1)}</span>
          </div>
          <p className="text-white/60 text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:online?C.online:C.g400}}/>{seen}
            {user.country&&<span className="ml-2">{flag} {user.country}</span>}
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(()=>{
              // Normalize completion: could be 0.21 or 21.4 or 21.428571...
              const raw = parseFloat(user.completion_rate||0);
              const comp = (raw > 0 && raw <= 1) ? (raw*100).toFixed(1) : raw.toFixed(1);
              return [
                {label:'Trades',     value:fmt(user.total_trades||0),        color:C.green},
                {label:'Rating',     value:`${rating.toFixed(1)}★`,           color:C.warn},
                {label:'Completion', value:`${comp}%`,                        color:C.success},
                {label:'Reviews',    value:fmt(user.feedback_count||0),       color:C.paid},
              ];
            })().map(s=>(
              <div key={s.label} className="text-center p-2.5 rounded-xl" style={{backgroundColor:C.g50}}>
                <p className="font-black text-sm" style={{color:s.color}}>{s.value}</p>
                <p className="text-[9px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-0 border-t pt-2" style={{borderColor:C.g100}}>
            {[
              {label:'Location',     value:`${flag} ${user.country||'—'}`},
              {label:'Member since', value:user.created_at?new Date(user.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'—'},
              {label:'Identity',     value:user.kyc_verified?'✅ KYC Verified':'Not verified'},
              {label:'Response',     value:'< 5 minutes'},
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between text-xs py-1.5 border-b last:border-0"
                style={{borderColor:C.g50}}>
                <span style={{color:C.g400}}>{label}</span>
                <span className="font-bold" style={{color:C.g700}}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center mt-2" style={{color:C.g400}}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Offer terms accordion ────────────────────────────────────────────────────
function OfferTerms({trade}) {
  const [open,setOpen]=useState(false);
  const terms=trade?.trade_instructions||trade?.listing_terms||trade?.offer_terms||
    'Standard trade rules apply. Send payment within the time limit and click "I Have Paid". Include trade ID as reference.';
  return(
    <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{borderColor:C.g200}}>
      <button onClick={()=>setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition">
        <FileText size={13} style={{color:C.green}}/>
        <span className="text-xs font-bold flex-1" style={{color:C.g700}}>Trade Instructions</span>
        {open?<ChevronUp size={12} style={{color:C.g400}}/>:<ChevronDown size={12} style={{color:C.g400}}/>}
      </button>
      {open&&(
        <div className="border-t px-3 pb-3 pt-2 text-xs leading-relaxed whitespace-pre-wrap"
          style={{borderColor:C.g100,color:C.g600}}>
          {terms}
        </div>
      )}
    </div>
  );
}

// ─── Main Trade Detail ────────────────────────────────────────────────────────
export default function TradeDetail({user}) {
  const {id}       = useParams();
  const navigate   = useNavigate();
  const msgEnd     = useRef(null);
  const fileRef    = useRef(null);
  const scrolled   = useRef(false);

  const [trade,     setTrade]     = useState(null);
  const [seller,    setSeller]    = useState(null);
  const [buyer,     setBuyer]     = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [sending,   setSending]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [uploading, setUploading] = useState(false);
  const [images,    setImages]    = useState([]);
  const [timeLeft,  setTimeLeft]  = useState(null);
  const [showCancel,setShowCancel]= useState(false);
  const [showFb,    setShowFb]    = useState(false);
  const [imgSrc,    setImgSrc]    = useState(null);
  const [fbSub,     setFbSub]     = useState(false);
  const [profUser,  setProfUser]  = useState(null);
  const [profLabel, setProfLabel] = useState('');
  const [loadErr,   setLoadErr]   = useState(false);
  const [infoOpen,  setInfoOpen]  = useState(false);

  const status = (trade?.status||'').toUpperCase();
  const isBuyer     = user&&trade&&String(user.id)===String(trade.buyer_id);
  const isSeller    = user&&trade&&String(user.id)===String(trade.seller_id);
  const isCompleted = status==='COMPLETED';
  const isCancelled = status==='CANCELLED';
  const isDisputed  = status==='DISPUTED';
  const isPaid      = ['PAYMENT_SENT','PAID'].includes(status);
  const isEscrow    = ['CREATED','FUNDS_LOCKED','ESCROW','ACTIVE','OPEN'].includes(status);
  const isActive    = !isCompleted&&!isCancelled;
  const cfg         = getS(status);
  const CfgIcon     = cfg.icon;
  const tradeAge    = trade?.created_at ? (()=>{
    const diff=Math.floor((Date.now()-new Date(trade.created_at))/1000);
    if(diff<3600)return`${Math.floor(diff/60)} min ago`;
    if(diff<86400)return`${Math.floor(diff/3600)}h ago`;
    return`${Math.floor(diff/86400)}d ago`;
  })() : '—';

  useEffect(()=>{
    if(!user){navigate('/login');return;}
    if(!id)return;
    loadAll();
    const iv=setInterval(()=>{refreshTrade();loadMessages();},5000);
    return()=>clearInterval(iv);
  },[id,user]);

  useEffect(()=>{
    if(!trade?.created_at||!isActive)return;
    const mins=parseInt(trade.time_limit||45);
    const iv=setInterval(()=>{
      const rem=Math.max(0,Math.floor((new Date(trade.created_at).getTime()+mins*60000-Date.now())/1000));
      setTimeLeft(rem);
      if(rem<=0&&isEscrow)autoCancel();
    },1000);
    return()=>clearInterval(iv);
  },[trade?.created_at,status]);

  useEffect(()=>{
    if(isCompleted&&!trade?.user_gave_feedback){
      const t=setTimeout(()=>setShowFb(true),1500);
      return()=>clearTimeout(t);
    }
  },[isCompleted]);

  useEffect(()=>{
    if(messages.length>0&&scrolled.current) msgEnd.current?.scrollIntoView({behavior:'smooth'});
  },[messages]);

  const loadAll=async()=>{
    await loadTrade();
    await loadMessages();
    await loadImages();
  };

  const loadTrade=async()=>{
    if(!id)return;
    try{
      setLoadErr(false);
      const r=await axios.get(`${API_URL}/trades/${id}`,{headers:authH()});
      const t=r.data.trade;
      setTrade(t);
      if(t.seller_id)try{const s=await axios.get(`${API_URL}/users/${t.seller_id}`,{headers:authH()});setSeller(s.data.user||s.data);}catch{}
      if(t.buyer_id) try{const b=await axios.get(`${API_URL}/users/${t.buyer_id}`, {headers:authH()});setBuyer(b.data.user||b.data);}catch{}
    }catch(e){
      setLoadErr(true);
      if(e.response?.status===400)toast.error('Trade not found');
      else toast.error('Failed to load trade');
    }finally{setLoading(false);}
  };

  const refreshTrade=async()=>{
    if(!id)return;
    try{
      const r=await axios.get(`${API_URL}/trades/${id}`,{headers:authH()});
      setTrade(r.data.trade);
    }catch{}
  };

  const loadMessages=async()=>{
    if(!id)return;
    try{
      const r=await axios.get(`${API_URL}/messages/${id}`,{headers:authH()});
      const msgs=r.data.messages||[];
      setMessages(msgs);
      if(!scrolled.current&&msgs.length>0){
        scrolled.current=true;
        setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'auto'}),100);
      }
    }catch{}
  };

  const loadImages=async()=>{
    if(!id)return;
    try{const r=await axios.get(`${API_URL}/trades/${id}/images`,{headers:authH()});setImages(r.data.images||[]);}catch{}
  };

  const postSys=async(text)=>{
    try{await axios.post(`${API_URL}/messages`,{tradeId:id,message:text},{headers:authH()});await loadMessages();}catch{}
  };

  const sendMessage=async(e)=>{
    e.preventDefault();
    if(!msg.trim())return;
    setSending(true);
    try{
      await axios.post(`${API_URL}/messages`,{tradeId:id,message:msg},{headers:authH()});
      setMsg('');await loadMessages();
      setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:'smooth'}),100);
    }catch{toast.error('Send failed');}
    finally{setSending(false);}
  };

  const uploadImage=async(file)=>{
    if(!file||!file.type.startsWith('image/')){toast.error('Select an image');return;}
    if(file.size>5*1024*1024){toast.error('Max 5MB');return;}
    setUploading(true);
    try{
      const b64=await new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.onerror=rej;rd.readAsDataURL(file);});
      await axios.post(`${API_URL}/trades/${id}/upload-image`,{image:b64,type:isBuyer?'payment':'giftcard'},{headers:authH()});
      await postSys(`📸 ${isBuyer?'Payment proof':'Proof'} uploaded by ${isBuyer?'Buyer':'Seller'}`);
      toast.success('Uploaded!');await loadImages();await loadMessages();
    }catch{toast.error('Upload failed');}
    finally{setUploading(false);if(fileRef.current)fileRef.current.value='';}
  };

  const markPaid=async()=>{
    if(!window.confirm('Have you sent the payment? This cannot be undone.'))return;
    setSubmitting(true);
    try{
      await axios.post(`${API_URL}/trades/${id}/mark-paid`,{},{headers:authH()});
      await postSys('💰 Buyer confirmed payment sent. Seller: verify and release Bitcoin.');
      toast.success('Payment confirmed!');await loadTrade();
    }catch(e){toast.error(e?.response?.data?.error||'Failed');}
    finally{setSubmitting(false);}
  };

  const releaseBtc=async()=>{
    if(!window.confirm('Release Bitcoin to buyer? ONLY after confirming payment received. Cannot be undone.'))return;
    setSubmitting(true);
    try{
      await axios.post(`${API_URL}/trades/${id}/release`,{},{headers:authH()});
      await postSys('🎉 TRADE COMPLETE! Bitcoin has been released to buyer. 0.5% fee deducted by escrow.');
      toast.success('Bitcoin released! Trade complete.');await loadTrade();
    }catch(e){toast.error(e?.response?.data?.error||'Failed');}
    finally{setSubmitting(false);}
  };

  const cancelTrade=async(reason)=>{
    setSubmitting(true);
    try{
      await axios.post(`${API_URL}/trades/${id}/cancel`,{reason},{headers:authH()});
      await postSys(`❌ Trade cancelled. Reason: ${reason}. Escrow funds returned.`);
      toast.info('Cancelled');setShowCancel(false);await loadTrade();
    }catch(e){
      console.error('Cancel trade error:', e);
      toast.error(e?.response?.data?.error || 'Failed to cancel trade. Please try again.');
    }
    finally{setSubmitting(false);}
  };

  const autoCancel=async()=>{
    try{
      await axios.post(`${API_URL}/trades/${id}/auto-cancel`,{reason:'Time expired'},{headers:authH()});
      toast.warning('Trade auto-cancelled — time expired');await loadTrade();
    }catch(e){console.error('Auto cancel error:',e);}
  };

  const openDispute=async()=>{
    const reason=window.prompt('Please explain why you are opening a dispute:');
    if(!reason?.trim()){toast.error('Please provide a reason');return;}
    if(!window.confirm('Open a dispute? A moderator will review within 24h.'))return;
    try{
      await axios.post(`${API_URL}/trades/${id}/dispute`,{reason},{headers:authH()});
      await postSys(`🚨 DISPUTE OPENED. Reason: ${reason}. Moderator will review within 24 hours.`);
      toast.warning('Dispute opened.');await loadTrade();
    }catch{toast.error('Failed');}
  };

  const submitFeedback=async(rating,comment)=>{
    setFbSub(true);
    try{
      await axios.post(`${API_URL}/trades/${id}/feedback`,{rating,comment,toUserId:isBuyer?trade.seller_id:trade.buyer_id},{headers:authH()});
      toast.success('Feedback submitted!');setShowFb(false);await loadTrade();
    }catch(e){toast.error(e?.response?.data?.error||'Failed');}
    finally{setFbSub(false);}
  };

  const fmtTimer=s=>{
    if(s===null||s===undefined)return'--:--';
    if(s<=0)return'00:00';
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
    return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
      :`${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
  };

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 animate-spin mx-auto" style={{borderColor:C.sage,borderTopColor:'transparent'}}/>
        <p className="text-sm font-semibold" style={{color:C.green}}>Loading trade…</p>
      </div>
    </div>
  );

  if(loadErr||!trade) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg max-w-md">
        <AlertCircle size={56} style={{color:C.danger}} className="mx-auto"/>
        <p className="font-black text-xl" style={{color:C.forest}}>Trade not found</p>
        <p className="text-sm text-gray-500">This trade doesn't exist or you don't have access.</p>
        <button onClick={()=>navigate('/dashboard')} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{backgroundColor:C.green}}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  // ── REAL DATA CALCULATIONS ──────────────────────────────────────────────────
  const shortId    = (trade.id||'').slice(0,8).toUpperCase();
  const cur        = trade.currency||'USD';
  const sym        = trade.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate    = USD_RATES[cur]||1;
  const btcGross   = parseFloat(trade.amount_btc||0);
  const usdAmt     = parseFloat(trade.amount_usd||0);
  const localAmt   = trade.local_amount||(usdAmt*usdRate);
  // ── ESCROW FEE: 0.5% deducted AUTOMATICALLY ──────────────────────────────
  const FEE_RATE   = 0.005;                              // 0.5%
  const feeBtc     = btcGross * FEE_RATE;                // 0.5% in BTC → goes to company wallet
  const btcNet     = btcGross - feeBtc;                  // what buyer actually receives
  const feeUsd     = feeBtc * (btcGross>0?(usdAmt/btcGross):0);
  const timeLimit  = parseInt(trade.time_limit||45);
  const urgent     = timeLeft!==null&&timeLeft<300&&timeLeft>0;
  const payMethod  = trade.payment_method||'Mobile Money';
  // Rate for Trade Info section (local currency per BTC)
  const rateLocal  = usdAmt>0&&btcGross>0 ? (usdAmt/btcGross)*usdRate : 0;

  // Counterparty
  const cp         = isBuyer?seller:buyer;
  const cpBadge    = deriveBadge(cp);
  const cpSeen     = fmtAge(cp?.last_login||cp?.updated_at);
  const cpOnline   = cpSeen==='Online';

  const showMarkPaid  = isBuyer&&isEscrow&&isActive;
  const showRelease   = isSeller&&isPaid&&isActive;
  const showCancelBtn = isBuyer&&isEscrow&&isActive;
  const showDispute   = isActive&&!isDisputed&&(isBuyer||isSeller);

  return(
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 py-3">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] mb-3" style={{color:C.g400}}>
          <button onClick={()=>navigate('/dashboard')} className="hover:underline flex items-center gap-1">
            <ArrowLeft size={10}/>Dashboard
          </button>
          <ChevronRight size={10}/>
          <span className="font-semibold" style={{color:C.g700}}>Trade #{shortId}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-3" style={{height:'calc(100vh - 80px)'}}>

          {/* ── LEFT PANEL ───────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-3 overflow-y-auto pb-3"
            style={{maxHeight:'calc(100vh - 80px)'}}>

            {/* ── TRADE SUMMARY ────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden shadow-sm border" style={{borderColor:C.g200}}>
              <div className="text-white px-4 py-4"
                style={{background:`linear-gradient(135deg,${C.forest},${C.green})`}}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider">Trade Summary</p>
                    <p className="font-mono text-xs text-white/60 mt-0.5">#{shortId}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
                    <CfgIcon size={11}/>
                    <span className="text-[10px] font-black">{cfg.label}</span>
                  </div>
                </div>

                {/* Big amount row */}
                <div className="mb-3 p-3 rounded-xl" style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
                  <p className="text-white/60 text-[9px] uppercase tracking-wide mb-0.5">
                    {isBuyer?'You Pay':'Buyer Pays'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-2xl" style={{color:C.gold}}>
                      {sym}{fmt(localAmt)}
                    </span>
                    <span className="text-white/50 text-xs">≈ {fmtUsd(usdAmt)}</span>
                  </div>
                </div>

                {/* Escrow breakdown — real math */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">🔒 Escrow (BTC gross)</span>
                    <span className="font-black text-white">₿ {fmtBtc(btcGross)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">PRAQEN fee (0.5%)</span>
                    <span className="text-white/60">−₿ {fmtBtc(feeBtc)}</span>
                  </div>
                  <div className="w-full h-px bg-white/20"/>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 font-bold">
                      {isBuyer?'✅ You Receive':'✅ Buyer Gets'}
                    </span>
                    <span className="font-black" style={{color:C.gold}}>₿ {fmtBtc(btcNet)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50">Fee (USD equiv.)</span>
                    <span className="text-white/50">{fmtUsd(feeUsd)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={11} className="text-white/60"/>
                    <span className="text-white/60">Via {payMethod}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${urgent?'animate-pulse':''}`}>
                    <Timer size={11} className={urgent?'text-red-300':'text-white/60'}/>
                    <span className={`font-black ${urgent?'text-red-200':'text-white/60'}`}>
                      {fmtTimer(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow fee note */}
              <div className="px-4 py-2.5 flex items-center gap-2 border-t"
                style={{borderColor:C.g100,backgroundColor:`${C.success}08`}}>
                <Lock size={11} style={{color:C.success}}/>
                <p className="text-[10px]" style={{color:C.success}}>
                  <strong>0.5% auto-deducted</strong> to PRAQEN on completion. Your funds safe until you confirm.
                </p>
              </div>
            </div>

            {/* ── COUNTERPARTY CARD ────────────────────────────────────── */}
            <button
              onClick={()=>{setProfUser(cp);setProfLabel(isBuyer?'Seller':'Buyer');}}
              className="w-full bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition text-left"
              style={{borderColor:C.g200}}>
              <div className="h-1" style={{background:`linear-gradient(90deg,${C.green},${C.sage})`}}/>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black uppercase tracking-wider" style={{color:C.g400}}>
                    {isBuyer?'👤 Seller':'👤 Buyer'}
                  </p>
                  <p className="text-[9px]" style={{color:C.g400}}>Tap to view profile</p>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar user={cp} size={44}/>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{backgroundColor:cpOnline?C.online:C.g400}}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-sm" style={{color:C.forest}}>{cp?.username||'—'}</p>
                      {cp?.kyc_verified&&<BadgeCheck size={12} style={{color:C.paid}}/>}
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm text-white"
                        style={{backgroundColor:cpBadge.color}}>{cpBadge.label}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={9} className="fill-yellow-400 text-yellow-400"/>
                      <span className="text-xs font-bold" style={{color:C.g700}}>{parseFloat(cp?.average_rating||0).toFixed(1)}</span>
                      <span className="text-[10px]" style={{color:C.g400}}>· {fmt(cp?.total_trades||0)} trades</span>
                      <span className="text-[10px] ml-1" style={{color:cpOnline?C.online:C.g400}}>{cpSeen}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {l:'Completion',v:`${parseFloat(cp?.completion_rate||98).toFixed(1)}%`,c:C.success},
                    {l:'Response', v:'<5 min',                       c:C.paid},
                    {l:'Reviews',  v:fmt(cp?.feedback_count||0),     c:C.warn},
                  ].map(s=>(
                    <div key={s.l} className="p-2 text-center rounded-xl" style={{backgroundColor:C.g50}}>
                      <p className="font-black text-xs" style={{color:s.c}}>{s.v}</p>
                      <p className="text-[8px] text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </button>

            {/* ── TRADE PROGRESS ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm p-4" style={{borderColor:C.g200}}>
              <p className="text-[9px] font-black uppercase tracking-wider mb-3" style={{color:C.g400}}>📋 Trade Progress</p>
              <div className="space-y-2.5">
                {[
                  {label:'Trade opened — BTC locked in escrow', done:true},
                  {label:'Buyer sends payment via '+payMethod,   done:isPaid||isCompleted},
                  {label:'Seller confirms payment received',     done:isPaid||isCompleted},
                  {label:'Bitcoin released (0.5% fee deducted)', done:isCompleted},
                ].map(({label,done},i)=>(
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{backgroundColor:done?C.green:C.g200}}>
                      {done?<Check size={11} className="text-white"/>
                        :<div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:C.g400}}/>}
                    </div>
                    <span className="text-xs leading-tight"
                      style={{color:done?C.g700:C.g400,fontWeight:done?600:400}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ACTION BUTTONS ───────────────────────────────────────── */}
            <div className="space-y-2">
              {showMarkPaid&&(
                <button onClick={markPaid} disabled={submitting}
                  className="w-full py-4 rounded-xl font-black text-base shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  style={{backgroundColor:C.gold,color:C.forest}}>
                  {submitting?<><RefreshCw size={16} className="animate-spin"/>Processing…</>
                    :<><Check size={18}/>✅ I HAVE PAID</>}
                </button>
              )}
              {showRelease&&(
                <button onClick={releaseBtc} disabled={submitting}
                  className="w-full py-4 rounded-xl text-white font-black text-base shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                  style={{backgroundColor:C.green}}>
                  {submitting?<><RefreshCw size={16} className="animate-spin"/>Processing…</>
                    :<><Bitcoin size={18}/>🔓 RELEASE BITCOIN</>}
                </button>
              )}
              {isSeller&&isEscrow&&isActive&&(
                <div className="p-3 rounded-xl text-center text-xs font-semibold border border-dashed"
                  style={{color:C.paid,borderColor:`${C.paid}50`,backgroundColor:`${C.paid}08`}}>
                  ⏳ Waiting for buyer to send payment…
                </div>
              )}
              {isBuyer&&isPaid&&(
                <div className="p-3 rounded-xl text-center text-xs font-semibold border"
                  style={{color:C.success,borderColor:`${C.success}30`,backgroundColor:`${C.success}08`}}>
                  ✅ Payment confirmed — awaiting Bitcoin release
                </div>
              )}
              {showDispute&&(
                <button onClick={openDispute}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 hover:bg-red-50 transition"
                  style={{borderColor:`${C.danger}40`,color:C.danger}}>
                  <Flag size={12}/> Open Dispute
                </button>
              )}
              {showCancelBtn&&(
                <button onClick={()=>setShowCancel(true)}
                  className="w-full py-2 rounded-xl font-semibold text-xs border hover:bg-gray-50 transition"
                  style={{borderColor:C.g200,color:C.g500}}>
                  Cancel Trade
                </button>
              )}
              {isCompleted&&(
                <div className="py-4 px-5 rounded-xl text-center text-white shadow"
                  style={{background:`linear-gradient(135deg,${C.forest},${C.mint})`}}>
                  <CheckCircle size={24} className="mx-auto mb-1"/>
                  <p className="font-black text-sm">Trade Complete 🎉</p>
                  <p className="text-[10px] text-white/60 mt-0.5">0.5% fee auto-collected by escrow</p>
                  {!trade?.user_gave_feedback&&(
                    <button onClick={()=>setShowFb(true)} className="mt-2 text-[11px] underline text-white/80">
                      Leave feedback →
                    </button>
                  )}
                </div>
              )}
              {isCancelled&&(
                <div className="py-3 px-5 rounded-xl text-center border" style={{backgroundColor:C.g100,borderColor:C.g200}}>
                  <X size={20} className="mx-auto mb-1" style={{color:C.g500}}/>
                  <p className="font-bold text-sm" style={{color:C.g700}}>Trade Cancelled</p>
                  <p className="text-[10px] mt-0.5" style={{color:C.g400}}>Escrow funds returned</p>
                </div>
              )}
              {isDisputed&&(
                <div className="py-3 px-5 rounded-xl text-center text-white"
                  style={{backgroundColor:C.danger}}>
                  <AlertTriangle size={20} className="mx-auto mb-1"/>
                  <p className="font-bold text-sm">Dispute Active</p>
                  <p className="text-[10px] text-white/70 mt-0.5">Moderator reviews within 24h</p>
                </div>
              )}
            </div>

            {/* Trade instructions accordion */}
            <OfferTerms trade={trade}/>

            {/* ── TRADE INFO + ACTIONS — single collapsible ─────────── */}
            {(()=>{

              return(
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{borderColor:C.g200}}>
                  {/* Accordion header */}
                  <button onClick={()=>setInfoOpen(!infoOpen)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition"
                    style={{borderBottom:infoOpen?`1px solid ${C.g100}`:'none'}}>
                    <Info size={13} style={{color:C.green}}/>
                    <span className="text-xs font-black flex-1 text-left" style={{color:C.forest}}>
                      Trade Info & Actions
                    </span>
                    <span className="text-[9px] font-mono mr-1" style={{color:C.g400}}>#{shortId}</span>
                    {infoOpen?<ChevronUp size={13} style={{color:C.g400}}/>:<ChevronDown size={13} style={{color:C.g400}}/>}
                  </button>

                  {infoOpen&&(
                    <div className="p-3 space-y-1">
                      {/* Info rows */}
                      {[
                        {label:'Trade ID',    val:<div className="flex items-center gap-1.5"><span className="font-mono font-bold text-[11px]" style={{color:C.forest}}>#{shortId}</span><button onClick={()=>{navigator.clipboard.writeText(trade.id||'');toast.success('Copied!');}} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100"><Copy size={10} style={{color:C.g400}}/></button></div>},
                        {label:'Offer',       val:<div className="flex items-center gap-1.5"><span className="font-mono font-bold text-[11px]" style={{color:C.g700}}>#{String(trade.listing_id||'').slice(0,8).toUpperCase()}</span><button onClick={()=>{navigator.clipboard.writeText(trade.listing_id||'');toast.success('Copied!');}} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100"><Copy size={10} style={{color:C.g400}}/></button></div>},
                        {label:'Started',     val:<span className="font-bold text-[11px]" style={{color:C.g700}}>{tradeAge}</span>},
                        {label:'Rate',        val:<span className="font-black text-[11px]" style={{color:C.forest}}>{sym}{fmt(rateLocal)} {cur}/BTC</span>},
                        {label:'Payment',     val:<span className="font-bold text-[11px]" style={{color:C.g700}}>{payMethod}</span>},
                        {label:'Status',      val:<span className="font-black text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:cfg.bg,color:cfg.color}}>{cfg.label}</span>},
                      ].map(({label,val})=>(
                        <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0 text-xs"
                          style={{borderColor:C.g50}}>
                          <span style={{color:C.g400}}>{label}</span>
                          {val}
                        </div>
                      ))}

                      {/* Actions */}
                      <div className="pt-2 space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{color:C.g400}}>Actions</p>

                        <button onClick={()=>{navigator.clipboard.writeText(trade.id||'');toast.success('Trade ID copied!');}}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition text-left border"
                          style={{borderColor:C.g100}}>
                          <Copy size={12} style={{color:C.paid}}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black" style={{color:C.g700}}>Copy Trade ID</p>
                            <p className="text-[9px] font-mono truncate" style={{color:C.g400}}>{(trade.id||'').slice(0,20)}…</p>
                          </div>
                        </button>

                        <button
                          onClick={()=>{
                            const reason=window.prompt('Describe the problem:');
                            if(!reason?.trim())return;
                            const sub=encodeURIComponent(`Trade Report: #${shortId}`);
                            const body=encodeURIComponent(`Trade ID: ${trade.id}\nOffer: ${trade.listing_id||'—'}\nProblem: ${reason}\nUser: ${user?.username||'—'}`);
                            window.open(`mailto:support@praqen.com?subject=${sub}&body=${body}`,'_blank');
                            toast.info('Email opened to report trade');
                          }}
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-red-50 transition text-left border"
                          style={{borderColor:C.g100}}>
                          <Flag size={12} style={{color:C.danger}}/>
                          <p className="text-[11px] font-black" style={{color:C.danger}}>Report a Problem</p>
                        </button>

                        <a href="https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t"
                          target="_blank" rel="noopener noreferrer"
                          className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-green-50 transition border"
                          style={{borderColor:C.g100}}>
                          <MessageCircle size={12} style={{color:C.success}}/>
                          <p className="text-[11px] font-black" style={{color:C.forest}}>Reach PRAQEN Support</p>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Escrow info */}
            <div className="bg-white rounded-2xl border p-4 space-y-1.5" style={{borderColor:C.g200}}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={13} style={{color:C.green}}/>
                <span className="text-xs font-black" style={{color:C.forest}}>Escrow Protection</span>
              </div>
              {[
                '🔒 BTC locked in escrow when trade opens',
                '💰 Buyer pays via agreed payment method',
                '✅ Seller confirms → releases BTC to buyer',
                '💸 0.5% fee auto-deducted to PRAQEN wallet',
                '🚨 Open dispute if problem — resolved in 24h',
              ].map(t=><p key={t} className="text-[10px]" style={{color:C.g600}}>{t}</p>)}
            </div>
          </div>

          {/* ── CHAT COLUMN ──────────────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col" style={{maxHeight:'calc(100vh - 80px)'}}>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col flex-1"
              style={{borderColor:C.g200}}>

              {/* ── RICH TRADE HEADER ───────────────────────────────── */}
              <div className="flex-shrink-0 border-b overflow-hidden"
                style={{borderColor:C.g100, background:`linear-gradient(135deg,${C.forest} 0%,${C.green} 100%)`}}>
                {/* Top row: user + score + timer + status */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Counterparty avatar */}
                    <div className="relative">
                      <Avatar user={cp} size={36} radius="rounded-xl"/>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{borderColor:C.forest,backgroundColor:cpOnline?C.online:C.g400}}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{cp?.username||'—'}</span>
                        {cp?.kyc_verified&&<BadgeCheck size={13} style={{color:'#93C5FD'}}/>}
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm text-white"
                          style={{backgroundColor:cpBadge.color}}>{cpBadge.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        {/* Real completion rate */}
                        <span className="font-bold" style={{color:'#86EFAC'}}>
                          👍 {parseFloat(cp?.completion_rate||98).toFixed(1)}%
                        </span>
                        <span className="text-white/40">·</span>
                        <span style={{color:'rgba(255,255,255,0.6)'}}>{fmt(cp?.total_trades||0)} Trades</span>
                        <span className="text-white/40">·</span>
                        <span style={{color:cpOnline?'#86EFAC':'rgba(255,255,255,0.45)'}}>{cpSeen}</span>
                      </div>
                    </div>
                  </div>
                  {/* Timer + status */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
                      <CfgIcon size={11} className="text-white/80"/>
                      <span className="text-[10px] font-bold text-white/80">{cfg.label}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm ${urgent?'animate-pulse':''}`}
                      style={{backgroundColor:urgent?C.danger:'rgba(255,255,255,0.2)',color:'#fff'}}>
                      <Timer size={13}/>{fmtTimer(timeLeft)}
                    </div>
                  </div>
                </div>

                {/* ── BIG TRADE AMOUNT ROW ────────────────────────────── */}
                <div className="mx-4 mb-3 p-3 rounded-2xl"
                  style={{backgroundColor:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Action label */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl font-black text-xs"
                        style={{backgroundColor:isBuyer?C.gold:'#F97316',color:isBuyer?C.forest:'#fff'}}>
                        {isBuyer?'🛒 BUYING':'💰 SELLING'}
                      </div>
                    </div>

                    {/* BTC amount */}
                    <div className="flex items-center gap-1.5">
                      <Bitcoin size={16} style={{color:C.gold}}/>
                      <span className="font-black text-xl" style={{color:C.gold}}>
                        {fmtBtc(btcNet)}
                      </span>
                      <span className="text-white/60 text-xs font-bold">BTC</span>
                    </div>

                    {/* Arrow */}
                    <span className="text-white/50 font-bold text-lg">⇄</span>

                    {/* Local currency */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xl text-white">{sym}{fmt(localAmt)}</span>
                      <span className="text-white/60 text-xs font-bold">{cur}</span>
                    </div>

                    {/* Payment method */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{backgroundColor:'rgba(255,255,255,0.15)'}}>
                      <CreditCard size={12} className="text-white/70"/>
                      <span className="text-xs font-black text-white">{payMethod}</span>
                    </div>
                  </div>

                  {/* Fee note inline */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[10px]">
                    <span style={{color:'rgba(255,255,255,0.5)'}}>
                      Escrow gross: ₿{fmtBtc(btcGross)} · Fee 0.5%: −₿{fmtBtc(feeBtc)}
                    </span>
                    <span style={{color:'rgba(255,255,255,0.5)'}}>≈ {fmtUsd(usdAmt)}</span>
                  </div>
                </div>
              </div>

              {/* Dispute active banner */}
              {isDisputed&&(
                <div className="px-4 py-2 border-b flex-shrink-0 flex items-center justify-center gap-2"
                  style={{backgroundColor:'#EDE9FE',borderColor:'#8B5CF6'}}>
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"/>
                  <Shield size={12} style={{color:'#6D28D9'}}/>
                  <span className="text-[11px] font-bold" style={{color:'#6D28D9'}}>
                    👨‍⚖️ Dispute active — Moderator reviewing within 24h
                  </span>
                </div>
              )}

              {/* ── PINNED TRADE INFO STRIP (above chat, not inside messages) ── */}
              <div className="flex-shrink-0 border-b px-4 py-2.5"
                style={{borderColor:C.g100, backgroundColor:`${C.green}06`}}>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Buying/Selling label */}
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl"
                    style={{
                      backgroundColor:isBuyer?`${C.gold}20`:`${C.forest}12`,
                      color:isBuyer?C.forest:C.green,
                      border:`1.5px solid ${isBuyer?C.gold:C.green}`,
                    }}>
                    {isBuyer?'🛒 BUYING':'💰 SELLING'}
                  </span>

                  {/* BTC */}
                  <div className="flex items-center gap-1">
                    <Bitcoin size={13} style={{color:C.gold}}/>
                    <span className="font-black text-sm" style={{color:C.forest}}>{fmtBtc(btcNet)}</span>
                    <span className="text-[10px] font-bold" style={{color:C.g400}}>BTC</span>
                  </div>

                  <span className="font-black text-base" style={{color:C.g300}}>for</span>

                  {/* Local amount */}
                  <div className="flex items-center gap-1">
                    <span className="font-black text-sm" style={{color:C.forest}}>{sym}{fmt(localAmt)}</span>
                    <span className="text-[10px] font-bold" style={{color:C.g400}}>{cur}</span>
                  </div>

                  {/* Payment method */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg ml-auto"
                    style={{backgroundColor:C.g100,border:`1px solid ${C.g200}`}}>
                    <CreditCard size={11} style={{color:C.paid}}/>
                    <span className="text-[11px] font-black" style={{color:C.g700}}>{payMethod}</span>
                  </div>
                </div>

                {/* Warning strip */}
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{backgroundColor:isBuyer?'#FFF8E1':'#FFF3F3',
                           border:`1px solid ${isBuyer?'#FDE68A':C.danger+'30'}`}}>
                  <span className="text-sm flex-shrink-0">⚠️</span>
                  <p className="text-[10px] font-bold leading-tight" style={{color:isBuyer?'#92400E':C.danger}}>
                    {isBuyer
                      ?`Send ${sym}${fmt(localAmt)} ${cur} via ${payMethod}. Use payment details shared by seller in chat. Click ✅ I HAVE PAID when done.`
                      :`Share your ${payMethod} details below. Verify payment received in your actual account before releasing Bitcoin.`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{backgroundColor:'#F9FAFB',minHeight:0}}>

                {/* Proof images */}
                {images.length>0&&(
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] w-full font-bold" style={{color:C.g400}}>📎 Uploaded Proofs:</span>
                    {images.map((img,i)=>{
                      const src=img.image_url||img.url;
                      if(!src)return null;
                      const fullSrc=src.startsWith('http')?src:`${API_URL}${src}`;
                      return(
                        <button key={i} onClick={()=>setImgSrc(fullSrc)}
                          className="w-14 h-14 rounded-xl overflow-hidden border-2 hover:opacity-80 transition"
                          style={{borderColor:C.green}}>
                          <img src={fullSrc} alt="Proof" className="w-full h-full object-cover"
                            onError={e=>{e.target.style.display='none';}}/>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Messages */}
                {messages.length===0?(
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageCircle size={40} className="mb-2 opacity-15" style={{color:C.green}}/>
                    <p className="text-sm font-semibold" style={{color:C.g400}}>No messages yet</p>
                    <p className="text-xs" style={{color:C.g300}}>Start the conversation below</p>
                  </div>
                ):messages.map((m,i)=>{
                  const isOwn=String(m.sender_id)===String(user?.id);
                  const isMod=m.sender_role==='moderator';
                  const isSys=!m.sender_id||m.message_type==='SYSTEM'||m.sender_role==='system';
                  const text=m.message_text||m.message||'';

                  if(isSys) return(
                    <div key={i} className="flex justify-center">
                      <div className="px-4 py-2 rounded-xl text-[10px] max-w-[90%] text-center border"
                        style={{backgroundColor:C.g100,color:C.g500,borderColor:C.g200}}>
                        {text}
                      </div>
                    </div>
                  );

                  if(isMod) return(
                    <div key={i} className="flex justify-center">
                      <div className="max-w-[85%] rounded-2xl p-3 border shadow-sm"
                        style={{backgroundColor:'#EDE9FE',borderColor:'#8B5CF6'}}>
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                          <Shield size={12} style={{color:'#6D28D9'}}/>
                          <span className="text-[10px] font-black" style={{color:'#6D28D9'}}>MODERATOR</span>
                        </div>
                        <p className="text-xs text-center font-medium" style={{color:'#4C1D95'}}>{text}</p>
                        <p className="text-[9px] text-center mt-1" style={{color:'#6D28D9'}}>
                          {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );

                  return(
                    <div key={i} className={`flex ${isOwn?'justify-end':'justify-start'}`}>
                      {!isOwn&&(
                        <button onClick={()=>{setProfUser(cp);setProfLabel(isBuyer?'Seller':'Buyer');}}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mr-2 flex-shrink-0 self-end hover:opacity-80 transition"
                          style={{backgroundColor:C.mint,color:C.white}}>
                          {cp?.username?.charAt(0)?.toUpperCase()||'?'}
                        </button>
                      )}
                      <div className="max-w-[72%]">
                        {!isOwn&&<p className="text-[9px] font-bold mb-0.5 ml-1" style={{color:C.g400}}>{cp?.username}</p>}
                        <div className="px-4 py-2 text-sm break-words shadow-sm"
                          style={{
                            backgroundColor:isOwn?C.green:'#fff',
                            color:isOwn?'#fff':C.g800,
                            borderRadius:isOwn?'18px 18px 4px 18px':'4px 18px 18px 18px',
                            border:isOwn?'none':`1px solid ${C.g200}`,
                          }}>
                          {text}
                        </div>
                        <p className={`text-[9px] mt-0.5 ${isOwn?'text-right':'ml-1'}`} style={{color:C.g400}}>
                          {new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEnd}/>
              </div>

              {/* Input */}
              {isActive?(
                <div className="border-t p-3 flex-shrink-0" style={{borderColor:C.g100}}>
                  <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border-2 hover:bg-gray-50 disabled:opacity-40 flex-shrink-0 transition"
                      style={{borderColor:C.g200}}>
                      {uploading?<RefreshCw size={14} className="animate-spin" style={{color:C.green}}/>
                        :<Paperclip size={14} style={{color:C.g400}}/>}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e=>uploadImage(e.target.files[0])} className="hidden"/>
                    <input type="text" value={msg} onChange={e=>setMsg(e.target.value)}
                      placeholder={`Message ${cp?.username||'counterparty'}…`}
                      className="flex-1 px-4 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition"
                      style={{borderColor:msg?C.green:C.g200}}/>
                    <button type="submit" disabled={!msg.trim()||sending}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition disabled:opacity-30"
                      style={{backgroundColor:msg.trim()?C.green:C.g300}}>
                      {sending?<RefreshCw size={14} className="animate-spin"/>:<Send size={14}/>}
                    </button>
                  </form>
                  <p className="text-[10px] text-center mt-1.5" style={{color:C.g400}}>
                    📎 Attach payment proof · 🔒 All messages encrypted
                  </p>
                </div>
              ):(
                <div className="border-t p-3 text-center text-sm font-semibold flex-shrink-0"
                  style={{borderColor:C.g100,color:C.g400}}>
                  Chat closed — trade {isCompleted?'completed successfully ✅':'cancelled ❌'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="mt-4" style={{backgroundColor:C.forest}}>
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg"
                  style={{backgroundColor:C.gold,color:C.forest}}>P</div>
                <span className="text-white font-black" style={{fontFamily:"'Syne',sans-serif"}}>PRAQEN</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.4)'}}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  {href:'https://x.com/praqenapp?s=21',label:'𝕏',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.instagram.com/praqen?igsh=MTRkZWg2amp5YnJlYQ%3D%3D&utm_source=qr',label:'📸',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://www.linkedin.com/in/pra-qen-045373402/',label:'💼',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t',label:'💬',bg:'rgba(255,255,255,0.1)'},
                  {href:'https://discord.gg/V6zCZxfdy',label:'🎮',bg:'rgba(88,101,242,0.4)'},
                ].map(({href,label,bg})=>(
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition"
                    style={{backgroundColor:bg}}>
                    <span className="text-white font-black">{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Trade</p>
              <div className="space-y-2">
                {[['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Gift Cards','/gift-cards'],['My Trades','/my-trades']].map(([l,h])=>(
                  <a key={l} href={h} className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm mb-3">Community</p>
              <div className="space-y-2">
                {[
                  ['💬 WhatsApp Community','https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t"
            style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-[10px] flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% auto-deducted on completion
            </p>
          </div>
        </div>
      </footer>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {profUser&&<ProfilePopup user={profUser} label={profLabel} onClose={()=>setProfUser(null)}/>}
      {showFb&&<FeedbackModal name={cp?.username} onClose={()=>setShowFb(false)} onSubmit={submitFeedback} submitting={fbSub}/>}
      {showCancel&&<CancelModal onClose={()=>setShowCancel(false)} onConfirm={cancelTrade} submitting={submitting}/>}
      {imgSrc&&<ImgModal src={imgSrc} onClose={()=>setImgSrc(null)}/>}
    </div>
  );
}
