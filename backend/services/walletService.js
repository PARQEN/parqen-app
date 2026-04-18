require('dotenv').config();
const { Coinbase, Wallet } = require("@coinbase/coinbase-sdk");

class WalletService {
    constructor() {
        this.masterWallet = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return this.masterWallet;

        Coinbase.configure({
            apiKeyName: process.env.CDP_API_KEY_NAME,
            privateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        });

        const walletId = process.env.MASTER_WALLET_ID;
        
        if (!walletId) {
            throw new Error('MASTER_WALLET_ID not found in .env');
        }

        this.masterWallet = await Wallet.fetch(walletId);
        this.initialized = true;
        
        console.log(`✅ Master wallet loaded: ${walletId}`);
        return this.masterWallet;
    }

    // Generate a unique address for a new user
    async createAddressForUser(userId) {
        await this.initialize();
        
        const address = await this.masterWallet.createAddress();
        
        console.log(`✅ New address for user ${userId}: ${address}`);
        
        return {
            address: address.address,
            userId: userId,
            createdAt: new Date()
        };
    }

    // Check balance of a specific address
    async getAddressBalance(address) {
        await this.initialize();
        
        const balances = await this.masterWallet.listBalances();
        const addressBalance = balances.find(b => b.address === address);
        
        return addressBalance?.amount || 0;
    }

    // Send Bitcoin from master wallet
    async sendBitcoin(toAddress, amount) {
        await this.initialize();
        
        const transfer = await this.masterWallet.createTransfer({
            amount: amount,
            assetId: Coinbase.assets.Btc,
            destination: toAddress,
        });
        
        console.log(`✅ Sent ${amount} BTC to ${toAddress}`);
        console.log(`   TX Hash: ${transfer.transactionHash}`);
        
        return transfer;
    }

    // List all addresses in the wallet
    async listAllAddresses() {
        await this.initialize();
        return await this.masterWallet.listAddresses();
    }
}

module.exports = new WalletService();