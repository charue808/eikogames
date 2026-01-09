# Overlap Game - Development Context

## Project Overview
Eiko Games is a cozy gaming platform. The first game is "Overlap" - a party game where 2-4 players find creative connections between two topics displayed as overlapping circles (Venn diagram style). Players submit answers, vote for the best, and earn points.

**Tech Stack:**
- SvelteKit (latest) with TypeScript
- Supabase (PostgreSQL) 
- Deployed on Netlify
- QRCode library for easy joining

**Target Launch:** New Year's Eve 2025 (soft launch)

---

## Current Status ✅

### What's Complete:
1. **Room creation flow** - Working, generates unique 4-char codes
2. **TV display page** - Shows QR code, player list, polls for updates
3. **Phone join flow** - Name entry, localStorage session management
4. **Phone controller** - Basic waiting lobby, polls game state
5. **Database schema** - Games and players tables set up
6. **API endpoints** - Create game, join game, get players, get state
7. **Design system** - Warm peach/coral gradients, Righteous + DM Sans fonts

### Known Issues Fixed:
- ✅ SSR issue with `window.location.origin` - moved to `onMount`
- ✅ `pollInterval` type annotation - using `ReturnType<typeof setInterval>`
- ✅ QR code not rendering on TV display - moved QR generation to `$effect()` reactive statement that triggers when canvas exists and gameState is 'lobby'
- ✅ Svelte 5 reactivity warnings - converted state variables to use `$state()` rune instead of plain `let` declarations

---

## Architecture Decisions

### Routing Structure
```
/                                    # Game selection landing (root)
/overlap/                            # Overlap game landing page
/overlap/[roomId]                    # TV display
/overlap/[roomId]/join               # Phone: name entry
/overlap/[roomId]/play               # Phone: controller

/api/overlap/create                  # POST: Create room
/api/overlap/[roomId]/join           # POST: Join room
/api/overlap/[roomId]/players        # GET: List players
/api/overlap/[roomId]/state          # GET: Game state
```

### TV + Phone Architecture
- **TV (`/overlap/[roomId]`)** - Passive display, no authentication, shows game state
- **Phone (`/overlap/[roomId]/play`)** - Active controller, requires player session
- **Separation is key** - TV shows prompts/results, phones are input devices

### State Management
- **Polling (not WebSockets)** - Simple 2-second intervals, adequate for 4 players
- **localStorage for sessions** - Keys: `eiko-player-id`, `eiko-player-name`, `eiko-room-code`
- **Server as source of truth** - All game logic happens server-side

---

## Database Schema

### `games` table
```sql
id              uuid (PK)
room_code       text (unique, 4 chars like "3K7M")
status          text ('lobby' | 'playing' | 'finished')
current_round   integer
created_at      timestamp
```

### `players` table
```sql
id              uuid (PK)
game_id         uuid (FK to games)
player_name     text (max 20 chars)
join_order      integer (1-4)
score           integer
is_connected    boolean
created_at      timestamp
```

### Tables Needed (not yet created):
```sql
-- Prompts table (for the two topics)
prompts:
  id              uuid (PK)
  topic1          text
  topic2          text
  difficulty      text ('easy' | 'medium' | 'hard')
  created_at      timestamp

-- Answers table (player submissions)
answers:
  id              uuid (PK)
  game_id         uuid (FK to games)
  round_number    integer
  player_id       uuid (FK to players)
  answer_text     text (max 50 chars)
  created_at      timestamp

-- Votes table (which answer players voted for)
votes:
  id              uuid (PK)
  game_id         uuid (FK to games)
  round_number    integer
  voter_id        uuid (FK to players)
  voted_for_answer_id  uuid (FK to answers)
  created_at      timestamp

-- Game rounds table (tracks which prompt was used)
game_rounds:
  id              uuid (PK)
  game_id         uuid (FK to games)
  round_number    integer
  prompt_id       uuid (FK to prompts)
  status          text ('answering' | 'voting' | 'results')
  created_at      timestamp
```

