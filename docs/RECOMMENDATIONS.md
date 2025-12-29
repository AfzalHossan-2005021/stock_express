# Personalized Stock Recommendations

## Goal
Provide personalized stock recommendations to users to increase engagement and retention. The feature should be privacy-preserving, performant, extensible, and consistent with the project's code style.

## High-level approach
Use a simple but effective hybrid recommender:
- Content-based signals: user's watchlist, recent views, saved sectors
- Popularity & momentum: global popularity and short-term sector momentum (from existing data source)
- Heuristics: filter stocks user already follows heavily, avoid highly volatile picks if user risk profile is low

Start with a deterministic heuristic score (no ML) for MVP; later we can add collaborative filtering or ML models.

## Data sources
- User watchlist (`models/watchlist.model.ts`) and user activity (recent views)
- Finnhub (existing `lib/actions/finnhub.actions.ts`) or other market APIs for quotes and sector data
- Aggregated popularity from recent searches/views across users

## API contract
**Endpoint**: `GET /api/stock/recommendations`

Query params:
- `limit` (optional, default 10)
- `type` (optional, "personal" or "popular")

Auth:
- If authenticated: return personalized recommendations
- If unauthenticated: return top popular picks (generic)

Response (200):
```
[
  {
    "symbol": "AAPL",
    "score": 0.87,
    "reasons": ["In your watchlist", "Sector momentum: Tech"],
    "metadata": {"currentPrice": 173.45}
  }
]
```

Errors:
- 401 if the request requires personalized data and auth fails
- 429 when rate limits are exceeded

## Caching & performance
- Cache personalized results per-user for 5 minutes (Redis or in-memory). Cache popular results for 1 minute.
- Respect third-party API rate limits; batch requests when possible.
- Activity privacy: users can delete individual activity items via the dashboard (Recent Activities) and activity is retained for a configurable TTL (default 90 days).

## Implementation notes
- Backend: add `lib/recommendations.ts` implementing scoring & caching, and `app/api/stock/recommendations/route.ts` as the API surface.
- Models: add `user_activity` collection or `recentViews` field to user profile if needed. Keep schema optional.
- Frontend: add `components/Recommendations.tsx` and render on the root page or a new `recommendations` section.
- Tests: add unit tests for scoring (`lib/__tests__/recommendations.test.ts`) and integration tests for the API in `tests/database/__tests__/`.
- Observe existing project patterns (TypeScript, Zod for validation if present, existing auth middleware in `better-auth`).

## Acceptance criteria
- Authenticated user gets personalized recommendations based on their watchlist and recent views.
- Unauthenticated user gets popular picks.
- Recommendations endpoint responds within 200-500ms (with caching) in staging.
- Unit tests and integration tests are added and pass in CI.

## Future improvements
- Add collaborative filtering / ML models trained on anonymized activity
- Allow users to give feedback (thumbs up/down) to improve recommendations
- A/B testing and gradual rollouts

---

Implementation file checklist:
- `lib/recommendations.ts` ✅ (service + caching)
- `app/api/stock/recommendations/route.ts` ✅ (route + auth)
- `components/Recommendations.tsx` ✅ (UI + skeletons)
- `lib/__tests__/recommendations.test.ts` ✅ (unit tests)
- `tests/database/__tests__/recommendations.api.test.ts` ✅ (integration tests)
- `tests/database/__tests__/watchlist.recommendations.test.ts` ✅ (watchlist cache integration test)
- `docs/RECOMMENDATIONS.md` ✅ (this file)

## Implementation notes
- Implemented a simple deterministic hybrid recommender as an MVP (popularity + watchlist affinity).
- Caching: In-memory Map with short TTLs (1 min popular, 5 min personalized). Designed so swapping to Redis is straightforward (single cache layer change).
- Auth: Uses existing `better-auth` session via `auth.api.getSession`. Functions gracefully fall back when outside of Next request context (tests, background jobs).
- Watchlist hooks: After add/remove, recommendation cache for the user is cleared so recommendations reflect recent changes.
- Frontend: `components/Recommendations.tsx` fetches `/api/stock/recommendations` and displays a small list with `AddToWatchlistButton`.

---

If you'd like, I can now:
1. Swap the in-memory cache to Redis and wire env-based configuration
2. Add Playwright E2E tests for the recommendations UI
3. Add telemetry events (Inngest) for impressions and clicks

Pick the next item to prioritize.
