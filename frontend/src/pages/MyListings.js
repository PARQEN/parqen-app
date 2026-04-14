import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Edit, Trash2, Eye, Plus, RefreshCw, Bitcoin, DollarSign,
  Clock, CheckCircle, XCircle, AlertCircle, TrendingUp,
  TrendingDown, Save, X, Shield, Activity, BarChart3,
  ChevronDown, ChevronUp, Copy, Zap, ToggleLeft,
  ToggleRight, PauseCircle, PlayCircle, Filter, Search,
  ArrowRight, Gift
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
};

const USD_RATES = {GHS:11.85,NGN:1580,KES:130,ZAR:18.5,USD:1,GBP:0.79,EUR:0.92};
const CUR_SYM   = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',USD:'$',GBP:'£',EUR:'€'};
const fmt = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const fmtBtc = n => parseFloat(n||0).toFixed(6);
const authH = () => { const t=localStorage.getItem('token'); return t?{Authorization:`Bearer ${t}`}:{}; };

function isoToFlag(code) {
  if(!code||code.length!==2)return'🌍';
  return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(0x1F1E0+c.charCodeAt(0)-65));
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({status}) {
  const cfg = {
    ACTIVE: {label:'Active',   bg:'#ECFDF5', color:C.success},
    PAUSED: {label:'Paused',   bg:'#FFFBEB', color:C.warn},
    CLOSED: {label:'Closed',   bg:'#F1F5F9', color:C.g500},
  }[status]||{label:status, bg:C.g100, color:C.g500};
  return(
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{backgroundColor:cfg.bg, color:cfg.color}}>
      {cfg.label}
    </span>
  );
}

