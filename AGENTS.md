# Repository Guidelines

## Project Structure & Module Organization
- Next.js app in `src/` with the homepage in `src/app/page.tsx` and global layout in `src/app/layout.tsx`.
- Core UI components: `src/components/HairTryOn` (upload → generate → compare → book), `src/components/Gallery` (curated inspiration), `src/components/Booking` (modal form).
- API: `src/pages/api/try-on.ts` sends model + selfie to Gemini and returns a base64 PNG.
- Helpers: `src/lib/rules.ts` holds keyword → service recommendations (not yet wired to UI).
- Assets live in `public/`. Env config lives in `.env.local` at the repo root.

## Build, Test, and Development Commands
- `npm run dev` — start Next.js dev server.
- `npm run build` — production build.
- `npm run start` — run the built app.
- `npm run lint` — ESLint checks.
- `npm run prisma:generate` — generate Prisma client.
- `npm run prisma:migrate` — run a dev migration (sqlite by default).
- `npm run prisma:seed` — seed availability (Tue–Fri 09–19, Sat 09–16) into the DB.

## Current AI Try-On Setup
- Default model: `gemini-3-pro-image-preview` (override via `GEMINI_MODEL` env or `model` field in the request).
- Request payload: JSON with `modelImage` and `selfieImage` as base64 data URLs (optional `prompt`/`model`).
- Prompt enforces: copy hairstyle from reference, keep face/skin/background unchanged, clean noisy selfies.
- Response: `{ outputImage: "<base64>" }` (PNG). Server logs output byte length for debugging.
- Environment: `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) in `.env.local` at repo root; restart `npm run dev` after changes.
- Current behavior is stable end-to-end (upload → Gemini → base64 PNG → before/after UI).

## Coding Style & Naming Conventions
- TypeScript + React; functional components with hooks.
- Tailwind utilities for layout/styling; keep design intentional but lean.
- camelCase for variables/functions, PascalCase for components. Stick to ASCII.
- Run `npm run lint` before sharing changes.

## Testing Guidelines
- No automated tests yet. Manually verify `/api/try-on` via `npm run dev` and browser Network tab.
- When adding tests, place them under `__tests__/` or co-locate with code.

## Commit & Pull Request Guidelines
- Use clear, scoped commit messages (e.g., “Refine try-on prompt handling”).
- PRs: include what changed, how to test, and screenshots/GIFs for UI updates when possible.

## Security & Configuration Tips
- Set `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) in `.env.local`; never commit secrets.
- Restart `npm run dev` after updating env vars.
- DB scaffold: Prisma + sqlite. Add `DATABASE_URL="file:./dev.db"` (or your Postgres URL) to `.env.local`, then run `npm run prisma:migrate` and `npm run prisma:generate`.
- Admin token: set `ADMIN_TOKEN` in `.env.local` (and prod) for protected admin endpoints.
- New APIs:
  - `/api/bookings` (GET/POST/PATCH/DELETE). GET/PATCH/DELETE require `ADMIN_TOKEN` via `x-admin-token` or Bearer. POST is public for client bookings.
  - `/api/availability` (GET/POST/DELETE). GET returns slots for next 7 days. POST/DELETE require `ADMIN_TOKEN` to manage rules/blackouts.
  - Debug admin read-only: `/api/debug/availability-rules`, `/api/debug/blackouts` (require `ADMIN_TOKEN`).
- Ideal flow: upload previews to storage and store URLs in bookings; `previewUrl` is optional for now.
