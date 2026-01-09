# Eiko Games - Architecture

**Last Updated:** 2025-01-08  
**Current Status:** Foundation complete, building core game loop

---

## Project Overview

Eiko Games is a cozy gaming platform focused on casual, accessible games. The first game is **Overlap** - a multiplayer party game where 2-4 players find creative connections between two topics.

**Philosophy:**
- Cozy and warm aesthetic (not flashy/competitive gaming vibes)
- Accessible to all ages and skill levels
- Social and collaborative gameplay
- TV + phone architecture for easy party setup

---

## Tech Stack

### Frontend
- **Framework:** SvelteKit (latest) with TypeScript
- **Styling:** Custom CSS (no framework)
- **Libraries:** 
  - `qrcode` - QR code generation for easy joining
  - `@supabase/supabase-js` - Database client
  - `@supabase/ssr` - Server-side rendering support

### Backend
- **Database:** Supabase (PostgreSQL)
- **API:** SvelteKit server endpoints
- **Authentication:** Session-based via localStorage (simple for MVP)

### Deployment
- **Hosting:** Netlify
- **Adapter:** `@sveltejs/adapter-netlify`
- **CI/CD:** Automatic deployments from main branch

### Development
- **Node Version:** 18+
- **Package Manager:** npm
- **TypeScript:** Strict mode enabled

---

## Project Structure

```
eiko-games/
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   ├── API_REFERENCE.md         # API documentation
│   └── OVERLAP_GAME_DESIGN.md   # Game-specific design doc
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client singleton
│   │   ├── utils.ts             # Shared utilities (room codes, etc)
│   │   └── types.ts             # TypeScript interfaces
│   └── routes/
│       ├── +page.svelte         # Landing page (game selection)
│       ├── overlap/             # Overlap game routes
│       │   ├── +page.svelte     # Game launch page
│       │   └── [roomId]/        # Dynamic room routes
│       │       ├── +page.svelte         # TV display
│       │       ├── join/+page.svelte    # Phone: name entry
│       │       └── play/+page.svelte    # Phone: controller
│       └── api/                 # API endpoints
│           └── overlap/
│               ├── create/+server.ts
│               └── [roomId]/
│                   ├── join/+server.ts
│                   ├── players/+server.ts
│                   ├── state/+server.ts
│                   └── ... (more endpoints as game develops)
├── static/                      # Static assets
├── supabase-schema.sql          # Database schema
├── .env.example                 # Environment variables template
└── README.md                    # Quick start guide
```

---

## Routing Architecture

### Multi-Game Structure

Eiko Games is designed to host multiple games. Each game has its own namespace:

```
/                           # Game selection landing
/overlap/                   # Overlap game landing
/[game-name]/               # Future game landings
```

### Overlap Game Routes

```
/overlap/                            # Game info + "Start New Game"
/overlap/[roomId]                    # TV display (passive, no auth)
/overlap/[roomId]/join               # Phone: name entry
/overlap/[roomId]/play               # Phone: controller (requires auth)

/api/overlap/create                  # POST: Create new game room
/api/overlap/[roomId]/join           # POST: Player joins game
/api/overlap/[roomId]/players        # GET: List players in room
/api/overlap/[roomId]/state          # GET: Current game state
/api/overlap/[roomId]/...            # Additional game-specific endpoints
```

**Design Decision:** Each game gets its own route namespace to keep code organized and allow independent development of different games.

---

## TV + Phone Architecture

### Core Concept

The game uses a **dual-screen architecture** where:
- **TV/Computer** = Passive display (no input needed)
- **Phones** = Active controllers (all input happens here)

This allows:
- Easy party setup (one person starts on TV, others join via QR)
- No need for multiple controllers or accounts
- Everyone can see the game state on the big screen
- Private input on personal devices

### Implementation

**TV Display (`/overlap/[roomId]`):**
- No authentication required
- Shows QR code for joining
- Displays game prompts, answers, results
- Polls for state changes every 2 seconds
- Pure presentation layer

**Phone Controller (`/overlap/[roomId]/play`):**
- Requires player session (stored in localStorage)
- Handles all user input (answers, votes)
- Shows personalized view (your score, your answer)
- Polls for state changes every 2 seconds
- Input layer

**Joining Flow:**
1. Host starts game on TV → generates room code
2. Players scan QR code with phones
3. Players enter name on phone
4. Session stored in localStorage
5. Redirect to controller view
6. Game auto-starts when 4 players join

