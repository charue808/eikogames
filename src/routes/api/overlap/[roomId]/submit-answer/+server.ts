import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { roomId } = params;
		const body = await request.json();
		const { playerId, answerText } = body;

		// Validate input
		if (!playerId || !answerText) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (answerText.length > 50) {
			return json({ error: 'Answer too long (max 50 characters)' }, { status: 400 });
		}

		if (answerText.trim().length === 0) {
			return json({ error: 'Answer cannot be empty' }, { status: 400 });
		}

		// Get the game
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('id, status, current_round, current_phase')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		if (game.status !== 'playing') {
			return json({ error: 'Game not in playing state' }, { status: 400 });
		}

		if (game.current_phase !== 'answering') {
			return json({ error: 'Not in answering phase' }, { status: 400 });
		}

		// Verify player is in this game
		const { data: player, error: playerError } = await supabase
			.from('players')
			.select('id')
			.eq('id', playerId)
			.eq('game_id', game.id)
			.single();

		if (playerError || !player) {
			return json({ error: 'Player not found in this game' }, { status: 404 });
		}

		// Check if player already submitted an answer for this round
		const { data: existingAnswer } = await supabase
			.from('answers')
			.select('id')
			.eq('game_id', game.id)
			.eq('round_number', game.current_round)
			.eq('player_id', playerId)
			.single();

		if (existingAnswer) {
			// Update existing answer
			const { error: updateError } = await supabase
				.from('answers')
				.update({ answer_text: answerText.trim() })
				.eq('id', existingAnswer.id);

			if (updateError) {
				console.error('Error updating answer:', updateError);
				return json({ error: 'Failed to update answer' }, { status: 500 });
			}
		} else {
			// Insert new answer
			const { error: insertError } = await supabase
				.from('answers')
				.insert({
					game_id: game.id,
					round_number: game.current_round,
					player_id: playerId,
					answer_text: answerText.trim()
				});

			if (insertError) {
				console.error('Error inserting answer:', insertError);
				return json({ error: 'Failed to submit answer' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
