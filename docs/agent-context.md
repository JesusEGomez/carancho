# Carancho Agent Context

## Vision

Carancho is a Payload CMS + Next.js commerce experience for fishing, camping, and home products. The current implementation replaces the blank Payload template with a branded storefront and a custom commercial dashboard.

## Current Scope

- Public storefront:
  - `/` branded home page aligned to the reference mockup
  - `/productos` catalog page with sidebar filters and product grid
  - `/productos/[slug]` product detail page with gallery, specs, and related items
- Custom admin dashboard:
  - `/admin/login` custom login screen
  - `/admin` commercial dashboard overview
  - `/admin/categorias` category management table with parent/subcategory hierarchy
  - `/admin/categorias/nueva` category creation form
  - `/admin/categorias/[id]` category editing form
  - `/admin/contacto` footer contact management form
  - `/admin/productos` inventory table
  - `/admin/productos/nuevo` product creation form with dependent category/subcategory selection, inline subcategory creation, featured image, gallery uploads, and optional product sections
  - `/admin/productos/[id]` product editing form with gallery management and persisted section visibility toggles
- Payload native admin:
  - `/payload-admin` remains available as the technical backoffice

## Architecture Decisions

- Tailwind CSS is the primary styling layer for all storefront and dashboard UI.
- Yarn remains the expected package manager for scripts and local development.
- Payload is the source of truth for users, categories, products, and media.
- Categories now support a single parent/child hierarchy level so storefront filtering and admin assignment can distinguish principal categories from subcategories.
- Categories now also expose a dedicated navigation flag so only selected principal categories appear in the storefront header and footer.
- The custom dashboard is built in frontend routes under `src/app/(frontend)/(admin)/admin`.
- Admin auth is handled in the frontend through a local `AuthProvider` plus route guarding in `AdminLayoutClient`.
- Admin data fetching uses TanStack Query and REST requests against Payload endpoints.
- Admin data fetching uses TanStack Query over a shared Axios client for authenticated REST requests against Payload endpoints.
- Admin forms use React Hook Form with Zod validation.
- Admin forms now share lightweight reusable field primitives under `src/components/admin/` so validation and styling stay aligned across screens.
- The native Payload admin route was moved from `/admin` to `/payload-admin`.
- Media uploads are intended to use Vercel Blob in hosted environments when `BLOB_READ_WRITE_TOKEN` is present.
- Media uploads in the custom admin now post directly to Payload's `/api/media` endpoint and rely on the configured storage adapter to place files in Vercel Blob on hosted environments.
- The build pipeline now runs `payload migrate` before `next build` when `DATABASE_URL` is available so Vercel preview and dev deployments stay aligned with the current schema.
- The seed script is now restricted to local development databases by default and is blocked on Vercel / CI unless an explicit force flag is provided.

## Data and Runtime Behavior

- Collections currently in use:
  - `users`
  - `categories`
  - `products`
  - `media`
  - `store-contacts`
  - `orders`
- The storefront reads from Payload through `src/lib/store.ts`.
- The storefront now includes a client-side cart persisted in `localStorage`, a guest-first checkout flow, and a confirmation screen backed by the `orders` collection.
- Orders are created through an internal checkout endpoint that recalculates prices and availability from Payload before persisting.
- The custom admin now includes a minimal `/admin/ordenes` module for operational review of guest checkout orders.
- Storefront header and footer navigation now read from categories explicitly marked for navigation instead of hardcoded links.
- Storefront category filtering now treats parent categories as umbrellas that include products assigned directly to the parent plus any of its child subcategories.
- Product detail visibility for technical specifications and general features is now controlled by persisted booleans on each product, with legacy products auto-enabled when they already contain data.
- To avoid empty demo states while the CMS has no seed data, the storefront falls back to preview content from `src/lib/storePreview.ts`.
- The preview layer is temporary presentation data only; Payload remains the intended production data source.
- A reusable seed script now exists at `scripts/seed.ts` to populate a baseline admin user plus catalog data in Postgres-backed environments.

## UI Direction

- Reference designs live in `design/`.
- The implemented UI follows those mockups closely in structure, spacing, and color language.
- The storefront home hero now uses a local editorial lake landscape asset under `public/images/heroes/` with a dark overlay for contrast.
- The visual system is based on:
  - bright orange primary actions
  - yellow accents
  - white cards with soft shadows
  - dark blue footer and hero sections
- Shared storefront primitives live in:
  - `src/components/store/StoreHeader.tsx`
  - `src/components/store/StoreFooter.tsx`
  - `src/components/store/ProductCard.tsx`
  - `src/components/store/StoreMedia.tsx`

## Known Gaps

- The storefront still uses gradient placeholders for preview cards and category imagery when real media is not loaded in Payload.
- The home hero image is currently a local frontend asset, not a managed Payload media entry yet.
- The custom admin dashboard is visually aligned to the design, but the best validation still requires a real admin user and seeded catalog data.
- The dashboard shell depends on client auth hydration; if auth is missing or invalid it redirects to `/admin/login`.

## Verification Expectations

- After code changes, validate TypeScript with `npx tsc --noEmit`.
- After schema/component path changes, regenerate Payload artifacts as needed:
  - `yarn generate:types`
  - `yarn generate:importmap`
- Use Playwright to visually verify the key routes when working on UI:
  - `/`
  - `/productos`
  - `/productos/[slug]`
  - `/admin/login`

## Out of Scope For Now

- Mercado Pago integration and payment processing
- Customer account area
- Automated shipping cost calculation
- Advanced admin modules beyond inventory, category/product operations, and basic order review

## Immediate Next Steps

1. Integrate Mercado Pago on top of the existing local order pipeline without reworking cart or order persistence.
2. Validate the authenticated dashboard flow end to end with a real admin session.
3. Replace demo-only merchandising values in the dashboard stats with live business metrics or clearly labeled placeholders.
4. Expand tests to cover cart, checkout, and order administration flows.
