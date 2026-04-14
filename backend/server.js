// PRAQEN Backend Server - COMPLETE FIXED VERSION
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supabase Clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client bypasses RLS — use for all writes that touch user data
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// ============================================
// EMAIL CONFIGURATION
// ============================================

// Email transporter for nodemailer
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || 587),
  secure: false, // false for STARTTLS (port 587), true for TLS (port 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store verification codes (temporary - use Redis in production)
const verificationCodes = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateMockWallet() {
  return '1' + crypto.randomBytes(20).toString('hex').toUpperCase().slice(0, 33);
}

function encryptCode(code, key = 'mock-encryption-key') {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptCode(encrypted, key = 'mock-encryption-key') {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return 'Invalid code';
  }
}

function calculateFee(btcAmount) {
  return (parseFloat(btcAmount) * 0.005).toFixed(8);
}

async function getModeratorUserIds() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .or('is_moderator.eq.true,is_admin.eq.true');
  if (error) { console.error('Error fetching moderators:', error); return []; }
  return data.map(u => u.id);
}

async function notifyModerators(tradeId, trade, reason) {
  const moderatorIds = await getModeratorUserIds();
  for (const moderatorId of moderatorIds) {
    await createNotification(
      moderatorId, 'dispute',
      '🚨 New Dispute Opened',
      `Dispute opened for trade #${tradeId.slice(0, 8)}. Reason: ${reason.substring(0, 100)}`,
      `/admin/disputes/${tradeId}`
    );
  }
  console.log(`✅ Notified ${moderatorIds.length} moderators about dispute on trade ${tradeId}`);
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users').select('email').eq('email', email).single();
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const walletAddress = generateMockWallet();

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email, password_hash: passwordHash, username,
        full_name: fullName || username,
        bitcoin_wallet_address: walletAddress,
        is_email_verified: true,
        average_rating: 0, total_trades: 0, completion_rate: 100,
        account_status: 'ACTIVE', created_at: new Date(),
        avatar_url: null, is_admin: false, is_moderator: false,
      }])
      .select();

    if (error) { console.error('Registration error:', error); return res.status(400).json({ error: error.message }); }
    if (!data || data.length === 0) return res.status(400).json({ error: 'Failed to create user' });

    await supabaseAdmin.from('mock_wallets').insert([{ user_id: data[0].id, wallet_address: walletAddress, balance_btc: 0 }]);
    await supabaseAdmin.from('user_balances').insert([{ user_id: data[0].id, balance_btc: 0, balance_usd: 0 }]);

    const token = jwt.sign({ userId: data[0].id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      user: {
        id: data[0].id, email: data[0].email, username: data[0].username,
        full_name: data[0].full_name, average_rating: 0, total_trades: 0,
        avatar_url: null, is_admin: false, is_moderator: false,
      },
      token, walletAddress,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const { data, error } = await supabaseAdmin
      .from('users').select('*').eq('email', email).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, data.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: data.id, email }, JWT_SECRET, { expiresIn: '7d' });

    await supabaseAdmin.from('users').update({ last_login: new Date() }).eq('id', data.id);

    res.json({
      success: true,
      user: {
        id: data.id, email: data.email, username: data.username,
        full_name: data.full_name, average_rating: data.average_rating || 0,
        total_trades: data.total_trades || 0,
        avatar_url: data.avatar_url || null,
        is_admin: data.is_admin || false, is_moderator: data.is_moderator || false,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// OTP ROUTES
// ============================================

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { method, contact, purpose } = req.body;
    if (!method || !contact) return res.status(400).json({ error: 'Method and contact required' });

    const email = method === 'email' ? contact : null;
    const phone = method === 'phone' ? contact : null;

    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const key = email || phone;
    otpStore.set(key, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    if (email) {
      // Send email OTP
      const { error } = await supabaseAdmin.auth.signInWithOtp({ email });
      if (error) return res.status(500).json({ error: 'Failed to send email OTP' });
    } else if (phone) {
      // Send SMS OTP - using Supabase for now, but you might need a SMS service
      const { error } = await supabaseAdmin.auth.signInWithOtp({ phone });
      if (error) return res.status(500).json({ error: 'Failed to send SMS OTP' });
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { contact, otp, purpose } = req.body;
    if (!otp || !contact) return res.status(400).json({ error: 'OTP and contact required' });

    const key = contact;
    const stored = otpStore.get(key);
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    otpStore.delete(key); // Remove used OTP

    // For registration verification, you might want to mark user as verified
    // For now, just return success
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER ROUTES
// ============================================

app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users').select('*').eq('id', req.userId).single();
    if (error) return res.status(400).json({ error: error.message });

    const { data: wallet } = await supabaseAdmin
      .from('mock_wallets').select('*').eq('user_id', req.userId).single();
    const { data: balance } = await supabaseAdmin
      .from('user_balances').select('balance_btc, balance_usd').eq('user_id', req.userId).single();

    res.json({
      user: { ...data, is_admin: data.is_admin || false, is_moderator: data.is_moderator || false },
      wallet,
      balance: balance || { balance_btc: 0, balance_usd: 0 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, full_name, bio, location, website, avatar_url, average_rating, total_trades, completion_rate, created_at, is_admin, is_moderator, is_id_verified, is_email_verified, total_feedback_count, last_login')
      .eq('id', req.params.userId)
      .single();

    if (error) return res.status(404).json({ error: 'User not found' });

    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, reviewer:reviewer_id(id, username)')
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ user: data, reviews: reviews || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile text fields
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const { username, full_name, bio, location, website } = req.body;
    const updateData = {};
    if (username)             updateData.username   = username.trim();
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined)    updateData.bio        = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined)  updateData.website  = website;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users').update(updateData).eq('id', req.userId).select().single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AVATAR UPLOAD — FIXED
// Bug 1: was using supabase (anon) instead of supabaseAdmin → RLS blocked writes
// Bug 2: userId comparison could fail with type mismatch
// ============================================

app.post('/api/users/upload-avatar', verifyToken, async (req, res) => {
  try {
    const { image } = req.body;
    // Use req.userId from JWT — ignore body userId to prevent spoofing
    const userId = req.userId;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format — must be a base64 data URL' });
    }

    console.log('[upload-avatar] userId:', userId);
    console.log('[upload-avatar] image size (chars):', image.length);

    // ✅ FIX: use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        avatar_url:  image,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, username, avatar_url')
      .single();

    if (error) {
      console.error('[upload-avatar] Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.error('[upload-avatar] No row updated — userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[upload-avatar] ✅ Saved for user:', data.username);

    res.json({
      success:    true,
      avatar_url: data.avatar_url,
      message:    'Profile picture updated successfully',
    });
  } catch (error) {
    console.error('[upload-avatar] Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/avatar', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users').select('avatar_url').eq('id', req.params.userId).single();
    if (error) return res.json({ avatar_url: null });
    res.json({ avatar_url: data?.avatar_url || null });
  } catch (error) {
    res.json({ avatar_url: null });
  }
});

// ============================================
// BALANCE / ESCROW FUNCTIONS
// ============================================

app.get('/api/user/balance', verifyToken, async (req, res) => {
  try {
    let { data, error } = await supabaseAdmin
      .from('user_balances').select('balance_btc, balance_usd').eq('user_id', req.userId).single();

    if (error && error.code === 'PGRST116') {
      await supabaseAdmin.from('user_balances')
        .insert([{ user_id: req.userId, balance_btc: 0, balance_usd: 0 }]);
      return res.json({ balance_btc: 0, balance_usd: 0 });
    }
    if (error) return res.status(400).json({ error: error.message });

    res.json({
      balance_btc: parseFloat(data?.balance_btc || 0),
      balance_usd: parseFloat(data?.balance_usd || 0),
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.json({ balance_btc: 0, balance_usd: 0 });
  }
});

app.post('/api/user/add-balance', verifyToken, async (req, res) => {
  try {
    const { amountBtc } = req.body;
    if (!amountBtc || amountBtc <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const { data: current } = await supabaseAdmin
      .from('user_balances').select('balance_btc').eq('user_id', req.userId).single();

    const newBalance = parseFloat(current?.balance_btc || 0) + parseFloat(amountBtc);

    await supabaseAdmin.from('user_balances')
      .upsert({ user_id: req.userId, balance_btc: newBalance, updated_at: new Date() });

    res.json({ success: true, balance_btc: newBalance });
  } catch (error) {
    console.error('Add balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function lockFundsInEscrow(tradeId, sellerId, buyerId, amountBtc) {
  console.log(`[lockFundsInEscrow] Starting for trade ${tradeId}: buyer=${buyerId}, seller=${sellerId}, amount=${amountBtc} BTC`);
  
  // ✅ FIX: Deduct from BUYER's balance (they are buying), not seller's
  const { data: buyerBalance, error: buyerBalanceError } = await supabaseAdmin
    .from('user_balances').select('balance_btc').eq('user_id', buyerId).single();

  if (buyerBalanceError || !buyerBalance) {
    console.error('[lockFundsInEscrow] Buyer balance error:', buyerBalanceError);
    throw new Error('Buyer balance not found');
  }

  const currentBuyerBalance = parseFloat(buyerBalance.balance_btc || 0);
  const amount = parseFloat(amountBtc);

  if (currentBuyerBalance < amount) {
    throw new Error(`Insufficient balance. Buyer has ${currentBuyerBalance} BTC, needs ${amount} BTC`);
  }

  console.log(`[lockFundsInEscrow] Deducting ${amount} BTC from buyer ${buyerId}. Current: ${currentBuyerBalance}, New: ${currentBuyerBalance - amount}`);

  // ✅ Deduct from buyer's wallet
  await supabaseAdmin.from('user_balances')
    .update({ balance_btc: currentBuyerBalance - amount, updated_at: new Date() })
    .eq('user_id', buyerId);

  // ✅ NEW: Charge seller a commission (e.g., 1%) for the trade opportunity
  const SELLER_COMMISSION_RATE = 0.01; // 1%
  const sellerCommission = amount * SELLER_COMMISSION_RATE;
  
  const { data: sellerBalance } = await supabaseAdmin
    .from('user_balances').select('balance_btc').eq('user_id', sellerId).single();
  
  const currentSellerBalance = parseFloat(sellerBalance?.balance_btc || 0);
  
  console.log(`[lockFundsInEscrow] Charging seller ${sellerId} commission of ${sellerCommission.toFixed(8)} BTC`);
  
  await supabaseAdmin.from('user_balances')
    .update({ balance_btc: currentSellerBalance - sellerCommission, updated_at: new Date() })
    .eq('user_id', sellerId);

  // Create escrow lock record
  const { error: escrowError } = await supabaseAdmin.from('escrow_locks').insert([{
    trade_id: tradeId, 
    seller_id: sellerId, 
    buyer_id: buyerId,
    amount_btc: amount, 
    status: 'LOCKED', 
    locked_at: new Date(),
  }]);

  if (escrowError) {
    console.error('[lockFundsInEscrow] Escrow insert error, reverting buyer balance:', escrowError);
    // Revert buyer balance
    await supabaseAdmin.from('user_balances')
      .update({ balance_btc: currentBuyerBalance, updated_at: new Date() })
      .eq('user_id', buyerId);
    // Revert seller commission
    await supabaseAdmin.from('user_balances')
      .update({ balance_btc: currentSellerBalance, updated_at: new Date() })
      .eq('user_id', sellerId);
    throw new Error(escrowError.message);
  }

  // Update trade status to FUNDS_LOCKED
  const { error: tradeError } = await supabaseAdmin.from('trades')
    .update({ status: 'FUNDS_LOCKED', escrow_locked_at: new Date(), escrow_amount: amount })
    .eq('id', tradeId);

  if (tradeError) {
    console.error('[lockFundsInEscrow] Trade update error:', tradeError);
    throw new Error(tradeError.message);
  }

  console.log(`✅ Funds locked for trade ${tradeId}: ${amount} BTC from buyer ${buyerId}, ${sellerCommission.toFixed(8)} BTC commission charged to seller ${sellerId}`);
  return { success: true, amountLocked: amount, commissionCharged: sellerCommission };
}

async function releaseFundsToBuyer(tradeId, buyerId, amountBtc) {
  const { data: escrow, error: escrowError } = await supabaseAdmin
    .from('escrow_locks').select('*').eq('trade_id', tradeId).single();

  if (escrowError || !escrow) throw new Error('Escrow record not found');
  if (escrow.status !== 'LOCKED') throw new Error(`Escrow status is ${escrow.status}, cannot release`);

  const { data: buyerBalance } = await supabaseAdmin
    .from('user_balances').select('balance_btc').eq('user_id', buyerId).single();

  const newBuyerBalance = parseFloat(buyerBalance?.balance_btc || 0) + parseFloat(amountBtc);

  await supabaseAdmin.from('user_balances')
    .upsert({ user_id: buyerId, balance_btc: newBuyerBalance, updated_at: new Date() });

  await supabaseAdmin.from('escrow_locks')
    .update({ status: 'RELEASED', released_at: new Date() }).eq('trade_id', tradeId);

  await supabaseAdmin.from('trades')
    .update({ status: 'COMPLETED', completed_at: new Date() }).eq('id', tradeId);

  console.log(`✅ Funds released for trade ${tradeId}: ${amountBtc} BTC to buyer ${buyerId}`);
  return { success: true };
}

// ============================================
// LISTINGS ROUTES
// ============================================

app.post('/api/listings', verifyToken, async (req, res) => {
  try {
    const b = req.body; // shorthand

    // Resolve field name variants (frontend may send camelCase or snake_case)
    const listingType    = b.listing_type   || 'SELL';
    const brand          = b.giftCardBrand  || b.gift_card_brand  || (listingType==='SELL'?'Sell Bitcoin':'Buy Bitcoin');
    const btcPriceUSD    = parseFloat(b.bitcoinPrice   || b.bitcoin_price)  || 0;
    const marginPct      = parseFloat(b.margin) || 0;
    const payMethod      = b.paymentMethod  || b.payment_method  || '';
    const timeLimit      = parseInt(b.time_limit || b.processingTime || 30);
    const minUSD         = parseFloat(b.min_limit_usd  || b.minAmount) || 0;
    const maxUSD         = parseFloat(b.max_limit_usd  || b.maxAmount || b.amountUsd) || 0;
    const minLocal       = parseFloat(b.min_limit_local) || 0;
    const maxLocal       = parseFloat(b.max_limit_local) || 0;
    const cur            = b.currency || 'USD';
    const curSym         = b.currency_symbol || (cur==='GHS'?'₵':cur==='NGN'?'₦':cur==='EUR'?'€':cur==='GBP'?'£':'$');
    const amtUsd         = parseFloat(b.amountUsd || b.amount_usd || minUSD) || 0;

    console.log('[POST /listings] Saving offer:', { listingType, brand, btcPriceUSD, marginPct, payMethod, timeLimit, minUSD, maxUSD, minLocal, maxLocal, cur });

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert([{
        seller_id:               req.userId,
        listing_type:            listingType,
        gift_card_brand:         brand,
        status:                  'ACTIVE',

        // Pricing
        bitcoin_price:           btcPriceUSD,    // USD per BTC
        margin:                  marginPct,       // e.g. 7.5 for +7.5%
        pricing_type:            b.pricing_type || b.pricingType || 'market',

        // Currency & location
        currency:                cur,
        currency_symbol:         curSym,
        country:                 b.country      || '',
        country_name:            b.country_name || '',

        // Payment
        payment_method:          payMethod,
        payment_methods:         b.paymentMethods || [payMethod],

        // Trade limits
        amount_usd:              amtUsd,
        min_limit_usd:           minUSD,
        max_limit_usd:           maxUSD,
        min_limit_local:         minLocal,        // e.g. 600 (EUR)
        max_limit_local:         maxLocal,        // e.g. 5000 (EUR)

        // Trade config
        time_limit:              timeLimit,
        processing_time_minutes: timeLimit,

        // Instructions
        trade_instructions:      b.trade_instructions || '',
        listing_terms:           b.listing_terms      || '',
        description:             b.description        || `${brand} via ${payMethod}`,
      }])
      .select();

    if (error) {
      console.error('[POST /listings] Supabase error:', error.message, error.details);
      return res.status(400).json({ error: error.message });
    }

    console.log('[POST /listings] ✅ Offer saved:', data[0]?.id);
    res.json({ success: true, listing: data[0] });
  } catch (error) {
    console.error('[POST /listings] Unexpected error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const { brand, minPrice, maxPrice } = req.query;

    let query = supabaseAdmin
      .from('listings')
      .select(`
        id, listing_type, gift_card_brand, status,
        bitcoin_price, margin, pricing_type,
        currency, currency_symbol, country, country_name,
        payment_method, payment_methods,
        amount_usd, min_limit_usd, max_limit_usd,
        min_limit_local, max_limit_local,
        time_limit, trade_instructions, listing_terms,
        description, created_at,
        users:seller_id(
          id, username, average_rating, total_trades, completion_rate,
          avatar_url, is_id_verified, is_email_verified, last_login,
          created_at, total_feedback_count, country, bio
        )
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (brand) query = query.ilike('gift_card_brand', `%${brand}%`);
    if (minPrice) query = query.gte('bitcoin_price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('bitcoin_price', parseFloat(maxPrice));

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Debug: log first listing fields so you can verify data
    if (data?.length > 0) {
      const s = data[0];
      console.log('[GET /listings] First listing sample:', {
        id: s.id, listing_type: s.listing_type,
        margin: s.margin, currency: s.currency,
        currency_symbol: s.currency_symbol,
        payment_method: s.payment_method,
        min_limit_local: s.min_limit_local,
        max_limit_local: s.max_limit_local,
        time_limit: s.time_limit,
      });
    }

    res.json({ listings: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Debug endpoint: see raw DB data for latest listings ──────────────────────
app.get('/api/debug/listings', async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('listings')
      .select('id,listing_type,gift_card_brand,margin,currency,currency_symbol,payment_method,min_limit_local,max_limit_local,min_limit_usd,max_limit_usd,time_limit,bitcoin_price,status,created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    res.json({ count: data?.length, listings: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`*, users:seller_id(
        id, username, average_rating, total_trades, completion_rate,
        avatar_url, created_at, total_feedback_count, last_login
      )`)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/affiliate/earnings ──────────────────────────────────────────────
app.get('/api/affiliate/earnings', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('affiliate_earnings')
      .select('commission_btc, trade_id, referred_user_id, created_at, status')
      .eq('referrer_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ earnings: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/my-listings', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings').select('*').eq('seller_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ listings: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE LISTING — Fixed to use supabaseAdmin
// ============================================
app.put('/api/listings/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { margin, min_limit_usd, max_limit_usd, payment_method, trade_instructions, status } = req.body;
    
    // Check if user owns this listing
    const { data: listing, error: findError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (findError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listing.seller_id !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }
    
    const updateData = {};
    if (margin !== undefined) updateData.margin = margin;
    if (min_limit_usd !== undefined) updateData.min_limit_usd = min_limit_usd;
    if (max_limit_usd !== undefined) updateData.max_limit_usd = max_limit_usd;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (trade_instructions !== undefined) updateData.trade_instructions = trade_instructions;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[PUT /listings/:id] Update error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`[PUT /listings/:id] ✅ Listing ${id} updated by user ${req.userId}`);
    res.json({ success: true, listing: data });
  } catch (error) {
    console.error('[PUT /listings/:id] Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE LISTING (soft delete)
// ============================================
app.delete('/api/listings/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this listing
    const { data: listing, error: findError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (findError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listing.seller_id !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }
    
    const { error } = await supabaseAdmin
      .from('listings')
      .update({ status: 'DELETED', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('[DELETE /listings/:id] Delete error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`[DELETE /listings/:id] ✅ Listing ${id} deleted (soft) by user ${req.userId}`);
    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    console.error('[DELETE /listings/:id] Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE LISTING STATUS (pause/activate)
// ============================================
app.patch('/api/listings/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['ACTIVE', 'PAUSED', 'CLOSED', 'DELETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const { data: listing, error: findError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();
    
    if (findError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listing.seller_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[PATCH /listings/:id/status] Update error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`[PATCH /listings/:id/status] ✅ Listing ${id} status changed to ${status}`);
    res.json({ success: true, listing: data });
  } catch (error) {
    console.error('[PATCH /listings/:id/status] Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRADES ROUTES
// ============================================

app.post('/api/trades', verifyToken, async (req, res) => {
  try {
    const { listingId, amountBtc } = req.body;
    if (!listingId || amountBtc === undefined) return res.status(400).json({ error: 'Missing required fields' });

    const parsedAmountBtc = parseFloat(amountBtc);
    if (isNaN(parsedAmountBtc) || parsedAmountBtc <= 0) return res.status(400).json({ error: 'Invalid BTC amount' });

    const { data: listing } = await supabaseAdmin.from('listings').select('*').eq('id', listingId).single();
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_id === req.userId) return res.status(400).json({ error: 'Cannot trade with yourself' });

    const fee = calculateFee(amountBtc);
    const escrowWallet = generateMockWallet();

    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .insert([{
        listing_id:            listingId,
        buyer_id:              req.userId,
        seller_id:             listing.seller_id,
        trade_type:            'BUY',
        amount_usd:            listing.amount_usd,
        amount_btc:            parsedAmountBtc,
        status:                'CREATED',
        escrow_wallet_address: escrowWallet,
        platform_fee_btc:      parseFloat(fee),
        platform_fee_usd:      (listing.amount_usd * 0.005).toFixed(2),
        fee_status:            'PENDING',
      }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    try {
      await lockFundsInEscrow(trade[0].id, listing.seller_id, req.userId, parsedAmountBtc);
      console.log(`[POST /trades] ✅ Trade created and funds locked: ${trade[0].id}`);
    } catch (lockError) {
      console.error(`[POST /trades] ❌ Lock escrow failed: ${lockError.message}`);
      await supabaseAdmin.from('trades').delete().eq('id', trade[0].id);
      return res.status(400).json({ error: lockError.message });
    }

    await createNotification(
      listing.seller_id, 'trade', '💰 New Trade Request',
      `Someone wants to buy ${listing.gift_card_brand} worth $${listing.amount_usd}`,
      `/trade/${trade[0].id}`
    );

    res.json({ success: true, trade: trade[0], escrowWallet, fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/my-trades', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trades')
      .select('*, listings:listing_id(gift_card_brand, amount_usd), buyer:buyer_id(username), seller:seller_id(username)')
      .or(`buyer_id.eq.${req.userId},seller_id.eq.${req.userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ trades: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trades/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trades')
      .select('*, listing:listing_id(*)')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Trade not found' });
    if (data.buyer_id !== req.userId && data.seller_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ trade: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MARK AS PAID — FIXED: accepts CREATED and FUNDS_LOCKED
app.post('/api/trades/:id/mark-paid', verifyToken, async (req, res) => {
  try {
    const { data: trade, error: fetchError } = await supabaseAdmin
      .from('trades').select('*').eq('id', req.params.id).single();

    if (fetchError || !trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.buyer_id !== req.userId) return res.status(403).json({ error: 'Only the buyer can mark as paid' });

    // ✅ FIX: accept both CREATED and FUNDS_LOCKED
    const allowedStatuses = ['CREATED', 'FUNDS_LOCKED', 'ESCROW', 'ACTIVE', 'OPEN'];
    if (!allowedStatuses.includes(trade.status)) {
      return res.status(400).json({ error: `Cannot mark as paid — trade status is ${trade.status}` });
    }

    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ status: 'PAYMENT_SENT', buyer_confirmed: true, buyer_confirmed_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await createNotification(
      trade.seller_id, 'trade', '✅ Payment Confirmed',
      `Buyer confirmed payment for trade #${req.params.id.slice(0, 8)}. Please verify and release Bitcoin.`,
      `/trade/${req.params.id}`
    );

    res.json({ success: true, trade: data });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RELEASE BITCOIN
app.post('/api/trades/:id/release', verifyToken, async (req, res) => {
  try {
    const { data: trade, error: fetchError } = await supabaseAdmin
      .from('trades').select('*').eq('id', req.params.id).single();

    if (fetchError || !trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.seller_id !== req.userId) return res.status(403).json({ error: 'Only the seller can release Bitcoin' });
    if (trade.status !== 'PAYMENT_SENT') {
      return res.status(400).json({ error: `Cannot release — trade status is ${trade.status}. Buyer must confirm payment first.` });
    }

    await releaseFundsToBuyer(trade.id, trade.buyer_id, trade.amount_btc);

    if (trade.platform_fee_btc) {
      await supabaseAdmin.from('company_profits').insert([{
        trade_id: req.params.id,
        profit_btc: trade.platform_fee_btc,
        profit_usd: trade.platform_fee_usd,
        status: 'COLLECTED',
      }]);
    }

    await updateUserTradeStats(trade.seller_id);
    await updateUserTradeStats(trade.buyer_id);

    await createNotification(
      trade.buyer_id, 'trade', '🎉 Bitcoin Released',
      `Trade #${req.params.id.slice(0, 8)} completed! Bitcoin sent to your wallet.`,
      `/trade/${req.params.id}`
    );

    res.json({ success: true, trade: { ...trade, status: 'COMPLETED' } });
  } catch (error) {
    console.error('Release Bitcoin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CANCEL TRADE — FIXED: accepts CREATED and FUNDS_LOCKED; seller cannot cancel
app.post('/api/trades/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: trade, error: fetchError } = await supabaseAdmin
      .from('trades').select('*').eq('id', req.params.id).single();

    if (fetchError || !trade) return res.status(404).json({ error: 'Trade not found' });

    // ✅ Only buyer can cancel
    if (trade.buyer_id !== req.userId) {
      return res.status(403).json({ error: 'Only the buyer can cancel this trade' });
    }

    // ✅ FIX: allow cancelling both CREATED and FUNDS_LOCKED
    const cancellableStatuses = ['CREATED', 'FUNDS_LOCKED', 'ESCROW', 'ACTIVE', 'OPEN'];
    if (!cancellableStatuses.includes(trade.status)) {
      return res.status(400).json({ error: `Trade cannot be cancelled — status is ${trade.status}` });
    }

    // Refund seller if funds were locked
    const { data: escrow } = await supabaseAdmin
      .from('escrow_locks').select('*').eq('trade_id', req.params.id).single();

    if (escrow && escrow.status === 'LOCKED') {
      const { data: sellerBalance } = await supabaseAdmin
        .from('user_balances').select('balance_btc').eq('user_id', trade.seller_id).single();

      const newSellerBalance = parseFloat(sellerBalance?.balance_btc || 0) + parseFloat(escrow.amount_btc);
      await supabaseAdmin.from('user_balances')
        .update({ balance_btc: newSellerBalance, updated_at: new Date() }).eq('user_id', trade.seller_id);

      await supabaseAdmin.from('escrow_locks')
        .update({ status: 'REFUNDED' }).eq('trade_id', req.params.id);
    }

    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ status: 'CANCELLED', cancel_reason: reason || 'Buyer cancelled', cancelled_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, trade: data });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AUTO CANCEL
app.post('/api/trades/:id/auto-cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: trade } = await supabaseAdmin
      .from('trades').select('*').eq('id', req.params.id).single();

    if (trade && ['CREATED','FUNDS_LOCKED'].includes(trade.status)) {
      const { data: escrow } = await supabaseAdmin
        .from('escrow_locks').select('*').eq('trade_id', req.params.id).single();

      if (escrow && escrow.status === 'LOCKED') {
        const { data: sellerBalance } = await supabaseAdmin
          .from('user_balances').select('balance_btc').eq('user_id', trade.seller_id).single();

        const newSellerBalance = parseFloat(sellerBalance?.balance_btc || 0) + parseFloat(escrow.amount_btc);
        await supabaseAdmin.from('user_balances')
          .update({ balance_btc: newSellerBalance }).eq('user_id', trade.seller_id);

        await supabaseAdmin.from('escrow_locks')
          .update({ status: 'REFUNDED' }).eq('trade_id', req.params.id);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ status: 'CANCELLED', cancel_reason: reason || 'Trade expired', cancelled_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, trade: data });
  } catch (error) {
    console.error('Auto cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MESSAGES ROUTES
// ============================================

app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { tradeId, message } = req.body;
    if (!tradeId || !message) return res.status(400).json({ error: 'Missing required fields' });

    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades').select('buyer_id, seller_id, status').eq('id', tradeId).single();

    if (tradeError || !trade) return res.status(404).json({ error: 'Trade not found' });

    const recipientId = trade.buyer_id === req.userId ? trade.seller_id : trade.buyer_id;

    const { data: userData } = await supabaseAdmin
      .from('users').select('is_moderator, is_admin').eq('id', req.userId).single();
    const senderRole = (userData?.is_moderator || userData?.is_admin) ? 'moderator' : 'user';

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([{
        trade_id: tradeId, sender_id: req.userId, recipient_id: recipientId,
        message_text: message, message_type: 'CHAT',
        sender_role: senderRole, created_at: new Date(),
      }])
      .select();

    if (error) { console.error('Insert message error:', error); return res.status(400).json({ error: error.message }); }

    res.json({ success: true, message: data[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/:tradeId', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages').select('*').eq('trade_id', req.params.tradeId)
      .order('created_at', { ascending: true });

    if (error) { console.error('Fetch messages error:', error); return res.json({ messages: [] }); }
    res.json({ messages: data || [] });
  } catch (error) {
    res.json({ messages: [] });
  }
});

// ============================================
// IMAGE UPLOAD ROUTES
// ============================================

app.post('/api/trades/:id/upload-image', verifyToken, async (req, res) => {
  try {
    const { image, type } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const { data, error } = await supabaseAdmin
      .from('trade_images')
      .insert({ trade_id: req.params.id, user_id: req.userId, image_url: image, image_type: type || 'proof', created_at: new Date() })
      .select();

    if (error) { console.warn('trade_images error:', error.message); return res.json({ success: true }); }
    res.json({ success: true, image: data[0] });
  } catch (error) {
    res.json({ success: true });
  }
});

app.get('/api/trades/:id/images', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trade_images').select('*').eq('trade_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) return res.json({ images: [] });
    res.json({ images: data || [] });
  } catch (error) {
    res.json({ images: [] });
  }
});

// ============================================
// DISPUTES
// ============================================

app.post('/api/trades/:id/dispute', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: trade } = await supabaseAdmin
      .from('trades').select('*').eq('id', req.params.id).single();

    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ status: 'DISPUTED', disputed_at: new Date(), dispute_reason: reason || 'User opened a dispute' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await createNotification(trade.seller_id, 'support', '⚠️ Dispute Opened',
      `Dispute opened for trade #${req.params.id.slice(0, 8)}. Moderator will review.`, `/trade/${req.params.id}`);
    await createNotification(trade.buyer_id, 'support', '⚠️ Dispute Opened',
      `Dispute opened for trade #${req.params.id.slice(0, 8)}. Please provide evidence.`, `/trade/${req.params.id}`);
    await notifyModerators(req.params.id, trade, reason || 'User opened a dispute');

    await supabaseAdmin.from('messages').insert([{
      trade_id: req.params.id, sender_id: null, recipient_id: null,
      message_text: `🚨 DISPUTE OPENED — Reason: ${reason || 'User opened a dispute'}. Moderators notified.`,
      message_type: 'SYSTEM', sender_role: 'system', created_at: new Date(),
    }]);

    res.json({ success: true, trade: data });
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trades/:id/moderator-join', verifyToken, async (req, res) => {
  try {
    const { data: userData } = await supabaseAdmin
      .from('users').select('is_moderator, is_admin, username').eq('id', req.userId).single();
    if (!userData?.is_moderator && !userData?.is_admin) return res.status(403).json({ error: 'Moderators only' });

    const { data: trade } = await supabaseAdmin
      .from('trades').select('status, id, buyer_id, seller_id').eq('id', req.params.id).single();
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    await supabaseAdmin.from('messages').insert([{
      trade_id: req.params.id, sender_id: req.userId, recipient_id: null,
      message_text: `👨‍⚖️ Moderator ${userData.username} has joined and is reviewing this dispute.`,
      message_type: 'SYSTEM', sender_role: 'moderator', created_at: new Date(),
    }]);

    res.json({ success: true, moderator: userData.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/disputes', verifyToken, async (req, res) => {
  try {
    const { data: userData } = await supabaseAdmin
      .from('users').select('is_moderator, is_admin').eq('id', req.userId).single();
    if (!userData?.is_moderator && !userData?.is_admin) return res.status(403).json({ error: 'Access denied' });

    const { data, error } = await supabaseAdmin
      .from('trades')
      .select('*, buyer:buyer_id(id, username), seller:seller_id(id, username)')
      .eq('status', 'DISPUTED')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const disputes = (data || []).map(t => ({
      id: t.id, trade_id: t.id, status: 'OPEN',
      reason: t.dispute_reason || 'User opened a dispute',
      initiated_by: t.buyer_id,
      created_at: t.disputed_at || t.updated_at,
      trade_details: t, buyer: t.buyer, seller: t.seller,
    }));

    res.json({ disputes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/disputes/:id/resolve', verifyToken, async (req, res) => {
  try {
    const { resolution, notes } = req.body;
    const { data: userData } = await supabaseAdmin
      .from('users').select('is_admin, is_moderator, username').eq('id', req.userId).single();
    if (!userData?.is_admin && !userData?.is_moderator) return res.status(403).json({ error: 'Access denied' });

    const { data: trade } = await supabaseAdmin.from('trades').select('*').eq('id', req.params.id).single();
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    let msg = '';
    if (resolution === 'BUYER_WINS') {
      await releaseFundsToBuyer(trade.id, trade.buyer_id, trade.amount_btc);
      msg = '✅ Resolved: BUYER WINS — Bitcoin released to buyer.';
    } else if (resolution === 'SELLER_WINS') {
      await supabaseAdmin.from('trades')
        .update({ status: 'COMPLETED', dispute_resolution: 'SELLER_WINS', dispute_notes: notes, resolved_by: req.userId, resolved_at: new Date() })
        .eq('id', req.params.id);
      msg = '✅ Resolved: SELLER WINS — Funds remain with seller.';
    } else if (resolution === 'CANCEL') {
      const { data: escrow } = await supabaseAdmin.from('escrow_locks').select('*').eq('trade_id', trade.id).single();
      if (escrow?.status === 'LOCKED') {
        const { data: sb } = await supabaseAdmin.from('user_balances').select('balance_btc').eq('user_id', trade.seller_id).single();
        await supabaseAdmin.from('user_balances')
          .update({ balance_btc: parseFloat(sb?.balance_btc || 0) + parseFloat(escrow.amount_btc) })
          .eq('user_id', trade.seller_id);
        await supabaseAdmin.from('escrow_locks').update({ status: 'REFUNDED' }).eq('trade_id', trade.id);
      }
      await supabaseAdmin.from('trades')
        .update({ status: 'CANCELLED', dispute_resolution: 'CANCEL', dispute_notes: notes, resolved_by: req.userId, resolved_at: new Date() })
        .eq('id', req.params.id);
      msg = '❌ Resolved: Trade cancelled. Funds returned to seller.';
    }

    await supabaseAdmin.from('messages').insert([{
      trade_id: req.params.id, sender_id: req.userId,
      message_text: `👨‍⚖️ Moderator ${userData.username} resolved dispute.\nDecision: ${resolution}\nNotes: ${notes || 'None'}\n${msg}`,
      message_type: 'SYSTEM', sender_role: 'moderator', created_at: new Date(),
    }]);

    for (const uid of [trade.buyer_id, trade.seller_id]) {
      await createNotification(uid, 'support', 'Dispute Resolved',
        `Trade #${trade.id.slice(0, 8)} dispute resolved: ${resolution}`, `/trade/${trade.id}`);
    }

    res.json({ success: true, message: `Dispute resolved: ${resolution}` });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FEEDBACK / REVIEWS
// ============================================

app.post('/api/trades/:id/feedback', verifyToken, async (req, res) => {
  try {
    const { rating, comment, toUserId } = req.body;
    if (!rating || !toUserId) return res.status(400).json({ error: 'Missing required fields' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5' });

    const { data: trade } = await supabaseAdmin.from('trades').select('*').eq('id', req.params.id).single();
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const isParticipant = req.userId === trade.buyer_id || req.userId === trade.seller_id;
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant in this trade' });

    const { data: existing } = await supabaseAdmin
      .from('reviews').select('id').eq('trade_id', req.params.id).eq('reviewer_id', req.userId).single();
    if (existing) return res.status(400).json({ error: 'Feedback already submitted for this trade' });

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert([{ trade_id: req.params.id, reviewer_id: req.userId, reviewee_id: toUserId, rating: parseInt(rating), comment: comment || '', created_at: new Date() }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    const { data: allReviews } = await supabaseAdmin
      .from('reviews').select('rating').eq('reviewee_id', toUserId);

    if (allReviews?.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabaseAdmin.from('users')
        .update({ average_rating: parseFloat(avg.toFixed(2)), total_feedback_count: allReviews.length })
        .eq('id', toUserId);
    }

    await updateUserTradeStats(trade.seller_id);
    await updateUserTradeStats(trade.buyer_id);

    res.json({ success: true, review: review[0] });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/reviews', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews').select('*, reviewer:reviewer_id(username)')
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) return res.json({ reviews: [] });
    res.json({ reviews: reviews || [] });
  } catch (error) {
    res.json({ reviews: [] });
  }
});

// ============================================
// UPDATE USER TRADE STATS
// ============================================

async function updateUserTradeStats(userId) {
  try {
    const { data: all } = await supabaseAdmin
      .from('trades').select('status').or(`seller_id.eq.${userId},buyer_id.eq.${userId}`);
    const total = (all || []).filter(t => t.status === 'COMPLETED').length;
    const rate = all?.length > 0 ? Math.round((total / all.length) * 100) : 100;
    await supabaseAdmin.from('users').update({ total_trades: total, completion_rate: rate }).eq('id', userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// ============================================
// WALLET ROUTES
// ============================================

app.get('/api/wallet', verifyToken, async (req, res) => {
  try {
    const { data: wallet } = await supabaseAdmin
      .from('wallets').select('address, balance_btc, created_at').eq('user_id', req.userId).single();
    res.json({ wallet: { address: wallet?.address || 'No wallet', balance_btc: wallet?.balance_btc || 0, escrow_balance: 0, total_earned: 0, created_at: wallet?.created_at || new Date() } });
  } catch (error) {
    res.json({ wallet: { address: 'Error', balance_btc: 0, escrow_balance: 0, total_earned: 0 } });
  }
});

app.get('/api/wallet/balance', verifyToken, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('wallets').select('balance_btc').eq('user_id', req.userId).single();
    res.json({ balance: data?.balance_btc || 0, unconfirmed: 0 });
  } catch (error) {
    res.json({ balance: 0, unconfirmed: 0 });
  }
});

app.post('/api/wallet/deposit-address', verifyToken, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('wallets').select('address').eq('user_id', req.userId).single();
    res.json({ address: data?.address || 'tb1q' + Math.random().toString(36).substring(2, 15) });
  } catch (error) {
    res.json({ address: 'tb1q' + Math.random().toString(36).substring(2, 15) });
  }
});

app.get('/api/wallet/transactions', verifyToken, async (req, res) => {
  res.json({ transactions: [] });
});

app.post('/api/wallet/withdraw', verifyToken, async (req, res) => {
  const { address, amount } = req.body;
  if (!address || !amount) return res.status(400).json({ error: 'Missing required fields' });
  res.json({ success: true, message: 'Withdrawal submitted. Allow 24–48h for processing.', withdrawalId: 'wd_' + Math.random().toString(36).substring(2, 10) });
});

// ============================================
// NOTIFICATIONS
// ============================================

async function createNotification(userId, type, title, message, action) {
  try {
    const { data } = await supabaseAdmin.from('notifications').insert({
      user_id: userId, type, title, message, action, created_at: new Date(), is_read: false,
    }).select();
    return data?.[0] || null;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications').select('*').eq('user_id', req.userId)
      .order('created_at', { ascending: false }).limit(50);
    if (error) return res.json({ notifications: [] });
    res.json({ notifications: data || [] });
  } catch (error) {
    res.json({ notifications: [] });
  }
});

app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    await supabaseAdmin.from('notifications')
      .update({ is_read: true, read_at: new Date() })
      .eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await supabaseAdmin.from('notifications')
      .update({ is_read: true, read_at: new Date() })
      .eq('user_id', req.userId).eq('is_read', false);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

// ============================================
// ADMIN PROFITS
// ============================================

app.get('/api/admin/profits', verifyToken, async (req, res) => {
  try {
    const { data: userData } = await supabaseAdmin.from('users').select('is_admin').eq('id', req.userId).single();
    if (!userData?.is_admin) return res.status(403).json({ error: 'Admin access required' });

    const { data: profits, error } = await supabaseAdmin.from('company_profits').select('*').order('collected_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    const totalBtc = (profits || []).reduce((s, p) => s + parseFloat(p.profit_btc), 0);
    const totalUsd = (profits || []).reduce((s, p) => s + parseFloat(p.profit_usd), 0);

    res.json({ profits: profits || [], totalBtc: totalBtc.toFixed(8), totalUsd: totalUsd.toFixed(2), tradeCount: profits?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SEND CODE (gift card)
// ============================================

app.post('/api/trades/:id/send-code', verifyToken, async (req, res) => {
  try {
    const { giftCardCode } = req.body;
    if (!giftCardCode) return res.status(400).json({ error: 'Code is required' });

    const { data, error } = await supabaseAdmin
      .from('trades')
      .update({ gift_card_code_encrypted: encryptCode(giftCardCode), code_sent_at: new Date() })
      .eq('id', req.params.id).eq('seller_id', req.userId).select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

// Send verification code endpoint
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    // Store code
    verificationCodes.set(email, { code, expiresAt });
    
    console.log(`📧 Verification code for ${email}: ${code}`);
    
    // Plain text version (this is most important for Gmail!)
    const textContent = `Welcome to PRAQEN!

Hello ${username || 'User'},

Thank you for registering with PRAQEN.

Your verification code is:

${code}

Please enter this code to complete your registration.
This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

---
© 2024 PRAQEN. All rights reserved.`;
    
    // HTML version (for clients that support it)
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; padding: 0; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2D5F4F 0%, #1e4d3d 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 30px 20px; }
    .greeting { font-size: 16px; margin-bottom: 15px; }
    .code-section { background-color: #f9f9f9; border-left: 4px solid #2D5F4F; padding: 20px; margin: 20px 0; text-align: center; }
    .code { font-size: 36px; font-weight: bold; color: #2D5F4F; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
    .expiry { font-size: 14px; color: #666; margin-top: 10px; }
    .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to PRAQEN!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${username || 'User'},</p>
      <p>Thank you for registering with PRAQEN. Please use the verification code below to complete your registration:</p>
      
      <div class="code-section">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Verification Code:</p>
        <div class="code">${code}</div>
        <p class="expiry">This code will expire in 10 minutes</p>
      </div>
      
      <p>If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 PRAQEN. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
    
    // Send email with both text and HTML versions
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@praqen.com',
      to: email,
      subject: 'Verify Your Email - PRAQEN',
      text: textContent,
      html: htmlContent,
    });
    
    console.log(`✅ Verification email sent to ${email}`);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent to your email',
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    });
    
  } catch (error) {
    console.error('❌ Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
});

// Verify code endpoint
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    const stored = verificationCodes.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }
    
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    
    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Code is valid
    verificationCodes.delete(email);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully!' 
    });
    
  } catch (error) {
    console.error('❌ Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ PRAQEN Backend running on http://localhost:${PORT}`);
  console.log('🔒 Avatar upload:     POST /api/users/upload-avatar  [FIXED — uses supabaseAdmin]');
  console.log('💰 Mark as paid:      POST /api/trades/:id/mark-paid  [FIXED — accepts CREATED+FUNDS_LOCKED]');
  console.log('❌ Cancel trade:      POST /api/trades/:id/cancel     [FIXED — buyer only, accepts CREATED+FUNDS_LOCKED]');
  console.log('🚀 Release Bitcoin:   POST /api/trades/:id/release');
  console.log('👨‍⚖️ Disputes:         POST /api/trades/:id/dispute');
  console.log('📊 Admin:             GET  /api/admin/disputes');
});

module.exports = app;