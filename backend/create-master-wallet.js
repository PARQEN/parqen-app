require('dotenv').config();
const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");
const fs = require('fs');

async function createMasterWallet() {
    console.log("🔧 Configuring CDP SDK...\n");
    
    Coinbase.configure({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        privateKey: process.env.CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    
    console.log("💰 Creating Master Wallet on Bitcoin Mainnet...\n");
    
    try {
        // Create wallet on Bitcoin mainnet
        const wallet = await Wallet.create({
            networkId: Coinbase.networks.BitcoinMainnet
        });
        
        const walletId = wallet.getId();
        
        console.log("✅ MASTER WALLET CREATED SUCCESSFULLY!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📋 Wallet ID: ${walletId}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Save wallet ID to .env file
        const envContent = `\n# Master Wallet ID (Auto-generated)\nMASTER_WALLET_ID=${walletId}\n`;
        fs.appendFileSync('.env', envContent);
        
        console.log("\n✅ Wallet ID saved to .env file!");
        console.log("\n⚠️  IMPORTANT: This wallet holds ALL user funds.");
        console.log("   Keep the .env file secure and backed up!\n");
        
        return walletId;
        
    } catch (error) {
        console.log("\n❌ Error creating master wallet:", error.message);
        throw error;
    }
}

createMasterWallet();