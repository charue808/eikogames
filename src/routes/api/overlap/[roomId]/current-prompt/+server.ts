import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { roomId } = params;

		// Get the game
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('id, status, current_round, current_phase, phase_started_at')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		if (game.status !== 'playing') {
			return json({ error: 'Game not started' }, { status: 400 });
		}

		// Get the current round's prompt
		const { data: gameRound, error: roundError } = await supabase
			.from('game_rounds')
			.select(`
				round_number,
				phase,
				phase_started_at,
				prompts (
					id,
					topic1,
					topic2
				)
			`)
			.eq('game_id', game.id)
			.eq('round_number', game.current_round)
			.single();

		if (roundError || !gameRound) {
			return json({ error: 'Round not found' }, { status: 404 });
		}

		// Calculate time remaining (60 seconds for answering phase)
		const phaseStartTime = new Date(gameRound.phase_started_at).getTime();
		const now = Date.now();
		const elapsed = Math.floor((now - phaseStartTime) / 1000);
		const timeLimit = gameRound.phase === 'answering' ? 60 : 30; // 60s for answering, 30s for voting
		const timeRemaining = Math.max(0, timeLimit - elapsed);

		// Get submitted answers count
		const { data: answers, error: answersError } = await supabase
			.from('answers')
			.select('id')
			.eq('game_id', game.id)
			.eq('round_number', game.current_round);

		if (answersError) {
			console.error('Error fetching answers:', answersError);
		}

		const submittedCount = answers?.length || 0;

		return json({
			promptId: gameRound.prompts.id,
			topic1: gameRound.prompts.topic1,
			topic2: gameRound.prompts.topic2,
			roundNumber: gameRound.round_number,
			phase: gameRound.phase,
			timeRemaining,
			submittedCount
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