---

## State Management

### Polling Strategy

**Why Polling Over WebSockets:**
- Simpler to implement and debug
- Adequate for 4-player games with 2-second intervals
- No connection management complexity
- Works reliably across all networks
- Can upgrade to Supabase Realtime later if needed

**Polling Intervals:**
- TV polls every 2 seconds for: player list, game state
- Phones poll every 2 seconds for: game state, current phase
- API responses are cached by Supabase for performance

### Session Management

**Player Sessions:**
- Stored in browser localStorage (not cookies)
- Keys used:
  - `eiko-player-id` - UUID from players table
  - `eiko-player-name` - Player's display name
  - `eiko-room-code` - Current room they're in

**Session Lifecycle:**
- Created on join
- Persists across refreshes
- Used to authenticate API requests
- Cleared when player explicitly leaves or starts new game

**Security Note:** Current implementation is simple for MVP. For production, consider:
- Short-lived session tokens
- Server-side session validation
- CSRF protection
- Rate limiting

---

## Database Schema

### Current Tables

#### `games`
Primary table tracking each game instance.

```sql
id              uuid PRIMARY KEY
room_code       text UNIQUE NOT NULL        -- 4-char code (e.g., "3K7M")
status          text NOT NULL               -- 'lobby' | 'playing' | 'finished'
current_round   integer NOT NULL DEFAULT 0
created_at      timestamp with time zone
```

**Indexes:**
- `games_room_code_idx` on `room_code` (for fast lookups)

#### `players`
Tracks players in each game.

```sql
id              uuid PRIMARY KEY
game_id         uuid REFERENCES games(id) ON DELETE CASCADE
player_name     text NOT NULL               -- Max 20 characters
join_order      integer NOT NULL            -- 1, 2, 3, or 4
score           integer NOT NULL DEFAULT 0
is_connected    boolean NOT NULL DEFAULT true
created_at      timestamp with time zone
```

**Indexes:**
- `players_game_id_idx` on `game_id` (for fast player list queries)

**Constraints:**
- Max 4 players per game (enforced in API)
- Player names max 20 characters (enforced in API and UI)

### Tables Needed (Not Yet Created)

#### `prompts`
Stores the two topics for each Venn diagram.

```sql
id              uuid PRIMARY KEY
topic1          text NOT NULL
topic2          text NOT NULL
difficulty      text                        -- 'easy' | 'medium' | 'hard'
created_at      timestamp with time zone
```

#### `game_rounds`
Tracks which prompt was used in each round.

```sql
id              uuid PRIMARY KEY
game_id         uuid REFERENCES games(id) ON DELETE CASCADE
round_number    integer NOT NULL
prompt_id       uuid REFERENCES prompts(id)
phase           text NOT NULL               -- 'answering' | 'voting' | 'results'
phase_started_at timestamp with time zone
created_at      timestamp with time zone
```

#### `answers`
Player submissions for each round.

```sql
id              uuid PRIMARY KEY
game_id         uuid REFERENCES games(id) ON DELETE CASCADE
round_number    integer NOT NULL
player_id       uuid REFERENCES players(id) ON DELETE CASCADE
answer_text     text NOT NULL               -- Max 50 characters
created_at      timestamp with time zone
```

#### `votes`
Tracks which answer each player voted for.

```sql
id                  uuid PRIMARY KEY
game_id             uuid REFERENCES games(id) ON DELETE CASCADE
round_number        integer NOT NULL
voter_id            uuid REFERENCES players(id) ON DELETE CASCADE
voted_for_answer_id uuid REFERENCES answers(id) ON DELETE CASCADE
created_at          timestamp with time zone
```

**Constraints to Add:**
- Players can't vote for their own answer
- Players can only vote once per round
- Voting only allowed during voting phase

---

## Design System

### Color Palette

**Primary Colors:**
```css
--bg-gradient-start: #ffecd2;  /* Warm peach */
--bg-gradient-end: #fcb69f;    /* Coral */
--primary: #ff6b6b;            /* Coral red - buttons, accents */
--primary-hover: #ff5252;      /* Darker coral on hover */
```

**Text Colors:**
```css
--text-primary: #2d1810;       /* Dark brown - headings */
--text-secondary: #5d3a2e;     /* Medium brown - body text */
--text-muted: #999999;         /* Gray - hints, disabled */
```

