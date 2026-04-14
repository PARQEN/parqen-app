import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { 
  AlertCircle, CheckCircle, Clock, Eye, X, Flag, 
  MessageCircle, Send, MapPin, CreditCard, Calendar,
  User, DollarSign, Bitcoin, Image, Phone, Building,
  ChevronDown, ChevronUp, Shield, AlertTriangle, Copy,
  Star, TrendingUp, Award, ThumbsUp, ThumbsDown, Activity,
  FileText, Wallet, Gift, History, BarChart3, Users,
  UserCheck, UserX, Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

const PRAQEN = {
  primary: '#2D5F4F',
  secondary: '#FFD700',
  darkBg: '#1a3a2a',
  lightBg: '#f0f8f5',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  orange: '#F97316'
};

export default function ModeratorDashboard({ user }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [tradeDetails, setTradeDetails] = useState(null);
  const [images, setImages] = useState([]);
  const [buyerStats, setBuyerStats] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [buyerReviews, setBuyerReviews] = useState([]);
  const [sellerReviews, setSellerReviews] = useState([]);
  const chatEndRef = useRef(null);
  const [moderatorJoined, setModeratorJoined] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [resolvedDisputesList, setResolvedDisputesList] = useState([]);
  const [moderatorName, setModeratorName] = useState('');

  useEffect(() => {
    if (!user) return;
    loadDisputes();
    loadResolvedDisputes();
    setModeratorName(user.username || 'Moderator');
  }, [user]);

  useEffect(() => {
    if (selectedDispute && activeTab === 'chat') {
      loadChatMessages();
      loadTradeDetails();
      loadImages();
      loadUserStats();
      const interval = setInterval(loadChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDispute, activeTab]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadDisputes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/disputes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const activeDisputes = (response.data.disputes || []).filter(d => 
        d.status === 'OPEN' || d.status === 'DISPUTED' || d.status === 'IN_REVIEW'
      );
      setDisputes(activeDisputes);
    } catch (error) {
      console.error('Failed to load disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadResolvedDisputes = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all trades that were disputed and now resolved (COMPLETED or CANCELLED with dispute resolution)
      const response = await axios.get(`${API_URL}/my-trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const allTrades = response.data.trades || [];
      const resolved = allTrades.filter(t => 
        (t.status === 'COMPLETED' || t.status === 'CANCELLED') && 
        t.dispute_resolution && 
        t.dispute_resolution !== ''
      ).map(t => ({
        id: t.id,
        trade_id: t.id,
        resolution: t.dispute_resolution,
        resolution_notes: t.dispute_notes,
        resolved_by: t.resolved_by,
        resolved_at: t.resolved_at,
        reason: t.dispute_reason,
        buyer: t.buyer,
        seller: t.seller,
        amount_btc: t.amount_btc,
        amount_usd: t.amount_usd,
        created_at: t.created_at
      }));
      
      setResolvedDisputesList(resolved);
    } catch (error) {
      console.error('Failed to load resolved disputes:', error);
      // Fallback to empty array
      setResolvedDisputesList([]);
    }
  };

  const loadTradeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/trades/${selectedDispute.trade_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTradeDetails(response.data.trade);
    } catch (error) {
      console.error('Failed to load trade details:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedDispute.buyer?.id) {
        const buyerResponse = await axios.get(`${API_URL}/users/${selectedDispute.buyer.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBuyerStats(buyerResponse.data.user);
        
        const buyerReviewsRes = await axios.get(`${API_URL}/users/${selectedDispute.buyer.id}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBuyerReviews(buyerReviewsRes.data.reviews || []);
      }
      
      if (selectedDispute.seller?.id) {
        const sellerResponse = await axios.get(`${API_URL}/users/${selectedDispute.seller.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSellerStats(sellerResponse.data.user);
        
        const sellerReviewsRes = await axios.get(`${API_URL}/users/${selectedDispute.seller.id}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSellerReviews(sellerReviewsRes.data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/trades/${selectedDispute.trade_id}/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setImages(response.data.images || []);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/messages/${selectedDispute.trade_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const moderatorJoinChat = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/trades/${selectedDispute.trade_id}/moderator-join`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setModeratorJoined(true);
      toast.success('Joined the dispute chat');
      await loadChatMessages();
    } catch (error) {
      console.error('Failed to join chat:', error);
      toast.error(error.response?.data?.error || 'Failed to join chat');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/messages`, {
        tradeId: selectedDispute.trade_id,
        message: newMessage
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNewMessage('');
      await loadChatMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const resolveDispute = async (disputeId, decision) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please add moderator notes explaining your decision');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/disputes/${disputeId}/resolve`, {
        resolution: decision,
        notes: `${resolutionNotes}\n\nResolved by: ${moderatorName} (Moderator)`,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const decisionText = decision === 'BUYER_WINS' ? 'Buyer Wins' : decision === 'SELLER_WINS' ? 'Seller Wins' : 'Trade Cancelled';
      toast.success(`Dispute resolved: ${decisionText}`);
      
      setSelectedDispute(null);
      setResolutionNotes('');
      await loadDisputes();
      await loadResolvedDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const openDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'DISPUTED');
  const inReviewDisputes = disputes.filter(d => d.status === 'IN_REVIEW');
  const totalResolved = resolvedDisputesList.length;

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const getPaymentMethodIcon = (method) => {
    if (method?.toLowerCase().includes('mtn')) return <Phone size={14} />;
    if (method?.toLowerCase().includes('bank')) return <Building size={14} />;
    return <CreditCard size={14} />;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star key={i} size={12} className={i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
      );
    }
    return stars;
  };

  const getResolutionBadge = (resolution) => {
    if (resolution === 'BUYER_WINS') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">✓ Buyer Won</span>;
    } else if (resolution === 'SELLER_WINS') {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">✓ Seller Won</span>;
    } else {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">✗ Trade Cancelled</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PRAQEN.lightBg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: PRAQEN.primary, borderTopColor: PRAQEN.secondary }}></div>
          <p style={{ color: PRAQEN.primary }}>Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: PRAQEN.lightBg }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-4xl font-black" style={{ color: PRAQEN.primary }}>🔨 Moderator Dashboard</h1>
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-500">Logged in as:</span>
              <span className="font-semibold ml-2" style={{ color: PRAQEN.purple }}>{moderatorName}</span>
            </div>
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <Shield size={18} style={{ color: PRAQEN.purple }} />
              <span className="text-sm font-semibold" style={{ color: PRAQEN.purple }}>Guidelines</span>
            </button>
          </div>
        </div>

        {/* Guidelines Panel */}
        {showGuidelines && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <Shield size={20} /> Fair Dispute Resolution Guidelines
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-green-700 mb-2">✓ Buyer Wins</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Buyer provided valid payment proof</li>
                  <li>• Seller failed to respond or release BTC</li>
                  <li>• Seller provided invalid gift card/code</li>
                  <li>• Clear evidence of seller fraud</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-blue-700 mb-2">✓ Seller Wins</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Buyer never sent payment</li>
                  <li>• Buyer provided fake payment proof</li>
                  <li>• Buyer attempted to scam</li>
                  <li>• Seller provided valid gift card/code</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-red-700 mb-2">✗ Cancel Trade</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Mutual misunderstanding</li>
                  <li>• Technical issues on platform</li>
                  <li>• Insufficient evidence from both sides</li>
                  <li>• Refund BTC to seller</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats - Real counts */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={32} className="text-red-600" />
              <div>
                <p className="text-gray-600">Open Disputes</p>
                <p className="text-3xl font-bold text-slate-900">{openDisputes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Clock size={32} className="text-yellow-600" />
              <div>
                <p className="text-gray-600">In Review</p>
                <p className="text-3xl font-bold text-slate-900">{inReviewDisputes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <CheckCircle size={32} className="text-green-600" />
              <div>
                <p className="text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-slate-900">{totalResolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={32} style={{ color: PRAQEN.purple }} />
              <div>
                <p className="text-gray-600">Total Disputes</p>
                <p className="text-3xl font-bold text-slate-900">{openDisputes.length + totalResolved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: PRAQEN.primary }}>Open Disputes ({openDisputes.length})</h2>

          {openDisputes.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No open disputes. All disputes have been resolved.</p>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((dispute) => (
                <div key={dispute.id} className="border border-red-200 bg-red-50 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          Trade: {dispute.trade_id?.slice(0, 8)}...
                        </h3>
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                          {dispute.status === 'IN_REVIEW' ? 'IN REVIEW' : 'DISPUTED'}
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                          {formatDate(dispute.created_at).split(',')[0]}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">
                        <strong>Reason:</strong> {dispute.reason || 'User opened a dispute'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <p className="text-gray-600">
                          <strong>Amount:</strong> {parseFloat(dispute.trade_details?.amount_btc || 0).toFixed(8)} BTC
                        </p>
                        <p className="text-gray-600">
                          <strong>Value:</strong> ${parseFloat(dispute.trade_details?.amount_usd || 0).toFixed(2)} USD
                        </p>
                        <p className="text-gray-600">
                          <strong>Payment:</strong> {dispute.trade_details?.payment_method || 'MTN Mobile Money'}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <User size={12} /> <strong>Buyer:</strong> {dispute.buyer?.username || 'Unknown'}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <User size={12} /> <strong>Seller:</strong> {dispute.seller?.username || 'Unknown'}
                        </p>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Clock size={12} /> <strong>Opened:</strong> {formatDate(dispute.created_at).split(',')[1]}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setModeratorJoined(false);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <Eye size={16} />
                      Review & Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Review Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: PRAQEN.primary }}>Dispute Review</h2>
                  <p className="text-sm text-gray-500 mt-1">Trade #{selectedDispute.trade_id?.slice(0, 8)}</p>
                </div>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="border-b px-6 overflow-x-auto">
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('details')} className={`py-3 px-2 font-medium transition whitespace-nowrap ${activeTab === 'details' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>📋 Details</button>
                  <button onClick={() => setActiveTab('user-history')} className={`py-3 px-2 font-medium transition whitespace-nowrap ${activeTab === 'user-history' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>👥 User History</button>
                  <button onClick={() => setActiveTab('evidence')} className={`py-3 px-2 font-medium transition whitespace-nowrap ${activeTab === 'evidence' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>📎 Evidence ({images.length})</button>
                  <button onClick={() => setActiveTab('chat')} className={`py-3 px-2 font-medium transition whitespace-nowrap ${activeTab === 'chat' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>💬 Chat</button>
                  <button onClick={() => setActiveTab('resolve')} className={`py-3 px-2 font-medium transition whitespace-nowrap ${activeTab === 'resolve' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}>⚖️ Resolve</button>
                </div>
              </div>

              <div className="p-6">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} /> Dispute Information
                      </h3>
                      <p className="text-red-700"><strong>Reason:</strong> {selectedDispute.reason || 'User opened a dispute'}</p>
                      <p className="text-red-600 text-sm mt-2"><strong>Opened:</strong> {formatDate(selectedDispute.created_at)}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <DollarSign size={16} /> Trade Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p><strong>BTC Amount:</strong> {parseFloat(selectedDispute.trade_details?.amount_btc || 0).toFixed(8)} BTC</p>
                          <p><strong>USD Amount:</strong> ${parseFloat(selectedDispute.trade_details?.amount_usd || 0).toFixed(2)}</p>
                          <p><strong>Local Amount:</strong> ₵{(parseFloat(selectedDispute.trade_details?.amount_usd || 0) * 11.02).toFixed(2)}</p>
                          <p><strong>Status:</strong> <span className="text-red-600 font-semibold">{selectedDispute.trade_details?.status}</span></p>
                          <p><strong>Created:</strong> {formatDate(selectedDispute.trade_details?.created_at)}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <CreditCard size={16} /> Payment Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2">
                            <strong>Method:</strong> 
                            {getPaymentMethodIcon(selectedDispute.trade_details?.payment_method)}
                            <span>{selectedDispute.trade_details?.payment_method || 'MTN Mobile Money'}</span>
                          </p>
                          <p><strong>Buyer Confirmed:</strong> {selectedDispute.trade_details?.buyer_confirmed ? '✅ Yes' : '⏳ No'}</p>
                          <p><strong>Payment Sent At:</strong> {formatDate(selectedDispute.trade_details?.buyer_confirmed_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <Shield size={16} /> Escrow Status
                      </h3>
                      <p className="text-sm text-blue-700">🔒 BTC is locked in escrow. Moderator decision will determine release.</p>
                    </div>
                  </div>
                )}

                {/* User History Tab */}
                {activeTab === 'user-history' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <User size={16} /> Buyer: {selectedDispute.buyer?.username}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm"><strong>Total Trades:</strong> {buyerStats?.total_trades || 0}</p>
                          <p className="text-sm"><strong>Completion Rate:</strong> {buyerStats?.completion_rate || 0}%</p>
                          <p className="text-sm flex items-center gap-1"><strong>Rating:</strong> {getRatingStars(buyerStats?.average_rating)} ({buyerStats?.average_rating || 0}/5)</p>
                          <p className="text-sm"><strong>Member Since:</strong> {formatDate(buyerStats?.created_at).split(',')[0]}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-semibold text-sm mb-2">Recent Feedback:</p>
                          {buyerReviews.slice(0, 3).map((review, idx) => (
                            <div key={idx} className="text-xs border-b py-1">
                              <span className="flex items-center gap-1">{getRatingStars(review.rating)}</span>
                              <p className="text-gray-600">{review.comment?.substring(0, 50)}...</p>
                            </div>
                          ))}
                          {buyerReviews.length === 0 && <p className="text-xs text-gray-500">No feedback yet</p>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                        <User size={16} /> Seller: {selectedDispute.seller?.username}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm"><strong>Total Trades:</strong> {sellerStats?.total_trades || 0}</p>
                          <p className="text-sm"><strong>Completion Rate:</strong> {sellerStats?.completion_rate || 0}%</p>
                          <p className="text-sm flex items-center gap-1"><strong>Rating:</strong> {getRatingStars(sellerStats?.average_rating)} ({sellerStats?.average_rating || 0}/5)</p>
                          <p className="text-sm"><strong>Member Since:</strong> {formatDate(sellerStats?.created_at).split(',')[0]}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-semibold text-sm mb-2">Recent Feedback:</p>
                          {sellerReviews.slice(0, 3).map((review, idx) => (
                            <div key={idx} className="text-xs border-b py-1">
                              <span className="flex items-center gap-1">{getRatingStars(review.rating)}</span>
                              <p className="text-gray-600">{review.comment?.substring(0, 50)}...</p>
                            </div>
                          ))}
                          {sellerReviews.length === 0 && <p className="text-xs text-gray-500">No feedback yet</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Tab */}
                {activeTab === 'evidence' && (
                  <div>
                    {images.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Image size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No evidence images uploaded yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img, idx) => (
                          <div key={idx} className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedEvidence(img)}>
                            <img src={img.image_url} alt={`Evidence ${idx + 1}`} className="w-full h-48 object-cover hover:opacity-90 transition" />
                            <div className="p-2 text-xs text-gray-500 bg-gray-50">
                              <span className="font-semibold">Uploaded by:</span> {img.user_id === selectedDispute.buyer?.id ? 'Buyer' : 'Seller'}
                              <br />{formatDate(img.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[500px]">
                    {!moderatorJoined && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 text-center">
                        <Shield size={32} className="mx-auto mb-2 text-purple-600" />
                        <p className="text-purple-800 mb-3">Join the dispute chat to communicate with both parties.</p>
                        <button onClick={moderatorJoinChat} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold">👨‍⚖️ Join Dispute Chat</button>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 rounded-lg p-4" style={{ minHeight: '300px', maxHeight: '400px' }}>
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                          <p>No messages yet</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => {
                          const isModerator = msg.sender_role === 'moderator';
                          const isSystem = msg.message_type === 'SYSTEM' || !msg.sender_id;
                          const isBuyer = msg.sender_id === selectedDispute.buyer?.id;
                          
                          if (isSystem) {
                            return (
                              <div key={idx} className="flex justify-center">
                                <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs max-w-[80%] text-center">{msg.message_text}</div>
                              </div>
                            );
                          }
                          
                          if (isModerator) {
                            return (
                              <div key={idx} className="flex justify-center">
                                <div className="bg-purple-100 border border-purple-300 rounded-lg px-4 py-2 max-w-[80%] text-center">
                                  <Shield size={12} className="inline mr-1 text-purple-600" />
                                  <span className="text-purple-800 font-medium">{msg.message_text}</span>
                                  <p className="text-[10px] text-purple-500 mt-1">{formatDate(msg.created_at)}</p>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={idx} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-[70%] ${isBuyer ? 'bg-white border border-gray-200' : 'bg-green-100 border border-green-200'} rounded-lg px-4 py-2`}>
                                <p className="text-xs font-semibold mb-1" style={{ color: isBuyer ? PRAQEN.primary : PRAQEN.secondary }}>
                                  {isBuyer ? '👤 Buyer' : '🛒 Seller'}
                                </p>
                                <p className="text-sm break-words">{msg.message_text}</p>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">{formatDate(msg.created_at)}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {moderatorJoined && (
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message as moderator..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <button type="submit" disabled={sendingMessage || !newMessage.trim()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition flex items-center gap-2"><Send size={16} /> Send</button>
                      </form>
                    )}
                  </div>
                )}

                {/* Resolve Tab */}
                {activeTab === 'resolve' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                        <Shield size={18} /> Making a Fair Decision
                      </h3>
                      <ul className="text-xs text-purple-600 space-y-1 ml-4">
                        <li>• Review all evidence uploaded by both parties</li>
                        <li>• Check user history and past feedback</li>
                        <li>• Read the chat history for context</li>
                        <li>• Consider who has more to lose</li>
                        <li>• Document your reasoning clearly</li>
                      </ul>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Moderator Decision Notes *</label>
                      <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" rows="5" placeholder="Document your decision and reasoning in detail. This will be shown to both parties and recorded as moderator notes..." />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <button onClick={() => resolveDispute(selectedDispute.id, 'BUYER_WINS')} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                        <ThumbsUp size={18} /> Buyer Wins (Release BTC)
                      </button>
                      <button onClick={() => resolveDispute(selectedDispute.id, 'SELLER_WINS')} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                        <ThumbsUp size={18} /> Seller Wins (Keep BTC)
                      </button>
                      <button onClick={() => resolveDispute(selectedDispute.id, 'CANCEL')} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                        <X size={18} /> Cancel Trade (Refund)
                      </button>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 flex items-center gap-2">
                        <AlertTriangle size={14} />
                        This decision is final and cannot be reversed. Both parties will be notified immediately.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {selectedEvidence && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedEvidence(null)}>
            <div className="relative max-w-4xl w-full">
              <img src={selectedEvidence.image_url} alt="Evidence full size" className="w-full h-auto rounded-lg" />
              <button onClick={() => setSelectedEvidence(null)} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"><X size={20} /></button>
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg text-sm">
                Uploaded by: {selectedEvidence.user_id === selectedDispute?.buyer?.id ? 'Buyer' : 'Seller'} | {formatDate(selectedEvidence.created_at)}
              </div>
            </div>
          </div>
        )}

        {/* Resolved Disputes - Shows all resolved disputes with details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ color: PRAQEN.primary }}>Resolved Disputes ({totalResolved})</h2>
          
          {resolvedDisputesList.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No resolved disputes yet. Resolved disputes will appear here.</p>
          ) : (
            <div className="space-y-4">
              {resolvedDisputesList.map((dispute) => (
                <div key={dispute.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <p className="font-semibold text-slate-900">Trade: {dispute.trade_id?.slice(0, 8)}...</p>
                        {getResolutionBadge(dispute.resolution)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-2">
                        <div>
                          <p className="text-gray-600"><strong>Reason:</strong> {dispute.reason || 'User opened a dispute'}</p>
                          <p className="text-gray-600"><strong>Amount:</strong> {parseFloat(dispute.amount_btc || 0).toFixed(8)} BTC (${parseFloat(dispute.amount_usd || 0).toFixed(2)})</p>
                          <p className="text-gray-600"><strong>Buyer:</strong> {dispute.buyer?.username || 'Unknown'}</p>
                          <p className="text-gray-600"><strong>Seller:</strong> {dispute.seller?.username || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <UserCheck size={14} style={{ color: PRAQEN.success }} />
                            <strong>Resolved by:</strong> {dispute.resolved_by ? (dispute.resolved_by === user?.id ? moderatorName : 'Moderator') : 'Unknown'}
                          </p>
                          <p className="text-gray-600 flex items-center gap-1">
                            <ClockIcon size={14} />
                            <strong>Resolved at:</strong> {formatDate(dispute.resolved_at)}
                          </p>
                          {dispute.resolution_notes && (
                            <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                              <p className="text-xs text-gray-500"><strong>Moderator Notes:</strong></p>
                              <p className="text-xs text-gray-600 mt-1">{dispute.resolution_notes.substring(0, 150)}...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDispute({...dispute, trade_details: dispute});
                        setActiveTab('details');
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}