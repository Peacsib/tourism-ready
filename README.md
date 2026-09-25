# Tourism Workforce 2031

AI-powered workforce readiness ecosystem for Zimbabwe's tourism and hospitality sector, built around **Learn → Practise → Prove → Connect → Discover**. Nyanzvi is the AI assistant layer that works alongside every module.

## Stack
- TanStack Start (React 19, Vite 7), Tailwind CSS v4
- Lovable Cloud (Postgres, auth, storage, realtime) with row-level security
- OpenAI streaming chat (`/api/chat`), Enrich professional discovery, LinkedIn connector (admin only)

## Modules
| Module | Source of truth |
| --- | --- |
| Network | `profiles`, `connections`, `posts`, `post_likes`, `post_comments`, `direct_messages`, `notifications` |
| Opportunities | `jobs`, `job_applications` |
| Skills Passport | `user_competencies`, `user_timeline` |
| Simulations | `sim_attempts` (scenarios defined in `src/lib/data.ts`) |
| Industry Discovery | `external_professionals`, `discovery_cache`, `discovery_invitations` |
| Roles | `user_roles` + `has_role()` |
| Learning, Hubs, Intelligence | curated catalogue in `src/lib/data.ts` (to be moved to the database) |

## Database
All schema, policies, functions and triggers live in `drizzle/migrations/` (applied in order, `0000` → latest). No seed data ships to production — empty sections show empty states.

Storage bucket: `post-images` (private, 5 MB).

## Secrets (server-only)
`OPENAI_API_KEY`, `ENRICH_API_KEY`, `LOVABLE_API_KEY`, connector-managed `LINKEDIN_API_KEY` / `APOLLO_API_KEY`. None are exposed to the browser.

## SEO
Public: `/` (indexed, listed in `public/sitemap.xml`). Private: `/app`, `/auth`, `/start`, `/api` — `noindex` and disallowed in `public/robots.txt`. Update the sitemap/robots domain after publishing to a custom domain.

## Development
```sh
bun install
bun run dev
```
