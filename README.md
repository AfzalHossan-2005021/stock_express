# Stock Express 📈

A modern, real-time stock trading and watchlist management application built with Next.js 16, React 19, and TypeScript. Track your favorite stocks, receive personalized market insights, and stay informed with curated financial news.

## 🌟 Features

### Core Functionality
- **Stock Search & Discovery** - Search over 10,000+ stocks with real-time market data
- **Personal Watchlist** - Create and manage your custom watchlist of favorite stocks
- **Real-Time Charts** - Interactive TradingView charts for technical analysis
- **Market Overview** - Dashboard with market heatmaps, trending stocks, and key indices
- **Stock Heatmap** - Visual representation of market sectors and performance
- **Market Data** - Live quotes, 52-week highs/lows, and trading volume

### Smart Features
- **Personalized Onboarding** - Select investment goals, risk tolerance, and preferred industries
- **AI-Powered Welcome Emails** - Gemini-powered personalized welcome messages
- **Daily News Digest** - Curated market news based on your watchlist (via Inngest)
- **Company News** - Latest news for stocks in your watchlist
- **Smart Search** - Debounced search with autocomplete suggestions

### User Experience
- **Dark Mode Support** - Modern dark theme with smooth transitions
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Command Palette** - Quick stock search with Cmd+K
- **Toast Notifications** - Real-time feedback for user actions
- **Smooth Animations** - Polished UI with Tailwind animations

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Shadcn UI
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Form Management**: React Hook Form
- **Command Palette**: cmdk

### Backend
- **Runtime**: Node.js (Next.js Server Components & Actions)
- **Database**: MongoDB with Mongoose
- **Authentication**: Better Auth 1.4
- **Task Queue**: Inngest 3.48
- **Email**: Nodemailer 7
- **External APIs**: Finnhub (stock data)

### Charts & Widgets
- **TradingView Lightweight Charts** - Interactive candlestick & heatmap charts
- **Market Data**: Finnhub API for stock information and news

### Infrastructure
- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Testing**: Jest + ts-jest
- **Linting**: ESLint 9
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js 18+ (tested with Node 20)
- npm or yarn
- MongoDB database (local or Atlas)
- API Keys:
  - Finnhub API key (free tier available)
  - Better Auth secret
  - Gmail credentials (for email notifications)
  - Inngest API key (for scheduled tasks)
  - Gemini API key (for AI-powered emails)

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/stock_express.git
cd stock_express

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/stock_express

# API Keys (Private - Server Only)
FINNHUB_API_KEY=your_finnhub_api_key

# Authentication
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000

# Email Service
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_password

# Async Tasks
INNGEST_API_KEY=your_inngest_key
INNGEST_EVENT_KEY=your_inngest_event_key

# AI (Optional - for personalized emails)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

The app will automatically reload as you make changes. Open DevTools to see any console messages.

### 4. Access the Application

