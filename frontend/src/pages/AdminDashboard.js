import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { TrendingUp, Users, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const [profits, setProfits] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profitsRes = await axios.get(`${API_URL}/admin/profits`);
      const statsRes = await axios.get(`${API_URL}/admin/stats`);
      setProfits(profitsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Profits</p>
                <p className="text-3xl font-bold text-slate-900">{profits?.totalBtc} BTC</p>
                <p className="text-sm text-gray-600">${profits?.totalUsd}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Completed Trades</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.completedTrades}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Collections */}
        {profits?.profits && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Fee Collections</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-700">Trade ID</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Fee (BTC)</th>
                    <th className="text-right py-3 font-semibold text-gray-700">Fee (USD)</th>
                    <th className="text-left py-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profits.profits.slice(0, 10).map((profit) => (
                    <tr key={profit.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-700">{profit.trade_id.slice(0, 8)}...</td>
                      <td className="py-3 text-sm font-mono text-right">{parseFloat(profit.profit_btc).toFixed(8)}</td>
                      <td className="py-3 text-sm text-right">${parseFloat(profit.profit_usd).toFixed(2)}</td>
                      <td className="py-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          {profit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
