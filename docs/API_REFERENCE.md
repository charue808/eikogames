# Eiko Games - API Reference

**Last Updated:** 2025-01-08  
**Base URL:** `/api`  
**Version:** 1.0.0

---

## Overview

All API endpoints are SvelteKit server routes. They return JSON responses and use standard HTTP status codes.

### Response Format

**Success Response:**
```json
{
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `409` - Conflict (game full, already started)
- `500` - Internal Server Error

---

## Authentication

### Current Implementation

**Method:** Session-based via localStorage

When a player joins a game, the API returns a `playerId`. The client stores this in localStorage and includes it in subsequent requests.

**Storage Keys:**
- `eiko-player-id` - UUID from players table
- `eiko-player-name` - Player's display name
- `eiko-room-code` - Current room code

**Usage:**
```typescript
// After joining
localStorage.setItem('eiko-player-id', playerId);

// In subsequent requests
const playerId = localStorage.getItem('eiko-player-id');
const response = await fetch(`/api/overlap/${roomId}/state?playerId=${playerId}`);
```

### Security Notes

⚠️ **Current authentication is MVP-level and NOT production-ready.**

For production:
- Implement proper session tokens with expiration
- Add rate limiting
- Add CSRF protection
- Validate player belongs to room on server

---

## Game Management Endpoints

### Create Game

Creates a new game room with a unique room code.

**Endpoint:** `POST /api/overlap/create`

**Request:**
```http
POST /api/overlap/create
Content-Type: application/json
```

No body required.

**Response:**
```json
{
  "roomCode": "3K7M"
}
```

**Status Codes:**
- `200` - Success
- `500` - Failed to generate unique code (after 10 attempts)

**Example:**
```typescript
const response = await fetch('/api/overlap/create', {
  method: 'POST'
});
const { roomCode } = await response.json();
// Navigate to /overlap/{roomCode}
```

**Notes:**
- Room codes are 4 characters (A-Z, 2-9, no O/0/I/1)
- Codes are checked for uniqueness (max 10 retries)
- Game is created in 'lobby' status
- Current round is 0

---

### Join Game

Adds a player to a game room.

**Endpoint:** `POST /api/overlap/[roomId]/join`

**Request:**
```http
POST /api/overlap/ABC123/join
Content-Type: application/json

{
  "playerName": "Charles"
}
```

**Request Body:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| playerName | string | Yes | 1-20 characters, non-empty |

**Response:**
```json
{
  "playerId": "550e8400-e29b-41d4-a716-446655440000",
  "playerName": "Charles"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid player name or game full
- `404` - Game not found

**Error Examples:**
```json
// Game full
{
  "error": "Game is full (4/4 players)"
}

// Game already started
{
  "error": "Game has already started"
}

// Invalid name
{
  "error": "Player name must be 20 characters or less"
}
```

**Side Effects:**
- Player is added to `players` table
- If this is the 4th player:
  - Game status changes to 'playing'
  - Current round set to 1

**Example:**
```typescript
const response = await fetch(`/api/overlap/${roomCode}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerName: 'Charles' })
});

if (!response.ok) {
  const { error } = await response.json();
  alert(error);
  return;
}

const { playerId, playerName } = await response.json();
localStorage.setItem('eiko-player-id', playerId);
localStorage.setItem('eiko-player-name', playerName);
```

---

### Get Players

Returns list of players in a game room.

**Endpoint:** `GET /api/overlap/[roomId]/players`

**Request:**
```http
GET /api/overlap/ABC123/players
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "game_id": "660e8400-e29b-41d4-a716-446655440000",
    "player_name": "Charles",
    "join_order": 1,
    "score": 5,
    "is_connected": true,
    "created_at": "2025-01-08T10:30:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "game_id": "660e8400-e29b-41d4-a716-446655440000",
    "player_name": "Sarah",
    "join_order": 2,
    "score": 3,
    "is_connected": true,
    "created_at": "2025-01-08T10:30:15Z"
  }
]
```

**Status Codes:**
- `200` - Success (returns empty array if no players)
- `404` - Game not found

**Notes:**
- Players are returned in `join_order` (ascending)
- Used by TV display to show player list
- Polled every 2 seconds

**Example:**
```typescript
const response = await fetch(`/api/overlap/${roomCode}/players`);
const players = await response.json();
console.log(`${players.length}/4 players`);
```

---

### Get Game State

Returns current state of the game.

**Endpoint:** `GET /api/overlap/[roomId]/state`

**Request:**
```http
GET /api/overlap/ABC123/state?playerId=550e8400-e29b-41d4-a716-446655440000
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| playerId | string (UUID) | Optional | If provided, validates player is in game |

