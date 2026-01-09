<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import QRCode from "qrcode";

	let qrCanvas: HTMLCanvasElement;
	let players: any[] = [];
	let roomCode = page.params.roomId;
	let pollInterval: ReturnType<typeof setInterval>;
	let origin = '';
	let gameState: any = null;
	let currentPrompt: any = null;
	let autoStartTimeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		origin = window.location.origin;

		const joinUrl = `${origin}/overlap/${roomCode}/join`;
		QRCode.toCanvas(qrCanvas, joinUrl, {
			width: 300,
			color: {
				dark: '#2d1810',
				light: "#ffffff"
			}
		});

		pollGameData();
		pollInterval = setInterval(pollGameData, 2000);

		return () => {
			clearInterval(pollInterval);
			if (autoStartTimeout) clearTimeout(autoStartTimeout);
		};
	});

	async function pollGameData() {
		try {
			// Poll players
			const playersResponse = await fetch(`/api/overlap/${roomCode}/players`);
			if (playersResponse.ok) {
				players = await playersResponse.json();
			}

			// Poll game state
			const stateResponse = await fetch(`/api/overlap/${roomCode}/state`);
			if (stateResponse.ok) {
				gameState = await stateResponse.json();

				// Auto-start game when 4 players join (only if in lobby)
				if (gameState.status === 'lobby' && players.length === 4 && !autoStartTimeout) {
					autoStartTimeout = setTimeout(startGame, 3000);
				}

				// If game is playing, fetch current prompt
				if (gameState.status === 'playing') {
					const promptResponse = await fetch(`/api/overlap/${roomCode}/current-prompt`);
					if (promptResponse.ok) {
						currentPrompt = await promptResponse.json();
					}
				}
			}
		} catch(error) {
			console.error('Error fetching game data:', error);
		}
	}

	async function startGame() {
		try {
			const response = await fetch(`/api/overlap/${roomCode}/start`, {
				method: 'POST'
			});
			if (!response.ok) {
				console.error('Failed to start game');
			}
		} catch (error) {
			console.error('Error starting game:', error);
		}
	}

</script>

