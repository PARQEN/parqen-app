// services/offerStatusService.js
// PRAQEN — Offer auto-pause / auto-reactivate based on seller wallet balance.
// Called after every trade, deposit, and withdrawal that changes a seller's balance.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Only SELL / SELL_BITCOIN offers require the seller to hold BTC.
const SELL_TYPES = ['SELL', 'SELL_BITCOIN'];

/**
 * After any balance change for `userId`:
 *   - Pause ACTIVE sell offers where available balance < minimum trade amount (in BTC)
 *   - Reactivate PAUSED sell offers where available balance >= minimum trade amount
 *
 * Never throws — must not break the caller.
 */
async function updateOfferStatus(userId) {
  try {
    // 1. Get seller's available BTC (user_wallets already reflects escrow deductions)
    const { data: wallet } = await supabaseAdmin
      .from('user_wallets')
      .select('balance_btc')
      .eq('user_id', userId)
      .single();

    const availableBtc = parseFloat(wallet?.balance_btc || 0);

    // 2. Get all SELL / SELL_BITCOIN listings — both ACTIVE and PAUSED
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('id, status, min_limit_usd, bitcoin_price')
      .eq('seller_id', userId)
      .in('listing_type', SELL_TYPES)
      .in('status', ['ACTIVE', 'PAUSED']);

    if (!listings || listings.length === 0) return { paused: 0, reactivated: 0 };

    const toPause      = [];
    const toReactivate = [];

    for (const listing of listings) {
      // Convert USD minimum to BTC using the listing's stored BTC price.
      // Falls back to 88 000 USD/BTC if price is missing (avoids division by zero).
      const btcPrice     = parseFloat(listing.bitcoin_price) || 88000;
      const minBtcNeeded = parseFloat(listing.min_limit_usd || 0) / btcPrice;

      const sufficient = availableBtc > 0 && availableBtc >= minBtcNeeded;

      if (listing.status === 'ACTIVE' && !sufficient) {
        toPause.push(listing.id);
      } else if (listing.status === 'PAUSED' && sufficient) {
        toReactivate.push(listing.id);
      }
    }

    const now = new Date().toISOString();

    // 3. Pause offers that no longer have sufficient balance
    if (toPause.length > 0) {
      await supabaseAdmin
        .from('listings')
        .update({ status: 'PAUSED', updated_at: now })
        .in('id', toPause);

      await supabaseAdmin.from('notifications').insert({
        user_id:    userId,
        type:       'wallet',
        title:      `⏸ ${toPause.length} Offer${toPause.length > 1 ? 's' : ''} Paused — Low Balance`,
        message:    `Your available balance (₿${availableBtc.toFixed(8)}) is below the minimum trade amount. ${toPause.length} sell offer${toPause.length > 1 ? 's have' : ' has'} been paused. Top up your wallet to reactivate.`,
        action:     '/my-listings',
        is_read:    false,
        created_at: now,
      });

      console.log(`⏸ [OfferStatus] Paused ${toPause.length} offer(s) for ${userId.slice(0,8)} — avail: ₿${availableBtc}`);
    }

    // 4. Reactivate offers that now have sufficient balance
    if (toReactivate.length > 0) {
      await supabaseAdmin
        .from('listings')
        .update({ status: 'ACTIVE', updated_at: now })
        .in('id', toReactivate);

      await supabaseAdmin.from('notifications').insert({
        user_id:    userId,
        type:       'wallet',
        title:      `✅ ${toReactivate.length} Offer${toReactivate.length > 1 ? 's' : ''} Reactivated`,
        message:    `Your balance (₿${availableBtc.toFixed(8)}) is now sufficient. ${toReactivate.length} sell offer${toReactivate.length > 1 ? 's are' : ' is'} live again.`,
        action:     '/my-listings',
        is_read:    false,
        created_at: now,
      });

      console.log(`✅ [OfferStatus] Reactivated ${toReactivate.length} offer(s) for ${userId.slice(0,8)} — avail: ₿${availableBtc}`);
    }

    return { paused: toPause.length, reactivated: toReactivate.length };
  } catch (err) {
    console.error('[updateOfferStatus]', err.message);
    return { paused: 0, reactivated: 0 };
  }
}

/**
 * One-shot bulk sync — call on server startup and periodically.
 * Loops over every unique seller with a SELL/SELL_BITCOIN listing and
 * runs updateOfferStatus so stale ACTIVE offers get paused and paused
 * offers with restored balance get reactivated.
 */
async function syncAllOfferStatuses() {
  try {
    const { data: rows } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .in('listing_type', SELL_TYPES)
      .in('status', ['ACTIVE', 'PAUSED']);

    const sellerIds = [...new Set((rows || []).map(r => r.seller_id))];
    if (sellerIds.length === 0) return;

    console.log(`[syncAllOfferStatuses] Checking ${sellerIds.length} seller(s)…`);
    let totalPaused = 0, totalReactivated = 0;

    for (const sellerId of sellerIds) {
      const result = await updateOfferStatus(sellerId);
      totalPaused      += result.paused;
      totalReactivated += result.reactivated;
    }

    console.log(`[syncAllOfferStatuses] Done — paused ${totalPaused}, reactivated ${totalReactivated}`);
  } catch (err) {
    console.error('[syncAllOfferStatuses]', err.message);
  }
}

module.exports = { updateOfferStatus, syncAllOfferStatuses };
