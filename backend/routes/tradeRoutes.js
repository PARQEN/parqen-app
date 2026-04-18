const express = require('express');
const router = express.Router();
const tradeEscrowService = require('../services/tradeEscrowService');
const db = require('../config/database');

// Buyer marks as paid
router.post('/:tradeId/mark-paid', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { buyerId } = req.body;
        
        const result = await tradeEscrowService.markAsPaid(tradeId, buyerId);
        res.json(result);
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Seller releases Bitcoin to buyer
router.post('/:tradeId/release', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { sellerId } = req.body;
        
        const result = await tradeEscrowService.releaseBitcoinToBuyer(tradeId, sellerId);
        res.json(result);
    } catch (error) {
        console.error('Release error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel trade (expired or manual)
router.post('/:tradeId/cancel', async (req, res) => {
    try {
        const { tradeId } = req.params;
        
        const result = await tradeEscrowService.cancelExpiredTrade(tradeId);
        res.json(result);
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get trade details
router.get('/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;
        
        const trade = await db.query(
            `SELECT t.*, 
                b.username as buyer_name,
                s.username as seller_name
            FROM trades t
            JOIN users b ON b.id = t.buyer_id
            JOIN users s ON s.id = t.seller_id
            WHERE t.id = $1`,
            [tradeId]
        );
        
        if (!trade.rows[0]) {
            return res.status(404).json({ success: false, error: 'Trade not found' });
        }
        
        res.json({ success: true, trade: trade.rows[0] });
    } catch (error) {
        console.error('Get trade error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;