// ─── Margin badge ─────────────────────────────────────────────────────────────
function MarginBadge({margin}) {
  const m = parseFloat(margin||0);
  const color = m>0?C.danger:m<0?C.success:C.g500;
  const label = m===0?'Market':m>0?`+${m}%`:`${m}%`;
  return(
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{backgroundColor:`${color}15`, color}}>
      {label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({icon:Icon, label, value, color, sub}) {
  return(
    <div className="bg-white rounded-2xl border p-4 shadow-sm" style={{borderColor:C.g200}}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{backgroundColor:`${color}15`}}>
          <Icon size={15} style={{color}}/>
        </div>
      </div>
      <p className="text-xl font-black" style={{color:C.g800}}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{color:C.g500}}>{label}</p>
      {sub&&<p className="text-[10px] mt-0.5" style={{color:C.g400}}>{sub}</p>}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({listing, onClose, onSave, saving}) {
  const [form, setForm] = useState({
    margin:            parseFloat(listing.margin||0),
    min_limit_usd:     listing.min_limit_usd||10,
    max_limit_usd:     listing.max_limit_usd||1000,
    min_limit_local:   listing.min_limit_local||0,
    max_limit_local:   listing.max_limit_local||0,
    payment_method:    listing.payment_method||'',
    trade_instructions:listing.trade_instructions||'',
    listing_terms:     listing.listing_terms||'',
    time_limit:        listing.time_limit||30,
    status:            listing.status||'ACTIVE',
  });

  return(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)'}}>
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl border"
        style={{borderColor:C.g200}}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:C.g100}}>
          <h2 className="font-black text-base" style={{color:C.forest}}>Edit Offer</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X size={14} style={{color:C.g500}}/>
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              {name:'margin',          label:'Margin (%)',      type:'number', step:'0.5'},
              {name:'time_limit',      label:'Time Limit (min)',type:'number', step:'1'},
              {name:'min_limit_usd',   label:'Min USD',         type:'number'},
              {name:'max_limit_usd',   label:'Max USD',         type:'number'},
              {name:'min_limit_local', label:'Min Local',       type:'number'},
              {name:'max_limit_local', label:'Max Local',       type:'number'},
            ].map(({name,label,type,step})=>(
              <div key={name}>
                <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>{label}</label>
                <input type={type} step={step} value={form[name]}
                  onChange={e=>setForm({...form,[name]:e.target.value})}
                  className="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none"
                  style={{borderColor:C.g200}}/>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>Payment Method</label>
            <input type="text" value={form.payment_method}
              onChange={e=>setForm({...form,payment_method:e.target.value})}
              placeholder="e.g. MTN Mobile Money"
              className="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none"
              style={{borderColor:C.g200}}/>
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>Trade Instructions</label>
            <textarea value={form.trade_instructions}
              onChange={e=>setForm({...form,trade_instructions:e.target.value})}
              rows={3} placeholder="Instructions for buyers..."
              className="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none resize-none"
              style={{borderColor:C.g200}}/>
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>Listing Terms</label>
            <textarea value={form.listing_terms}
              onChange={e=>setForm({...form,listing_terms:e.target.value})}
              rows={2} placeholder="Any terms or conditions..."
              className="w-full px-3 py-2 text-sm border-2 rounded-xl focus:outline-none resize-none"
              style={{borderColor:C.g200}}/>
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block" style={{color:C.g600}}>Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[['ACTIVE','🟢 Active'],['PAUSED','⏸ Paused']].map(([val,lbl])=>(
                <button key={val} onClick={()=>setForm({...form,status:val})}
                  className="py-2.5 rounded-xl text-xs font-bold border-2 transition"
                  style={{
                    borderColor:form.status===val?C.green:C.g200,
                    backgroundColor:form.status===val?`${C.green}10`:'transparent',
                    color:form.status===val?C.green:C.g500,
                  }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex gap-2" style={{borderColor:C.g100}}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-bold hover:bg-gray-50"
            style={{borderColor:C.g200, color:C.g600}}>
            Cancel
          </button>
          <button onClick={()=>onSave(listing.id, form)} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            style={{backgroundColor:C.green}}>
            {saving?<><RefreshCw size={13} className="animate-spin"/>Saving…</>:<><Save size={13}/>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({listing, onEdit, onDelete, onToggle, onView}) {
  const [expanded, setExpanded] = useState(false);
  const margin = parseFloat(listing.margin||0);
  const cur    = listing.currency||'USD';
  const sym    = listing.currency_symbol||CUR_SYM[cur]||'$';
  const usdRate= USD_RATES[cur]||1;
  const isActive = listing.status==='ACTIVE';

  const minLocal = listing.min_limit_local||(listing.min_limit_usd?listing.min_limit_usd*usdRate:0);
  const maxLocal = listing.max_limit_local||(listing.max_limit_usd?listing.max_limit_usd*usdRate:0);
  const flag = isoToFlag(listing.country||'');

  return(
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isActive?'':'opacity-75'}`}
      style={{borderColor:isActive?`${C.green}30`:C.g200}}>

      {/* Active indicator strip */}
      <div className="h-0.5" style={{backgroundColor:isActive?C.green:C.g300}}/>

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:`${C.green}12`}}>
              {listing.gift_card_brand
                ? <Gift size={18} style={{color:'#0D9488'}}/>
                : <Bitcoin size={18} style={{color:C.gold}}/>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm" style={{color:C.forest}}>
                  {listing.gift_card_brand||listing.listing_type==='BUY'?'Buy BTC':'Sell BTC'} Offer
                </h3>
                <StatusBadge status={listing.status}/>
                <MarginBadge margin={margin}/>
              </div>
              <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{color:C.g400}}>
                <span className="font-mono">#{String(listing.id||'').slice(0,8).toUpperCase()}</span>
                <span>·</span>
                <span>{flag} {listing.country_name||listing.country||'—'}</span>
                <span>·</span>
                <span>Created {new Date(listing.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short'})}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={()=>onEdit(listing)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-50 border transition"
              style={{borderColor:C.g200}} title="Edit">
              <Edit size={13} style={{color:C.green}}/>
            </button>
            <button onClick={()=>onToggle(listing.id, listing.status)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-50 border transition"
              style={{borderColor:C.g200}} title={isActive?'Pause':'Activate'}>
              {isActive
                ? <PauseCircle size={13} style={{color:C.warn}}/>
                : <PlayCircle size={13} style={{color:C.success}}/>}
            </button>
            <button onClick={()=>onDelete(listing.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 border transition"
              style={{borderColor:C.g200}} title="Delete">
              <Trash2 size={13} style={{color:C.danger}}/>
            </button>
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {label:'Payment',    value:listing.payment_method||'—',           color:C.paid},
            {label:'Rate',       value:`${sym}${fmt(parseFloat(listing.bitcoin_price||0)*usdRate)} ${cur}`, color:C.forest},
            {label:'Range',      value:minLocal&&maxLocal?`${sym}${fmt(minLocal)}–${sym}${fmt(maxLocal)}`:`$${listing.min_limit_usd||0}–$${listing.max_limit_usd||0}`, color:C.g700},
          ].map(({label,value,color})=>(
            <div key={label} className="p-2 rounded-xl" style={{backgroundColor:C.g50}}>
              <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
              <p className="text-[10px] font-black truncate" style={{color}}>{value}</p>
            </div>
          ))}
        </div>

        {/* Expandable details */}
        <button onClick={()=>setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[10px] py-1 hover:bg-gray-50 rounded-lg px-1 transition"
          style={{color:C.g400}}>
          <span>Trade instructions & terms</span>
          {expanded?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
        </button>

        {expanded&&(
          <div className="mt-2 space-y-2">
            {listing.trade_instructions&&(
              <div className="p-2.5 rounded-xl text-[10px] leading-relaxed"
                style={{backgroundColor:C.mist, color:C.g600, border:`1px solid ${C.g200}`}}>
                <p className="font-black mb-0.5" style={{color:C.forest}}>Trade Instructions</p>
                {listing.trade_instructions}
              </div>
            )}
            {listing.listing_terms&&(
              <div className="p-2.5 rounded-xl text-[10px] leading-relaxed"
                style={{backgroundColor:'#F0F9FF', color:C.g600}}>
                <p className="font-black mb-0.5" style={{color:C.paid}}>Terms</p>
                {listing.listing_terms}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px]" style={{color:C.g400}}>
              <span>⏱ Time limit: {listing.time_limit||30} min</span>
              <span>Margin: {margin===0?'Market rate':margin>0?`+${margin}% above market`:`${margin}% below market`}</span>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{borderColor:C.g100}}>
          <button onClick={()=>onView(listing.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border hover:bg-gray-50 transition"
            style={{borderColor:C.g200, color:C.g600}}>
            <Eye size={11}/> View Live
          </button>
          <button onClick={()=>{navigator.clipboard.writeText(listing.id);toast.success('Offer ID copied!');}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border hover:bg-gray-50 transition"
            style={{borderColor:C.g200, color:C.g500}}>
            <Copy size={11}/> Copy ID
          </button>
          <button onClick={()=>onEdit(listing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ml-auto hover:opacity-90 transition"
            style={{backgroundColor:C.green, color:C.white}}>
            <Edit size={11}/> Edit Offer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyListings({user}) {
  const navigate = useNavigate();
  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editListing, setEditListing] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [filter,      setFilter]      = useState('ALL'); // ALL | ACTIVE | PAUSED
  const [search,      setSearch]      = useState('');

  useEffect(()=>{
    if(!user){navigate('/login');return;}
    load();
  },[user]);

  const load = async()=>{
    setLoading(true);
    try{
      const r = await axios.get(`${API_URL}/my-listings`,{headers:authH()});
      setListings(r.data.listings||[]);
    }catch(e){ toast.error('Failed to load your offers'); }
    finally{ setLoading(false); }
  };

  const saveEdit = async(id, form)=>{
    setSaving(true);
    try{
      const r = await axios.put(`${API_URL}/listings/${id}`, form, {headers:authH()});
      if(r.data.success){ toast.success('Offer updated!'); setEditListing(null); load(); }
    }catch(e){ toast.error(e.response?.data?.error||'Failed to update'); }
    finally{ setSaving(false); }
  };

  const deleteListing = async(id)=>{
    if(!window.confirm('Delete this offer? This cannot be undone.')) return;
    try{
      const r = await axios.delete(`${API_URL}/listings/${id}`,{headers:authH()});
      if(r.data.success){ toast.success('Offer deleted'); load(); }
    }catch(e){ toast.error(e.response?.data?.error||'Failed to delete'); }
  };

  const toggleStatus = async(id, current)=>{
    const next = current==='ACTIVE'?'PAUSED':'ACTIVE';
    try{
      const r = await axios.patch(`${API_URL}/listings/${id}/status`,{status:next},{headers:authH()});
      if(r.data.success){ toast.success(`Offer ${next==='ACTIVE'?'activated':'paused'}`); load(); }
    }catch(e){ toast.error('Failed to update status'); }
  };

  // Derived stats
  const active   = listings.filter(l=>l.status==='ACTIVE').length;
  const paused   = listings.filter(l=>l.status==='PAUSED').length;
  const btcOffers= listings.filter(l=>!l.gift_card_brand).length;
  const gcOffers = listings.filter(l=>!!l.gift_card_brand).length;

  // Filtered list
  const filtered = listings
    .filter(l=>filter==='ALL'||l.status===filter)
    .filter(l=>{
      if(!search.trim()) return true;
      const q=search.toLowerCase();
      return(
        (l.payment_method||'').toLowerCase().includes(q)||
        (l.gift_card_brand||'').toLowerCase().includes(q)||
        (l.country||'').toLowerCase().includes(q)||
        (l.listing_type||'').toLowerCase().includes(q)
      );
    });

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{borderColor:C.sage,borderTopColor:'transparent'}}/>
        <p className="text-sm font-semibold" style={{color:C.green}}>Loading your offers…</p>
      </div>
    </div>
  );

  return(
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50, fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-5 space-y-5">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-black text-2xl" style={{color:C.forest, fontFamily:"'Syne',sans-serif"}}>
              My Offers
            </h1>
            <p className="text-xs mt-0.5" style={{color:C.g500}}>
              {listings.length} total · {active} active · {paused} paused
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold hover:bg-white transition"
              style={{borderColor:C.g200, color:C.g600}}>
              <RefreshCw size={12}/> Refresh
            </button>
            <button onClick={()=>navigate('/create-offer')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black hover:opacity-90 transition shadow-sm"
              style={{backgroundColor:C.gold, color:C.forest}}>
              <Plus size={14}/> Create Offer
            </button>
          </div>
        </div>

        {/* ── STATS GRID ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity}   label="Total Offers"   value={listings.length}  color={C.green}/>
          <StatCard icon={CheckCircle}label="Active Offers"  value={active}           color={C.success} sub="Live on marketplace"/>
          <StatCard icon={Bitcoin}    label="Bitcoin Offers" value={btcOffers}         color={C.gold}/>
          <StatCard icon={Gift}       label="Gift Cards"     value={gcOffers}          color="#0D9488"/>
        </div>

        {/* ── TIPS BANNER (only if no listings) ────────────────── */}
        {listings.length===0&&(
          <div className="bg-white rounded-2xl border p-8 text-center shadow-sm" style={{borderColor:C.g200}}>
            <div className="text-5xl mb-4">📝</div>
            <h3 className="font-black text-lg mb-2" style={{color:C.forest}}>No offers yet</h3>
            <p className="text-sm mb-5" style={{color:C.g500}}>
              Create your first Bitcoin or gift card offer to start earning on PRAQEN.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button onClick={()=>navigate('/create-offer')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90"
                style={{backgroundColor:C.green}}>
                <Plus size={15}/> Create Bitcoin Offer
              </button>
              <button onClick={()=>navigate('/buy-bitcoin')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm border hover:bg-gray-50"
                style={{borderColor:C.g200, color:C.g700}}>
                <Eye size={15}/> Browse Marketplace
              </button>
            </div>
          </div>
        )}

        {listings.length>0&&(
          <>
            {/* ── FILTER + SEARCH BAR ──────────────────────────── */}
            <div className="bg-white rounded-2xl border p-3 flex flex-wrap gap-2 items-center"
              style={{borderColor:C.g200}}>
              {/* Status filter pills */}
              <div className="flex gap-1">
                {[['ALL','All'],['ACTIVE','Active'],['PAUSED','Paused']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setFilter(val)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    style={{
                      backgroundColor:filter===val?C.green:'transparent',
                      color:filter===val?C.white:C.g500,
                    }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[140px]">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by payment, country…"
                  className="w-full pl-7 pr-3 py-2 text-xs border-2 rounded-xl focus:outline-none"
                  style={{borderColor:search?C.green:C.g200}}/>
              </div>

              <p className="text-[10px] ml-auto" style={{color:C.g400}}>
                {filtered.length} of {listings.length} offers
              </p>
            </div>

            {/* ── QUICK TIPS ───────────────────────────────────── */}
            <div className="grid md:grid-cols-3 gap-3">
              {[
                {icon:'💡', title:'Set competitive margin',   desc:'Offers within ±5% of market rate get 3× more trades.'},
                {icon:'⚡', title:'Stay online',               desc:'Active traders with recent logins appear higher in search.'},
                {icon:'📋', title:'Add clear instructions',   desc:'Offers with detailed instructions have 80% fewer disputes.'},
              ].map(({icon,title,desc})=>(
                <div key={title} className="flex items-start gap-3 p-3 rounded-2xl border"
                  style={{backgroundColor:`${C.gold}06`, borderColor:`${C.gold}20`}}>
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs font-black" style={{color:C.forest}}>{title}</p>
                    <p className="text-[10px] mt-0.5" style={{color:C.g500}}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── OFFER CARDS ──────────────────────────────────── */}
            {filtered.length===0?(
              <div className="bg-white rounded-2xl border p-8 text-center" style={{borderColor:C.g200}}>
                <p className="text-4xl mb-2">🔍</p>
                <p className="font-bold text-sm" style={{color:C.g700}}>No offers match your filter</p>
              </div>
            ):(
              <div className="grid md:grid-cols-2 gap-3">
                {filtered.map(l=>(
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onEdit={setEditListing}
                    onDelete={deleteListing}
                    onToggle={toggleStatus}
                    onView={id=>navigate(`/listing/${id}`)}
                  />
                ))}
              </div>
            )}

            {/* Create another offer CTA */}
            <div className="flex items-center justify-between p-4 rounded-2xl border"
              style={{backgroundColor:`${C.green}06`, borderColor:`${C.green}20`}}>
              <div>
                <p className="text-sm font-black" style={{color:C.forest}}>Want more trades?</p>
                <p className="text-xs" style={{color:C.g500}}>Create another offer to reach more buyers.</p>
              </div>
              <button onClick={()=>navigate('/create-offer')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-black text-xs hover:opacity-90"
                style={{backgroundColor:C.green}}>
                <Plus size={13}/> New Offer <ArrowRight size={12}/>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-black text-xl" style={{fontFamily:"'Syne',sans-serif"}}>
                  PRA<span style={{color:C.gold}}>QEN</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{color:'rgba(255,255,255,0.4)'}}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  {href:'https://x.com/praqenapp?s=21',              label:'𝕏',  bg:'rgba(255,255,255,0.1)'},
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
                {[['Buy Bitcoin','/buy-bitcoin'],['Sell Bitcoin','/sell-bitcoin'],['Gift Cards','/gift-cards'],['My Trades','/my-trades'],['Create Offer','/create-offer']].map(([l,h])=>(
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t" style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>© {new Date().getFullYear()} PRAQEN. All rights reserved.</p>
            <p className="text-[10px] flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>

      {/* Edit Modal */}
      {editListing&&(
        <EditModal
          listing={editListing}
          onClose={()=>setEditListing(null)}
          onSave={saveEdit}
          saving={saving}
        />
      )}
    </div>
  );
}
