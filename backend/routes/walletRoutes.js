const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');

// Generate address for new user
router.post('/generate-address', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const addressData = await walletService.createAddressForUser(userId);
        
        // Save to your database here
        // await User.update({ btcAddress: addressData.address }, { where: { id: userId } });
        
        res.json({
            success: true,
            address: addressData.address,
            userId: userId
        });
        
    } catch (error) {
        console.error('Error generating address:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Send Bitcoin
router.post('/send', async (req, res) => {
    try {
        const { toAddress, amount, userId } = req.body;
        
        // Check user balance in YOUR DATABASE first!
        // const user = await User.findByPk(userId);
        // if (user.balance < amount) throw new Error('Insufficient balance');
        
        const transfer = await walletService.sendBitcoin(toAddress, amount);
        
        // Update user balance in database
        // user.balance -= amount;
        // await user.save();
        
        res.json({
            success: true,
            txHash: transfer.transactionHash,
            amount: amount,
            to: toAddress
        });
        
    } catch (error) {
        console.error('Error sending Bitcoin:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;