import React, { useState, useEffect } from 'react';
import { useRates } from '../contexts/RatesContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Edit, Trash2, Eye, Plus, RefreshCw, Bitcoin,
  Clock, CheckCircle, Shield, Activity,
  Save, X, Gift, Search,
  ArrowRight, ShoppingCart, BarChart2,
  TrendingUp, Tag, CreditCard, ToggleLeft, ToggleRight,
  AlertTriangle, Copy, Zap, Minus, Share2,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const C = {
  forest:'#1B4332', green:'#2D6A4F', mint:'#40916C', sage:'#52B788',
  gold:'#F4A422', amber:'#F59E0B', mist:'#F0FAF5', white:'#FFFFFF',
  g50:'#F8FAFC', g100:'#F1F5F9', g200:'#E2E8F0',
  g400:'#94A3B8', g500:'#64748B', g600:'#475569', g700:'#334155', g800:'#1E293B',
  success:'#10B981', danger:'#EF4444', warn:'#F59E0B', paid:'#3B82F6',
  purple:'#8B5CF6', orange:'#F97316',
};

const CUR_SYM = {GHS:'₵',NGN:'₦',KES:'KSh',ZAR:'R',USD:'$',GBP:'£',EUR:'€',UGX:'USh',TZS:'TSh',XAF:'CFA',XOF:'CFA',RWF:'RF',ETB:'Br',AUD:'A$',CAD:'C$',SGD:'S$',INR:'₹'};
const fmt    = (n,d=0) => new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:d}).format(n||0);
const authH  = () => { const t=localStorage.getItem('token'); return t?{Authorization:`Bearer ${t}`}:{}; };
const flag   = code => !code||code.length!==2?'🌍':code.toUpperCase().replace(/./g,c=>String.fromCodePoint(0x1F1E0+c.charCodeAt(0)-65));

const tabOf = l => {
  const lt = (l.listing_type||'').toUpperCase();
  if (lt.includes('GIFT')) return 'gift';
  if (lt === 'SELL' || lt === 'SELL_BITCOIN') return 'sell';
  return 'buy';
};

