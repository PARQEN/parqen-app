// test-send-btc.js
// Run: node test-send-btc.js
require('dotenv').config();
const hdWallet = require('./services/hdWalletService');

async function testSend() {
  console.log('\n========================================');
  console.log('  PRAQEN HD Wallet — Send BTC Test');
  console.log('========================================\n');

  // Print wallet info first
  const info = hdWallet.getInfo();
  console.log('Wallet Info:', info);
  console.log('');

  // ── TEST 1: Simple send ───────────────────────────────────────────────────
  try {
    const fromUser    = 'user_65830906-297b-4eb5-8c60-ed0e9a4aac82';
    const toAddress   = 'tb1qerzrlxcfu24davlur5sqmgzzgsal6wusda40er'; // faucet return
    const amountBTC   = 0.001;

    // Check balance first
    const senderAddr  = hdWallet.generateUserAddress('65830906-297b-4eb5-8c60-ed0e9a4aac82').address;
    console.log('Sender address:', senderAddr);

    const balance = await hdWallet.checkBalance(senderAddr);
    console.log('Balance:', balance);
    console.log('');

    if (balance.confirmed_btc < amountBTC) {
      console.log(`⚠️  Not enough balance to send ${amountBTC} BTC`);
      console.log(`   Available: ${balance.confirmed_btc} BTC`);
      return;
    }

    console.log(`Sending ${amountBTC} BTC to ${toAddress}...`);
    const result = await hdWallet.sendBitcoin(fromUser, toAddress, amountBTC);

    console.log('\n✅ SUCCESS!');
    console.log('TX ID    :', result.txid);
    console.log('Explorer :', result.explorer_url);
    console.log('Sent     :', result.amount_btc, 'BTC');
    console.log('Fee      :', result.fee_sats, 'sats');

  } catch (error) {
    console.error('\n❌ Send failed:', error.message);
  }
}

testSend();