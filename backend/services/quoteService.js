const crypto = require('crypto');

// In-memory store. Replace with Redis in production.
const quotes = new Map();

// Purge quotes that expired more than 2 minutes ago
setInterval(() => {
  const cutoff = Date.now() - 120000;
  for (const [id, q] of quotes.entries()) {
    if (q.expiresAt < cutoff) quotes.delete(id);
  }
}, 60000);

async function createQuote(listing) {
  const FX_API_KEY = 'd51dba3e8a731b12d73e8d72';

  const [fxRes, btcRes] = await Promise.all([
    fetch('https://open.er-api.com/v6/latest/USD'),
    fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
  ]);

  const fxData  = await fxRes.json();
  const btcData = await btcRes.json();

  if (fxData.result !== 'success') throw new Error('FX rate fetch failed');

  const currency   = listing.currency || 'USD';
  const usdToLocal = fxData.rates[currency] || 1;
  const btcUsd     = parseFloat(btcData.data.amount);
  const margin     = parseFloat(listing.margin || 0);

  const basePriceUSD = (listing.pricing_type === 'fixed' && parseFloat(listing.bitcoin_price || 0) > 100)
    ? parseFloat(listing.bitcoin_price)
    : btcUsd;

  const executableRate = basePriceUSD * (1 + margin / 100) * usdToLocal;

  const quoteId = crypto.randomBytes(16).toString('hex');
  quotes.set(quoteId, {
    quoteId,
    listingId: String(listing.id),
    executableRate,
    components: { btcUsd, usdToLocal, margin, currency },
    expiresAt: Date.now() + 30000,
    used: false,
  });

  return { quoteId, executableRate, expiresIn: 30 };
}

function getQuote(quoteId) {
  const q = quotes.get(quoteId);
  if (!q)             throw new Error('Quote not found');
  if (q.used)         { quotes.delete(quoteId); throw new Error('Quote already used'); }
  if (Date.now() > q.expiresAt) {
    quotes.delete(quoteId);
    throw new Error('Quote expired. Please refresh the rate and try again.');
  }
  return q;
}

function consumeQuote(quoteId) {
  const q = getQuote(quoteId);
  quotes.delete(quoteId);
  return q;
}

module.exports = { createQuote, getQuote, consumeQuote };
