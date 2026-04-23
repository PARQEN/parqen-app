// setup-hd-wallet.js - Run ONCE to generate your master seed (TESTNET)
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');
const fs = require('fs');
const path = require('path');

// Initialize ECPair for v7
const ECPair = ECPairFactory(ecc);

console.log('🔐 GENERATING HD WALLET MASTER SEED (TESTNET)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generate 12-word mnemonic
const mnemonic = bip39.generateMnemonic(128);

console.log('📝 YOUR MASTER SEED (12 WORDS):\n');
console.log('   ' + mnemonic);
console.log('\n⚠️  WRITE THIS DOWN AND STORE IT SAFELY!');
console.log('   Anyone with these words controls ALL funds.\n');

// Generate seed from mnemonic
const seed = bip39.mnemonicToSeedSync(mnemonic);

// Create master key pair from seed
const network = bitcoin.networks.testnet;
const keyPair = ECPair.fromPrivateKey(seed.slice(0, 32), { network });

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ HD Master Wallet Created Successfully!\n');
console.log('📋 Network: TESTNET (Fake BTC - Safe for development)\n');

// Generate first address (Native SegWit - bc1...)
const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network: network
});

console.log('📋 First derived address (example):');
console.log('   ' + address + '\n');
console.log('📋 Format: Native SegWit (bc1...) - Lower fees\n');

// Save to .env file
const envPath = path.join(__dirname, '.env');
const envContent = `
# HD Wallet Configuration (TESTNET) - Generated on ${new Date().toISOString()}
MNEMONIC="${mnemonic}"
MASTER_PRIVATE_KEY="${seed.slice(0, 32).toString('hex')}"
HD_NETWORK="testnet"
`;

fs.appendFileSync(envPath, envContent);

console.log('✅ Saved to .env file!');
console.log('   Variables added: MNEMONIC, MASTER_PRIVATE_KEY, HD_NETWORK\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');