---

## Design System

### Colors
- **Background:** Linear gradient `#ffecd2` → `#fcb69f` (warm peach to coral)
- **Primary button:** `#ff6b6b` (coral red)
- **Text:** `#2d1810` (dark brown), `#5d3a2e` (medium brown)
- **Accents:** White cards with `rgba(255, 255, 255, 0.7-0.9)` + backdrop-filter blur

### Typography
- **Display font:** Righteous (playful, friendly)
- **Body font:** DM Sans (clean, readable)
- **Title sizes:** 4rem desktop, 3rem mobile
- **Button sizes:** 1.25rem text, 1.25rem padding

### Style Principles
- **Cozy, warm, inviting** - NOT flashy gaming vibes
- **Rounded corners everywhere** - 15px-30px border-radius
- **Smooth animations** - Fade ins, slide ups, gentle pulses
- **Generous spacing** - 2-3rem gaps between sections
- **Frosted glass effects** - backdrop-filter: blur(10px)

### Animation Guidelines
- **Page loads:** fadeIn (0.6s), slideDown (0.8s)
- **Buttons:** pulse (2s infinite), lift on hover
- **Player joins:** slideIn (0.4s) with scale
- **State changes:** Smooth transitions (0.3s)

---

## Game Flow (What Needs to Be Built)

### Phase 1: Prompt Display (5-10 seconds)
**TV Display:**
- Show two topics in Venn diagram circles (overlapping)
- Timer counting down
- Instructions: "What belongs in both?"

**Phone Controller:**
- Show the same prompt
- Text input field (max 50 chars)
- Submit button (disabled until text entered)
- Timer synced with TV

**API Needed:**
- `GET /api/overlap/[roomId]/current-prompt` - Returns current round's prompt
- `POST /api/overlap/[roomId]/submit-answer` - Player submits answer

### Phase 2: Answer Collection (60-90 seconds)
**TV Display:**
- Continue showing prompt
- "Waiting for answers..." message
- Show which players have submitted (checkmarks)
- Countdown timer

**Phone Controller:**
- After submit: "Answer submitted! ✓"
- Show waiting state with player count
- "X/4 players have answered"

**Logic:**
- Players can't see other answers yet
- Once timer expires OR all players submit, move to voting
- Store answers in `answers` table

### Phase 3: Voting (30-45 seconds)
**TV Display:**
- Show all answers ANONYMOUSLY (no player names)
- "Vote for the best answer!"
- Timer counting down

**Phone Controller:**
- List all answers as buttons/cards
- Player selects ONE answer
- Can't vote for their own answer (server validates)
- After voting: "Vote cast! ✓"

**API Needed:**
- `GET /api/overlap/[roomId]/answers` - Get all answers for current round
- `POST /api/overlap/[roomId]/vote` - Player casts vote

**Logic:**
- Answers displayed in random order
- Hide player names to avoid bias
- Track votes in `votes` table

### Phase 4: Results (15-20 seconds)
**TV Display:**
- Reveal who submitted each answer
- Show vote counts with animations
- Award points (1 point per vote received)
- Show updated leaderboard
- "Next round in 3... 2... 1..."

**Phone Controller:**
- Show same results
- Highlight their answer with vote count
- Show updated score
- Waiting for next round

**API Needed:**
- `GET /api/overlap/[roomId]/results` - Get results for current round

**Logic:**
- Update player scores in database
- Increment current_round in games table
- If this was the last round, move to Phase 5

### Phase 5: Final Results (Game Over)
**TV Display:**
- Show final leaderboard
- Confetti animation for winner
- "Play Again" button

**Phone Controller:**
- Show final scores
- Show their placement (1st, 2nd, 3rd, 4th)
- "Play Again" redirects to `/overlap/`

