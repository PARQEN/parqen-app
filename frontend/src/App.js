import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RatesProvider } from './contexts/RatesContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import GiftCardMarketplace from './pages/GiftCardMarketplace';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import CreateListing from './pages/CreateListing';
import CreateOffer from './pages/CreateOffer';
import ListingDetail from './pages/ListingDetail';
import MyTrades from './pages/MyTrades';
import TradeDetail from './pages/TradeDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import EscrowVerification from './pages/EscrowVerification';
import WalletPage from './pages/Wallet';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import MyListings from './pages/MyListings';
import EditListing from './pages/EditListing';
import ForgotPassword from './pages/ForgotPassword';
import Feedback from './pages/Feedback';
import TradeChat from './pages/TradeChat';
import BuyBitcoin from './pages/BuyBitcoin';
import SellBitcoin from './pages/SellBitcoin';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SellGiftCardMarketplace from './pages/SellGiftCardMarketplace';
import VerifyOTP from './pages/VerifyOTP';  // ✅ ADDED OTP PAGE
import ResetPassword from './pages/ResetPassword';  // ✅ ADDED RESET PASSWORD PAGE
import EmailConfirmation from './pages/EmailConfirmation';  // ✅ EMAIL CONFIRMATION PAGE


// API Base URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Setup axios interceptor for auth
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      console.log('✅ Auth header set from localStorage:', storedToken.slice(0, 20) + '...');
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('❌ No token found, auth header removed');
    }
  }, [token]);

  // Load user profile on mount
  useEffect(() => {
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }

    // Listen for user updates from other pages (e.g., Profile page)
    const handleUserUpdated = () => {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser && storedUser.id) {
        setUser(storedUser);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, [token]);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`);
      const userData = response.data.user;
      
      setUser(userData);
      
      // Keep localStorage in sync
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Fire event so all components (Navbar, etc) sync
      window.dispatchEvent(new Event('userUpdated'));
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    console.log('🔐 LOGIN FUNCTION CALLED');
    console.log('Token:', token.slice(0, 20) + '...');

    setToken(token);
    setUser(userData);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Fire event for Navbar and other components
    window.dispatchEvent(new Event('userUpdated'));

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Authorization header set immediately:', axios.defaults.headers.common['Authorization'].slice(0, 30) + '...');

    toast.success('✅ Logged in successfully!');
  };

  const logout = () => {
    console.log('🚪 LOGOUT FUNCTION CALLED');

    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];

    console.log('✅ Auth header removed');
    toast.info('Logged out');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PRAQEN...</p>
        </div>
      </div>
    );
  }

  return (
    <RatesProvider>
    <Router>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <Navbar user={user} onLogout={logout} />
        
        <Routes>
          {/* HOME ROUTE */}
          <Route path="/" element={<LandingPage user={user} />} />
          
          {/* Public Routes */}
          <Route path="/listing/:id" element={<ListingDetail user={user} />} />
          
          {/* Gift Card Marketplace - MAIN PAGE */}
          <Route path="/gift-cards" element={<GiftCardMarketplace user={user} />} />
          
          {/* Redirect old marketplace to new gift cards */}
          <Route path="/marketplace" element={<Navigate to="/gift-cards" />} />

          {/* Auth Routes */}
          <Route path="/register" element={!user ? <Register onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* ✅ OTP AND RESET PASSWORD ROUTES - ADDED */}
          <Route path="/verify-otp" element={<VerifyOTP onLogin={login} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/confirm" element={<EmailConfirmation />} />
          
          {/* Sell Gift Card Marketplace */}
          <Route path="/sell-gift-card" element={<SellGiftCardMarketplace user={user} />} />
          
          {/* Bitcoin Marketplace Routes */}
          <Route path="/buy-bitcoin" element={<BuyBitcoin user={user} />} />
          <Route path="/sell-bitcoin" element={<SellBitcoin user={user} />} />

          {/* Protected Routes - Core Features */}
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/wallet" element={user ? <WalletPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile" element={user ? <Profile userId={user.id} /> : <Navigate to="/login" />} />

          {/* Listing Management */}
          <Route path="/create-listing" element={user ? <CreateListing user={user} /> : <Navigate to="/login" />} />
          <Route path="/create-offer" element={user ? <CreateOffer user={user} /> : <Navigate to="/login" />} />
          <Route path="/edit-listing/:id" element={user ? <EditListing user={user} /> : <Navigate to="/login" />} />
          <Route path="/my-listings" element={user ? <MyListings user={user} /> : <Navigate to="/login" />} />

          {/* Trade Routes */}
          <Route path="/my-trades" element={user ? <MyTrades user={user} /> : <Navigate to="/login" />} />
          <Route path="/trade/:id" element={user ? <TradeDetail user={user} /> : <Navigate to="/login" />} />
          <Route path="/trade-chat/:id" element={user ? <TradeChat user={user} /> : <Navigate to="/login" />} />
          <Route path="/feedback/:tradeId/:userId" element={user ? <Feedback user={user} /> : <Navigate to="/login" />} />

          {/* Admin/Moderator Routes */}
          <Route path="/admin" element={user?.is_admin ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/moderator" element={user?.is_moderator ? <ModeratorDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/escrow/:id" element={user ? <EscrowVerification user={user} /> : <Navigate to="/login" />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <BottomNav user={user} />
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    </Router>
    </RatesProvider>
  );
}

export default App;