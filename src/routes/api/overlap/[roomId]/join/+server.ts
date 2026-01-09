import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { getNameOfJSDocTypedef } from 'typescript';

export const POST: RequestHandler = async ({ params, request }) => {
	const { roomId } = params;

	try {
		const { playerName } = await request.json();

		if (!playerName || playerName.trim().length === 0) {
			return json({ error: 'Player name is requied'}, { status: 400 });
		}

		if (playerName.trim().length > 20) {
			return json({ error: 'Player name must be 20 characters or less'}, { status: 400 });
		}

		const { data: game, error: gameError } = await supabase
			.from('games')
			.select('id, status')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		const { count } = await supabase
			.from('players')
			.select('*', { count: 'exact', head: true })
			.eq('game_id', game.id);

		if (count && count >= 4) {
			return json({ error: 'Game is full (4/4 players)'}, { status: 400 });
		}

		if (game.status !== 'lobby') {
			return json({ error: 'Game has already started' }, { status: 400 });
		}

		const { data: player, error: playerError } = await supabase
			.from('players')
			.insert({
				game_id: game.id,
				player_name: playerName.trim(),
				join_order: (count || 0) + 1,
				score: 0,
				is_connected: true
			})
			.select()
			.single();
		
		if (playerError) {
			console.error('Error creating player:', playerError);
			return json({ error: 'Failed to join game'}, { status: 500 });
		}

		if (( count || 0) + 1 === 4) {
			await supabase
				.from('games')
				.update({ status: 'playing', current_round: 1})
				.eq('id', game.id)
		}

		return json({
			playerId: player.id,
			playerName: player.player_name
		});


	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error'}, { status: 500 });
	}
}