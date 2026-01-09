import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ params }) => {
	try {
		const { roomId } = params;

		// Get the game
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('id, status, current_round')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		if (game.status !== 'lobby') {
			return json({ error: 'Game already started' }, { status: 409 });
		}

		// Check if we have exactly 4 players
		const { data: players, error: playersError } = await supabase
			.from('players')
			.select('id')
			.eq('game_id', game.id);

		if (playersError) {
			return json({ error: 'Failed to fetch players' }, { status: 500 });
		}

		if (players.length < 1) {
			return json({ error: 'Need at least 1 player to start' }, { status: 400 });
		}

		if (players.length > 4) {
			return json({ error: 'Too many players' }, { status: 400 });
		}

		// Get a random prompt
		const { data: prompts, error: promptsError } = await supabase
			.from('prompts')
			.select('id, topic1, topic2');

		if (promptsError || !prompts || prompts.length === 0) {
			return json({ error: 'No prompts available' }, { status: 500 });
		}

		const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

		// Start transaction-like operations
		// 1. Update game status and start round 1
		const { error: updateGameError } = await supabase
			.from('games')
			.update({
				status: 'playing',
				current_round: 1,
				current_phase: 'answering',
				phase_started_at: new Date().toISOString()
			})
			.eq('id', game.id);

		if (updateGameError) {
			console.error('Error updating game:', updateGameError);
			return json({ error: 'Failed to start game' }, { status: 500 });
		}

		// 2. Create game_round entry
		const { error: roundError } = await supabase
			.from('game_rounds')
			.insert({
				game_id: game.id,
				round_number: 1,
				prompt_id: randomPrompt.id,
				phase: 'answering',
				phase_started_at: new Date().toISOString()
			});

		if (roundError) {
			console.error('Error creating round:', roundError);
			return json({ error: 'Failed to create round' }, { status: 500 });
		}

		return json({
			success: true,
			roundNumber: 1,
			phase: 'answering'
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
