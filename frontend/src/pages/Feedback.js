import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, User, Calendar, MessageCircle, ThumbsUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PRAQEN = {
  primary: '#2D5F4F',
  secondary: '#FFD700',
  lightBg: '#f0f8f5',
  darkBg: '#1a3a2a',
};

export default function Feedback({ user }) {
  const { tradeId, userId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [trade, setTrade] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [tradeId, userId]);

  const loadData = async () => {
    try {
      // Load trade details
      const tradeRes = await axios.get(`${API_URL}/trades/${tradeId}`);
      setTrade(tradeRes.data.trade);

      // Load user to give feedback to
      const userRes = await axios.get(`${API_URL}/users/${userId}`);
      setReceiver(userRes.data.user);

      // Check if feedback already exists
      try {
        const feedbackRes = await axios.get(`${API_URL}/users/${userId}/reviews`);
        const existing = feedbackRes.data.reviews?.find(r => r.trade_id === tradeId);
        if (existing) {
          setExistingFeedback(existing);
        }
      } catch (err) {
        // No feedback exists yet
        console.log('No existing feedback');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/trades/${tradeId}/feedback`, {
        rating,
        comment,
        toUserId: userId,
      });

      toast.success('Feedback submitted successfully!');
      navigate('/my-trades');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PRAQEN.lightBg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: PRAQEN.primary, borderTopColor: PRAQEN.secondary }}></div>
          <p style={{ color: PRAQEN.primary }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (existingFeedback) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ backgroundColor: PRAQEN.lightBg }}>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: PRAQEN.primary }}>Feedback Already Submitted</h2>
          <p className="text-gray-600 mb-4">
            You already left feedback for this user on this trade.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-center gap-1 mb-2">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} size={24} className={star <= existingFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <p className="text-gray-700">{existingFeedback.comment}</p>
          </div>
          <button
            onClick={() => navigate('/my-trades')}
            className="px-6 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: PRAQEN.primary }}
          >
            Back to My Trades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: PRAQEN.lightBg }}>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4" style={{ backgroundColor: PRAQEN.primary }}>
            <h1 className="text-2xl font-bold text-white">Leave Feedback</h1>
            <p className="text-blue-100 text-sm">Trade #{tradeId?.slice(0, 8)}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3 shadow-lg" style={{ backgroundColor: PRAQEN.primary }}>
                {receiver?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <h2 className="text-xl font-bold" style={{ color: PRAQEN.primary }}>{receiver?.username}</h2>
              <p className="text-gray-500 text-sm">
                {receiver?.total_trades || 0} total trades
              </p>
            </div>

            {/* Rating Stars */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 text-center">
                How was your experience?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={`${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {rating === 1 && 'Poor - Very dissatisfied'}
                {rating === 2 && 'Fair - Somewhat dissatisfied'}
                {rating === 3 && 'Good - Satisfied'}
                {rating === 4 && 'Very Good - Highly satisfied'}
                {rating === 5 && 'Excellent - Amazing experience!'}
              </p>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this trader..."
                rows="4"
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full py-3 rounded-lg text-white font-bold transition hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: PRAQEN.primary }}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Your feedback helps build trust in the community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}