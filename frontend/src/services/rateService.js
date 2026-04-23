// Central exchange rate service — single source of truth for USD→local FX rates
// Uses ExchangeRate-API (reliable, supports all African currencies)

const FALLBACK_RATES = {
  GHS: 11.06, NGN: 1610,  KES: 129,  ZAR: 18.2,  UGX: 3720,
  TZS: 2680,  USD: 1,     GBP: 0.79, EUR: 0.92,  XAF: 612,
  XOF: 612,   RWF: 1320,  ETB: 58,   AUD: 1.55,  CAD: 1.36,
  SGD: 1.35,  INR: 83,    MAD: 10.1, ZMW: 26,    MWK: 1730,
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class RateService {
  constructor() {
    this.rates  = { ...FALLBACK_RATES };
    this.btcUsd = 0;
    this.lastUpdated = null;
    this.listeners   = [];
    this._fetchPromise = null;
  }

  async fetchRates() {
    if (this._fetchPromise) return this._fetchPromise;

    this._fetchPromise = (async () => {
      try {
        const API_KEY = 'd51dba3e8a731b12d73e8d72';
        
        // Fetch all rates from ExchangeRate-API (supports GHS, NGN, all currencies)
        const [fxRes, btcRes] = await Promise.all([
          fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`),
          fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
        ]);

        if (fxRes.ok) {
          const fxData = await fxRes.json();
          if (fxData.result === 'success' && fxData.conversion_rates) {
            // Use ALL rates from ExchangeRate-API (includes GHS, NGN)
            Object.assign(this.rates, fxData.conversion_rates);
            console.log('✅ Rates updated from ExchangeRate-API');
          }
        }

        if (btcRes.ok) {
          const btcData = await btcRes.json();
          this.btcUsd = parseFloat(btcData.data.amount) || this.btcUsd;
        }

        this.lastUpdated = new Date();
        this._notifyListeners();
      } catch (err) {
        console.warn('[RateService] fetch failed, using cached/fallback rates:', err.message);
      } finally {
        this._fetchPromise = null;
      }

      return { rates: this.rates, btcUsd: this.btcUsd };
    })();

    return this._fetchPromise;
  }

  startAutoRefresh() {
    this.fetchRates();
    if (!this._timer) {
      this._timer = setInterval(() => this.fetchRates(), REFRESH_INTERVAL_MS);
    }
  }

  stopAutoRefresh() {
    clearInterval(this._timer);
    this._timer = null;
  }

  getRate(currency) {
    return this.rates[currency] || FALLBACK_RATES[currency] || 1;
  }

  getBTCInLocal(currency) {
    return this.btcUsd * this.getRate(currency);
  }

  getRatesSnapshot() {
    return { ...this.rates };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  _notifyListeners() {
    this.listeners.forEach(l => l({ rates: this.rates, btcUsd: this.btcUsd }));
  }
}

export const rateService = new RateService();
export default rateService;