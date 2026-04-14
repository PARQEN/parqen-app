// src/pages/TradeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function TradeDetails() {
    const { id } = useParams(); // Gets the trade ID from URL
    const navigate = useNavigate();
    const [trade, setTrade] = useState(null);
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        if (id) {
            fetchTradeDetails();
            subscribeToTradeUpdates();
        }
    }, [id]);

    async function fetchTradeDetails() {
        setLoading(true);
        try {
            // Fetch trade
            const { data: tradeData, error: tradeError } = await supabase
                .from('trades')
                .select('*')
                .eq('id', id)
                .single();

            if (tradeError) throw tradeError;
            setTrade(tradeData);

            // Fetch associated listing
            const { data: listingData, error: listingError } = await supabase
                .from('listings')
                .select('*')
                .eq('id', tradeData.listing_id)
                .single();

            if (listingError) throw listingError;
            setListing(listingData);
        } catch (error) {
            console.error('Error fetching trade:', error);
        } finally {
            setLoading(false);
        }
    }

    function subscribeToTradeUpdates() {
        const subscription = supabase
            .channel(`trade-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trades',
                    filter: `id=eq.${id}`
                },
                (payload) => {
                    setTrade(payload.new);
                }
            )
            .subscribe();

        return () => subscription.unsubscribe();
    }

    const handleMarkAsPaid = async () => {
        const { error } = await supabase
            .from('trades')
            .update({ status: 'PAID' })
            .eq('id', id);

        if (!error) {
            alert('Marked as paid! Waiting for seller to release Bitcoin.');
        }
    };

    const handleReleaseBitcoin = async () => {
        const { error } = await supabase
            .from('trades')
            .update({ status: 'COMPLETED' })
            .eq('id', id);

        if (!error) {
            alert('Bitcoin released! Trade completed.');
        }
    };

    const handleCancel = async () => {
        const { error } = await supabase
            .from('trades')
            .update({ status: 'CANCELLED' })
            .eq('id', id);

        if (!error) {
            navigate('/buy-bitcoin');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading trade details...</p>
            </div>
        );
    }

    if (!trade || !listing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500">Trade not found</p>
            </div>
        );
    }

    const isBuyer = user?.id === trade.buyer_id;
    const isSeller = user?.id === trade.seller_id;

    return (
        <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F0FAF5' }}>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-black mb-6" style={{ color: '#1B4332' }}>
                    Trade #{trade.id.slice(0, 8)}
                </h1>

                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    {/* Status Badge */}
                    <div className="mb-6">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold
                            ${trade.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                            ${trade.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${trade.status === 'PAID' ? 'bg-blue-100 text-blue-800' : ''}
                            ${trade.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                            Status: {trade.status}
                        </span>
                    </div>

                    {/* Trade Details */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-600">Amount (USD):</span>
                            <span className="font-bold text-lg">${trade.amount_usd}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-600">Amount (BTC):</span>
                            <span className="font-bold text-lg">{trade.amount_btc} BTC</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-600">Rate:</span>
                            <span className="font-bold">${listing.bitcoin_price}/BTC</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-bold">{listing.payment_method}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-gray-600">Country:</span>
                            <span className="font-bold">{listing.country}</span>
                        </div>
                    </div>

                    {/* Payment Instructions (Visible to Buyer) */}
                    {isBuyer && trade.status === 'PENDING' && (
                        <div className="bg-blue-50 p-4 rounded-xl mb-6">
                            <h3 className="font-bold mb-2 text-blue-900">📝 Payment Instructions:</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {listing.trade_instructions || 'No instructions provided. Contact seller.'}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {isBuyer && trade.status === 'PENDING' && (
                            <button
                                onClick={handleMarkAsPaid}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                            >
                                I Have Paid
                            </button>
                        )}

                        {isSeller && trade.status === 'PAID' && (
                            <button
                                onClick={handleReleaseBitcoin}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                            >
                                Release Bitcoin
                            </button>
                        )}

                        {(trade.status === 'PENDING' || trade.status === 'PAID') && (
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50"
                            >
                                Cancel Trade
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/buy-bitcoin')}
                            className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                        >
                            Back to Market
                        </button>
                    </div>

                    {/* Trade Info */}
                    <div className="mt-6 pt-4 border-t text-xs text-gray-400">
                        <p>Trade ID: {trade.id}</p>
                        <p>Created: {new Date(trade.created_at).toLocaleString()}</p>
                        <p>Seller ID: {trade.seller_id?.slice(0, 8)}...</p>
                        <p>Buyer ID: {trade.buyer_id?.slice(0, 8)}...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}