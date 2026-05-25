# Buyer Marketplace — 4-Step Implementation Plan

## Background

Kropigo is a monorepo (pnpm workspaces) with:
- **Server**: Express + MongoDB (Mongoose), JWT auth via httpOnly cookie
- **Web**: Next.js 15 App Router, RTK Query, Tailwind-like utility classes, `font-serif`/`font-sans` design language, dark-mode via `ThemeProvider`
- **Auth**: `RoleGuard` wraps kisan pages; buyer pages will need a parallel `buyer` layout
- **Existing APIs**: `GET /listings` and `GET /listings/:id` are **public** (no auth needed). Interest CRUD endpoints exist for kisan only.

The Interest model (`pending | accepted | rejected | withdrawn`) and `listing.controller.ts` are already wired up. What's **missing** is the buyer-facing UI surface and the server-side interest submission endpoint.

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Buyer layout**: Should `/buyer/*` share the same sidebar/bottom-nav shell as `/kisan/*`, or get its own layout with different nav links (Marketplace, My Interests, Profile)?

> [!IMPORTANT]
> **Q2 — Auth gate for marketplace**: The spec says "no auth needed to browse" `/buyer/marketplace`. Should unauthenticated users see the listing grid but hit a login wall only when they click "Express Interest"? Or should `/buyer/marketplace` itself be behind auth (so we can pre-populate the interest form with buyer info)?

> [!IMPORTANT]
> **Q3 — Withdraw interest**: The `withdrawn` state is shown in Step 3. Should buyers be able to withdraw a **pending** interest themselves, or is "withdrawn" only set server-side (e.g. when a listing is deleted)?

> [!IMPORTANT]
> **Q4 — Mandi rate on listing detail**: The `MandiRate` model stores `minPrice`, `maxPrice`, `modalPrice` per crop. Should the comparison show only the **latest** rate, or a mini chart/table of recent rates?

---

## Proposed Changes

---

### 1. Server — Interest Submission & Buyer Endpoints

#### [MODIFY] [listing.routes.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/server/src/routes/listing.routes.ts)

Add two new buyer-facing routes:
```
POST   /listings/:id/interests          → submitInterest   (auth + requireRole('buyer'))
DELETE /listings/:id/interests/:intId   → withdrawInterest (auth + requireRole('buyer'))
GET    /interests/my                    → getMyInterests   (auth + requireRole('buyer'))
```

Note: `GET /interests/my` lives on a new `/interests` router prefix to keep listing routes clean.

#### [MODIFY] [listing.controller.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/server/src/controllers/listing.controller.ts)

Add **`submitInterest`**:
- `POST /listings/:id/interests` — body: `{ price, quantity?, notes? }`
- Validates listing is `open` or `interest_received`
- Prevents duplicate pending interest from same buyer (upsert or 409)
- Increments `listing.interestedBuyerCount`, sets status → `interest_received`
- Returns created interest

Add **`withdrawInterest`**:
- `DELETE /listings/:id/interests/:intId` — buyer can only withdraw their own pending interest
- Sets `interest.status = 'withdrawn'`
- Decrements `listing.interestedBuyerCount` if > 0
- If no other pending interests remain, revert listing status → `open`

#### [NEW] [interest.routes.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/server/src/routes/interest.routes.ts)

```
GET /interests/my   → getMyInterests (auth + requireRole('buyer'))
```
- Paginates by `buyerId`, supports `?status=pending|accepted|rejected|withdrawn`
- Populates `listingId` (crop name, asking price, status, mediaUrls[0]) and `listingId.sellerId` (name)

#### [NEW] [interest.controller.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/server/src/controllers/interest.controller.ts)

Contains `getMyInterests` (moved out of listing controller for clean separation).

#### [MODIFY] [index.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/server/src/index.ts)

Mount:
```ts
import interestRoutes from './routes/interest.routes';
app.use('/api/v1/interests', interestRoutes);
```

---

### 2. Web — RTK Query API Layer

#### [MODIFY] [listingsApi.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/web/src/store/endpoints/listingsApi.ts)

Add buyer interest mutations:
```ts
submitInterest(listingId, { price, quantity?, notes? })   // POST
withdrawInterest({ listingId, interestId })               // DELETE
getMyInterestForListing(listingId)                        // GET /listings/:id/interests/mine
```

