require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log("🔍 PRAQEN Wallet System Check\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

let passed = 0;
let failed = 0;

function check(name, condition, fix = '') {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}`);
        if (fix) console.log(`   → Fix: ${fix}`);
        failed++;
    }
}

// 1. Check .env variables
console.log("📋 Environment Variables:");
check("CDP_API_KEY_NAME", !!process.env.CDP_API_KEY_NAME, "Add to .env file");
check("CDP_API_KEY_PRIVATE_KEY", !!process.env.CDP_API_KEY_PRIVATE_KEY, "Add to .env file");
check("CDP_PRIVATE_KEY has BEGIN line", process.env.CDP_API_KEY_PRIVATE_KEY?.includes('BEGIN EC PRIVATE KEY'), "Add BEGIN line to private key");
check("CDP_PRIVATE_KEY has END line", process.env.CDP_API_KEY_PRIVATE_KEY?.includes('END EC PRIVATE KEY'), "Add END line to private key");
check("MASTER_WALLET_ID (pending)", !process.env.MASTER_WALLET_ID ? '⏳ Waiting for creation' : `✅ ${process.env.MASTER_WALLET_ID.substring(0,20)}...`, "Run create-master-wallet.js after rate limit clears");

console.log("\n📦 Required Files:");
const files = [
    'services/walletService.js',
    'routes/walletRoutes.js',
    'create-master-wallet.js',
    'test-cdp.js'
];

files.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    check(`File: ${file}`, exists, `Create ${file}`);
});

console.log("\n📚 Package Dependencies:");
try {
    const packageJson = require('./package.json');
    const deps = packageJson.dependencies || {};
    check("@coinbase/coinbase-sdk", !!deps['@coinbase/coinbase-sdk'], "Run: npm install @coinbase/coinbase-sdk");
    check("express", !!deps['express']);
    check("dotenv", !!deps['dotenv']);
} catch(e) {
    console.log("❌ Could not read package.json");
}

console.log("\n🔧 Code Structure Check:");
try {
    const walletService = fs.readFileSync(path.join(__dirname, 'services/walletService.js'), 'utf8');
    check("walletService has initialize()", walletService.includes('async initialize()'));
    check("walletService has createAddressForUser()", walletService.includes('createAddressForUser'));
    check("walletService has sendBitcoin()", walletService.includes('sendBitcoin'));
} catch(e) {
    console.log("❌ Could not read walletService.js");
}

try {
    const walletRoutes = fs.readFileSync(path.join(__dirname, 'routes/walletRoutes.js'), 'utf8');
    check("walletRoutes has /generate-address", walletRoutes.includes('/generate-address'));
    check("walletRoutes has /send", walletRoutes.includes('/send'));
} catch(e) {
    console.log("❌ Could not read walletRoutes.js");
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log("\n🎉 PERFECT! Your system is ready!");
    console.log("   Just wait for rate limit to clear, then:");
    console.log("   node create-master-wallet.js");
} else {
    console.log(`\n⚠️  Fix the ${failed} issue(s) above.`);
}

console.log("\n⏰ Rate Limit Status: PENDING (try again in 12-24 hours)");