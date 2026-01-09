<script lang="ts">
	import { goto } from "$app/navigation";
	let creating = false;

	async function createGame() {
		creating = true;
		try {
			const response = await fetch('/api/overlap/create', {
				method: 'POST'
			});

			const data = await response.json();

			if (data.roomCode) {
				goto(`/overlap/${data.roomCode}`);
			}
		} catch (error) {
			console.error('Error creating game:', error);
			alert('Failed to create game. Please try again.');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>Overlap - Eiko Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Righteous&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
	<div class="container">
		<div class="hero">
			<h1 class="title">Overlap</h1>
			<p class="subtitle">Find the perfect overlap</p>
			<button
				class="start-button"
				on:click={createGame}
				disabled={creating}
			>
				{creating ? 'Creating...' : 'Start New Game'}
			</button>

			<div class="how-to-play">
				<h3>How to Play</h3>
				<p>Two topics appear on screen. Think creatively about what belongs in both circles. Vote for the best answer!</p>
			</div>
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
		padding: 2rem;
	}
	
	.hero {
		text-align: center;
		max-width: 600px;
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
	
	.title {
		font-family: 'Righteous', cursive;
		font-size: 4rem;
		color: #2d1810;
		margin: 0 0 0.5rem 0;
		text-shadow: 2px 2px 0 rgba(252, 182, 159, 0.3);
		animation: slideDown 0.8s ease-out;
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.subtitle {
		font-size: 1.5rem;
		color: #5d3a2e;
		margin: 0 0 3rem 0;
		font-weight: 500;
	}
	
	.start-button {
		background: #ff6b6b;
		color: white;
		border: none;
		padding: 1.25rem 3rem;
		font-size: 1.25rem;
		font-weight: 700;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
		font-family: 'DM Sans', sans-serif;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
	
	.start-button:hover:not(:disabled) {
		background: #ff5252;
		transform: translateY(-2px);
		box-shadow: 0 12px 30px rgba(255, 107, 107, 0.4);
		animation: none;
	}
	
	.start-button:active:not(:disabled) {
		transform: translateY(0);
	}
	
	.start-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		animation: none;
	}
	
	.how-to-play {
		margin-top: 4rem;
		background: rgba(255, 255, 255, 0.7);
		padding: 2rem;
		border-radius: 20px;
		backdrop-filter: blur(10px);
	}
	
	.how-to-play h3 {
		font-family: 'Righteous', cursive;
		color: #2d1810;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}
	
	.how-to-play p {
		color: #5d3a2e;
		line-height: 1.6;
		margin: 0;
		font-size: 1.1rem;
	}
	
	@media (max-width: 768px) {
		.title {
			font-size: 3rem;
		}
		
		.subtitle {
			font-size: 1.25rem;
		}
		
		.start-button {
			padding: 1rem 2rem;
			font-size: 1.1rem;
		}
	}
</style>