require('dotenv').config();
const { Coinbase } = require("@coinbase/coinbase-sdk");

console.log("🔍 Testing CDP Connection...\n");

// Check if variables exist
console.log("CDP_API_KEY_NAME:", process.env.CDP_API_KEY_NAME ? "✅ Present" : "❌ Missing");
console.log("CDP_API_KEY_PRIVATE_KEY:", process.env.CDP_API_KEY_PRIVATE_KEY ? "✅ Present" : "❌ Missing");

if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_PRIVATE_KEY) {
    console.log("\n❌ Missing CDP credentials in .env file");
    process.exit(1);
}

try {
    // Configure CDP
    Coinbase.configure({
        apiKeyName: process.env.CDP_API_KEY_NAME,
        privateKey: process.env.CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    
    console.log("✅ SDK configured successfully!");
    console.log("\n🎉 CDP Setup Complete - Ready for STEP 19!");
    
} catch (error) {
    console.log("\n❌ Configuration Error:", error.message);
    process.exit(1);
}