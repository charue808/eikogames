import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ params }) => {
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

		// Get the current round
		const { data: gameRound, error: roundError } = await supabase
			.from('game_rounds')
			.select('round_number, phase, phase_started_at')
			.eq('game_id', game.id)
			.eq('round_number', game.current_round)
			.single();

		if (roundError || !gameRound) {
			return json({ error: 'Round not found' }, { status: 404 });
		}

		// Calculate time elapsed
		const phaseStartTime = new Date(gameRound.phase_started_at).getTime();
		const now = Date.now();
		const elapsed = Math.floor((now - phaseStartTime) / 1000);
		const timeLimit = gameRound.phase === 'answering' ? 60 : 30;

		// Check if time is up
		if (elapsed < timeLimit) {
			return json({
				error: 'Phase time not elapsed yet',
				timeRemaining: timeLimit - elapsed
			}, { status: 400 });
		}

		let nextPhase: string;
		let shouldAdvance = true;

		if (gameRound.phase === 'answering') {
			// Check how many answers were submitted
			const { data: answers, error: answersError } = await supabase
				.from('answers')
				.select('id')
				.eq('game_id', game.id)
				.eq('round_number', game.current_round);

			if (answersError) {
				console.error('Error fetching answers:', answersError);
				return json({ error: 'Failed to check answers' }, { status: 500 });
			}

			const answerCount = answers?.length || 0;

			// Single-player mode: skip voting if only 0 or 1 answer
			if (answerCount <= 1) {
				nextPhase = 'results';
				console.log('Single-player mode: skipping voting phase');
			} else {
				nextPhase = 'voting';
			}
		} else if (gameRound.phase === 'voting') {
			nextPhase = 'results';
		} else {
			// Already in results phase, cannot advance further
			return json({
				error: 'Already in results phase',
				phase: 'results'
			}, { status: 400 });
		}

		// Update the game phase
		const newPhaseStartTime = new Date().toISOString();

		const { error: updateGameError } = await supabase
			.from('games')
			.update({
				current_phase: nextPhase,
				phase_started_at: newPhaseStartTime
			})
			.eq('id', game.id);

		if (updateGameError) {
			console.error('Error updating game:', updateGameError);
			return json({ error: 'Failed to update game phase' }, { status: 500 });
		}

		// Update the round phase
		const { error: updateRoundError } = await supabase
			.from('game_rounds')
			.update({
				phase: nextPhase,
				phase_started_at: newPhaseStartTime
			})
			.eq('game_id', game.id)
			.eq('round_number', game.current_round);

		if (updateRoundError) {
			console.error('Error updating round:', updateRoundError);
			return json({ error: 'Failed to update round phase' }, { status: 500 });
		}

		return json({
			success: true,
			previousPhase: gameRound.phase,
			newPhase: nextPhase,
			phaseStartedAt: newPhaseStartTime
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
