# Carancho

Carancho is a Payload CMS + Next.js storefront with a custom admin dashboard for fishing, camping, and home products.

## Current Routes

- Storefront:
  - `/`
  - `/productos`
  - `/productos/[slug]`
- Custom admin:
  - `/admin/login`
  - `/admin`
  - `/admin/productos`
  - `/admin/productos/nuevo`
  - `/admin/productos/[id]`
- Native Payload admin:
  - `/payload-admin`

## Stack

- Next.js 16
- Payload CMS 3
- PostgreSQL via `@payloadcms/db-postgres`
- Tailwind CSS 4
- TanStack Query
- React Hook Form + Zod

## Local Development

1. Copy env vars:

```bash
cp .env.example .env
```

2. Set the required values in `.env`.

Current local setup expects:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/carancho
PAYLOAD_SECRET=your-secret
```

3. Install dependencies:

```bash
yarn install
```

4. Start the app:

```bash
yarn dev
```

5. Open:

- `http://localhost:3000`

## Useful Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
yarn generate:types
yarn generate:importmap
yarn test
yarn test:int
yarn test:e2e
```

## Project Structure

```text
src/
├── app/
│   ├── (frontend)/                # Storefront and custom admin routes
│   └── (payload)/                 # Payload routes and native admin mount
├── access/                        # Access control helpers
├── collections/                   # Payload collections
├── components/
│   ├── admin/                     # Custom dashboard UI
│   └── store/                     # Storefront UI
├── hooks/                         # Query hooks for admin data
├── lib/                           # Payload client, storefront queries, helpers
├── providers/                     # Auth and query providers
├── services/                      # REST client for custom admin
└── payload.config.ts
```

## Storefront Data Behavior

The storefront reads from Payload through `src/lib/store.ts`.

If the CMS has no catalog data yet, the storefront falls back to preview content from `src/lib/storePreview.ts` so the main pages still render with realistic cards and layouts. This is only a presentation fallback for local/demo use.

## Validation

After code changes, run:

```bash
npx tsc --noEmit
```

When modifying Payload schemas or admin component paths, also run:

```bash
yarn generate:types
yarn generate:importmap
```

## Notes

- Local visual references and agent-specific context files are intentionally excluded from version control.
- Storefront demo assets that should ship with the app live under `public/images/`.
