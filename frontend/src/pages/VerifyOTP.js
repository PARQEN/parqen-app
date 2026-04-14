import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Shield, Mail, Lock, ArrowRight, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const C = {
  forest: '#1B4332',
  green: '#2D6A4F',
  gold: '#F4A422',
  mist: '#F0FAF5',
};

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [purpose, setPurpose] = useState('verify'); // 'verify' or 'reset'

  useEffect(() => {
    // Get email and purpose from location state or URL params
    const stateEmail = location.state?.email;
    const statePurpose = location.state?.purpose;
    
    if (stateEmail) {
      setEmail(stateEmail);
    }
    if (statePurpose) {
      setPurpose(statePurpose);
    }
    
    startTimer();
  }, [location]);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email,
        otp,
        purpose
      });

      if (response.data.success) {
        toast.success(response.data.message);
        
        if (purpose === 'verify') {
          // Email verified successfully
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (purpose === 'reset') {
          // Password reset - redirect to reset password page
          navigate('/reset-password', { state: { email, token: response.data.resetToken } });
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/send-otp`, {
        email,
        purpose
      });

      if (response.data.success) {
        toast.success('New OTP sent to your email');
        startTimer();
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: C.mist }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${C.green}15` }}>
            <Shield size={32} style={{ color: C.green }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: C.forest }}>
            Verify Your Email
          </h2>
          <p className="text-gray-500 mt-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-gray-700 mt-1">{email}</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none text-center text-2xl tracking-widest font-mono"
                style={{ borderColor: otp ? C.green : C.gray[200] }}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !otp}
            className="w-full py-3 rounded-xl font-bold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: C.green }}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <span>Resend code in {timer} seconds</span>
            )}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}