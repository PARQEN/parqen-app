// backend/services/coinbaseWallet.js
// Uses Coinbase API v2 with HMAC signature — your original structure, fixed
//
// .env required:
//   COINBASE_API_KEY=your_api_key
//   COINBASE_API_SECRET=your_api_secret

const axios  = require('axios');
const crypto = require('crypto');

class CoinbaseWalletService {
  constructor() {
    this.apiKey    = process.env.COINBASE_API_KEY;
    this.apiSecret = process.env.COINBASE_API_SECRET;
    this.baseUrl   = 'https://api.coinbase.com/v2';

    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️  COINBASE_API_KEY or COINBASE_API_SECRET not set in .env');
    } else {
      console.log('✅ CoinbaseWalletService initialized');
    }
  }

  // ── HMAC signature (your original, unchanged) ──────────────────────────────
  generateSignature(method, path, body = '') {
    const timestamp = Math.floor(Date.now() / 1000);
    const message   = timestamp + method.toUpperCase() + path + body;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
    return { timestamp, signature };
  }

  // ── Authenticated request (your original, + timeout + better error) ─────────
  async makeRequest(method, path, data = null) {
    try {
      const body = data ? JSON.stringify(data) : '';
      const { timestamp, signature } = this.generateSignature(method, path, body);

      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        headers: {
          'CB-ACCESS-KEY':       this.apiKey,
          'CB-ACCESS-SIGN':      signature,
          'CB-ACCESS-TIMESTAMP': timestamp,
          'CB-VERSION':          '2023-01-01',
          'Content-Type':        'application/json',
        },
        data: data || undefined,
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      const msg = error.response?.data?.errors?.[0]?.message
        || error.response?.data?.message
        || error.message;
      console.error(`[Coinbase] ${method} ${path} →`, msg);
      throw new Error(`Coinbase API error: ${msg}`);
    }
  }

  // ── Create a unique BTC account + address for a new user ───────────────────
  // Called on registration. Each user gets their OWN Coinbase account
  // with their own unique bc1q... receive address.
  async createWallet(userId, userName) {
    try {
      console.log(`[createWallet] Creating for: ${userName} (${userId})`);

      // Step 1: create a named BTC account for this user
      const accountRes = await this.makeRequest('POST', '/accounts', {
        name:     `PRAQEN-${userName}-${userId.slice(0, 8)}`,
        currency: 'BTC',
      });

      const account = accountRes.data;
      if (!account?.id) throw new Error('No account ID returned from Coinbase');
      console.log(`[createWallet] Account created: ${account.id}`);

      // Step 2: generate a unique receive address for that account
      const addressRes = await this.makeRequest(
        'POST',
        `/accounts/${account.id}/addresses`,
        { name: `PRAQEN deposit — ${userName}` }
      );

      const addr = addressRes.data;
      if (!addr?.address) throw new Error('No Bitcoin address returned from Coinbase');
      console.log(`[createWallet] ✅ Address: ${addr.address}`);

      return {
        walletId:   account.id,       // Coinbase account UUID — save to coinbase_wallet_id
        address:    addr.address,     // bc1q... — save to bitcoin_wallet_address
        addressId:  addr.id,
        name:       account.name,
        created_at: account.created_at,
      };
    } catch (error) {
      console.error('[createWallet] Failed:', error.message);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // ── Get wallet balance ──────────────────────────────────────────────────────
  async getBalance(walletId) {
    try {
      const res = await this.makeRequest('GET', `/accounts/${walletId}`);
      return {
        balance:        parseFloat(res.data?.balance?.amount || 0),
        currency:       res.data?.balance?.currency || 'BTC',
        native_balance: res.data?.native_balance,
      };
    } catch (error) {
      console.error('[getBalance] Error:', error.message);
      return { balance: 0, currency: 'BTC' };
    }
  }

  // ── Get the primary deposit address for an existing account ────────────────
  async getWalletAddress(walletId) {
    try {
      const res = await this.makeRequest('GET', `/accounts/${walletId}/addresses`);
      return res.data?.[0]?.address || null;
    } catch (error) {
      console.error('[getWalletAddress] Error:', error.message);
      return null;
    }
  }

  // ── Generate a fresh deposit address (privacy best practice) ───────────────
  async generateNewAddress(walletId, label = 'PRAQEN deposit') {
    try {
      const res = await this.makeRequest(
        'POST',
        `/accounts/${walletId}/addresses`,
        { name: label }
      );
      const addr = res.data;
      console.log(`[generateNewAddress] ✅ ${addr.address}`);
      return { address: addr.address, addressId: addr.id, created_at: addr.created_at };
    } catch (error) {
      console.error('[generateNewAddress] Error:', error.message);
      throw new Error(`Failed to generate address: ${error.message}`);
    }
  }

  // ── Send Bitcoin to external address ───────────────────────────────────────
  async sendBitcoin(walletId, toAddress, amountBtc, description = '') {
    try {
      console.log(`[sendBitcoin] Sending ${amountBtc} BTC → ${toAddress}`);

      const res = await this.makeRequest(
        'POST',
        `/accounts/${walletId}/transactions`,
        {
          type:        'send',
          to:          toAddress,
          amount:      amountBtc.toString(),
          currency:    'BTC',
          description: description || 'PRAQEN withdrawal',
          idem:        `${walletId}-${Date.now()}`, // idempotency — prevents double-send
        }
      );

      const tx = res.data;
      console.log(`[sendBitcoin] ✅ TX: ${tx.id} | hash: ${tx.network?.hash || 'pending'}`);

      return {
        success:       true,
        transactionId: tx.id,
        status:        tx.status,
        amount:        tx.amount,
        txHash:        tx.network?.hash || null,
        fee:           tx.network?.transaction_fee || null,
      };
    } catch (error) {
      console.error('[sendBitcoin] Error:', error.message);
      throw new Error(`Failed to send Bitcoin: ${error.message}`);
    }
  }

  // ── Get transaction history ─────────────────────────────────────────────────
  async getTransactions(walletId, limit = 50) {
    try {
      const res = await this.makeRequest(
        'GET',
        `/accounts/${walletId}/transactions?limit=${limit}&order=desc`
      );

      return (res.data || []).map(tx => ({
        id:            tx.id,
        type:          tx.type,          // send | receive | buy | sell
        amount:        parseFloat(tx.amount?.amount || 0),
        currency:      tx.amount?.currency || 'BTC',
        status:        tx.status,        // pending | completed | failed
        created_at:    tx.created_at,
        description:   tx.description || '',
        txHash:        tx.network?.hash || null,
        native_amount: tx.native_amount,
      }));
    } catch (error) {
      console.error('[getTransactions] Error:', error.message);
      return [];
    }
  }

  // ── Check for recent deposits (simplified) ───────────────────────────────
  async checkPayment(walletId) {
    try {
      const txs = await this.getTransactions(walletId, 10); // last 10 tx
      const deposits = txs.filter(tx => tx.type === 'receive' && tx.status === 'completed');
      if (deposits.length > 0) {
        const latest = deposits[0]; // most recent
        return {
          confirmed: true,
          amount: latest.amount,
          txHash: latest.txHash,
        };
      }
      return { confirmed: false, amount: 0, txHash: null };
    } catch (error) {
      console.error('[checkPayment] Error:', error.message);
      return { confirmed: false, amount: 0, txHash: null };
    }
  }
}

module.exports = CoinbaseWalletService;