<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import  { onMount } from 'svelte';

	let playerName = '';
	let error = '';
	let submitting = false;
	let roomCode = page.params.roomId;

	onMount(() => {
		const existingPlayerId = localStorage.getItem('eiko-player-id');
		const existingRoomCode = localStorage.getItem('eiko-room-code');

		if (existingPlayerId && existingRoomCode === roomCode) {
			goto(`/overlap/${roomCode}/play`);
		}
	});

	async function handleSubmit() {
		error = '';

		if (!playerName.trim()) {
			error = 'Please enter your name';
			return;
		}

		if (playerName.trim().length > 20) {
			error = 'Name must be 20 characters or less';
			return;
		}

		submitting = true;

		try {
			const response = await fetch(`/api/overlap/${roomCode}/join`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ playerName: playerName.trim() })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to join game';
				submitting = false;
				return;
			}

			localStorage.setItem('eiko-player-id', data.playerId);
			localStorage.setItem('eiko-player-name', playerName.trim());
			localStorage.setItem('eiko-room-code', roomCode);

			goto(`/overlap/${roomCode}/play`);
		} catch(err) {
			console.error('Error joining game: ', err);
			error = 'Failed to join game. Please try again.';
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Join Overlap {roomCode} - Eiko Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Righteous&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<main>
	<div class="container">
		<div class="join-card">
			<h1 class="title">Eiko Games</h1>
			<p class="room-info">Room: <strong>{roomCode}</strong></p>

			<form on:submit|preventDefault={handleSubmit}>
				<label for="playerName">Enter Your Name</label>
				<input 
					id="playerName"
					type="text"
					bind:value={playerName}
					placeholder="Your name"
					maxLength="20"
					autoComplete="off"
					disabled={submitting}
				/>

				{#if error}
					<div class="error">{error}</div>
				{/if}
				<button type="submit" disabled={submitting || !playerName.trim()}>
					{submitting ? 'Joining...' : 'Join Game'}
				</button>
			</form>
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'DM Sans', sans-serif;
		background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
		min-height: 100vh;
	}
	
	.container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	
	.join-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 30px;
		padding: 2.5rem;
		max-width: 400px;
		width: 100%;
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		animation: slideUp 0.5s ease-out;
	}
	
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.title {
		font-family: 'Righteous', cursive;
		font-size: 2.5rem;
		color: #2d1810;
		margin: 0 0 1rem 0;
		text-align: center;
	}
	
	.room-info {
		text-align: center;
		color: #5d3a2e;
		font-size: 1.1rem;
		margin: 0 0 2rem 0;
	}
	
	.room-info strong {
		font-weight: 700;
		color: #ff6b6b;
	}
	
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	label {
		font-size: 1.1rem;
		font-weight: 600;
		color: #2d1810;
	}
	
	input {
		padding: 1rem;
		font-size: 1.1rem;
		border: 2px solid rgba(45, 24, 16, 0.2);
		border-radius: 15px;
		font-family: 'DM Sans', sans-serif;
		transition: all 0.3s ease;
	}
	
	input:focus {
		outline: none;
		border-color: #ff6b6b;
		box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
	}
	
	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	button {
		background: #ff6b6b;
		color: white;
		border: none;
		padding: 1.25rem;
		font-size: 1.2rem;
		font-weight: 700;
		border-radius: 15px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'DM Sans', sans-serif;
		margin-top: 1rem;
	}
	
	button:hover:not(:disabled) {
		background: #ff5252;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
	}
	
	button:active:not(:disabled) {
		transform: translateY(0);
	}
	
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.error {
		background: rgba(244, 67, 54, 0.1);
		color: #c62828;
		padding: 0.75rem;
		border-radius: 10px;
		font-size: 0.95rem;
		text-align: center;
		border: 1px solid rgba(198, 40, 40, 0.2);
	}
</style>