> Note: We need a lightweight `GET /listings/:id/interests/mine` endpoint (returns the buyer's single interest for a listing) so the listing detail page can show the correct state panel without fetching all interests.

#### [NEW] [interestsApi.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/web/src/store/endpoints/interestsApi.ts)

```ts
getMyInterests({ status?, page?, limit? })  // GET /interests/my
```

Tag type `'Interest'` added to `baseApi.ts`.

#### [MODIFY] [baseApi.ts](file:///c:/KAAMKAAJ/Freelance/Kropigo-3/apps/web/src/store/baseApi.ts)

Add `'Interest'` to `tagTypes`.

---

### 3. Web — Buyer Layout & Route Shell

#### [NEW] buyer layout — `apps/web/src/app/(dashboard)/buyer/layout.tsx`

Mirrors kisan layout structure:
- `RoleGuard allowedRoles={['buyer']}`
- Sticky sidebar (desktop) / bottom nav (mobile) with links:
  - 🏪 Marketplace → `/buyer/marketplace`
  - 📋 My Interests → `/buyer/interests`
  - 👤 Profile → `/buyer/profile`
- Same design tokens (stone palette, green accent, serif/sans fonts, dark mode)

---

### 4. Step 1 — Marketplace Browse Page

#### [NEW] `apps/web/src/app/(dashboard)/buyer/marketplace/page.tsx`

**No auth guard** — page renders even if unauthenticated (listing grid is public).

Layout:
```
┌─────────────────────────────────────────────────────┐
│  Header: "Marketplace"  +  search bar               │
├────────────────┬────────────────────────────────────┤
│  Filter Panel  │  Crop Card Grid (2-3 cols)          │
│  ─ Crop type   │  ┌──────────┐  ┌──────────┐        │
│  ─ State       │  │ img      │  │ img      │        │
│  ─ District    │  │ crop name│  │ crop name│        │
│  ─ Price range │  │ ₹ / unit │  │ ₹ / unit │        │
│  ─ Sort        │  │ qty • loc│  │ qty • loc│        │
│                │  └──────────┘  └──────────┘        │
│                │                                    │
│                │  Pagination                         │
└────────────────┴────────────────────────────────────┘
```

Each **Crop Card** shows:
- Thumbnail (`mediaUrls[0]`) with fallback icon
- Crop name + category badge
- Asking price (bold) + unit
- Quantity available
- Location (district, state)
- Kisan verification badge (if `sellerId.isVerified`)
- Days until expiry (if `expiresAt` within 3 days → amber warning)
- Link → `/buyer/marketplace/[id]`

Filters (left sidebar / top sheet on mobile):
| Filter | Input Type | API Param |
|--------|-----------|-----------|
| Crop | Searchable dropdown (uses `useGetCropsQuery`) | `cropId` |
| State | Text/select | `state` |
| District | Text | `district` |
| Min Price | Number input | `minPrice` |
| Max Price | Number input | `maxPrice` |
| Sort | Select (newest / price ↑ / price ↓) | `sort` |

Pagination: Page X of Y, Prev/Next (reuses existing `meta` from `getListings`).

---

### 5. Step 2 — Listing Detail Page

#### [NEW] `apps/web/src/app/(dashboard)/buyer/marketplace/[id]/page.tsx`

Sections (in order):
1. **Photo Carousel** — main image + dot/thumbnail strip (max 6 images), swipe on mobile
2. **Header** — crop name + category, listing status badge, view count, listed date
3. **Pricing & Quantity** — asking price / unit, quantity available
4. **Kisan Profile Card** — avatar initials, name, location, verification badge, star rating
5. **Mandi Rate Comparison** — calls `GET /mandi-rates/:cropId`, shows latest rate range vs asking price, simple visual diff (e.g. "₹200 below market" or "₹50 above market")
6. **Express Interest Panel** — see Step 3

---

### 6. Step 3 — Interest Status States (Express Interest Panel)

The panel at the bottom of the listing detail page adapts based on the buyer's current interest state for that listing.

| State | Panel UI |
|-------|---------|
| **No interest yet** | Form: offered price (number), quantity (number, optional), notes (textarea). CTA: "Express Interest" button |
| **Pending** | Read-only summary card showing submitted price + qty. "Withdraw Interest" ghost button. Amber badge "Awaiting seller response" |
| **Accepted** | Green success banner. Seller contact info revealed (phone number from `sellerId.phone`). Confetti/celebration micro-animation |
| **Rejected** | Muted red info: "Seller has declined your offer." Option to re-submit a new interest at a different price |
| **Withdrawn** | Muted grey info: "You withdrew this interest." Option to re-submit |

The panel must load the buyer's existing interest first (via `getMyInterestForListing`). Show skeleton while loading.

---

### 7. Step 4 — My Interests Page

#### [NEW] `apps/web/src/app/(dashboard)/buyer/interests/page.tsx`

Layout:
```
┌───────────────────────────────────────────────────┐
│  My Interests                    [Status Filter ▾] │
├───────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │ [thumb] Wheat        Pending  ↗ View Listing  │ │
│  │         ₹1800/q · 50q        Submitted 2d ago │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ [thumb] Rice         Accepted ↗ View Listing  │ │
│  │         ₹2100/q · 20q        Accepted 1d ago  │ │
│  └───────────────────────────────────────────────┘ │
│  ...                                               │
│  Pagination                                        │
└───────────────────────────────────────────────────┘
```

Each card shows:
- Listing thumbnail (`listingId.mediaUrls[0]`)
- Crop name (`listingId.cropId.name`)
- Buyer's offered price + quantity
- Status badge (colour-coded: amber=pending, green=accepted, red=rejected, grey=withdrawn)
- "View Listing" link → `/buyer/marketplace/[listingId._id]`
- Date submitted / date resolved

Filter tabs: All | Pending | Accepted | Rejected | Withdrawn

Empty state for each filter (with relevant copy).

---

### 8. Supporting Server Changes

#### `GET /listings/:id/interests/mine`

A new lightweight endpoint: returns the **authenticated buyer's** single interest for a given listing (or `null`). This avoids fetching all interests (which is kisan-only) just to know the buyer's current state.

```
GET /listings/:id/interests/mine  (authenticate + requireRole('buyer'))
Response: { success: true, data: IInterest | null }
```

---

## File Change Summary

### New Files
| Path | Purpose |
|------|---------|
| `apps/server/src/controllers/interest.controller.ts` | `getMyInterests`, `submitInterest`, `withdrawInterest` |
| `apps/server/src/routes/interest.routes.ts` | `/interests/my` route |
| `apps/web/src/app/(dashboard)/buyer/layout.tsx` | Buyer nav shell with RoleGuard |
| `apps/web/src/app/(dashboard)/buyer/marketplace/page.tsx` | Step 1: Browse grid |
| `apps/web/src/app/(dashboard)/buyer/marketplace/[id]/page.tsx` | Steps 2 & 3: Detail + interest panel |
| `apps/web/src/app/(dashboard)/buyer/interests/page.tsx` | Step 4: My Interests |
| `apps/web/src/store/endpoints/interestsApi.ts` | RTK Query for `/interests/my` |

### Modified Files
| Path | Change |
|------|--------|
| `apps/server/src/routes/listing.routes.ts` | Add `POST /:id/interests`, `DELETE /:id/interests/:intId`, `GET /:id/interests/mine` |
| `apps/server/src/controllers/listing.controller.ts` | Add `submitInterest`, `withdrawInterest`, `getMyInterestForListing` |
| `apps/server/src/index.ts` | Mount `/api/v1/interests` router |
| `apps/web/src/store/baseApi.ts` | Add `'Interest'` to `tagTypes` |
| `apps/web/src/store/endpoints/listingsApi.ts` | Add `submitInterest`, `withdrawInterest`, `getMyInterestForListing` hooks |

---

## Verification Plan

### Server
- `POST /listings/:id/interests` with buyer cookie → 201, interest created
- `POST /listings/:id/interests` with kisan cookie → 403
- Duplicate submission → 409 (or idempotent upsert)
- `DELETE /listings/:id/interests/:intId` on accepted interest → 400 (can't withdraw non-pending)
- `GET /interests/my?status=pending` → returns only buyer's pending interests

### Frontend
- Unauthenticated user can reach `/buyer/marketplace` and browse listings
- Auth wall appears only on "Express Interest" click if not logged in
- Buyer submits interest → panel switches to Pending state immediately (optimistic or refetch)
- Seller accepts → buyer's panel shows Accepted state with phone revealed
- `/buyer/interests` shows all 4 status types, filter tabs work
- Pagination works on both marketplace and interests page
- Mobile bottom nav + responsive card layout verified at 375px