**Surface Colors:**
```css
--surface-light: rgba(255, 255, 255, 0.9);   /* Cards */
--surface-medium: rgba(255, 255, 255, 0.7);  /* Secondary cards */
--surface-translucent: rgba(255, 255, 255, 0.5); /* Overlays */
```

**Semantic Colors:**
```css
--success: #4caf50;            /* Green - game ready, correct */
--error: #c62828;              /* Red - errors */
--warning: #ff9800;            /* Orange - warnings */
```

### Typography

**Font Stack:**
```css
--font-display: 'Righteous', cursive;      /* Headings, logos */
--font-body: 'DM Sans', sans-serif;        /* Body text, UI */
```

**Type Scale:**
```css
/* Desktop */
--text-4xl: 4rem;      /* Page titles */
--text-3xl: 3rem;      /* Section headings */
--text-2xl: 2.5rem;    /* Card headings */
--text-xl: 1.5rem;     /* Subheadings */
--text-lg: 1.25rem;    /* Buttons, large text */
--text-base: 1.1rem;   /* Body text */
--text-sm: 0.95rem;    /* Small text */

/* Mobile - scale down appropriately */
```

### Spacing System

```css
--space-xs: 0.5rem;    /* 8px */
--space-sm: 1rem;      /* 16px */
--space-md: 2rem;      /* 32px */
--space-lg: 3rem;      /* 48px */
--space-xl: 4rem;      /* 64px */
```

### Border Radius

```css
--radius-sm: 10px;     /* Small elements */
--radius-md: 15px;     /* Inputs, small buttons */
--radius-lg: 20px;     /* Cards, sections */
--radius-xl: 30px;     /* Large cards */
--radius-full: 50px;   /* Buttons, badges, pills */
```

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-md: 0 8px 30px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.2);
```

### Animation Principles

**Duration:**
- Micro-interactions: 150-200ms (hovers, toggles)
- Standard transitions: 300ms (modals, dropdowns)
- Page transitions: 600-800ms (page loads, phase changes)

**Easing:**
- `ease-out` for entering animations
- `ease-in` for exiting animations
- `ease-in-out` for position changes

**Common Animations:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Game State Machine

### State Flow

```
LOBBY → ROUND_START → ANSWERING → VOTING → RESULTS
         ↑____________________________________________|
         (loop if more rounds remain)
         ↓
      GAME_OVER
```

### State Definitions

**LOBBY:**
- Waiting for 4 players to join
- Shows QR code and player list
- Auto-transitions to ROUND_START when full

**ROUND_START:**
- Brief transition screen
- Shows round number
- Duration: 3-5 seconds
- Loads next prompt

**ANSWERING:**
- Display prompt on TV and phones
- Players submit answers via phone
- Timer: 60 seconds
- Transitions when timer expires OR all players submit

**VOTING:**
- Display all answers anonymously
- Players vote for best answer via phone
- Can't vote for own answer
- Timer: 30 seconds
- Transitions when timer expires OR all players vote

**RESULTS:**
- Reveal who submitted each answer
- Show vote counts with animations
- Award points (1 point per vote)
- Show updated leaderboard
- Duration: 15-20 seconds
- Transitions to ROUND_START or GAME_OVER

**GAME_OVER:**
- Show final leaderboard
- Highlight winner
- Show fun stats
- "Play Again" option

### Implementation Notes

Track current state in either:
- `games.status` column (for game-level state)
- `game_rounds.phase` column (for round-level state)

Consider adding `phase_started_at` timestamp to calculate time remaining.

---

## Performance Considerations

### Database Queries

**Optimizations:**
- Indexes on frequently queried columns (room_code, game_id)
- Use `select('*')` sparingly - specify needed columns
- Batch queries where possible (fetch game + players in one query)
- Cache prompt list to avoid repeated DB hits

**Query Patterns:**
```typescript
// Good: Fetch only what you need
const { data } = await supabase
  .from('players')
  .select('id, player_name, score')
  .eq('game_id', gameId);

// Bad: Fetching everything
const { data } = await supabase
  .from('players')
  .select('*')
  .eq('game_id', gameId);
