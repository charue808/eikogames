-- Eiko Games - Overlap Database Schema
-- Last Updated: 2026-01-08

-- ============================================
-- Games Table (Core game instances)
-- ============================================
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('lobby', 'playing', 'finished')),
    current_round INTEGER NOT NULL DEFAULT 0,
    current_phase TEXT CHECK (current_phase IN ('answering', 'voting', 'results')),
    phase_started_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS games_room_code_idx ON games(room_code);

-- ============================================
-- Players Table (Player data for each game)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    join_order INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS players_game_id_idx ON players(game_id);

-- ============================================
-- Prompts Table (Topic pairs for Venn diagrams)
-- ============================================
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic1 TEXT NOT NULL,
    topic2 TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Game Rounds Table (Tracks prompt used per round)
-- ============================================
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    prompt_id UUID NOT NULL REFERENCES prompts(id),
    phase TEXT NOT NULL CHECK (phase IN ('answering', 'voting', 'results')),
    phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, round_number)
);

CREATE INDEX IF NOT EXISTS game_rounds_game_id_idx ON game_rounds(game_id);

-- ============================================
-- Answers Table (Player submissions per round)
-- ============================================
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, round_number, player_id)
);

CREATE INDEX IF NOT EXISTS answers_game_id_round_idx ON answers(game_id, round_number);

-- ============================================
-- Votes Table (Player votes per round)
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    voted_for_answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, round_number, voter_id)
);

CREATE INDEX IF NOT EXISTS votes_game_id_round_idx ON votes(game_id, round_number);

-- ============================================
-- Sample Prompts Data
-- ============================================
INSERT INTO prompts (topic1, topic2, difficulty) VALUES
    ('Things in the Ocean', 'Breakfast Foods', 'medium'),
    ('Round Objects', 'Things You Can Eat', 'easy'),
    ('Things in a Wallet', 'Things at a Concert', 'medium'),
    ('Cold Things', 'Sweet Things', 'easy'),
    ('Things That Fly', 'Things That Are Red', 'medium'),
    ('Things Made of Metal', 'Kitchen Items', 'easy'),
    ('Things That Are Sticky', 'Things at a Beach', 'medium'),
    ('Things That Glow', 'Things in Space', 'hard'),
    ('Things That Make Noise', 'Things in a Classroom', 'easy'),
    ('Things That Are Soft', 'Things You Wear', 'easy'),
    ('Things That Are Hot', 'Things at a Restaurant', 'easy'),
    ('Things That Are Green', 'Things in a Garden', 'easy'),
    ('Things That Smell Good', 'Things in a Bakery', 'easy'),
    ('Things That Are Fast', 'Things with Wheels', 'medium'),
    ('Things That Are Expensive', 'Things That Are Shiny', 'medium'),
    ('Things That Are Wet', 'Things at a Pool', 'easy'),
    ('Things That Are Small', 'Things in Your Pocket', 'easy'),
    ('Things That Are Loud', 'Things at a Party', 'medium'),
    ('Things That Are Scary', 'Things at Night', 'medium'),
    ('Things That Are Old', 'Things in a Museum', 'easy'),
    ('Things That Are Yellow', 'Things in the Sky', 'easy'),
    ('Things That Are Fuzzy', 'Things in Nature', 'medium'),
    ('Things That Are Sharp', 'Things in a Toolbox', 'medium'),
    ('Things That Are Heavy', 'Things You Lift', 'easy'),
    ('Things That Are Transparent', 'Things You Drink From', 'medium'),
    ('Things That Are Square', 'Things on Your Desk', 'medium'),
    ('Things That Are Sour', 'Things You Eat', 'easy'),
    ('Things That Are Electronic', 'Things in Your Bedroom', 'easy'),
    ('Things That Are Wooden', 'Things in a Forest', 'medium'),
    ('Things That Are Purple', 'Things in a Garden', 'medium')
ON CONFLICT DO NOTHING;
