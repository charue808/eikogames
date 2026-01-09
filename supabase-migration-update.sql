-- Migration to add current_phase and phase_started_at columns to games table
-- Run this in your Supabase SQL Editor if these columns don't exist

-- Add current_phase column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'games' AND column_name = 'current_phase'
    ) THEN
        ALTER TABLE games ADD COLUMN current_phase TEXT CHECK (current_phase IN ('answering', 'voting', 'results'));
    END IF;
END $$;

-- Add phase_started_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'games' AND column_name = 'phase_started_at'
    ) THEN
        ALTER TABLE games ADD COLUMN phase_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
