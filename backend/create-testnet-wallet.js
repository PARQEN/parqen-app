require('dotenv').config();
const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const fs = require('fs');

async function createTestnetWallet() {
    console.log("🔧 Configuring CDP SDK...\n");
    
    Coinbase.configure({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        privateKey: process.env.CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    
    console.log("💰 Creating Master Wallet on Bitcoin TESTNET...\n");
    
    try {
        // Create wallet on Bitcoin TESTNET (no rate limits)
        const wallet = await Wallet.create({
            networkId: Coinbase.networks.BitcoinTestnet
        });
        
        const walletId = wallet.getId();
        
        console.log("✅ MASTER WALLET CREATED SUCCESSFULLY!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📋 Wallet ID: ${walletId}`);
        console.log(`🌐 Network: Bitcoin Testnet`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Save wallet ID to .env file
        const envContent = `\n# Master Wallet ID (Testnet)\nMASTER_WALLET_ID_TESTNET=${walletId}\n`;
        fs.appendFileSync('.env', envContent);
        
        console.log("\n✅ Wallet ID saved to .env file!");
        console.log("\n💡 Testnet is FREE - perfect for development!");
        console.log("   Once working, we'll switch to Mainnet.\n");
        
        return walletId;
        
    } catch (error) {
        console.log("\n❌ Error:", error.message);
        throw error;
    }
}

createTestnetWallet();