- **Home**: [http://localhost:3000](http://localhost:3000) - Market overview and watchlist
- **Sign In**: [http://localhost:3000/sign-in](http://localhost:3000/sign-in)
- **Sign Up**: [http://localhost:3000/sign-up](http://localhost:3000/sign-up)

## 📁 Project Structure

```
stock_express/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes & Inngest webhooks
│   ├── (auth)/                   # Authentication pages (sign-in, sign-up)
│   ├── (root)/                   # Protected routes (dashboard, watchlist)
│   └── layout.tsx                # Root layout with themes & providers
│
├── components/                   # React components
│   ├── SearchCommand.tsx         # Stock search with Cmd+K
│   ├── Header.tsx                # Navigation header
│   ├── TradingViewWidget.tsx     # Chart embeddings
│   ├── AddToWatchlistButton.tsx  # Watchlist actions
│   ├── ui/                       # Shadcn UI components
│   └── forms/                    # Form components
│
├── lib/
│   ├── actions/                  # Server actions (auth, watchlist, API calls)
│   ├── better-auth/              # Authentication setup
│   ├── inngest/                  # Async workflow functions
│   ├── nodemailer/               # Email templates & service
│   ├── tradingview.ts            # TradingView utilities
│   ├── constants.ts              # App constants & configs
│   └── utils.ts                  # Helper functions
│
├── database/
│   ├── mongoose.ts               # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   └── __tests__/                # Database tests
│
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── middleware/                   # Next.js middleware
├── public/                       # Static assets
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── jest.config.js
    ├── tailwind.config.ts
    └── components.json
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

### Test Setup

Tests are configured with Jest and ts-jest. Database tests are in `database/__tests__/`.

## 📚 Documentation

Comprehensive guides are included:

- **[START_HERE.md](START_HERE.md)** - Quick overview of project analysis and improvements
- **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** - Detailed analysis of 15 improvement areas
- **[IMPLEMENTATION_GUIDE.ts](IMPLEMENTATION_GUIDE.ts)** - Code examples for fixes
- **[TESTING_STRATEGY.md](TESTING_STRATEGY.md)** - Complete testing plan
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and improvements
- **[DATABASE_TEST_GUIDE.md](DATABASE_TEST_GUIDE.md)** - Guide for setting up database tests

## 🔒 Security Features

✅ **Protected API Keys** - Finnhub API key kept server-side only  
✅ **Authentication** - Email/password with Better Auth  
✅ **Environment Variables** - Sensitive data in `.env.local`  
✅ **HTTPS Ready** - Configured for production SSL  
✅ **User Isolation** - Watchlists and data tied to authenticated users  

### Security Checklist

- [ ] Set all environment variables in production
- [ ] Use strong BETTER_AUTH_SECRET in production
- [ ] Enable HTTPS in production environment
- [ ] Configure CORS headers if needed
- [ ] Set up rate limiting on API routes
- [ ] Review MongoDB security groups

## 🚀 Deployment

### Deploy on Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Follow the prompts to connect your GitHub repository and set environment variables in Vercel dashboard.

### Deploy on Other Platforms

Make sure to set all environment variables:

```
MONGODB_URI
FINNHUB_API_KEY
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NODEMAILER_EMAIL
NODEMAILER_PASSWORD
INNGEST_API_KEY
INNGEST_EVENT_KEY
GEMINI_API_KEY (optional)
```

## 🐛 Troubleshooting

### Development Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**MongoDB connection fails:**
- Check MONGODB_URI is correct
- Verify IP whitelist in MongoDB Atlas
- Ensure network connection works

**API key errors:**
- Verify FINNHUB_API_KEY is set in .env.local
- Check Finnhub API quota hasn't been exceeded
- Ensure API key has correct permissions

**Email not sending:**
- Verify NODEMAILER_EMAIL is correct
- Check Gmail app-specific password is used (not regular password)
- Enable "Less secure app access" if needed (not recommended)

## 📊 API Endpoints

### Stock Data (Server-Side Only)

- `POST /api/stock/profile` - Get stock profile information
  ```json
  {
    "symbol": "AAPL"
  }
  ```

### Server Actions

- `signUpWithEmail()` - Register new user
- `signInWithEmail()` - Authenticate user
- `addToWatchlist()` - Add stock to user's watchlist
- `removeFromWatchlist()` - Remove stock from watchlist
- `getNews()` - Fetch market and company news
- `searchStocks()` - Search for stocks

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create a Pull Request

### Code Standards

- Run linter: `npm run lint`
- Use TypeScript for type safety
- Add tests for new features
- Follow existing code style

## 📈 Roadmap

### Planned Features

- [ ] Stock price alerts
- [ ] Portfolio tracking
- [ ] Trading history
- [ ] Advanced charting with technical indicators
- [ ] Community features (stock discussions)
- [ ] Mobile app (React Native)
- [ ] Integration with Stripe for premium features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [TradingView](https://www.tradingview.com/) - Market charts and widgets
- [Finnhub](https://finnhub.io/) - Stock market data
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📞 Support

For issues, questions, or suggestions:

1. Check the [documentation](./PROJECT_ANALYSIS.md)
2. Review [existing issues](https://github.com/yourusername/stock_express/issues)
3. Create a new issue with details

## 🔗 Links

- **Live Demo**: https://stock-express.vercel.app (when deployed)
- **API Docs**: See [IMPLEMENTATION_GUIDE.ts](IMPLEMENTATION_GUIDE.ts)
- **Project Board**: GitHub Projects (when set up)

---

**Built with ❤️ using Next.js and React**