```

### Polling Performance

**Current Load:**
- 4 players × 1 poll/2s = 2 requests/second
- 1 TV × 2 polls/2s = 1 request/second
- Total: ~3 requests/second per game

**Scaling Considerations:**
- 10 concurrent games = 30 requests/second
- 100 concurrent games = 300 requests/second
- Supabase free tier handles this fine
- Consider caching API responses for 1 second

**Future Optimization:**
- Switch to Supabase Realtime for instant updates
- Implement proper WebSocket connections
- Add Redis cache for game state

### Asset Optimization

**Images:**
- Use WebP format with PNG fallbacks
- Lazy load images below fold
- Compress all images (TinyPNG, ImageOptim)

**Fonts:**
- Preload critical fonts
- Use font-display: swap
- Subset fonts to needed characters

**JavaScript:**
- Code splitting by route
- Lazy load game phases
- Tree shake unused libraries

---

## Security Considerations

### Current Security (MVP)

**What's Implemented:**
- Row Level Security (RLS) enabled on Supabase tables
- Basic input validation (name length, answer length)
- CORS configured for Netlify domain

**What's NOT Implemented (Yet):**
- ❌ Proper authentication/authorization
- ❌ Rate limiting on API endpoints
- ❌ CSRF protection
- ❌ Session expiration
- ❌ SQL injection prevention (Supabase handles this)

### Future Security Enhancements

**Before Production Launch:**
1. **Rate Limiting:** Limit API calls per IP/session
2. **Session Tokens:** Replace localStorage with secure tokens
3. **Input Sanitization:** Prevent XSS in user-submitted content
4. **RLS Policies:** Tighten Supabase policies to user-specific data
5. **HTTPS Only:** Enforce secure connections
6. **Content Security Policy:** Add CSP headers

### Data Privacy

**Current Approach:**
- No email or personal data collected
- Only player names (max 20 chars)
- No analytics or tracking (yet)
- Games auto-delete after 24 hours (to implement)

**GDPR Considerations:**
- No cookies (using localStorage)
- No persistent user accounts
- No tracking across sessions
- Clear data on game end

---

## Error Handling

### Client-Side

**Strategy:**
- Try-catch around all API calls
- Display user-friendly error messages
- Graceful degradation (show cached state if poll fails)
- Retry logic for transient failures

**Example:**
```typescript
try {
  const response = await fetch('/api/overlap/[roomId]/state');
  if (!response.ok) {
    throw new Error('Failed to fetch game state');
  }
  const data = await response.json();
  gameState = data;
} catch (error) {
  console.error('Error polling game state:', error);
  // Show last known state, retry on next interval
}
```

### Server-Side

**Strategy:**
- Validate all inputs
- Return appropriate HTTP status codes
- Log errors server-side (Netlify logs)
- Return structured error responses

**Error Response Format:**
```typescript
{
  error: string;           // User-friendly message
  code?: string;           // Machine-readable code
  details?: any;           // Additional context (dev only)
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid input)
- `404` - Resource not found
- `409` - Conflict (game full, already started)
- `500` - Server error

---

## Testing Strategy

### Manual Testing Checklist

**Room Creation:**
- [ ] Create game generates unique room code
- [ ] Room code is 4 characters
- [ ] Multiple rooms can exist simultaneously

**Joining:**
- [ ] QR code works on mobile devices
- [ ] Name validation works (empty, too long)
- [ ] Can't join full game (4/4)
- [ ] Can't join started game
- [ ] localStorage persists on refresh

**Multi-Device:**
- [ ] Test with 4 real devices
- [ ] All players see same game state
- [ ] No race conditions when submitting
- [ ] Polling stays in sync

**Edge Cases:**
- [ ] Player refreshes during game
- [ ] Player closes browser
- [ ] Network interruption
- [ ] Room code doesn't exist

### Automated Testing (Future)

**Unit Tests:**
- Utility functions (room code generation)
- Scoring calculations
- Input validation

**Integration Tests:**
- API endpoint behavior
- Database queries
- Session management

**E2E Tests:**
- Full game flow with Playwright
- Multi-user scenarios
- Mobile device testing

---

## Deployment

### Netlify Configuration

