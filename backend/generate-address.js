const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');

const bip32 = BIP32Factory(ecc);

// REPLACE WITH YOUR 12 WORDS FROM PAPER
const mnemonic = 'town cushion place media agent regret shrimp retreat pull aware clap recall';

const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
const child = root.derivePath("m/84'/0'/0'/0/0");
const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network: bitcoin.networks.bitcoin });
console.log('MAINNET ADDRESS:', address);