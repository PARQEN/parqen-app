// Central exchange rate service — single source of truth for USD→local FX rates
// Uses open.er-api.com (free, no API key required) with Coinbase for BTC/USD.

const FALLBACK_RATES = {
  GHS: 11.06, NGN: 1610,  KES: 129,  ZAR: 18.2,  UGX: 3720,
  TZS: 2680,  USD: 1,     GBP: 0.79, EUR: 0.92,  XAF: 612,
  XOF: 612,   RWF: 1320,  ETB: 58,   AUD: 1.55,  CAD: 1.36,
  SGD: 1.35,  INR: 83,    MAD: 10.1, ZMW: 26,    MWK: 1730,
};

// Live rate calibration — fetched from Frankfurter API for realtime accuracy
// These are fallback values; they get overridden by live API fetches
const LIVE_CALIBRATION_FALLBACK = {
  GHS: 11.06,  // 1 USD = 11.06 GHS  (fallback)
  NGN: 1610,   // 1 USD = 1610  NGN  (fallback)
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
        // FX rates — open.er-api.com is free and requires no API key
        const [fxRes, btcRes, ghsRes, ngnRes] = await Promise.all([
          fetch('https://open.er-api.com/v6/latest/USD'),
          fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
          fetch('https://api.frankfurter.app/latest?from=USD&to=GHS'),
          fetch('https://api.frankfurter.app/latest?from=USD&to=NGN'),
        ]);

        if (fxRes.ok) {
          const fxData = await fxRes.json();
          if (fxData.result === 'success' && fxData.rates) {
            Object.assign(this.rates, fxData.rates);
          }
        }

        // Fetch live GHS rate from Frankfurter (overrides any API or fallback value)
        if (ghsRes.ok) {
          const ghsData = await ghsRes.json();
          if (ghsData && ghsData.rates && ghsData.rates.GHS) {
            this.rates.GHS = ghsData.rates.GHS;
            console.log('✅ Live GHS rate updated from Frankfurter:', this.rates.GHS);
          }
        } else {
          // Fallback if Frankfurter fails
          this.rates.GHS = LIVE_CALIBRATION_FALLBACK.GHS;
          console.warn('⚠️ Could not fetch live GHS rate from Frankfurter, using fallback:', this.rates.GHS);
        }

        // Fetch live NGN rate from Frankfurter (overrides any API or fallback value)
        if (ngnRes.ok) {
          const ngnData = await ngnRes.json();
          if (ngnData && ngnData.rates && ngnData.rates.NGN) {
            this.rates.NGN = ngnData.rates.NGN;
            console.log('✅ Live NGN rate updated from Frankfurter:', this.rates.NGN);
          }
        } else {
          // Fallback if Frankfurter fails
          this.rates.NGN = LIVE_CALIBRATION_FALLBACK.NGN;
          console.warn('⚠️ Could not fetch live NGN rate from Frankfurter, using fallback:', this.rates.NGN);
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

  // Returns a plain snapshot of the current rates map (safe to spread into USD_RATES)
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