<svelte:head>
	<title>Overlap Room {roomCode} - Eiko Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Righteous&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
	<div class="tv-container">
		<div class="header">
			<h1 class="logo">Eiko Games</h1>
			<div class="room-code">Room: {roomCode}</div>
		</div>

		{#if gameState?.status === 'lobby'}
			<!-- LOBBY VIEW -->
			<div class="main-content">
				<div class="qr-section">
					<h2>Scan to Join</h2>
					<div class="qr-wrapper">
						<canvas bind:this={qrCanvas}></canvas>
					</div>
					<p class="join-url">or visit: {origin}/overlap/{roomCode}/join</p>
				</div>

				<div class="players-section">
					<h2>Players ({players.length}/4)</h2>
					<div class="player-grid">
						{#each Array(4) as _, i}
							<div class="player-slot" class:filled={players[i]}>
								{#if players[i]}
									<div class="player-avatar">
										{players[i].player_name.charAt(0).toUpperCase()}
									</div>
									<div class="player-name">{players[i].player_name}</div>
								{:else}
									<div class="player-avatar empty">?</div>
									<div class="player-name waiting">Waiting...</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			{#if players.length >= 2 && players.length <= 4}
				<div class="ready-banner">
					{#if players.length === 4}
						All players ready! Starting game...
					{:else}
						{players.length}/4 players - Waiting for more...
					{/if}
				</div>
			{/if}

		{:else if gameState?.status === 'playing' && currentPrompt}
			<!-- ANSWERING PHASE VIEW -->
			<div class="game-content">
				<div class="round-info">
					<div class="round-number">Round {currentPrompt.roundNumber}</div>
					<div class="timer" class:warning={currentPrompt.timeRemaining < 10}>
						{currentPrompt.timeRemaining}s
					</div>
				</div>

				<div class="prompt-container">
					<h2 class="instruction">What belongs in both?</h2>

					<div class="venn-diagram">
						<div class="circle circle-left">
							<div class="circle-content">
								{currentPrompt.topic1}
							</div>
						</div>
						<div class="circle circle-right">
							<div class="circle-content">
								{currentPrompt.topic2}
							</div>
						</div>
						<div class="overlap-label">?</div>
					</div>
				</div>

				<div class="submission-status">
					<h3>Submissions: {currentPrompt.submittedCount}/{players.length}</h3>
					<div class="player-status-grid">
						{#each players as player}
							<div class="player-status">
								<div class="player-avatar-small">
									{player.player_name.charAt(0).toUpperCase()}
								</div>
								<span class="player-status-name">{player.player_name}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
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
	
	.tv-container {
		min-height: 100vh;
		padding: 3rem;
		display: flex;
		flex-direction: column;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
	}
	
	.logo {
		font-family: 'Righteous', cursive;
		font-size: 3rem;
		color: #2d1810;
		margin: 0;
	}
	
	.room-code {
		font-size: 2rem;
		font-weight: 700;
		color: #2d1810;
		background: rgba(255, 255, 255, 0.7);
		padding: 1rem 2rem;
		border-radius: 20px;
		backdrop-filter: blur(10px);
	}
	
	.main-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		flex: 1;
	}
	
	.qr-section,
	.players-section {
		background: rgba(255, 255, 255, 0.8);
		border-radius: 30px;
		padding: 3rem;
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	h2 {
		font-family: 'Righteous', cursive;
		font-size: 2.5rem;
		color: #2d1810;
		margin: 0 0 2rem 0;
	}
	
	.qr-wrapper {
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	}
	
	.join-url {
		margin-top: 2rem;
		color: #5d3a2e;
		font-size: 1.2rem;
		text-align: center;
	}
	
	.player-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		width: 100%;
	}
	
	.player-slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.5);
		transition: all 0.3s ease;
	}
	
	.player-slot.filled {
		background: rgba(255, 107, 107, 0.2);
		animation: slideIn 0.4s ease-out;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.player-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: #ff6b6b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		font-weight: 700;
		font-family: 'Righteous', cursive;
	}
	
	.player-avatar.empty {
		background: rgba(255, 255, 255, 0.5);
		color: #ccc;
	}
	
	.player-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d1810;
	}
	
	.player-name.waiting {
		color: #999;
		font-style: italic;
	}
	
	.ready-banner {
		position: fixed;
		bottom: 3rem;
		left: 50%;
		transform: translateX(-50%);
		background: #4caf50;
		color: white;
		padding: 1.5rem 3rem;
		border-radius: 50px;
		font-size: 1.5rem;
		font-weight: 700;
		box-shadow: 0 10px 30px rgba(76, 175, 80, 0.4);
		animation: bounceIn 0.6s ease-out;
	}
	
	@keyframes bounceIn {
		0% {
			opacity: 0;
			transform: translateX(-50%) scale(0.3);
		}
		50% {
			transform: translateX(-50%) scale(1.05);
		}
		100% {
			opacity: 1;
			transform: translateX(-50%) scale(1);
		}
	}

	/* GAME PHASE STYLES */
	.game-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		animation: fadeIn 0.6s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.round-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.8);
		padding: 1.5rem 2rem;
		border-radius: 20px;
		backdrop-filter: blur(10px);
	}

	.round-number {
		font-family: 'Righteous', cursive;
		font-size: 2rem;
		color: #2d1810;
	}

	.timer {
		font-family: 'Righteous', cursive;
		font-size: 3rem;
		color: #ff6b6b;
		min-width: 100px;
		text-align: right;
	}

	.timer.warning {
		color: #c62828;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.prompt-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.8);
		padding: 3rem;
		border-radius: 30px;
		backdrop-filter: blur(10px);
	}

	.instruction {
		font-family: 'Righteous', cursive;
		font-size: 2.5rem;
		color: #2d1810;
		margin: 0 0 3rem 0;
		text-align: center;
	}

	.venn-diagram {
		position: relative;
		width: 100%;
		max-width: 800px;
		height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.circle {
		position: absolute;
		width: 350px;
		height: 350px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
		font-weight: 700;
		text-align: center;
		color: white;
		padding: 2rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
	}

	.circle-left {
		left: 50px;
		background: rgba(255, 107, 107, 0.85);
		animation: slideInLeft 0.8s ease-out;
	}

	.circle-right {
		right: 50px;
		background: rgba(76, 175, 255, 0.85);
		animation: slideInRight 0.8s ease-out;
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			left: -100px;
		}
		to {
			opacity: 1;
			left: 50px;
		}
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			right: -100px;
		}
		to {
			opacity: 1;
			right: 50px;
		}
	}

	.circle-content {
		position: relative;
		z-index: 2;
	}

	.overlap-label {
		position: absolute;
		font-family: 'Righteous', cursive;
		font-size: 4rem;
		color: #2d1810;
		z-index: 3;
		animation: pulseQuestion 2s infinite;
	}

	@keyframes pulseQuestion {
		0%, 100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	.submission-status {
		background: rgba(255, 255, 255, 0.8);
		padding: 2rem;
		border-radius: 20px;
		backdrop-filter: blur(10px);
		text-align: center;
	}

	.submission-status h3 {
		font-family: 'Righteous', cursive;
		font-size: 1.8rem;
		color: #2d1810;
		margin: 0 0 1.5rem 0;
	}

	.player-status-grid {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.player-status {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.player-avatar-small {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: #ff6b6b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		font-family: 'Righteous', cursive;
	}

	.player-status-name {
		font-size: 1rem;
		color: #5d3a2e;
		font-weight: 600;
	}
</style>