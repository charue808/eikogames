import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { roomId } = params;
		const { playerId, answerId } = await request.json();

		if (!playerId || !answerId) {
			return json({ error: 'Missing playerId or answerId' }, { status: 400 });
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
			return json({ error: 'Game not started' }, { status: 400 });
		}

		if (game.current_phase !== 'voting') {
			return json({ error: 'Not in voting phase' }, { status: 400 });
		}

		// Check if player already voted
		const { data: existingVote } = await supabase
			.from('votes')
			.select('id')
			.eq('game_id', game.id)
			.eq('round_number', game.current_round)
			.eq('voter_id', playerId)
			.single();

		if (existingVote) {
			return json({ error: 'Already voted' }, { status: 400 });
		}

		// Verify the answer exists and is not from the same player
		const { data: answer, error: answerError } = await supabase
			.from('answers')
			.select('player_id')
			.eq('id', answerId)
			.eq('game_id', game.id)
			.eq('round_number', game.current_round)
			.single();

		if (answerError || !answer) {
			return json({ error: 'Invalid answer' }, { status: 400 });
		}

		if (answer.player_id === playerId) {
			return json({ error: 'Cannot vote for your own answer' }, { status: 400 });
		}

		// Submit the vote
		const { error: voteError } = await supabase
			.from('votes')
			.insert({
				game_id: game.id,
				round_number: game.current_round,
				voter_id: playerId,
				voted_for_answer_id: answerId
			});

		if (voteError) {
			console.error('Error submitting vote:', voteError);
			return json({ error: 'Failed to submit vote' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
