🎁 PRAQEN - P2P Gift Card & Bitcoin Trading Platform
=====================================================

A complete open-source MVP for peer-to-peer gift card to Bitcoin trading with dual escrow protection.

## ✨ Features

✅ User Registration & Authentication (JWT)
✅ Create Gift Card Listings
✅ Browse & Search Marketplace
✅ Dual Escrow System (Both assets locked)
✅ Mock Bitcoin Wallets (For MVP testing)
✅ Code Encryption & Decryption
✅ Mutual Confirmation System
✅ Rating & Review System
✅ Admin Profit Dashboard
✅ Company Wallet Tracking
✅ Complete Trade Management
✅ Row Level Security (RLS) in Database
✅ Responsive Design (Mobile + Desktop)

---

## 🚀 Tech Stack

**Frontend:**
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Lucide Icons

**Backend:**
- Node.js
- Express.js
- JWT Authentication
- Bcryptjs (Password hashing)

**Database:**
- Supabase (PostgreSQL)
- Row Level Security Policies
- Real-time Triggers

---

## 📁 Project Structure

```
PRAQEN_MVP/
│
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Backend dependencies
│   └── .env.example           # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main App component
│   │   ├── pages/
│   │   │   ├── Home.js        # Landing page
│   │   │   ├── Login.js       # Login page
│   │   │   ├── Register.js    # Registration page
│   │   │   ├── Marketplace.js # Browse listings
│   │   │   ├── CreateListing.js
│   │   │   ├── ListingDetail.js
│   │   │   ├── MyTrades.js    # User's trades
│   │   │   ├── TradeDetail.js # Trade details
│   │   │   ├── Profile.js     # User profile
│   │   │   └── AdminDashboard.js
│   │   ├── components/
│   │   │   └── Navbar.js      # Navigation bar
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   │   └── index.html
│   ├── package.json           # Frontend dependencies
│   └── .env.example           # Frontend env variables
│
├── database/
│   └── schema.sql             # Complete database schema
│
├── README.md                  # This file
├── SETUP.md                   # Detailed setup instructions
└── API_DOCS.md               # API documentation

```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn
- Supabase account (free tier available)
- Git

### Step 1: Clone or Download
```bash
cd PRAQEN_MVP
```

### Step 2: Setup Database

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Copy your Project URL and Anon Key
4. Go to SQL Editor in Supabase
5. Copy the entire content from `database/schema.sql`
6. Paste into SQL Editor and run
7. Wait for all tables and security policies to be created

### Step 3: Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL=your_url
# SUPABASE_ANON_KEY=your_key

# Install dependencies
npm install

# Start backend server
npm start
# Server runs on http://localhost:5000
```

### Step 4: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start frontend development server
npm start
# Opens on http://localhost:3000
```

---

## 📝 Default Test Credentials

After registration, you can create test accounts. Or use:
- Email: `test@praqen.com`
- Password: `test123`

(Create this by registering in the app)

---

## 🎯 Quick Start Workflow

