<script lang="ts">
</script>

<svelte:head>
	<title>Eiko Games - A cozy place to play</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Righteous&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <div class="container">
    <header class="hero">
      <h1 class="title">Eiko Games</h1>
      <p class="tagline">A cozy place to play</p>
    </header>
    <div class="games-grid">
      <a href="/overlap" class="game-card multiplayer">
        <div class="game-header">
          <div class="game-icon">⭕</div>
          <span class="player-badge multiplayer">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<circle cx="5" cy="6" r="2.5"/>
						<circle cx="11" cy="6" r="2.5"/>
						<path d="M1 14c0-2.2 1.8-4 4-4s4 1.8 4 4M7 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
					</svg>
					Multiplayer
				</span>
        </div>
        <h2>Overlap</h2>
        <p>Find the perfect connection between two topics. 2-4 players, TV + phones.</p>
      </a>

      <!-- Future Single Player Game -->
      <div class="game-card single-player coming-soon">
        <div class="game-header">
          <div class="game-icon">🎯</div>
          <span class="player-badge single-player">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            </svg>
            Single Player
          </span>
        </div>
        <h2>Coming Soon</h2>
        <p>Solo challenges and puzzles</p>
      </div>

      <!-- Future Multiplayer Game -->
      <div class="game-card multiplayer coming-soon">
        <div class="game-header">
          <div class="game-icon">🎲</div>
          <span class="player-badge multiplayer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="6" r="2.5"/>
              <circle cx="11" cy="6" r="2.5"/>
              <path d="M1 14c0-2.2 1.8-4 4-4s4 1.8 4 4M7 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
            </svg>
            Multiplayer
          </span>
        </div>
        <h2>Coming Soon</h2>
        <p>More party games on the way</p>
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
		padding: 3rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.hero {
		text-align: center;
		margin-bottom: 4rem;
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
	}
	
	.tagline {
		font-size: 1.5rem;
		color: #5d3a2e;
		margin: 0;
		font-weight: 500;
	}
	
	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		animation: slideUp 0.8s ease-out 0.2s both;
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
	
	.game-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 24px;
		padding: 2rem;
		backdrop-filter: blur(10px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
		overflow: hidden;
	}
	
	.game-card:not(.coming-soon) {
		cursor: pointer;
	}
	
	.game-card:not(.coming-soon):hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
	}
	
	.game-card.coming-soon {
		opacity: 0.6;
		cursor: default;
	}
	
	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.game-icon {
		font-size: 3rem;
		line-height: 1;
	}
	
	.player-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
	}
	
	.player-badge.multiplayer {
		background: rgba(255, 107, 107, 0.15);
		color: #ff6b6b;
	}
	
	.player-badge.single-player {
		background: rgba(76, 175, 80, 0.15);
		color: #4caf50;
	}
	
	.game-card h2 {
		font-family: 'Righteous', cursive;
		font-size: 2rem;
		color: #2d1810;
		margin: 0;
	}
	
	.game-card p {
		color: #5d3a2e;
		line-height: 1.6;
		margin: 0;
		font-size: 1.05rem;
	}
	
	@media (max-width: 768px) {
		.container {
			padding: 2rem 1rem;
		}
		
		.title {
			font-size: 3rem;
		}
		
		.tagline {
			font-size: 1.25rem;
		}
		
		.games-grid {
			grid-template-columns: 1fr;
		}
	}
</style>