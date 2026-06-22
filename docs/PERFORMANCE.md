# Performance notes (internal CRM)

This app is an internal dashboard — SEO and static generation are not goals. Responsiveness for day-to-day actions (notes, status changes, file uploads) is.

## Environment

| Factor | Impact | Recommendation |
|--------|--------|----------------|
| **Supabase free tier** | Project auto-pauses after inactivity; first request after idle can take **5–15+ seconds** (cold start + wake). Every HTTP round-trip adds latency. | For production use a **paid** project in an **EU region** close to users (UA/PL). Disable auto-pause. |
| **`next dev`** | First hit to a route/server action compiles on demand (often **seconds**). Not representative of production. | Measure with `npm run build && npm start`, or compare the **second** save after warm-up. |
| **Network to Supabase** | Each `auth.getUser()` was a round-trip to Auth API; each DB query is another round-trip. | Prefer local JWT verification (`getClaims`) and batch/parallel queries. |

## What we optimized in code

1. **Local JWT verification** — `resolveVerifiedUser()` uses `auth.getClaims()` (local) with `getUser()` fallback ([`src/lib/supabase/session-user.ts`](../src/lib/supabase/session-user.ts)).
2. **Scoped cache invalidation** — mutations use `revalidateTag` for list/dashboard only when needed; plain notes invalidate **nothing** ([`src/lib/cache-tags.ts`](../src/lib/cache-tags.ts)).
3. **Lean mutation snapshots** — `finishLeadMutation` skips attachment signing unless uploading files; client preserves existing signed URLs ([`src/lib/lead-mutations.ts`](../src/lib/lead-mutations.ts)).
4. **Optimistic notes** — note composer updates timeline immediately ([`src/components/customer/lead-activity-composer.tsx`](../src/components/customer/lead-activity-composer.tsx)).
5. **Middleware** — skips profile/membership queries when `kolss_locale` cookie is already set.
6. **Shared Supabase client** — `createClient` is wrapped in React `cache()` per request.

## Measuring locally

In development, server timings log automatically:

```
[perf] auth.getSessionContext: 12ms
[perf] saveLeadActivity: 340ms
[perf] getLeadPageData: 180ms
[perf] finishLeadMutation: 195ms
```

Enable in production builds with `CRM_PERF_TIMING=1`.

## Supabase JWT signing keys

For fully local `getClaims()` (no network fallback), enable **asymmetric JWT signing keys** in Supabase Dashboard → Project Settings → API → JWT Settings. Legacy HS256 shared-secret tokens still work via `getUser()` fallback but add latency.

## Expected note-save path (after warm-up)

| Step | Before | After (target) |
|------|--------|----------------|
| Auth | Network `getUser` | Local `getClaims` |
| Cache revalidation | `revalidatePath` leads + dashboard | None for plain note |
| Post-mutation fetch | 9 queries + N signed URLs | 8 queries, no attachments |
| UI feedback | After full round-trip | Optimistic immediately |

Typical warm production target: **under 1–2s** on paid EU Supabase; dev + free tier can still spike on cold start.
