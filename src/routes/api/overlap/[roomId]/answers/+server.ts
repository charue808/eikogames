import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const { roomId } = params;
		const playerId = url.searchParams.get('playerId');

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

		// Get answers for the current round
		const { data: answers, error: answersError } = await supabase
			.from('answers')
			.select(`
				id,
				answer_text,
				player_id,
				players (
					id,
					display_name
				)
			`)
			.eq('game_id', game.id)
			.eq('round_number', game.current_round);

		if (answersError) {
			console.error('Error fetching answers:', answersError);
			return json({ error: 'Failed to fetch answers' }, { status: 500 });
		}

		console.log(`[Voting Answers] Game: ${game.id}, Round: ${game.current_round}, Total answers: ${answers?.length || 0}`);
		console.log('[Voting Answers] All answers:', JSON.stringify(answers, null, 2));

		// Filter out the current player's answer (can't vote for yourself)
		const votableAnswers = answers?.filter(answer => {
			// Use player_id field directly instead of nested players.id
			const isOwnAnswer = answer.player_id === playerId;
			console.log(`[Voting Answers] Answer ${answer.id} by player ${answer.player_id}, current player: ${playerId}, is own answer: ${isOwnAnswer}`);
			return !isOwnAnswer;
		}) || [];

		console.log(`[Voting Answers] Votable answers count: ${votableAnswers.length}`);

		// Check if the current player has already voted
		let hasVoted = false;
		if (playerId) {
			const { data: vote } = await supabase
				.from('votes')
				.select('id')
				.eq('game_id', game.id)
				.eq('round_number', game.current_round)
				.eq('voter_id', playerId)
				.single();

			hasVoted = !!vote;
		}

		return json({
			answers: votableAnswers.map(answer => ({
				id: answer.id,
				answerText: answer.answer_text,
				playerName: answer.players.display_name
			})),
			hasVoted
		});
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
