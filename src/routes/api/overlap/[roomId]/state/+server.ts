import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params, url }) => {
	const { roomId } = params;
	const playerId = url.searchParams.get('playerId');

	try {
		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('id, status, current_round')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found'}, { status: 404 });
		}

		const { count } = await supabase
			.from('players')
			.select('*', { count: 'exact', head: true })
			.eq('game_id', game.id)

		if (playerId) {
			const { data: player } = await supabase
				.from('players')
				.select('id')
				.eq('id', playerId)
				.eq('game_id', game.id)
				.single();

			if (!player) {
				return json({ error: 'Player not found in this game'}, { status: 404 });
			}
		}

		return json({
			status: game.status,
			currentRound: game.current_round,
			playerCount: count || 0
		});
		
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal sever error'}, { status: 500 });
	}
};