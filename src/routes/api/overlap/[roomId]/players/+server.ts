import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params }) => {
	const { roomId } = params;

	try {
		const { data:game, error: gameError} = await supabase
			.from('games')
			.select('id')
			.eq('room_code', roomId)
			.single();

		if (gameError || !game) {
			return json({ error: 'Game not found'}, { status: 404 })
		}

		const { data: players, error: playersError } = await supabase
			.from('players')
			.select('*')
			.eq('game_id', game.id)
			.order('join_order', { ascending: true });
		
		if (playersError) {
			console.error('Error fetching players:', playersError);
			return json({ error: 'Failed to fetch players' }, { status: 500 });
		}

		return json(players || []);
	} catch (error) {
		console.error('Unexpected error', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};