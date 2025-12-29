# Stock Express - Architecture & Improvement Roadmap

## 📐 Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / Client                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (SearchCommand, AddToWatchlist, etc)   │   │
│  │  - State management with useState                        │   │
│  │  - API calls from client (❌ EXPOSED API KEY)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                   Next.js Server                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Server Actions (lib/actions/*.ts)                       │   │
│  │  ❌ Minimal error handling                               │   │
│  │  ❌ No input validation                                  │   │
│  │  ❌ Inconsistent error messages                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│        ┌──────────────────┼─────────────────┬────────────┐      │
│        │                  │                 │            │      │
│  ┌─────▼────┐      ┌──────▼──────┐   ┌──────▼────┐  ┌─────▼──┐  │
│  │ Finnhub  │      │  MongoDB    │   │ Nodemailer│  │Inngest │  │
│  │  API ❌  │      │  (Watchlist)│   │  (Email)  │  │(Async) │  │
│  │Exposed   │      │             │   │           │  │        │  │
│  └──────────┘      └─────────────┘   └───────────┘  └────────┘  │
│  • No rate limit                                                │
│  • No circuit breaker                                           │
│  • No retry logic                                               │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Improved Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / Client                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (SearchCommand, AddToWatchlist, etc)   │   │
│  │  - State management with custom hooks                    │   │
│  │  - API calls to /api/* endpoints only (✅ SECURE)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                   Next.js Server                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (/app/api/*)  ✅ NEW                         │   │
│  │  ├─ POST /api/stock/profile                              │   │
│  │  ├─ GET /api/news                                        │   │
│  │  ├─ POST /api/watchlist                                  │   │
│  │  └─ Global error handling middleware                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Server Actions (lib/actions/*.ts) ✅ REFACTORED         │   │
│  │  ├─ Zod input validation                                 │   │
│  │  ├─ Structured error handling                            │   │
│  │  ├─ Consistent error messages                            │   │
│  │  └─ Proper logging                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Layer (lib/core/*.ts) ✅ NEW                    │   │
│  │  ├─ watchlist.service.ts                                 │   │
│  │  ├─ auth.service.ts                                      │   │
│  │  ├─ market.service.ts                                    │   │
│  │  └─ Encapsulated business logic                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Clients (lib/api-clients/*.ts) ✅ NEW               │   │
│  │  ├─ finnhub.client.ts (with rate limiting)               │   │
│  │  ├─ email.client.ts                                      │   │
│  │  └─ Circuit breaker + retry logic                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Validation (lib/validation/*.ts) ✅ NEW                 │   │
│  │  ├─ schemas.ts (Zod schemas)                             │   │
│  │  └─ Input validation at entry points                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Error Handling (lib/errors/*.ts) ✅ NEW                 │   │
│  │  ├─ error-handler.ts                                     │   │
│  │  ├─ custom-errors.ts                                     │   │
│  │  └─ Structured error responses                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Logging (lib/logging/*.ts) ✅ NEW                       │   │
│  │  ├─ logger.ts (Winston/Pino)                             │   │
│  │  └─ Structured logging + monitoring                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│        ┌──────────────────┬─────────────────┬─────────────┐     │
│        │                  │                 │             │     │
│  ┌─────▼────┐      ┌──────▼──────┐   ┌──────▼────┐  ┌─────▼──┐  │
│  │ Finnhub  │      │  MongoDB    │   │ Nodemailer│  │Inngest │  │
│  │  API ✅  │      │  (Watchlist)│   │  (Email)  │  │(Async) │  │
│  │ Proxied  │      │  + health   │   │  + retry  │  │        │  │
│  │          │      │  checks     │   │  logic    │  │        │  │
│  └──────────┘      └─────────────┘   └───────────┘  └────────┘  │
│  • Rate limited via p-queue                                     │
│  • Circuit breaker pattern                                      │
│  • Exponential backoff                                          │
│  • Timeout handling                                             │
└─────────────────────────────────────────────────────────────────┘
        │                    │                  │              │
        └──────────────────────────────────────────────────────┘
                 ┌──────────────────────────────┐
                 │  Monitoring (Sentry, etc)    │
                 │  • Error tracking            │
                 │  • Performance metrics       │
                 │  • User analytics            │
                 └──────────────────────────────┘
```

## 🗂️ Recommended Folder Structure

```
stock_express/
├── app/
│   ├── api/
│   │   └── stock/
│   │       ├── profile/
│   │       │   └── route.ts          (✅ NEW - Server-side API proxy)
│   │       ├── news/
│   │       │   └── route.ts          (✅ NEW)
│   │       └── search/
│   │           └── route.ts          (✅ NEW)
│   ├── (auth)/
│   ├── (root)/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── SearchCommand.tsx
│   ├── Header.tsx
│   ├── forms/
│   ├── ui/
│   └── __tests__/                   (✅ NEW - Component tests)
│       └── SearchCommand.test.tsx
│
├── lib/
│   ├── actions/                      (Server actions - business logic)
│   │   ├── auth.actions.ts
│   │   ├── watchlist.actions.ts
│   │   ├── finnhub.actions.ts
│   │   └── user.actions.ts
│   │
│   ├── core/                         (✅ NEW - Service layer)
│   │   ├── watchlist.service.ts
│   │   ├── auth.service.ts
│   │   └── market.service.ts
│   │
│   ├── api-clients/                  (✅ NEW - External APIs)
│   │   ├── finnhub.client.ts
│   │   ├── email.client.ts
│   │   └── inngest.client.ts
│   │
│   ├── validation/                   (✅ NEW - Zod schemas)
│   │   ├── schemas.ts
│   │   ├── auth.schema.ts
│   │   └── stock.schema.ts
│   │
│   ├── errors/                       (✅ NEW - Error handling)
│   │   ├── error-handler.ts
│   │   └── custom-errors.ts
│   │
│   ├── logging/                      (✅ NEW - Structured logging)
│   │   └── logger.ts
│   │
│   ├── better-auth/
│   │   └── auth.ts
│   │
│   ├── inngest/
│   │   ├── client.ts
│   │   ├── functions.ts
│   │   └── prompts.ts
│   │
│   ├── nodemailer/
│   │   ├── index.ts
│   │   └── templates.ts
│   │
│   ├── tradingview.ts
│   ├── constants.ts
│   └── utils.ts
│
├── database/
│   ├── mongoose.ts
│   ├── models/
│   │   └── watchlist.model.ts
│   └── __tests__/
│       ├── connection.test.ts
│       ├── operations.test.ts
│       └── setup.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useTradingViewWidget.tsx
│   └── useStockSearch.ts              (✅ NEW - Extract from SearchCommand)
│
├── types/                             (✅ NEW - Organized type files)
│   ├── user.ts
│   ├── stock.ts
│   ├── auth.ts
│   ├── email.ts
│   └── global.d.ts
│
├── middleware/
│   └── index.ts
│
├── __tests__/                         (✅ NEW - Integration tests)
│   ├── api/
│   │   └── stock.test.ts
│   └── integration/
│       └── auth.flow.test.ts
│
├── public/
│   └── assets/
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── jest.config.js
    ├── jest.setup.ts                 (✅ NEW)
    ├── eslint.config.mjs
    ├── postcss.config.mjs
    ├── components.json
    │
    └── Documentation                 (✅ NEW)
        ├── PROJECT_ANALYSIS.md
        ├── IMPLEMENTATION_GUIDE.ts
        ├── TESTING_STRATEGY.md
        ├── REFACTORING_GUIDE.md
        ├── QUICK_FIX_GUIDE.sh
        ├── ANALYSIS_SUMMARY.md
        ├── ARCHITECTURE.md            (This file)
        ├── DATABASE_TEST_GUIDE.md
        └── README.md
```

## 🔄 Data Flow Comparison

### CURRENT (Problematic)
```
Client
   │
   ├─→ API calls to Finnhub (EXPOSED KEY) ❌
   │
   ├─→ Call server action
   │     │
   │     └─→ Minimal validation ❌
   │          │
   │          └─→ Call Finnhub again (Key exposed in env) ❌
   │               │
   │               └─→ No error handling ❌
   │
   └─→ Error handling via console.error ❌
```

### IMPROVED (Secure & Reliable)
```
Client
   │
   ├─→ Call server action with validated input
   │     │
   │     ├─→ Zod validation ✅
   │     │
   │     ├─→ Try-catch with AppError ✅
   │     │
   │     └─→ Call service layer
   │          │
   │          └─→ Call API client (with rate limiting) ✅
   │               │
   │               ├─→ Retry logic ✅
   │               ├─→ Circuit breaker ✅
   │               └─→ Timeout handling ✅
   │
   ├─→ Call /api/stock/* endpoints (Server-side proxy) ✅
   │     │
   │     ├─→ Input validation ✅
   │     ├─→ Server-side API key ✅
   │     ├─→ Error handling ✅
   │     └─→ Structured logging ✅
   │
   └─→ Proper error response handling ✅
       │
       └─→ User feedback + monitoring ✅
```

## 📊 Comparison Table

| Aspect | Current | Improved | Impact |
|--------|---------|----------|--------|
| **Security** | API key exposed | Server-side proxy | CRITICAL |
| **Error Handling** | console.error | AppError + logging | HIGH |
| **Input Validation** | None | Zod schemas | HIGH |
| **Rate Limiting** | None | p-queue + circuit breaker | HIGH |
| **Code Organization** | Mixed concerns | Service-based | MEDIUM |
| **Testing** | 5% coverage | 70%+ coverage | MEDIUM |
| **Database | Simple caching | Health checks + retry | MEDIUM |
| **Type Safety | 80% | 95%+ | LOW |
| **Documentation | Minimal | Complete | LOW |
| **Monitoring | None | Sentry integration | MEDIUM |

## 🚀 Implementation Timeline

```
Week 1: Security Fixes (Critical)
├─ Move API key to server-side          (30 min)
├─ Add Zod validation                   (1 hour)
├─ Implement error handler              (1 hour)
└─ Create .env.example                  (5 min)
   ✓ Total: ~3 hours

Week 2: Testing & Reliability
├─ Set up test infrastructure           (1 hour)
├─ Add server action tests              (2 hours)
├─ Add API endpoint tests               (2 hours)
├─ Add rate limiting                    (2 hours)
└─ Add database health checks           (1 hour)
   ✓ Total: ~8 hours

Week 3: Quality & Organization
├─ Extract service layer                (2 hours)
├─ Add component tests                  (2 hours)
├─ Refactor components                  (2 hours)
├─ Add structured logging               (1 hour)
└─ Document API endpoints               (1 hour)
   ✓ Total: ~8 hours

Week 4: Polish & Monitoring
├─ Add performance optimizations        (1 hour)
├─ Set up CI/CD                         (1 hour)
├─ Add error monitoring (Sentry)        (1 hour)
└─ Create architecture docs             (1 hour)
   ✓ Total: ~4 hours

Total Effort: ~23 hours over 4 weeks
```

## 🎯 Success Metrics

### Before Improvements
- Test Coverage: 5%
- Security: VULNERABLE
- Error Handling: MINIMAL
- Production Issues: HIGH
- Maintenance Difficulty: HIGH

### After Improvements
- Test Coverage: 70%+
- Security: SECURE
- Error Handling: COMPREHENSIVE
- Production Issues: LOW
- Maintenance Difficulty: LOW

---

**This architecture ensures your application is secure, maintainable, and scalable.**

See other documents for detailed implementation steps and code examples.