**Logic:**
- Update game status to 'finished'
- Could show fun stats: "Most creative answer", "Most votes received", etc.

---

## Implementation Priorities

### Phase 1 - Core Game Loop (Do This First)
1. Create prompt system and seed database with 20-30 prompts
2. Implement answer submission phase (TV + phone)
3. Implement voting phase (TV + phone)
4. Implement results phase (TV + phone)
5. Implement multi-round logic (3-5 rounds per game)

### Phase 2 - Polish
1. Add animations and transitions between phases
2. Add sound effects (optional, but nice)
3. Improve error handling and edge cases
4. Add "Play Again" functionality
5. Add game statistics/fun facts at end

### Phase 3 - Enhancements
1. Add difficulty selection (easy/medium/hard prompts)
2. Add custom prompt creation by players
3. Add game settings (rounds, time limits)
4. Add spectator mode for 5+ people
5. Add social sharing ("I scored X points in Overlap!")

---

## Technical Notes

### State Machine for Game
```
LOBBY → ROUND_START → ANSWERING → VOTING → RESULTS → 
        ↑_____________________________________________|
        (if more rounds)
        ↓
GAME_OVER
```

Add a `phase` column to `games` table or `game_rounds` table to track current phase.

### Polling Strategy
- **TV polls every 2 seconds** for player list and game state
- **Phone polls every 2 seconds** for game state
- Consider moving to Supabase Realtime later for instant updates

### Prompt Selection
- Random selection from pool
- Don't repeat prompts in same game
- Track used prompts in `game_rounds` table
- Could add rating/difficulty system later

### Scoring System (Keep it Simple)
- **1 point per vote received** - Easy to understand
- Winner is highest score after all rounds
- Ties are okay, show co-winners

### Edge Cases to Handle
- Player disconnects mid-game (mark as disconnected)
- Player refreshes during game (rejoin with localStorage)
- Not all players submit answer (timeout and continue)
- Not all players vote (timeout and continue)
- Room codes expire after 24 hours (cleanup job)

---

