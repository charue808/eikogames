# Eiko Games

Cozy gaming platform. First game: **Overlap** (Venn diagram party game).

## Tech Stack
- SvelteKit
- Supabase (auth, realtime, database)
- Netlify (hosting)
- TypeScript

## Commands
```bash
npm run dev          # Local dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Svelte type checking
npm run lint         # ESLint
```

## Documentation
- **Architecture decisions**: see `docs/architecture/` before making structural changes
- **Game rules & mechanics**: see `docs/game/` when implementing Overlap gameplay, round logic, or scoring
- **API reference**: see `docs/api/` for Supabase schema, endpoints, and realtime subscriptions

## Project Structure
```
src/
├── lib/           # Shared utilities, stores, Supabase client
├── routes/        # SvelteKit pages and API routes
└── components/    # Reusable UI components
```

## Conventions
- Use TypeScript strict mode
- Prefer Svelte stores for shared state
- Supabase realtime for multiplayer sync
- Mobile-first responsive design

## Before You Code
- For new features, check `docs/architecture/` for existing patterns
- For game logic changes, verify against `docs/game/` rules documentation
- Run `npm run check` before committing