import { useState, useEffect } from 'react';

export default function CountryFlag({ countryCode, className = "w-5 h-4" }) {
  // Default to Ghana ('gh') - no API calls needed
  const [code, setCode] = useState(countryCode || 'gh');

  useEffect(() => {
    if (countryCode) {
      setCode(countryCode.toLowerCase());
    }
  }, [countryCode]);

  return (
    <img 
      src={`https://flagcdn.com/48x36/${code}.png`}
      srcSet={`https://flagcdn.com/96x72/${code}.png 2x`}
      alt={code}
      className={`${className} object-cover rounded-sm inline-block`}
      onError={(e) => { e.currentTarget.src = 'https://flagcdn.com/48x36/gh.png'; }}
    />
  );
}