1. **Open** http://localhost:3000
2. **Register** two test accounts (Seller & Buyer)
3. **Seller:** Create listing (Marketplace → Create Listing)
4. **Buyer:** Browse marketplace
5. **Buyer:** Click "Buy Now" on a listing
6. **Seller:** Go to "My Trades" → Send code
7. **Buyer:** Confirm receipt of code
8. **Seller:** Confirm buyer received code
9. **Trade completes** ✓
10. **Both rate** each other
11. **Check Admin Dashboard** for profit tracking

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
```

### Users
```
GET    /api/users/profile           (Protected)
GET    /api/users/:userId           (Public)
PUT    /api/users/profile           (Protected)
```

### Listings
```
POST   /api/listings                (Protected)
GET    /api/listings                (Public)
GET    /api/listings/:id            (Public)
GET    /api/my-listings             (Protected)
PUT    /api/listings/:id            (Protected)
```

### Trades
```
POST   /api/trades                  (Protected)
GET    /api/my-trades               (Protected)
GET    /api/trades/:id              (Protected)
POST   /api/trades/:id/send-code    (Protected, Seller)
POST   /api/trades/:id/confirm-buyer (Protected, Buyer)
POST   /api/trades/:id/confirm-seller (Protected, Seller)
```

### Reviews
```
POST   /api/reviews                 (Protected)
GET    /api/reviews/:userId         (Public)
```

### Admin
```
GET    /api/admin/profits           (Protected)
GET    /api/admin/stats             (Protected)
```

---

## 💰 Fee System

**Every successful trade:**
- Buyer sends: 0.00222 BTC (example)
- Platform fee (3%): 0.0000666 BTC → Company wallet
- Seller receives: 0.002154 BTC (97%)

Fee is **automatically calculated and collected** when both parties confirm.

---

## 🔒 Security Features

✅ Password hashing (bcryptjs)
✅ JWT authentication
✅ Row Level Security (RLS) in database
✅ Gift card code encryption
✅ CORS enabled
✅ Protected API routes
✅ User authorization checks

**Note:** For production, add:
- HTTPS only
- Rate limiting
- API key rotation
- Email verification
- Real blockchain integration

---

## 📱 Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Update profile
- [ ] Create a listing
- [ ] Browse marketplace listings
- [ ] Search/filter listings
- [ ] View listing details
- [ ] Create a trade (buy)
- [ ] Send gift card code (as seller)
- [ ] Confirm receipt (as buyer)
- [ ] Rate each other
- [ ] View trade history
- [ ] Check admin dashboard
- [ ] View own profile
- [ ] View other user profiles

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on port 5000
- Check .env file has correct API URL
- Run `npm start` in backend directory

### "Supabase connection error"
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check database schema is created
- Ensure RLS policies are enabled

### "Authentication not working"
- Clear browser localStorage
- Try incognito/private mode
- Restart frontend server
- Check JWT_SECRET in .env

### "Listings not appearing"
- Verify listings were created in database
- Check status = 'ACTIVE'
- Try refreshing page
- Check browser console for errors

---

## 📚 Additional Documentation

See `SETUP.md` for detailed setup
See `API_DOCS.md` for complete API documentation

---

## 🚀 Deployment

### Backend Deployment (Railway, Fly.io, Heroku)
```bash
# Add Procfile
echo "web: node server.js" > Procfile

# Deploy with Railway
railway up
```

### Frontend Deployment (Vercel, Netlify)
```bash
npm run build
# Deploy 'build' folder to Vercel or Netlify
```

---

## 📊 Mock Data for Testing

When you first run the app, create test listings:

**Test Listing 1:**
- Brand: Amazon $100
- Price: 0.00222 BTC
- Processing: 15 min

**Test Listing 2:**
- Brand: Apple iTunes $50
- Price: 0.00111 BTC
- Processing: 10 min

**Test Listing 3:**
- Brand: Google Play $25
- Price: 0.00055 BTC
- Processing: 20 min

---

## 🎯 Next Steps (After MVP Testing)

1. **Real Bitcoin Integration**
   - Connect Blockchain.com API
   - Implement real wallet generation
   - Real transaction signing

2. **Enhanced Features**
   - Dispute resolution system
   - Admin moderation tools
   - Email notifications
   - Two-factor authentication
   - KYC/AML integration

3. **Scaling**
   - Add caching (Redis)
   - Database optimization
   - API rate limiting
   - Analytics tracking

4. **Marketing**
   - Launch with 30 community testers
   - Gather feedback
   - Iterate based on feedback
   - Organic growth through word-of-mouth

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Review server logs
5. Ask your community testers for feedback

---

## 📄 License

Open source - Build your own PRAQEN instance

---

## ✨ Credits

Built with ❤️ for the African P2P trading community
Rebuilding trust. One transaction at a time.

**PRAQEN**: Professional. Trustworthy. Honest.

---

Last updated: 2024