**Response:**
```json
{
  "status": "playing",
  "currentRound": 2,
  "playerCount": 4
}
```

**Response Fields:**
| Field | Type | Values | Description |
|-------|------|--------|-------------|
| status | string | 'lobby', 'playing', 'finished' | Game status |
| currentRound | number | 0-n | Current round (0 in lobby) |
| playerCount | number | 0-4 | Number of players |

**Status Codes:**
- `200` - Success
- `404` - Game or player not found

**Notes:**
- If `playerId` provided, verifies player belongs to game
- Polled every 2 seconds by both TV and phones
- Can be extended to include more state (current phase, time remaining, etc.)

**Example:**
```typescript
const playerId = localStorage.getItem('eiko-player-id');
const response = await fetch(
  `/api/overlap/${roomCode}/state?playerId=${playerId}`
);
const { status, currentRound, playerCount } = await response.json();
```

---

## Game Play Endpoints

### Get Current Prompt

Returns the current round's prompt (two topics).

**Endpoint:** `GET /api/overlap/[roomId]/current-prompt`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/ABC123/current-prompt
```

**Response:**
```json
{
  "promptId": "880e8400-e29b-41d4-a716-446655440000",
  "topic1": "Things in the Ocean",
  "topic2": "Breakfast Foods",
  "roundNumber": 1,
  "phase": "answering",
  "phaseStartedAt": "2025-01-08T10:35:00Z",
  "phaseDuration": 60
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| promptId | string (UUID) | ID of the prompt |
| topic1 | string | First topic |
| topic2 | string | Second topic |
| roundNumber | number | Current round number |
| phase | string | 'answering', 'voting', or 'results' |
| phaseStartedAt | string (ISO) | When current phase started |
| phaseDuration | number | Phase duration in seconds |

**Status Codes:**
- `200` - Success
- `404` - Game not found or not in playing state

**Client Calculation:**
```typescript
const timeElapsed = (Date.now() - new Date(phaseStartedAt).getTime()) / 1000;
const timeRemaining = Math.max(0, phaseDuration - timeElapsed);
```

**Notes:**
- Returns prompt for current round
- Includes timing information for countdown display
- Both TV and phones use this endpoint

---

### Submit Answer

Player submits their answer for the current round.

**Endpoint:** `POST /api/overlap/[roomId]/submit-answer`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
POST /api/overlap/ABC123/submit-answer
Content-Type: application/json

{
  "playerId": "550e8400-e29b-41d4-a716-446655440000",
  "answerText": "Seaweed"
}
```

**Request Body:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| playerId | string (UUID) | Yes | Must be valid player in game |
| answerText | string | Yes | 1-50 characters, non-empty |

**Response:**
```json
{
  "answerId": "990e8400-e29b-41d4-a716-446655440000",
  "answerText": "Seaweed",
  "submittedAt": "2025-01-08T10:35:30Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid answer or already submitted
- `404` - Game or player not found
- `409` - Not in answering phase

**Error Examples:**
```json
// Already submitted
{
  "error": "You have already submitted an answer for this round"
}

// Wrong phase
{
  "error": "Not in answering phase"
}

// Answer too long
{
  "error": "Answer must be 50 characters or less"
}
```

**Validation:**
- Player must be in the game
- Game must be in 'answering' phase
- Player can only submit once per round
- Answer must be 1-50 characters

**Side Effects:**
- Answer stored in `answers` table
- If all players have submitted:
  - Phase changes to 'voting'
  - Timer resets

---

### Get Answers

Returns all answers for the current round.

**Endpoint:** `GET /api/overlap/[roomId]/answers`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/ABC123/answers?roundNumber=1
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roundNumber | number | Optional | Defaults to current round |

**Response:**
```json
{
  "answers": [
    {
      "answerId": "990e8400-e29b-41d4-a716-446655440000",
      "answerText": "Seaweed",
      "playerId": null,
      "playerName": null
    },
    {
      "answerId": "aa0e8400-e29b-41d4-a716-446655440000",
      "answerText": "Fish eggs",
      "playerId": null,
      "playerName": null
    }
  ],
  "phase": "voting"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| answerId | string (UUID) | ID of the answer |
| answerText | string | The answer content |
| playerId | string or null | Player who submitted (null during voting) |
| playerName | string or null | Player name (null during voting) |

**Status Codes:**
- `200` - Success
- `404` - Game not found

**Notes:**
- During 'voting' phase: `playerId` and `playerName` are `null` (anonymous)
- During 'results' phase: All fields populated
- Answers returned in random order during voting
- Used by both TV (display) and phones (voting interface)

**Phase-Specific Behavior:**

**Voting Phase:**
```json
{
  "answers": [...],  // Anonymous
  "phase": "voting"
}
```

**Results Phase:**
```json
{
  "answers": [
    {
      "answerId": "...",
      "answerText": "Seaweed",
      "playerId": "550e8400-...",
      "playerName": "Charles",
      "voteCount": 3
    }
  ],
  "phase": "results"
}
```

---

### Submit Vote

Player votes for an answer.

**Endpoint:** `POST /api/overlap/[roomId]/vote`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
POST /api/overlap/ABC123/vote
Content-Type: application/json

{
  "playerId": "550e8400-e29b-41d4-a716-446655440000",
  "answerId": "990e8400-e29b-41d4-a716-446655440000"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| playerId | string (UUID) | Yes | Voting player |
| answerId | string (UUID) | Yes | Answer being voted for |

**Response:**
```json
{
  "voteId": "bb0e8400-e29b-41d4-a716-446655440000",
  "votedAt": "2025-01-08T10:37:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid vote (own answer, already voted)
- `404` - Game, player, or answer not found
- `409` - Not in voting phase

**Error Examples:**
```json
// Voting for own answer
{
  "error": "You cannot vote for your own answer"
}

// Already voted
{
  "error": "You have already voted in this round"
}

// Wrong phase
{
  "error": "Not in voting phase"
}
```

**Validation:**
- Player must be in the game
- Game must be in 'voting' phase
- Player can only vote once per round
- Can't vote for own answer (server validates)
- Answer must exist in current round

**Side Effects:**
- Vote stored in `votes` table
- If all players have voted:
  - Phase changes to 'results'
  - Scores calculated and updated

---

### Get Results

Returns results for a round (answers with vote counts).

**Endpoint:** `GET /api/overlap/[roomId]/results`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/ABC123/results?roundNumber=1
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| roundNumber | number | Optional | Defaults to current round |

**Response:**
```json
{
  "roundNumber": 1,
  "prompt": {
    "topic1": "Things in the Ocean",
    "topic2": "Breakfast Foods"
  },
  "answers": [
    {
      "answerId": "990e8400-e29b-41d4-a716-446655440000",
      "answerText": "Seaweed",
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "playerName": "Charles",
      "voteCount": 3
    },
    {
      "answerId": "aa0e8400-e29b-41d4-a716-446655440000",
      "answerText": "Fish eggs",
      "playerId": "770e8400-e29b-41d4-a716-446655440000",
      "playerName": "Sarah",
      "voteCount": 1
    }
  ],
  "leaderboard": [
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "playerName": "Charles",
      "score": 8,
      "place": 1
    },
    {
      "playerId": "770e8400-e29b-41d4-a716-446655440000",
      "playerName": "Sarah",
      "score": 6,
      "place": 2
    }
  ],
  "isGameOver": false,
  "nextRoundIn": 5
}
```

**Status Codes:**
- `200` - Success
- `404` - Game or round not found

**Notes:**
- Answers sorted by vote count (descending)
- Leaderboard shows cumulative scores
- `nextRoundIn` counts down from 15 seconds
- `isGameOver` is true if this was the last round

---

## Admin/Utility Endpoints

### Delete Game

Deletes a game and all associated data.

**Endpoint:** `DELETE /api/overlap/[roomId]`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
DELETE /api/overlap/ABC123
```

**Response:**
```json
{
  "deleted": true,
  "roomCode": "ABC123"
}
```

**Status Codes:**
- `200` - Success
- `404` - Game not found

**Notes:**
- Cascading delete removes players, answers, votes, rounds
- Should be rate-limited to prevent abuse
- Consider requiring admin token in production

---

### Get Game Statistics

Returns stats for a completed game.

**Endpoint:** `GET /api/overlap/[roomId]/stats`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/ABC123/stats
```

**Response:**
```json
{
  "gameId": "660e8400-e29b-41d4-a716-446655440000",
  "roomCode": "ABC123",
  "totalRounds": 3,
  "duration": 420,
  "winner": {
    "playerId": "550e8400-e29b-41d4-a716-446655440000",
    "playerName": "Charles",
    "finalScore": 12
  },
  "mostVoted": {
    "answer": "Seaweed",
    "voteCount": 3,
    "playerName": "Charles"
  },
  "funFacts": [
    "Charles won all 3 rounds!",
    "Everyone agreed on 'Seaweed' in round 1"
  ]
}
```

**Notes:**
- Only available for completed games
- Used for end-game summary screen
- Could add social sharing functionality

---

## Prompts Management

### Get Random Prompt

Returns a random unused prompt for a game.

**Endpoint:** `GET /api/overlap/prompts/random`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/prompts/random?gameId=660e8400-e29b-41d4-a716-446655440000&difficulty=medium
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| gameId | string (UUID) | Yes | Game requesting prompt |
| difficulty | string | Optional | 'easy', 'medium', or 'hard' |

**Response:**
```json
{
  "promptId": "880e8400-e29b-41d4-a716-446655440000",
  "topic1": "Things in the Ocean",
  "topic2": "Breakfast Foods",
  "difficulty": "medium"
}
```

**Logic:**
- Excludes prompts already used in this game
- Filters by difficulty if specified
- Returns random from remaining pool

---

### List All Prompts

Returns all available prompts (admin/testing use).

**Endpoint:** `GET /api/overlap/prompts`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
GET /api/overlap/prompts?difficulty=medium&limit=20
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| difficulty | string | Optional | Filter by difficulty |
| limit | number | Optional | Max results (default 50) |

**Response:**
```json
{
  "prompts": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "topic1": "Things in the Ocean",
      "topic2": "Breakfast Foods",
      "difficulty": "medium",
      "timesUsed": 42
    }
  ],
  "total": 150
}
```

---

### Create Prompt

Adds a new prompt to the database.

**Endpoint:** `POST /api/overlap/prompts`

**Status:** 🚧 **NOT YET IMPLEMENTED**

**Request:**
```http
POST /api/overlap/prompts
Content-Type: application/json

{
  "topic1": "Things That Float",
  "topic2": "Things That Are Blue",
  "difficulty": "easy"
}
```

**Response:**
```json
{
  "promptId": "cc0e8400-e29b-41d4-a716-446655440000",
  "topic1": "Things That Float",
  "topic2": "Things That Are Blue",
  "difficulty": "easy"
}
```

**Notes:**
- Should require admin authentication
- Validate topics are not empty
- Consider moderation for user-submitted prompts

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}  // Optional, dev mode only
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `GAME_NOT_FOUND` | 404 | Room code doesn't exist |
| `GAME_FULL` | 409 | Already has 4 players |
| `GAME_STARTED` | 409 | Can't join after start |
| `PLAYER_NOT_FOUND` | 404 | Player ID invalid |
| `INVALID_PHASE` | 409 | Action not allowed in current phase |
| `ALREADY_SUBMITTED` | 409 | Already submitted answer/vote this round |
| `INVALID_INPUT` | 400 | Validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Handling Best Practices

**Client-Side:**
```typescript
try {
  const response = await fetch('/api/overlap/...');
  
  if (!response.ok) {
    const { error, code } = await response.json();
    
    // Handle specific errors
    if (code === 'GAME_FULL') {
      alert('This game is full. Please create a new game.');
    } else {
      alert(error);
    }
    return;
  }
  
  const data = await response.json();
  // Handle success
} catch (err) {
  console.error('Network error:', err);
  alert('Connection failed. Please check your internet.');
}
```

**Server-Side:**
```typescript
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    // ... business logic ...
    
    return json({ data: result });
    
  } catch (error) {
    console.error('Error:', error);
    return json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
};
```

---

## Rate Limiting

### Current Status

⚠️ **No rate limiting implemented yet**

### Recommended Implementation

**Per-IP Limits:**
- Game creation: 10 per hour
- Join game: 20 per hour
- Submit answer: 100 per hour
- Vote: 100 per hour

**Per-Game Limits:**
- Prevent spam from single game
- Max 1 action per player per second

**Implementation Options:**
- Netlify Edge Functions (rate limiting)
- Upstash Redis (distributed rate limiting)
- Simple in-memory cache (single server)

---

## Versioning

### Current Approach

No versioning yet (MVP stage).

### Future Versioning Strategy

**URL Versioning:**
```
/api/v1/overlap/create
/api/v2/overlap/create
```

**Or Header Versioning:**
```http
GET /api/overlap/create
API-Version: 2
```

**Deprecation Policy:**
- Support old version for 6 months
- Add deprecation warnings to responses
- Document breaking changes clearly

---

## Testing

### API Testing Checklist

**Game Creation:**
- [ ] Creates unique room codes
- [ ] Returns valid room code
- [ ] Handles database errors

**Joining:**
- [ ] Validates player name
- [ ] Prevents joining full games
- [ ] Prevents joining started games
- [ ] Returns valid player ID
- [ ] 4th player triggers game start

**Game State:**
- [ ] Returns current state
- [ ] Validates player belongs to game
- [ ] Handles non-existent games

**Answer Submission:**
- [ ] Validates answer length
- [ ] Prevents duplicate submissions
- [ ] Enforces phase rules
- [ ] All players submitted triggers phase change

**Voting:**
- [ ] Prevents voting for own answer
- [ ] Prevents duplicate votes
- [ ] Enforces phase rules
- [ ] All players voted triggers phase change

**Results:**
- [ ] Calculates scores correctly
- [ ] Updates leaderboard
- [ ] Handles ties
- [ ] Transitions to next round

---

## Performance

### Response Time Targets

- Game creation: < 200ms
- Join game: < 200ms
- Get players: < 100ms
- Get state: < 100ms
- Submit answer: < 200ms
- Vote: < 200ms

### Optimization Strategies

**Database:**
- Use indexes on frequently queried columns
- Select only needed columns
- Batch related queries
- Consider caching game state (Redis)

**API:**
- Enable compression (Netlify automatic)
- Add Cache-Control headers where appropriate
- Consider CDN for static responses

**Monitoring:**
- Log slow queries (> 500ms)
- Track API response times
- Monitor error rates

---

## API Evolution

### Upcoming Endpoints

**Phase 2 (Core Game Loop):**
- `GET /api/overlap/[roomId]/current-prompt` ✅
- `POST /api/overlap/[roomId]/submit-answer` ✅
- `GET /api/overlap/[roomId]/answers` ✅
- `POST /api/overlap/[roomId]/vote` ✅
- `GET /api/overlap/[roomId]/results` ✅

**Phase 3 (Features):**
- `POST /api/overlap/[roomId]/skip-phase` (dev only)
- `GET /api/overlap/[roomId]/replay` (watch game replay)
- `POST /api/overlap/prompts` (custom prompts)

**Phase 4 (Platform):**
- `GET /api/games` (list all game types)
- `GET /api/leaderboard` (cross-game leaderboard)
- `POST /api/account/create` (persistent accounts)

---

## Example Client Usage

### Complete Game Flow

```typescript
// 1. Create game (on TV)
const { roomCode } = await fetch('/api/overlap/create', {
  method: 'POST'
}).then(r => r.json());

// 2. Join game (on phone)
const { playerId } = await fetch(`/api/overlap/${roomCode}/join`, {
  method: 'POST',
  body: JSON.stringify({ playerName: 'Charles' })
}).then(r => r.json());

localStorage.setItem('eiko-player-id', playerId);

// 3. Poll for game start (both TV and phone)
const pollState = setInterval(async () => {
  const { status, currentRound } = await fetch(
    `/api/overlap/${roomCode}/state?playerId=${playerId}`
  ).then(r => r.json());
  
  if (status === 'playing') {
    clearInterval(pollState);
    startGame();
  }
}, 2000);

// 4. Get current prompt (both TV and phone)
const { topic1, topic2, phase } = await fetch(
  `/api/overlap/${roomCode}/current-prompt`
).then(r => r.json());

// 5. Submit answer (on phone)
await fetch(`/api/overlap/${roomCode}/submit-answer`, {
  method: 'POST',
  body: JSON.stringify({
    playerId,
    answerText: 'Seaweed'
  })
});

// 6. Get answers for voting (both TV and phone)
const { answers } = await fetch(
  `/api/overlap/${roomCode}/answers`
).then(r => r.json());

// 7. Vote (on phone)
await fetch(`/api/overlap/${roomCode}/vote`, {
  method: 'POST',
  body: JSON.stringify({
    playerId,
    answerId: answers[0].answerId
  })
});

// 8. Get results (both TV and phone)
const { answers, leaderboard, isGameOver } = await fetch(
  `/api/overlap/${roomCode}/results`
).then(r => r.json());
```

---

## Questions & Feedback

Have questions about the API? Found a bug? Want to suggest an improvement?

**Contact:** Create an issue in the repository

**Version History:**
- v1.0.0 (2025-01-08) - Initial API design