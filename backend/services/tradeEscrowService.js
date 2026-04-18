const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const db = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

class TradeEscrowService {
    constructor() {
        this.masterWallet = null;
        this.feePercent = 0.5; // 0.5% platform fee
    }

    async initialize() {
        if (this.masterWallet) return this.masterWallet;
        
        Coinbase.configure({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            privateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        });
        
        this.masterWallet = await Wallet.fetch(process.env.MASTER_WALLET_ID);
        return this.masterWallet;
    }

    // Lock seller's funds in escrow when trade is created
    async lockFundsInEscrow(tradeId, sellerId, amountBtc) {
        await this.initialize();
        
        const sellerWallet = await db.query(
            'SELECT btc_address FROM user_wallets WHERE user_id = $1',
            [sellerId]
        );
        
        if (!sellerWallet.rows[0]) {
            throw new Error('Seller wallet not found');
        }

        // Create escrow address for this trade
        const escrowAddress = await this.masterWallet.createAddress();
        
        // Calculate fee
        const feeAmount = (amountBtc * this.feePercent) / 100;
        
        // Update trade with escrow details (using YOUR column names)
        await db.query(
            `UPDATE trades SET 
                status = 'FUNDS_LOCKED',
                escrow_wallet_address = $1,
                escrow_amount = $2,
                platform_fee_btc = $3,
                expires_at = NOW() + INTERVAL '30 minutes',
                escrow_locked_at = NOW()
            WHERE id = $4`,
            [escrowAddress.address, amountBtc, feeAmount, tradeId]
        );

        return {
            escrowAddress: escrowAddress.address,
            feeAmount,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        };
    }

    // Buyer marks as paid
    async markAsPaid(tradeId, buyerId) {
        const trade = await db.query(
            'SELECT * FROM trades WHERE id = $1 AND buyer_id = $2',
            [tradeId, buyerId]
        );

        if (!trade.rows[0]) {
            throw new Error('Trade not found or unauthorized');
        }

        await db.query(
            `UPDATE trades SET 
                status = 'PAID',
                paid_at = NOW()
            WHERE id = $1`,
            [tradeId]
        );

        return { success: true, message: 'Marked as paid. Waiting for seller confirmation.' };
    }

    // Seller confirms payment - release Bitcoin to buyer
    async releaseBitcoinToBuyer(tradeId, sellerId) {
        await this.initialize();
        
        const trade = await db.query(
            `SELECT t.*, uw.btc_address as buyer_address 
            FROM trades t
            JOIN user_wallets uw ON uw.user_id = t.buyer_id
            WHERE t.id = $1 AND t.seller_id = $2`,
            [tradeId, sellerId]
        );

        if (!trade.rows[0]) {
            throw new Error('Trade not found or unauthorized');
        }

        if (trade.rows[0].status !== 'PAID') {
            throw new Error('Buyer has not marked as paid yet');
        }

        const tradeData = trade.rows[0];
        const buyerGets = tradeData.amount_btc;
        const platformFee = tradeData.platform_fee_btc || 0;

        // Send Bitcoin to buyer
        const buyerTransfer = await this.masterWallet.createTransfer({
            amount: buyerGets,
            assetId: Coinbase.assets.Btc,
            destination: tradeData.buyer_address,
        });

        // Update trade status
        await db.query(
            `UPDATE trades SET 
                status = 'COMPLETED',
                completed_at = NOW(),
                buyer_btc_txhash = $1,
                fee_status = 'COLLECTED',
                fee_collected_at = NOW()
            WHERE id = $2`,
            [buyerTransfer.transactionHash, tradeId]
        );

        // Update buyer balance
        await db.query(
            `UPDATE user_wallets SET 
                balance_btc = balance_btc + $1,
                updated_at = NOW()
            WHERE user_id = $2`,
            [buyerGets, tradeData.buyer_id]
        );

        return {
            success: true,
            buyerTxHash: buyerTransfer.transactionHash,
            buyerReceived: buyerGets,
            platformFee: platformFee
        };
    }

    // Cancel expired trade - return funds to seller
    async cancelExpiredTrade(tradeId) {
        await this.initialize();
        
        const trade = await db.query(
            `SELECT t.*, uw.btc_address as seller_address 
            FROM trades t
            JOIN user_wallets uw ON uw.user_id = t.seller_id
            WHERE t.id = $1 
            AND t.status IN ('CREATED', 'FUNDS_LOCKED', 'PAID') 
            AND t.expires_at < NOW()`,
            [tradeId]
        );

        if (!trade.rows[0]) {
            return { success: false, message: 'Trade not found or not expired' };
        }

        const tradeData = trade.rows[0];
        const refundAmount = tradeData.escrow_amount || tradeData.amount_btc;

        // Refund Bitcoin to seller
        const refundTransfer = await this.masterWallet.createTransfer({
            amount: refundAmount,
            assetId: Coinbase.assets.Btc,
            destination: tradeData.seller_address,
        });

        // Update trade status
        await db.query(
            `UPDATE trades SET 
                status = 'CANCELLED',
                cancelled_at = NOW(),
                cancel_reason = 'Trade expired',
                seller_btc_txhash = $1
            WHERE id = $2`,
            [refundTransfer.transactionHash, tradeId]
        );

        return {
            success: true,
            message: 'Trade expired. Funds returned to seller.',
            refundTxHash: refundTransfer.transactionHash
        };
    }

    // Process all expired trades
    async processExpiredTrades() {
        const expiredTrades = await db.query(
            `SELECT id FROM trades 
            WHERE status IN ('CREATED', 'FUNDS_LOCKED', 'PAID') 
            AND expires_at < NOW()`
        );

        for (const trade of expiredTrades.rows) {
            await this.cancelExpiredTrade(trade.id);
            console.log(`✅ Trade ${trade.id} expired and refunded`);
        }

        return expiredTrades.rows.length;
    }
}

module.exports = new TradeEscrowService();