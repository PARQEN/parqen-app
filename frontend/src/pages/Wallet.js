import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { Copy, Wallet, TrendingUp, ArrowDown, ArrowUp, History, Bitcoin, DollarSign, CheckCircle, X, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const PRAQEN = {
  primary: '#2D5F4F',
  secondary: '#FFD700',
  darkBg: '#1a3a2a',
  lightBg: '#f0f8f5',
  gray: {
    300: '#d1d5db',
  }
};

export default function WalletPage({ user }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [depositAddress, setDepositAddress] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    loadBalance();
    loadTransactions();
    generateDepositAddress();
  }, [user]);

  const loadBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Balance response:', response.data);
      setBalance(parseFloat(response.data.balance_btc || 0));
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/transactions`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    }
  };

  const generateDepositAddress = async () => {
    try {
      const response = await axios.post(`${API_URL}/wallet/deposit-address`);
      setDepositAddress(response.data.address);
    } catch (error) {
      console.error('Failed to generate address:', error);
      setDepositAddress('Contact support for deposit address');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress.trim()) {
      toast.error('Please enter a Bitcoin address');
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/wallet/withdraw`, {
        address: withdrawAddress,
        amount: withdrawAmount,
      });
      toast.success('Withdrawal request submitted!');
      setShowWithdrawModal(false);
      setWithdrawAddress('');
      setWithdrawAmount('');
      await loadBalance();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatBtc = (btc) => {
    return parseFloat(btc || 0).toFixed(8);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PRAQEN.lightBg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: PRAQEN.primary, borderTopColor: PRAQEN.secondary }}></div>
          <p style={{ color: PRAQEN.primary }}>Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: PRAQEN.lightBg }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black" style={{ color: PRAQEN.primary }}>My Wallet</h1>
          <p style={{ color: PRAQEN.primary }} className="opacity-70 mt-1">
            Manage your Bitcoin balance
          </p>
          <button 
            onClick={loadBalance}
            className="mt-2 text-sm flex items-center gap-1 hover:opacity-70"
            style={{ color: PRAQEN.primary }}
          >
            <RefreshCw size={14} />
            Refresh balance
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r rounded-2xl shadow-xl p-8 mb-8 text-white" style={{ background: `linear-gradient(135deg, ${PRAQEN.primary}, ${PRAQEN.darkBg})` }}>
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={28} />
            <span className="text-lg font-semibold">Total Balance</span>
          </div>
          <div className="text-5xl font-black mb-2">
            {formatBtc(balance)} BTC
          </div>
          <div className="text-xl opacity-80">
            ≈ ${formatNumber(balance * 45000)} USD
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition hover:scale-105"
              style={{ backgroundColor: PRAQEN.secondary, color: PRAQEN.darkBg }}
            >
              <ArrowDown size={18} />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition hover:scale-105 bg-white/20 backdrop-blur"
              style={{ color: 'white' }}
            >
              <ArrowUp size={18} />
              Withdraw
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin size={20} style={{ color: PRAQEN.primary }} />
              <span className="text-gray-500">Available Balance</span>
            </div>
            <div className="text-2xl font-black" style={{ color: PRAQEN.primary }}>
              {formatBtc(balance)} BTC
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={20} style={{ color: PRAQEN.secondary }} />
              <span className="text-gray-500">In Escrow</span>
            </div>
            <div className="text-2xl font-black" style={{ color: PRAQEN.darkBg }}>
              0.00000000 BTC
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} style={{ color: '#10b981' }} />
              <span className="text-gray-500">Total Earned</span>
            </div>
            <div className="text-2xl font-black text-green-600">
              {formatBtc(balance > 2 ? balance - 2 : 0)} BTC
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: PRAQEN.primary }}>
            <History size={20} style={{ color: PRAQEN.primary }} />
            <h2 className="text-xl font-black" style={{ color: PRAQEN.primary }}>Transaction History</h2>
          </div>
          
          <div className="divide-y">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <History size={48} className="mx-auto mb-3 opacity-30" style={{ color: PRAQEN.primary }} />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Deposit or withdraw to see history</p>
              </div>
            ) : (
              transactions.map((tx, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {tx.type === 'deposit' ? (
                      <ArrowDown size={20} className="text-green-600" />
                    ) : (
                      <ArrowUp size={20} className="text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold capitalize">{tx.type}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} {formatBtc(tx.amount)} BTC
                    </p>
                    <p className="text-xs text-gray-500">{tx.status || 'completed'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black" style={{ color: PRAQEN.primary }}>Deposit Bitcoin</h2>
              <button onClick={() => setShowDepositModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Send Bitcoin to the address below. Funds will appear after 2 confirmations.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-xs text-gray-500 mb-2">Your Deposit Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm break-all font-mono">{depositAddress}</code>
                <button onClick={() => copyToClipboard(depositAddress)} className="p-1 hover:bg-gray-200 rounded">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Only send BTC to this address. Sending other coins may result in loss.
              </p>
            </div>
            
            <button
              onClick={() => setShowDepositModal(false)}
              className="w-full py-2 rounded-lg font-semibold"
              style={{ backgroundColor: PRAQEN.primary, color: 'white' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black" style={{ color: PRAQEN.primary }}>Withdraw Bitcoin</h2>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">BTC Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Enter Bitcoin address"
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Amount (BTC)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00000000"
                  step="0.00000001"
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ borderColor: PRAQEN.gray?.[300] || '#d1d5db' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatBtc(balance)} BTC
                </p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-800">
                  ⚠️ Double-check the address. Withdrawals cannot be reversed.
                </p>
              </div>
              
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full py-2 rounded-lg font-semibold transition hover:opacity-80"
                style={{ backgroundColor: PRAQEN.primary, color: 'white' }}
              >
                {submitting ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}