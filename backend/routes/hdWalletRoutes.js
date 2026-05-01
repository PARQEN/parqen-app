// routes/hdWalletRoutes.js
// PRAQEN — HD Wallet API Endpoints (Production Ready)
// All endpoints the Wallet.jsx frontend needs

require('dotenv').config();
const express      = require('express');
const router       = express.Router();
const hdWallet     = require('../services/hdWalletService');
const depositMonitor = require('../services/depositMonitor');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── Auth middleware — reads token from Authorization header ──────────────────
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'praqen-secret-change-in-production';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================================
// GET /api/hd-wallet/wallet
// Returns user's BTC address + balance
// Called by Wallet.jsx on load
// ============================================================
router.get('/wallet', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Primary source: user_wallets (updated by deposit monitor on every confirmed tx)
        const { data: walletRow } = await supabaseAdmin
            .from('user_wallets')
            .select('btc_address, balance_btc')
            .eq('user_id', userId)
            .single();

        let address = walletRow?.btc_address || null;
        let balance = parseFloat(walletRow?.balance_btc || 0);

        // Fallback: if user_wallets has 0, also check user_balances
        if (!balance) {
            const { data: balRow } = await supabaseAdmin
                .from('user_balances')
                .select('balance_btc')
                .eq('user_id', userId)
                .single();
            if (parseFloat(balRow?.balance_btc || 0) > 0) {
                balance = parseFloat(balRow.balance_btc);
            }
        }

        // Fallback: if user_wallets has no address, check users table
        if (!address) {
            const { data: userRow } = await supabaseAdmin
                .from('users')
                .select('bitcoin_wallet_address')
                .eq('id', userId)
                .single();
            address = userRow?.bitcoin_wallet_address || null;
        }

        // Transaction history
        const { data: txs } = await supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        const network = process.env.HD_NETWORK || 'mainnet';

        console.log(`💰 Wallet API — user ${userId.slice(0,8)}: ${balance} BTC | addr ${address ? address.slice(0,12) + '…' : 'none'}`);

        res.json({
            success:      true,
            address:      address,
            balance_btc:  balance,
            network:      network,
            has_address:  !!address,
            transactions: txs || [],
        });
    } catch (error) {
        console.error('Wallet API error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// POST /api/hd-wallet/generate-address
// Force-generate or regenerate user's BTC address
// ============================================================
router.post('/generate-address', verifyToken, async (req, res) => {
  try {
    const userId  = req.userId;
    const addrData = hdWallet.generateUserAddress(userId);

    // Save to users table
    await supabaseAdmin
      .from('users')
      .update({
        bitcoin_wallet_address: addrData.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log(`[hdWalletRoutes] Address generated for ${userId.slice(0,8)}: ${addrData.address}`);

    res.json({
      success:  true,
      address:  addrData.address,
      network:  addrData.network,
      message:  'Your unique Bitcoin deposit address is ready',
    });

  } catch (error) {
    console.error('[hdWalletRoutes POST /generate-address]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/hd-wallet/balance
// Returns live balance from mempool + DB balance
// ============================================================
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('bitcoin_wallet_address')
      .eq('id', userId)
      .single();

    if (!user?.bitcoin_wallet_address) {
      return res.json({ success: true, balance_btc: 0, confirmed_btc: 0, unconfirmed_btc: 0 });
    }

    // Live mempool balance
    const live = await hdWallet.checkBalance(user.bitcoin_wallet_address);

    // DB balance
    const { data: bal } = await supabaseAdmin
      .from('user_balances')
      .select('balance_btc')
      .eq('user_id', userId)
      .single();

    res.json({
      success:          true,
      address:          user.bitcoin_wallet_address,
      balance_btc:      parseFloat(bal?.balance_btc || 0),   // DB tracked balance
      confirmed_btc:    live.confirmed_btc,                   // live from mempool
      unconfirmed_btc:  live.unconfirmed_btc,
      network:          hdWallet.getNetwork(),
    });

  } catch (error) {
    console.error('[hdWalletRoutes GET /balance]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/hd-wallet/check-deposit
// Manually trigger deposit check for this user
// Called when user clicks "Check for New Payments"
// ============================================================
router.post('/check-deposit', verifyToken, async (req, res) => {
  try {
    const result = await depositMonitor.checkAddressNow(req.userId);

    res.json({
      success:     true,
      balance_btc: result.balance_btc,
      address:     result.address,
      message:     result.balance_btc > 0
        ? `Balance: ${result.balance_btc.toFixed(8)} BTC`
        : 'No confirmed deposits yet. Confirmations take 10–60 minutes.',
    });

  } catch (error) {
    console.error('[hdWalletRoutes POST /check-deposit]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/hd-wallet/send
// Send BTC from user's PRAQEN wallet to any external address
// (Withdrawal)
// ============================================================
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { toAddress, amountBtc } = req.body;
    const userId = req.userId;

    if (!toAddress || !amountBtc || parseFloat(amountBtc) <= 0) {
      return res.status(400).json({ error: 'Invalid address or amount' });
    }

    const amount = parseFloat(amountBtc);

    // Check DB balance first
    const { data: bal } = await supabaseAdmin
      .from('user_balances')
      .select('balance_btc')
      .eq('user_id', userId)
      .single();

    const available = parseFloat(bal?.balance_btc || 0);
    if (available < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: ${available.toFixed(8)} BTC, Requested: ${amount.toFixed(8)} BTC`
      });
    }

    console.log(`[hdWalletRoutes] Sending ${amount} BTC from user ${userId.slice(0,8)} to ${toAddress}`);

    // Send via HD wallet — uses user's derived private key
    const result = await hdWallet.sendBitcoin(`user_${userId}`, toAddress, amount);

    // Deduct from DB balance
    const newBalance = parseFloat((available - amount).toFixed(8));
    await supabaseAdmin
      .from('user_balances')
      .update({ balance_btc: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Log the withdrawal
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id:              userId,
        type:                 'WITHDRAWAL',
        amount_btc:           amount,
        status:               'CONFIRMED',
        tx_hash:              result.txid,
        destination_address:  toAddress,
        created_at:           new Date().toISOString(),
      });

    console.log(`✅ [hdWalletRoutes] Sent ${amount} BTC — TX: ${result.txid}`);

    res.json({
      success:     true,
      txid:        result.txid,
      amount_btc:  amount,
      to:          toAddress,
      fee_sats:    result.fee_sats,
      new_balance: newBalance,
      explorer:    result.explorer_url,
      message:     `${amount} BTC sent successfully`,
    });

  } catch (error) {
    console.error('[hdWalletRoutes POST /send]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/hd-wallet/transactions
// Returns user's full transaction history
// ============================================================
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const { data: txs, error } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success:      true,
      transactions: txs || [],
      count:        txs?.length || 0,
    });

  } catch (error) {
    console.error('[hdWalletRoutes GET /transactions]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/hd-wallet/escrow-address
// Generate escrow address for a trade
// Called when trade is created
// ============================================================
router.post('/escrow-address', verifyToken, async (req, res) => {
  try {
    const { tradeId } = req.body;
    if (!tradeId) return res.status(400).json({ error: 'Trade ID is required' });

    const addrData = hdWallet.generateEscrowAddress(tradeId);

    res.json({
      success:       true,
      escrow_address: addrData.address,
      trade_id:      tradeId,
      network:       addrData.network,
    });

  } catch (error) {
    console.error('[hdWalletRoutes POST /escrow-address]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/hd-wallet/network
// Returns current network (testnet or mainnet)
// ============================================================
router.get('/network', (req, res) => {
  try {
    const network = hdWallet.getNetwork();
    res.json({
      success: true,
      network,
      message: network === 'testnet'
        ? '⚠️ TESTNET — Using fake BTC for development'
        : '✅ MAINNET — Real Bitcoin',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/hd-wallet/info
// Returns PRAQEN fee wallet address and system info
// ============================================================
router.get('/info', verifyToken, async (req, res) => {
  try {
    const info = hdWallet.getInfo();
    res.json({ success: true, ...info });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;