import { useState, useEffect } from 'react';

function LiveRates() {
  const [rates, setRates] = useState({ 
    usdToLocal: null, 
    btcUsd: null, 
    localCurrency: 'USD', 
    isLoading: true, 
    error: null 
  });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // 1. Auto-detect user's country via IP
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        const userCurrency = ipData.currency || 'USD';
        const userCountry = ipData.country_name || 'your region';

        // 2. Fetch USD to local currency rate
        const apiKey = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
        const forexRes = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
        const forexData = await forexRes.json();
        const usdToLocalRate = forexData.conversion_rates[userCurrency];

        // 3. Fetch BTC to USD rate
        const btcRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        const btcData = await btcRes.json();
        const btcUsdRate = parseFloat(btcData.data.amount);
        const btcLocalRate = btcUsdRate * usdToLocalRate;

        setRates({
          usdToLocal: usdToLocalRate,
          btcUsd: btcUsdRate,
          btcLocal: btcLocalRate,
          localCurrency: userCurrency,
          userCountry: userCountry,
          lastUpdated: new Date(forexData.time_last_update_utc),
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error("Failed to fetch live rates:", error);
        setRates(prev => ({ ...prev, isLoading: false, error: "Could not load rates." }));
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (rates.isLoading) return <div className="text-sm text-gray-500">Loading live rates...</div>;
  if (rates.error) return <div className="text-sm text-red-500">{rates.error}</div>;

  return (
    <div className="live-rates text-sm">
      <div className="rate-item">
        <span>1 USD = {rates.localCurrency} {rates.usdToLocal?.toFixed(2)}</span>
      </div>
      <div className="rate-item font-semibold">
        <span>1 BTC = {rates.localCurrency} {rates.btcLocal?.toLocaleString()}</span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Rates for {rates.userCountry} · Updated {rates.lastUpdated?.toLocaleTimeString()}
      </div>
    </div>
  );
}

export default LiveRates;