// Centralized API error/success messages for PRAQEN backend
// Keep all user-facing strings here so they stay consistent

const E = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  NO_TOKEN:             'Please log in to continue.',
  INVALID_TOKEN:        'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS:  'Incorrect email or password. Please check your details and try again.',
  ACCOUNT_NOT_FOUND:    'No account found with those details. Please check or create a new account.',
  EMAIL_TAKEN:          'An account with this email already exists. Try logging in or use a different email.',
  USERNAME_TAKEN:       'That username is already taken. Please choose a different one.',
  MISSING_FIELDS:       'Please fill in all required fields.',
  PASSWORD_TOO_SHORT:   'Password must be at least 6 characters long.',
  EMAIL_INVALID:        'Please enter a valid email address.',
  PHONE_REQUIRED:       'Please enter your phone number.',
  REGISTER_FAILED:      'We couldn\'t create your account right now. Please try again.',

  // ── OTP / Verification ────────────────────────────────────────────────────
  OTP_REQUIRED:         'Please enter the full 6-digit verification code.',
  OTP_INVALID:          'That code is incorrect. Please check the code and try again.',
  OTP_EXPIRED:          'That code has expired. Please request a new one and try again within 5 minutes.',
  OTP_NO_CODE:          'No verification code found. Please request a new one.',
  OTP_SEND_FAILED:      'We couldn\'t send the verification code. Please check your details and try again.',
  OTP_VERIFY_FAILED:    'Verification failed. Please request a new code and try again.',
  PHONE_EMAIL_REQUIRED: 'Please provide your phone number or email address.',
  CODE_EMAIL_REQUIRED:  'Please provide your email address and verification code.',

  // ── Trade ─────────────────────────────────────────────────────────────────
  TRADE_NOT_FOUND:         'We couldn\'t find this trade. It may have been removed.',
  TRADE_SELF:              'You cannot trade with yourself. Please select a different offer.',
  TRADE_INVALID_AMOUNT:    'Please enter a valid Bitcoin amount greater than zero.',
  TRADE_NO_LISTING:        'We couldn\'t find the offer you\'re trying to trade on. It may have been removed.',
  TRADE_VERIFY_EMAIL:      'Please verify your email address before selling Bitcoin. Go to Settings → Verification to get started.',
  TRADE_INSUFFICIENT_SELLER: (have, need) =>
    `The seller no longer has enough Bitcoin to fulfill this trade.\n\nAvailable: ₿${parseFloat(have).toFixed(8)}\nRequired: ₿${parseFloat(need).toFixed(8)}\n\nPlease try a smaller amount or choose a different offer.`,
  TRADE_INSUFFICIENT_BUYER: (have, need) =>
    `You don't have enough Bitcoin for this trade.\n\nYour balance: ₿${parseFloat(have).toFixed(8)}\nRequired: ₿${parseFloat(need).toFixed(8)}\n\nPlease deposit more Bitcoin or choose a smaller amount.`,
  TRADE_CANNOT_MARK_PAID:  'Only the buyer can mark a trade as paid.',
  TRADE_CANNOT_RELEASE:    'Only the seller can release Bitcoin after confirming payment.',
  TRADE_WRONG_STATUS:      (action, status) => `Cannot ${action} — this trade is currently "${status}".`,
  TRADE_CANCEL_FORBIDDEN:  'Only the person who started this trade can cancel it.',
  TRADE_CANCEL_TOO_LATE:   'This trade cannot be cancelled at its current stage.',
  TRADE_DISPUTE_NO_REASON: 'Please provide a reason for opening a dispute.',
  TRADE_FEEDBACK_NOT_PART: 'You are not a participant in this trade.',
  TRADE_FEEDBACK_DONE:     'You have already submitted feedback for this trade.',

  // ── Wallet ────────────────────────────────────────────────────────────────
  WALLET_INVALID_ADDRESS: 'Please enter a valid Bitcoin address.',
  WALLET_AMOUNT_REQUIRED: 'Please enter a valid Bitcoin amount greater than zero.',
  WALLET_INSUFFICIENT:    (have) => `Insufficient balance. You have ₿${parseFloat(have).toFixed(8)} available.`,
  WALLET_NO_ADDRESS:      'Your wallet address hasn\'t been set up yet. Please generate one from your Wallet page.',
  WALLET_SEND_FAILED:     'Bitcoin transfer failed. Please check the address and try again.',
  WALLET_NOT_PRAQEN:      'That address is not registered on PRAQEN. Use the external send option for other Bitcoin addresses.',
  WALLET_SELF_TRANSFER:   'You cannot transfer Bitcoin to yourself.',
  WALLET_RECIPIENT_REQUIRED: 'Please provide a recipient username or Bitcoin address.',

  // ── General ───────────────────────────────────────────────────────────────
  SERVER_ERROR:    'Something went wrong on our end. Please try again in a moment.',
  FORBIDDEN:       'You don\'t have permission to do that.',
  NOT_FOUND:       'The resource you\'re looking for no longer exists.',
};

const S = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  REGISTERED:        'Welcome to PRAQEN! Your account has been created successfully.',
  EMAIL_VERIFIED:    'Your email has been verified successfully!',
  PHONE_VERIFIED:    'Your phone number has been verified successfully!',
  OTP_SENT:          'A verification code has been sent to your phone.',
  EMAIL_CODE_SENT:   'A verification code has been sent to your email address.',
  PASSWORD_CHANGED:  'Password changed successfully.',

  // ── Trade ─────────────────────────────────────────────────────────────────
  TRADE_PAID:        'Payment confirmed! The seller has been notified and will verify your payment shortly.',
  TRADE_RELEASED:    (amount) => `Trade completed! ₿${parseFloat(amount).toFixed(8)} has been released to the buyer's wallet.`,
  TRADE_CANCELLED:   'Trade cancelled. Any locked Bitcoin has been returned.',
  TRADE_DISPUTED:    'Dispute opened. Our moderators have been notified and will review your case.',
  TRADE_FEEDBACK:    'Feedback submitted. Thank you for rating this trade!',

  // ── Wallet ────────────────────────────────────────────────────────────────
  WALLET_SENT:       (amount, txid) => `₿${parseFloat(amount).toFixed(8)} sent successfully! TX: ${txid}`,
  WALLET_INTERNAL:   (amount, to) => `₿${parseFloat(amount).toFixed(8)} sent to @${to} instantly — no fee!`,
  ADDRESS_GENERATED: 'Your Bitcoin deposit address is ready!',
};

module.exports = { E, S };
