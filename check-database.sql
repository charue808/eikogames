-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if prompts table has data
SELECT COUNT(*) as prompt_count FROM prompts;

-- 2. Check if current_phase column exists in games table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'games'
ORDER BY column_name;

-- 3. Check if game_rounds table exists
SELECT COUNT(*) as round_count FROM game_rounds;

-- 4. Check current games status
SELECT room_code, status, current_round, current_phase, created_at
FROM games
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are any players
SELECT g.room_code, COUNT(p.id) as player_count
FROM games g
LEFT JOIN players p ON g.id = p.game_id
GROUP BY g.id, g.room_code
ORDER BY g.created_at DESC
LIMIT 5;
