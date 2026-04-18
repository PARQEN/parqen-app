require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

async function generateBTCAddress() {
    console.log("🔧 Using Coinbase Exchange API...\n");
    
    const apiKey = process.env.COINBASE_API_KEY;
    const apiSecret = process.env.COINBASE_API_SECRET;
    const passphrase = 'YOUR_PASSPHRASE_HERE'; // ← YOU NEED TO ADD THIS
    
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const requestPath = '/deposits/coinbase-account';
    const body = JSON.stringify({
        amount: "0.00",
        currency: "BTC"
    });
    
    const message = timestamp + method + requestPath + body;
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');
    
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://api.exchange.coinbase.com/deposits/coinbase-account',
            headers: {
                'CB-ACCESS-KEY': apiKey,
                'CB-ACCESS-SIGN': signature,
                'CB-ACCESS-TIMESTAMP': timestamp,
                'CB-ACCESS-PASSPHRASE': passphrase,
                'Content-Type': 'application/json'
            },
            data: { amount: "0.00", currency: "BTC" }
        });
        
        console.log("✅ BTC Address Generated!");
        console.log(`📋 Address: ${response.data.address}`);
        console.log("\nThis address can receive Bitcoin!");
        
    } catch (error) {
        console.log("❌ Error:", error.response?.data || error.message);
    }
}

generateBTCAddress();