**Environment Variables:**
```
PUBLIC_SUPABASE_URL=https://[project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `build`
- Node version: 18

**Netlify Functions:**
- Not currently used (using SvelteKit API routes)
- Available if needed for background jobs

### Deployment Checklist

**Pre-Deploy:**
- [ ] Run `npm run build` locally
- [ ] Test production build locally
- [ ] Check environment variables set in Netlify
- [ ] Verify Supabase connection

**Post-Deploy:**
- [ ] Test on actual devices
- [ ] Verify QR codes work
- [ ] Check all routes load
- [ ] Monitor Netlify logs for errors

### Monitoring

**Current:**
- Netlify deploy logs
- Supabase dashboard (query performance)
- Browser console errors (manual)

**Future:**
- Error tracking (Sentry)
- Analytics (privacy-focused)
- Performance monitoring (Lighthouse CI)
- Uptime monitoring

---

## Future Architecture Considerations

### Scalability

**When to Upgrade:**
- More than 100 concurrent games
- Need for real-time updates (< 1s latency)
- Multiple game types with complex state

**Potential Upgrades:**
- Supabase Realtime instead of polling
- Redis for game state caching
- WebSocket connections for instant updates
- Separate game server (Node.js/Deno)

### Multi-Game Platform

**Shared Infrastructure:**
- Common authentication system
- Shared player profiles (optional)
- Cross-game leaderboards
- Unified design system

**Game-Specific:**
- Each game has own routes
- Each game has own database tables
- Shared utilities and components

### Mobile Apps

**Considerations:**
- PWA first (installable web app)
- Native apps later (Capacitor/React Native)
- Share API with web version
- Offline support for single-player games

---

## Maintenance

### Database Cleanup

**Implement:**
- Daily job to delete games older than 24 hours
- Delete orphaned players
- Archive completed games (optional)

**Supabase Cron Job:**
```sql
-- Run daily at 3 AM
DELETE FROM games 
WHERE created_at < NOW() - INTERVAL '24 hours'
AND status = 'finished';
```

### Monitoring Checklist

**Weekly:**
- Check Netlify deploy status
- Review Supabase storage usage
- Check for errors in logs

**Monthly:**
- Review database performance
- Check for slow queries
- Update dependencies
- Review user feedback

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials

# Run development server
npm run dev

# Open in browser
open http://localhost:5173
```

### Git Workflow

**Branches:**
- `main` - Production (auto-deploys to Netlify)
- `develop` - Integration branch
- `feature/*` - Feature branches

**Commit Messages:**
```
feat: add answer submission phase
fix: resolve QR code rendering issue
docs: update API reference
chore: update dependencies
```

### Code Review Checklist

- [ ] Code follows design system
- [ ] TypeScript types are correct
- [ ] Error handling implemented
- [ ] No console.logs in production code
- [ ] Database queries are optimized
- [ ] Mobile responsive
- [ ] Documentation updated

---

## Key Architectural Decisions

### Why SvelteKit?
- Modern, fast, great DX
- Built-in SSR and API routes
- Smaller bundle size than React/Vue
- Easy to learn for team

### Why Supabase?
- PostgreSQL (familiar, powerful)
- Real-time capabilities (future)
- Row Level Security built-in
- Great developer experience
- Generous free tier

### Why Polling Over WebSockets?
- Simpler to implement and maintain
- Adequate for current scale (4 players)
- No connection management overhead
- Can upgrade to Supabase Realtime later

### Why localStorage Over Cookies?
- Simpler implementation (no server config)
- No cookie banner needed (GDPR)
- Client-side only (no server sessions)
- Good enough for MVP scope

### Why TV + Phone Architecture?
- Natural party game setup
- No controller pairing needed
- Everyone sees results together
- Private input on personal devices
- Accessible (everyone has a phone)

---

## Questions & Answers

**Q: Why not use a state management library (Redux, Zustand)?**  
A: Current state is simple enough (fetched from API). Adding a state library would be premature optimization. Re-evaluate if state management becomes complex.

**Q: Why not use a UI component library (Material-UI, Chakra)?**  
A: Custom design system is core to Eiko Games identity. Pre-built components would dilute the "cozy" aesthetic.

**Q: Why not use Tailwind CSS?**  
A: Considered, but wanted full control over design tokens and avoiding utility class bloat. CSS custom properties + scoped styles work well for this project.

**Q: Will this scale to 1000 concurrent games?**  
A: Current architecture can handle 100-200 concurrent games. For 1000+, need caching layer (Redis), real-time updates (WebSockets), and possibly separate game servers.

**Q: Why not use TypeScript interfaces more extensively?**  
A: Should be added! Create `src/lib/types.ts` with interfaces for Game, Player, Prompt, Answer, Vote, etc.

---

**Next Steps:** See [API_REFERENCE.md](./API_REFERENCE.md) for detailed API documentation.