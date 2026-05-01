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
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);

        // Fetch FX rates and BTC price in parallel with 8s timeout
        const [fxResult, btcResult] = await Promise.allSettled([
          fetch('https://open.er-api.com/v6/latest/USD', { signal: ctrl.signal }),
          fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: ctrl.signal }),
        ]);
        clearTimeout(timer);

        if (fxResult.status === 'fulfilled' && fxResult.value.ok) {
          const fxData = await fxResult.value.json().catch(() => null);
          if (fxData?.result === 'success' && fxData.rates) {
            Object.assign(this.rates, fxData.rates);
          }
        }

        if (btcResult.status === 'fulfilled' && btcResult.value.ok) {
          const btcData = await btcResult.value.json().catch(() => null);
          const price = parseFloat(btcData?.data?.amount);
          if (price > 0) this.btcUsd = price;
        }

        this.lastUpdated = new Date();
      } catch (err) {
        console.warn('[RateService] fetch failed, using fallback rates:', err.message);
      } finally {
        this._fetchPromise = null;
        this._notifyListeners(); // always notify so loading state resolves
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