const shareUrl = id => `${window.location.origin}/listing/${id}`;

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ listing, onClose, onSave, saving }) {
  const cur = listing.currency || 'USD';
  const sym = listing.currency_symbol || CUR_SYM[cur] || '$';
  const [form, setForm] = useState({
    margin:             parseFloat(listing.margin || 0),
    min_limit_local:    listing.min_limit_local || listing.min_limit_usd || 0,
    max_limit_local:    listing.max_limit_local || listing.max_limit_usd || 0,
    payment_method:     listing.payment_method || '',
    trade_instructions: listing.trade_instructions || '',
    listing_terms:      listing.listing_terms || '',
    time_limit:         listing.time_limit || 30,
  });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{backgroundColor:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)'}}>
      <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:C.g100}}>
          <div>
            <h2 className="font-black text-base" style={{color:C.forest}}>Edit Offer</h2>
            <p className="text-[10px] mt-0.5" style={{color:C.g400}}>
              #{String(listing.id||'').slice(0,8).toUpperCase()} · {listing.payment_method}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <X size={15} style={{color:C.g500}}/>
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>Margin — your profit above market rate</label>
            <div className="flex items-center gap-3">
              <button onClick={()=>set('margin',Math.max(0,parseFloat((form.margin-0.5).toFixed(1))))}
                className="w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0"
                style={{borderColor:C.danger,backgroundColor:`${C.danger}10`}}>
                <Minus size={14} style={{color:C.danger}}/>
              </button>
              <div className="flex-1 relative">
                <input type="number" step="0.5" min="0" max="100"
                  value={form.margin} onChange={e=>set('margin',parseFloat(e.target.value)||0)}
                  className="w-full px-4 pr-8 py-3 text-lg font-black border-2 rounded-xl focus:outline-none text-center"
                  style={{borderColor:C.green,color:C.success}}/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-sm" style={{color:C.g400}}>%</span>
              </div>
              <button onClick={()=>set('margin',Math.min(100,parseFloat((form.margin+0.5).toFixed(1))))}
                className="w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0"
                style={{borderColor:C.success,backgroundColor:`${C.success}10`}}>
                <Plus size={14} style={{color:C.success}}/>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>Trade Range ({sym} {cur})</label>
            <div className="grid grid-cols-2 gap-3">
              {[{key:'min_limit_local',label:'Minimum'},{key:'max_limit_local',label:'Maximum'}].map(({key,label})=>(
                <div key={key}>
                  <p className="text-[10px] font-bold mb-1" style={{color:C.g500}}>{label}</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black" style={{color:C.g400}}>{sym}</span>
                    <input type="number" value={form[key]} onChange={e=>set(key,e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 text-sm font-bold border-2 rounded-xl focus:outline-none"
                      style={{borderColor:form[key]?C.green:C.g200,color:C.forest}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>Payment Method</label>
            <input type="text" value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}
              placeholder="e.g. MTN Mobile Money"
              className="w-full px-4 py-2.5 text-sm border-2 rounded-xl focus:outline-none"
              style={{borderColor:form.payment_method?C.green:C.g200}}/>
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>Payment Window</label>
            <div className="grid grid-cols-6 gap-1.5">
              {[15,30,45,60,90,120].map(t=>(
                <button key={t} onClick={()=>set('time_limit',t)}
                  className="py-2 rounded-xl text-xs font-black border-2 transition"
                  style={{borderColor:form.time_limit===t?C.green:C.g200,backgroundColor:form.time_limit===t?C.green:'transparent',color:form.time_limit===t?C.white:C.g500}}>
                  {t}<span className="text-[9px]">m</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>Trade Instructions</label>
            <textarea value={form.trade_instructions} onChange={e=>set('trade_instructions',e.target.value)}
              rows={3} placeholder="Tell traders exactly how to pay you…"
              className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none resize-none"
              style={{borderColor:C.g200}}/>
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{color:C.g700}}>
              Offer Terms <span className="font-normal text-[10px]" style={{color:C.g400}}>(optional)</span>
            </label>
            <textarea value={form.listing_terms} onChange={e=>set('listing_terms',e.target.value)}
              rows={2} placeholder="Any conditions or restrictions…"
              className="w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none resize-none"
              style={{borderColor:C.g200}}/>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex gap-2.5" style={{borderColor:C.g100}}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border text-sm font-bold hover:bg-gray-50 transition"
            style={{borderColor:C.g200,color:C.g600}}>Cancel</button>
          <button onClick={()=>onSave(listing.id,form)} disabled={saving}
            className="flex-1 py-3 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
            style={{backgroundColor:C.green}}>
            {saving?<><RefreshCw size={13} className="animate-spin"/>Saving…</>:<><Save size={13}/>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ active, onToggle, loading }) {
  return (
    <button onClick={e=>{e.stopPropagation();onToggle();}} disabled={loading}
      title={active?'Pause offer':'Activate offer'}
      className="relative flex-shrink-0 transition-all disabled:opacity-50"
      style={{width:44,height:24}}>
      <div className="w-full h-full rounded-full transition-all duration-300"
        style={{backgroundColor:active?C.success:C.g300}}/>
      <div className="absolute top-1 transition-all duration-300 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center"
        style={{left:active?'calc(100% - 18px)':'4px'}}>
        {loading
          ? <RefreshCw size={8} className="animate-spin" style={{color:active?C.success:C.g400}}/>
          : active
            ? <Zap size={8} style={{color:C.success}}/>
            : <X size={7} style={{color:C.g400}}/>}
      </div>
    </button>
  );
}

// ─── Compact Offer Card ───────────────────────────────────────────────────────
function OfferCard({ listing, onEdit, onDelete, onToggle }) {
  const { rates: USD_RATES } = useRates();
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isActive  = listing.status === 'ACTIVE';
  const tab       = tabOf(listing);
  const cur       = listing.currency || 'USD';
  const sym       = listing.currency_symbol || CUR_SYM[cur] || '$';
  const usdRate   = USD_RATES[cur] || 1;
  const margin    = parseFloat(listing.margin || 0);
  const minLocal  = listing.min_limit_local || (listing.min_limit_usd ? listing.min_limit_usd * usdRate : 0);
  const maxLocal  = listing.max_limit_local || (listing.max_limit_usd ? listing.max_limit_usd * usdRate : 0);
  const views     = parseInt(listing.view_count || 0);

  const TYPE_CFG = {
    sell: { label:'Sell Bitcoin',  badge:'Buy BTC page',   color:C.green,  icon:Bitcoin      },
    buy:  { label:'Buy Bitcoin',   badge:'Sell BTC page',  color:C.paid,   icon:ShoppingCart },
    gift: { label:'Buy Gift Card', badge:'Gift Cards page', color:C.purple, icon:Gift         },
  };
  const tc   = TYPE_CFG[tab] || TYPE_CFG.sell;
  const Icon = tc.icon;

  const handleToggle = async () => { setToggling(true); await onToggle(listing.id, listing.status); setToggling(false); };

  const copyShareLink = () => {
    const url = shareUrl(listing.id);
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Offer link copied! Share it with buyers.'))
      .catch(() => toast.error('Could not copy link'));
  };

  const marginDisplay = margin === 0 ? 'Market' : margin > 0 ? `+${margin}%` : `${margin}%`;
  const marginColor   = margin > 0 ? C.success : margin < 0 ? C.danger : C.g500;
  const rangeDisplay  = minLocal > 0 && maxLocal > 0
    ? `${sym}${fmt(minLocal)}–${sym}${fmt(maxLocal)} ${cur}`
    : '—';

  return (
    <div className="bg-white rounded-xl border transition-all"
      style={{borderColor: isActive ? `${tc.color}35` : C.g200, opacity: isActive ? 1 : 0.75}}>

      {/* Left accent bar */}
      <div className="flex">
        <div className="w-1 rounded-l-xl flex-shrink-0" style={{backgroundColor: isActive ? tc.color : C.g200}}/>

        <div className="flex-1 p-3 space-y-2.5">

          {/* ── Row 1: icon + label + toggle + delete ── */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:`${tc.color}12`}}>
              <Icon size={15} style={{color:tc.color}}/>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs" style={{color:C.forest}}>{tc.label}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{backgroundColor:`${tc.color}12`,color:tc.color}}>
                  {tc.badge}
                </span>
                {listing.gift_card_brand && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{backgroundColor:`${C.purple}12`,color:C.purple}}>
                    {listing.gift_card_brand}
                  </span>
                )}
              </div>
              <p className="text-[9px] mt-0.5 font-mono" style={{color:C.g400}}>
                #{String(listing.id||'').slice(0,8).toUpperCase()} · {isActive?'🟢 Live':'⏸ Paused'}
              </p>
            </div>

            {/* Toggle ON/OFF */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <ToggleSwitch active={isActive} onToggle={handleToggle} loading={toggling}/>
              <span className="text-[8px] font-black" style={{color:isActive?C.success:C.g400}}>
                {isActive?'ON':'OFF'}
              </span>
            </div>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={()=>setConfirmDelete(false)}
                  className="text-[9px] font-bold px-1.5 py-1 rounded-lg border"
                  style={{borderColor:C.g200,color:C.g500}}>
                  No
                </button>
                <button onClick={()=>{setConfirmDelete(false);onDelete(listing.id);}}
                  className="text-[9px] font-black px-2 py-1 rounded-lg text-white"
                  style={{backgroundColor:C.danger}}>
                  Delete
                </button>
              </div>
            ) : (
              <button onClick={()=>setConfirmDelete(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border hover:bg-red-50 transition flex-shrink-0"
                style={{borderColor:C.g200}} title="Delete offer">
                <Trash2 size={12} style={{color:C.danger}}/>
              </button>
            )}
          </div>

          {/* ── Row 2: compact metrics ── */}
          <div className="flex items-center gap-0 text-[10px] divide-x rounded-lg overflow-hidden border"
            style={{borderColor:C.g100}}>
            <div className="flex-1 px-2.5 py-1.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-wide" style={{color:C.g400}}>Margin</p>
              <p className="font-black text-xs" style={{color:marginColor}}>{marginDisplay}</p>
            </div>
            <div className="flex-1 px-2.5 py-1.5 text-center min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-wide" style={{color:C.g400}}>Range</p>
              <p className="font-black text-[10px] truncate" style={{color:C.forest}}>{rangeDisplay}</p>
            </div>
            <div className="flex-1 px-2.5 py-1.5 text-center min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-wide" style={{color:C.g400}}>Payment</p>
              <p className="font-black text-[10px] truncate" style={{color:C.paid}}>{listing.payment_method||'—'}</p>
            </div>
            <div className="flex-none px-2.5 py-1.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-wide" style={{color:C.g400}}>Views</p>
              <p className="font-black text-xs flex items-center gap-0.5 justify-center" style={{color:C.amber}}>
                <Eye size={9}/>{fmt(views)}
              </p>
            </div>
          </div>

          {/* ── Row 3: action buttons ── */}
          <div className="flex items-center gap-1.5">
            <button onClick={()=>onEdit(listing)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black border hover:bg-gray-50 transition flex-1 justify-center"
              style={{borderColor:C.green,color:C.green}}>
              <Edit size={10}/> Edit
            </button>
            <button onClick={copyShareLink}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black border hover:bg-blue-50 transition flex-1 justify-center"
              style={{borderColor:C.paid,color:C.paid}}>
              <Share2 size={10}/> Share Link
            </button>
            <span className="text-[9px]" style={{color:C.g400}}>
              <Clock size={9} className="inline mr-0.5"/>{listing.time_limit||30}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab panel ────────────────────────────────────────────────────────────────
function TabPanel({ listings, onEdit, onDelete, onToggle, onToggleAll, search }) {
  const filtered = listings.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.payment_method||'').toLowerCase().includes(q) ||
      (l.country_name||l.country||'').toLowerCase().includes(q) ||
      (l.gift_card_brand||'').toLowerCase().includes(q) ||
      String(l.margin||'').includes(q)
    );
  });

  const activeCount = listings.filter(l=>l.status==='ACTIVE').length;
  const allActive   = activeCount === listings.length && listings.length > 0;

  if (listings.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">📭</p>
        <p className="font-bold text-sm" style={{color:C.g700}}>No offers here yet</p>
        <p className="text-xs mt-1" style={{color:C.g400}}>Create an offer to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Per-tab bulk toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold" style={{color:C.g500}}>
          {filtered.length} offer{filtered.length!==1?'s':''} · {activeCount} active
        </p>
        <button
          onClick={()=>onToggleAll(listings.map(l=>l.id), allActive?'PAUSED':'ACTIVE')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition hover:bg-gray-50"
          style={{borderColor:C.g200,color:allActive?C.warn:C.success}}>
          {allActive
            ? <><ToggleLeft size={11}/> Pause tab</>
            : <><ToggleRight size={11}/> Activate tab</>}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-6 rounded-xl border" style={{borderColor:C.g200}}>
          <p className="text-xl mb-1">🔍</p>
          <p className="font-bold text-xs" style={{color:C.g700}}>No offers match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(l => (
            <OfferCard key={l.id} listing={l} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({icon:Icon, label, value, color, sub}) {
  return (
    <div className="bg-white rounded-xl border p-3 shadow-sm" style={{borderColor:C.g200}}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5"
        style={{backgroundColor:`${color}15`}}>
        <Icon size={14} style={{color}}/>
      </div>
      <p className="text-xl font-black" style={{color:C.g800}}>{value}</p>
      <p className="text-[10px] font-semibold mt-0.5" style={{color:C.g500}}>{label}</p>
      {sub&&<p className="text-[9px] mt-0.5" style={{color:C.g400}}>{sub}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyListings({ user }) {
  const navigate = useNavigate();
  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editListing, setEditListing] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [activeTab,   setActiveTab]   = useState('sell');

  useEffect(()=>{ if(!user){navigate('/login');return;} load(); },[user]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/my-listings`,{headers:authH()});
      setListings(r.data.listings||[]);
    } catch { toast.error('Failed to load your offers'); }
    finally { setLoading(false); }
  };

  const saveEdit = async (id, form) => {
    setSaving(true);
    try {
      const r = await axios.put(`${API_URL}/listings/${id}`, {
        margin:             parseFloat(form.margin),
        min_limit_local:    parseFloat(form.min_limit_local),
        max_limit_local:    parseFloat(form.max_limit_local),
        min_limit_usd:      parseFloat(form.min_limit_local),
        max_limit_usd:      parseFloat(form.max_limit_local),
        payment_method:     form.payment_method,
        trade_instructions: form.trade_instructions,
        listing_terms:      form.listing_terms,
        time_limit:         parseInt(form.time_limit),
      },{headers:authH()});
      if (r.data.success) {
        toast.success('Offer updated!');
        setEditListing(null);
        setListings(prev=>prev.map(l=>l.id===id?{...l,...form,margin:parseFloat(form.margin)}:l));
      }
    } catch(e) { toast.error(e.response?.data?.error||'Failed to update'); }
    finally { setSaving(false); }
  };

  // Instant remove — revert on API failure
  const deleteListing = async (id) => {
    setListings(prev=>prev.filter(l=>l.id!==id));
    try {
      const r = await axios.delete(`${API_URL}/listings/${id}`,{headers:authH()});
      if (r.data.success) { toast.success('Offer deleted'); }
      else { load(); toast.error('Failed to delete offer'); }
    } catch(e) { load(); toast.error(e.response?.data?.error||'Failed to delete offer'); }
  };

  // Optimistic toggle — revert on failure
  const toggleStatus = async (id, current) => {
    const next = current==='ACTIVE'?'PAUSED':'ACTIVE';
    setListings(prev=>prev.map(l=>l.id===id?{...l,status:next}:l));
    try {
      const r = await axios.patch(`${API_URL}/listings/${id}/status`,{status:next},{headers:authH()});
      if (!r.data.success) {
        setListings(prev=>prev.map(l=>l.id===id?{...l,status:current}:l));
        toast.error('Failed to update status');
      } else {
        toast.success(`Offer ${next==='ACTIVE'?'activated ✅':'paused ⏸'}`);
      }
    } catch {
      setListings(prev=>prev.map(l=>l.id===id?{...l,status:current}:l));
      toast.error('Failed to update status');
    }
  };

  // Bulk toggle for a subset of IDs
  const toggleAll = async (ids, targetStatus) => {
    setListings(prev=>prev.map(l=>ids.includes(l.id)?{...l,status:targetStatus}:l));
    const results = await Promise.allSettled(
      ids.map(id=>axios.patch(`${API_URL}/listings/${id}/status`,{status:targetStatus},{headers:authH()}))
    );
    const failed = results.filter(r=>r.status==='rejected').length;
    if (failed===0) toast.success(`All offers ${targetStatus==='ACTIVE'?'activated ✅':'paused ⏸'}`);
    else { toast.warn(`${failed} offer(s) failed to update`); load(); }
  };

  const sellListings = listings.filter(l=>tabOf(l)==='sell');
  const buyListings  = listings.filter(l=>tabOf(l)==='buy');
  const gcListings   = listings.filter(l=>tabOf(l)==='gift');
  const totalActive  = listings.filter(l=>l.status==='ACTIVE').length;
  const totalViews   = listings.reduce((s,l)=>s+parseInt(l.view_count||0),0);
  const allIds       = listings.map(l=>l.id);
  const allAreActive = listings.length > 0 && totalActive === listings.length;

  const TABS = [
    {id:'sell', label:'Sell Offers',      count:sellListings.length, color:C.green,  icon:Bitcoin},
    {id:'buy',  label:'Buy Offers',       count:buyListings.length,  color:C.paid,   icon:ShoppingCart},
    {id:'gift', label:'Gift Card Offers', count:gcListings.length,   color:C.purple, icon:Gift},
  ];
  const tabListings = activeTab==='sell'?sellListings:activeTab==='buy'?buyListings:gcListings;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:C.mist}}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-3"
          style={{borderColor:C.sage,borderTopColor:'transparent'}}/>
        <p className="text-sm font-semibold" style={{color:C.green}}>Loading your offers…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:C.g50,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-black text-2xl" style={{color:C.forest,fontFamily:"'Syne',sans-serif"}}>
              My Offers
            </h1>
            <p className="text-xs mt-0.5" style={{color:C.g500}}>
              {listings.length} total · {totalActive} active · {totalViews} views
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold hover:bg-white transition"
              style={{borderColor:C.g200,color:C.g600}}>
              <RefreshCw size={12}/> Refresh
            </button>
            <button onClick={()=>navigate('/create-offer')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black hover:opacity-90 transition shadow-sm"
              style={{backgroundColor:C.gold,color:C.forest}}>
              <Plus size={14}/> Create Offer
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard icon={Activity}    label="Total Offers" value={listings.length}    color={C.green}/>
          <StatCard icon={CheckCircle} label="Active"       value={totalActive}        color={C.success} sub="Live on market"/>
          <StatCard icon={Eye}         label="Total Views"  value={fmt(totalViews)}    color={C.amber}/>
          <StatCard icon={Bitcoin}     label="Sell"         value={sellListings.length} color={C.gold}   sub={`${buyListings.length} buy · ${gcListings.length} gift`}/>
        </div>

        {/* ── GLOBAL ON / OFF ALL ── */}
        {listings.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl border"
            style={{backgroundColor:allAreActive?`${C.warn}08`:`${C.success}08`,borderColor:allAreActive?`${C.warn}30`:`${C.success}30`}}>
            <div>
              <p className="text-xs font-black" style={{color:C.forest}}>
                {allAreActive ? '⚡ All offers are live' : totalActive===0 ? '⏸ All offers are paused' : `${totalActive} of ${listings.length} offers active`}
              </p>
              <p className="text-[10px] mt-0.5" style={{color:C.g500}}>Toggle all your offers at once across every tab</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={()=>toggleAll(allIds, 'ACTIVE')}
                disabled={allAreActive}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black text-white disabled:opacity-40 transition hover:opacity-90"
                style={{backgroundColor:C.success}}>
                <ToggleRight size={12}/> All ON
              </button>
              <button
                onClick={()=>toggleAll(allIds, 'PAUSED')}
                disabled={totalActive===0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black text-white disabled:opacity-40 transition hover:opacity-90"
                style={{backgroundColor:C.warn}}>
                <ToggleLeft size={12}/> All OFF
              </button>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {listings.length === 0 && (
          <div className="bg-white rounded-2xl border p-10 text-center shadow-sm" style={{borderColor:C.g200}}>
            <div className="text-5xl mb-4">📝</div>
            <h3 className="font-black text-lg mb-2" style={{color:C.forest}}>No offers yet</h3>
            <p className="text-sm mb-5" style={{color:C.g500}}>Create your first offer to start earning on PRAQEN.</p>
            <button onClick={()=>navigate('/create-offer')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-black text-sm hover:opacity-90"
              style={{backgroundColor:C.green}}>
              <Plus size={15}/> Create Your First Offer
            </button>
          </div>
        )}

        {listings.length > 0 && (
          <>
            {/* ── TABS ── */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor:C.g200}}>
              {/* Tab bar */}
              <div className="flex border-b" style={{borderColor:C.g100}}>
                {TABS.map(tab=>{
                  const TabIcon = tab.icon;
                  const isCur = activeTab===tab.id;
                  return (
                    <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-black transition relative"
                      style={{color:isCur?tab.color:C.g400,backgroundColor:isCur?`${tab.color}06`:'transparent'}}>
                      {isCur&&(
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                          style={{backgroundColor:tab.color}}/>
                      )}
                      <TabIcon size={12}/>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      {tab.count>0&&(
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{backgroundColor:isCur?tab.color:C.g100,color:isCur?'#fff':C.g500}}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search + description */}
              <div className="px-4 py-2 border-b flex items-center justify-between gap-3"
                style={{borderColor:C.g100,backgroundColor:C.g50}}>
                <p className="text-[10px] font-semibold" style={{color:C.g500}}>
                  {activeTab==='sell'&&'Listed on the Buy Bitcoin marketplace page'}
                  {activeTab==='buy' &&'Listed on the Sell Bitcoin marketplace page'}
                  {activeTab==='gift'&&'Listed on the Gift Cards marketplace page'}
                </p>
                <div className="relative flex-shrink-0" style={{width:160}}>
                  <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{color:C.g400}}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full pl-7 pr-3 py-1.5 text-[10px] border rounded-lg focus:outline-none"
                    style={{borderColor:search?C.green:C.g200}}/>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-3">
                <TabPanel
                  listings={tabListings}
                  onEdit={setEditListing}
                  onDelete={deleteListing}
                  onToggle={toggleStatus}
                  onToggleAll={toggleAll}
                  search={search}
                />
              </div>
            </div>

            {/* ── CREATE MORE CTA ── */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{backgroundColor:`${C.green}06`,borderColor:`${C.green}20`}}>
              <div>
                <p className="text-sm font-black" style={{color:C.forest}}>Want more trades?</p>
                <p className="text-xs" style={{color:C.g500}}>Create another offer to reach more buyers and sellers.</p>
              </div>
              <button onClick={()=>navigate('/create-offer')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-black text-xs hover:opacity-90 flex-shrink-0"
                style={{backgroundColor:C.green}}>
                <Plus size={13}/> New Offer <ArrowRight size={12}/>
              </button>
            </div>

            {/* ── TIPS ── */}
            <div className="grid md:grid-cols-3 gap-2">
              {[
                {icon:'💡',title:'Competitive margin gets more trades',desc:'Offers within ±5% of market rate receive 3× more trade requests.'},
                {icon:'⚡',title:'Keep offers active',               desc:'Paused offers disappear from the marketplace. Activate to stay visible.'},
                {icon:'🔗',title:'Share your offer link',             desc:'Send your offer link directly to buyers or sellers to skip the marketplace queue.'},
              ].map(({icon,title,desc})=>(
                <div key={title} className="flex items-start gap-2.5 p-3 rounded-xl border"
                  style={{backgroundColor:`${C.gold}06`,borderColor:`${C.gold}20`}}>
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs font-black" style={{color:C.forest}}>{title}</p>
                    <p className="text-[10px] mt-0.5 leading-relaxed" style={{color:C.g500}}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-8" style={{backgroundColor:C.forest}}>
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-5">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <span className="text-xl font-black" style={{fontFamily:"'Syne',sans-serif"}}>
                <span className="text-white">PRA</span><span style={{color:C.gold}}>QEN</span>
              </span>
              <p className="text-xs mt-2 leading-relaxed" style={{color:'rgba(255,255,255,0.4)'}}>
                Africa's most trusted P2P Bitcoin platform. Escrow-protected. Fast. Honest.
              </p>
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
              <p className="text-white font-black text-sm mb-3">Support</p>
              <div className="space-y-2">
                {[['💬 WhatsApp','https://chat.whatsapp.com/LHVjrw9SK8qGoXcKvprjWz?mode=gi_t'],
                  ['🎮 Discord','https://discord.gg/V6zCZxfdy'],
                  ['📧 support@praqen.com','mailto:support@praqen.com']].map(([l,h])=>(
                  <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                    className="block text-xs hover:text-white transition" style={{color:'rgba(255,255,255,0.4)'}}>{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-4 border-t"
            style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <p className="text-[10px]" style={{color:'rgba(255,255,255,0.3)'}}>
              © {new Date().getFullYear()} PRAQEN. All rights reserved.
            </p>
            <p className="text-[10px] flex items-center gap-1" style={{color:'rgba(255,255,255,0.3)'}}>
              <Shield size={10}/> Escrow Protected · 0.5% fee on completion only
            </p>
          </div>
        </div>
      </footer>

      {editListing && (
        <EditModal listing={editListing} onClose={()=>setEditListing(null)} onSave={saveEdit} saving={saving}/>
      )}
    </div>
  );
}
