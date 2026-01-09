import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { generateRoomCode } from '$lib/utils';

export const POST: RequestHandler = async () => {
	try {
		let roomCode = generateRoomCode();
		let isUnique = false;
		let attempts = 0;

		while (!isUnique && attempts < 10) {
			const { data: existing } = await supabase
				.from('games')
				.select('id')
				.eq('room_code', roomCode)
				.single();

			if (!existing) {
				isUnique = true;
			} else {
				roomCode = generateRoomCode();
				attempts++;
			}
		}

		if (!isUnique) {
			return json({ error: 'Failed to generate unique room code'}, { status: 500 })
		}

		const { data: game, error} = await supabase
			.from('games')
			.insert({
				room_code: roomCode,
				status: 'lobby',
				current_round: 0
			})
			.select()
			.single();
		
		if (error) {
			console.error('Error creating game:', error);
			return json({ error: 'Failed to create game'}, { status: 500 });
		}

		return json({ roomCode: game.room_code })
	} catch (error) {
		console.error('Unexpected error:', error);
		return json({ error: 'Internal server error'}, { status: 500 });
	}
};