## File Structure

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── utils.ts                 # Room code generator
│   └── types.ts                 # (ADD) TypeScript interfaces
├── routes/
│   ├── +page.svelte             # Main landing (game selection)
│   ├── overlap/
│   │   ├── +page.svelte         # Overlap launch page
│   │   └── [roomId]/
│   │       ├── +page.svelte     # TV display ✅
│   │       ├── join/
│   │       │   └── +page.svelte # Phone join ✅
│   │       └── play/
│   │           └── +page.svelte # Phone controller ✅
│   └── api/
│       └── overlap/
│           ├── create/+server.ts              # ✅
│           └── [roomId]/
│               ├── join/+server.ts            # ✅
│               ├── players/+server.ts         # ✅
│               ├── state/+server.ts           # ✅
│               ├── current-prompt/+server.ts  # TODO
│               ├── submit-answer/+server.ts   # TODO
│               ├── answers/+server.ts         # TODO
│               ├── vote/+server.ts            # TODO
│               └── results/+server.ts         # TODO
```

---

## Sample Prompts to Get Started

Add these to your `prompts` table:

```typescript
const samplePrompts = [
  { topic1: "Things in the Ocean", topic2: "Breakfast Foods", difficulty: "medium" },
  { topic1: "Round Objects", topic2: "Things You Can Eat", difficulty: "easy" },
  { topic1: "Things in a Wallet", topic2: "Things at a Concert", difficulty: "medium" },
  { topic1: "Cold Things", topic2: "Sweet Things", difficulty: "easy" },
  { topic1: "Things That Fly", topic2: "Things That Are Red", difficulty: "medium" },
  { topic1: "Things Made of Metal", topic2: "Kitchen Items", difficulty: "easy" },
  { topic1: "Things That Are Sticky", topic2: "Things at a Beach", difficulty: "medium" },
  { topic1: "Things That Glow", topic2: "Things in Space", difficulty: "hard" },
  { topic1: "Things That Make Noise", topic2: "Things in a Classroom", difficulty: "easy" },
  { topic1: "Things That Are Soft", topic2: "Things You Wear", difficulty: "easy" },
  { topic1: "Things That Are Hot", topic2: "Things at a Restaurant", difficulty: "easy" },
  { topic1: "Things That Are Green", topic2: "Things in a Garden", difficulty: "easy" },
  { topic1: "Things That Smell Good", topic2: "Things in a Bakery", difficulty: "easy" },
  { topic1: "Things That Are Fast", topic2: "Things with Wheels", difficulty: "medium" },
  { topic1: "Things That Are Expensive", topic2: "Things That Are Shiny", difficulty: "medium" }
];
```

---

## API Response Formats

### `/api/overlap/[roomId]/current-prompt`
```json
{
  "promptId": "uuid",
  "topic1": "Things in the Ocean",
  "topic2": "Breakfast Foods",
  "roundNumber": 1,
  "phase": "answering",
  "timeRemaining": 75
}
```

### `/api/overlap/[roomId]/answers`
```json
{
  "answers": [
    {
      "answerId": "uuid",
      "answerText": "Seaweed",
      "playerId": "uuid"  // Only include after voting starts
    }
  ]
}
```

### `/api/overlap/[roomId]/results`
```json
{
  "answers": [
    {
      "answerId": "uuid",
      "answerText": "Seaweed",
      "playerName": "Charles",
      "playerId": "uuid",
      "voteCount": 3
    }
  ],
  "leaderboard": [
    { "playerName": "Charles", "score": 15, "place": 1 },
    { "playerName": "Sarah", "score": 12, "place": 2 }
  ],
  "isGameOver": false,
  "nextRoundIn": 5
}
```

---

## Development Tips

### Testing Locally
1. Open TV view on desktop: `http://localhost:5173/overlap/[roomCode]`
2. Open 2-4 phone simulators in DevTools (iPhone SE)
3. Scan QR or manually navigate to join page
4. Test the full flow with multiple "players"

### Debugging Polling
- Add `console.log` in poll functions to see updates
- Check Network tab to verify API calls
- Verify Supabase data updates in dashboard

### Time Management
- Make timers configurable (constants file)
- Start with shorter times for testing (10s instead of 60s)
- Add "Skip" button in dev mode to test phases quickly

### Deployment Checklist
- [ ] Add environment variables to Netlify
- [ ] Test on actual mobile devices
- [ ] Test QR code scanning
- [ ] Verify TV display on actual TV
- [ ] Test with 4 real people
- [ ] Add error boundaries for production

---

## Next Steps for Claude Code

1. **Create the remaining database tables** (prompts, answers, votes, game_rounds)
2. **Seed prompts table** with 30-50 good prompts
3. **Build the core game loop:**
   - Add `phase` tracking to game state
   - Implement prompt display on TV + phones
   - Implement answer submission flow
   - Implement voting flow
   - Implement results display
4. **Add phase transitions** with timers
5. **Test full game with multiple rounds**
6. **Polish and deploy**

---

## Questions to Consider

1. **How many rounds per game?** Suggest 3-5 rounds (10-15 min total)
2. **What happens if player disconnects?** Mark as disconnected, continue game
3. **Can players rejoin?** Yes, if they have localStorage session
4. **Time limits?** Answering: 60s, Voting: 30s, Results: 15s
5. **Sound effects?** Optional, but would enhance experience
6. **Animations?** Focus on smooth phase transitions

---

## Design References

The aesthetic is **cozy, warm, inviting** - think of:
- Coffee shop vibes
- Warm sunset colors
- Friendly, playful typography
- NOT competitive/intense gaming aesthetics

Keep this vibe consistent as you build out the game phases.

---

Good luck! The foundation is solid. Focus on getting the core game loop working first, then polish. You've got this! 🎮