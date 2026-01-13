<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let roomCode = page.params.roomId;
	let playerId = '';
	let playerName = '';
	let gameStatus = 'lobby';
	let playerCount = 0;
	let pollInterval: ReturnType<typeof setInterval>;
	let currentPrompt: any = null;
	let answerText = '';
	let hasSubmitted = false;
	let isSubmitting = false;
	let submitError = '';
	let votingAnswers: any[] = [];
	let hasVoted = false;
	let isVoting = false;
	let voteError = '';

	onMount(() => {
		playerId = localStorage.getItem('eiko-player-id') || '';
		playerName = localStorage.getItem('eiko-player-name') || '';
		const storedRoomCode = localStorage.getItem('eiko-room-code') || '';

		if (!playerId || storedRoomCode !== roomCode) {
			goto(`/overlap/${roomCode}/join`);
			return;
		}

		pollGameState();
		pollInterval = setInterval(pollGameState, 2000);
	})

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function pollGameState() {
		try {
			const response = await fetch(`/api/overlap/${roomCode}/state?playerId=${playerId}`);
			if (response.ok) {
				const data = await response.json();
				gameStatus = data.status;
				playerCount = data.playerCount;

				// If game is playing, fetch current prompt
				if (gameStatus === 'playing') {
					const promptResponse = await fetch(`/api/overlap/${roomCode}/current-prompt`);
					if (promptResponse.ok) {
						const newPrompt = await promptResponse.json();

						// Check if we have a new round - reset submission state
						if (currentPrompt && newPrompt.roundNumber !== currentPrompt.roundNumber) {
							hasSubmitted = false;
							answerText = '';
							submitError = '';
							hasVoted = false;
							votingAnswers = [];
							voteError = '';
						}

						// Check if phase changed to voting - fetch answers
						if (currentPrompt && currentPrompt.phase !== 'voting' && newPrompt.phase === 'voting') {
							fetchVotingAnswers();
						}

						// Also fetch answers if we're in voting phase but don't have answers yet
						if (newPrompt.phase === 'voting' && votingAnswers.length === 0 && !hasVoted) {
							fetchVotingAnswers();
						}

						currentPrompt = newPrompt;
						console.log('Player current prompt:', currentPrompt);

						// Auto-advance phase when timer reaches 0
						if (currentPrompt.timeRemaining === 0 && currentPrompt.phase !== 'results') {
							await checkPhaseTransition();
						}
					} else {
						console.error('Failed to fetch current prompt:', await promptResponse.text());
					}
				}
			}
		} catch (error) {
			console.error('Error fetching game state:', error);
		}
	}

	async function submitAnswer() {
		if (!answerText.trim() || isSubmitting) return;

		isSubmitting = true;
		submitError = '';

		try {
			const response = await fetch(`/api/overlap/${roomCode}/submit-answer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerId,
					answerText: answerText.trim()
				})
			});

			if (response.ok) {
				hasSubmitted = true;
			} else {
				const error = await response.json();
				submitError = error.error || 'Failed to submit answer';
			}
		} catch (error) {
			console.error('Error submitting answer:', error);
			submitError = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isSubmitting) {
			submitAnswer();
		}
	}

	async function fetchVotingAnswers() {
		try {
			const response = await fetch(`/api/overlap/${roomCode}/answers?playerId=${playerId}`);
			if (response.ok) {
				const data = await response.json();
				votingAnswers = data.answers;
				hasVoted = data.hasVoted;
				console.log('Fetched voting answers:', data);
				console.log('Number of votable answers:', votingAnswers.length);
			} else {
				console.error('Failed to fetch voting answers:', await response.text());
			}
		} catch (error) {
			console.error('Error fetching voting answers:', error);
		}
	}

	async function submitVote(answerId: string) {
		if (isVoting) return;

		isVoting = true;
		voteError = '';

		try {
			const response = await fetch(`/api/overlap/${roomCode}/vote`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerId,
					answerId
				})
			});

			if (response.ok) {
				hasVoted = true;
			} else {
				const error = await response.json();
				voteError = error.error || 'Failed to submit vote';
			}
		} catch (error) {
			console.error('Error submitting vote:', error);
			voteError = 'Network error. Please try again.';
		} finally {
			isVoting = false;
		}
	}

	async function checkPhaseTransition() {
		if (!currentPrompt || currentPrompt.timeRemaining > 0) return;

		console.log('Attempting to advance phase from:', currentPrompt.phase);

		try {
			const response = await fetch(`/api/overlap/${roomCode}/advance-phase`, {
				method: 'POST'
			});

			if (response.ok) {
				// Phase advanced, poll will pick up the change
				const data = await response.json();
				console.log('Phase advanced successfully from', data.previousPhase, 'to', data.newPhase);
			} else {
				// Might already be advanced or not ready yet
				const data = await response.json();
				console.log('Phase advance response:', data);
			}
		} catch (error) {
			console.error('Error advancing phase:', error);
		}
	}
</script>

<svelte:head>
	<title>Playing Overlap - Eiko Games</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Righteous&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<main>
	<div class="container">
		<div class="phone-controller">
			<div class="header">
				<h1 class="title">Eiko Games</h1>
				<div class="player-info">
					<div class="player-badge">{playerName.charAt(0).toUpperCase()}</div>
					<span>{playerName}</span>
				</div>
			</div>
			{#if gameStatus === 'lobby'}
				<div class="waiting-state">
					<div class="spinner"></div>
					<h2>Waiting for players...</h2>
					<p>{playerCount}/4 players joined</p>
					<p class="hint">Game will start when all 4 players are ready!</p>
				</div>
			{:else if gameStatus === 'playing' && currentPrompt}
				{#if currentPrompt.phase === 'answering'}
					<div class="answering-state">
						<div class="timer-badge" class:warning={currentPrompt.timeRemaining < 10}>
							{currentPrompt.timeRemaining}s
						</div>

						<div class="prompt-display">
							<h2>Round {currentPrompt.roundNumber}</h2>
							<p class="instruction">What belongs in both?</p>
							<div class="topics">
								<div class="topic topic-1">{currentPrompt.topic1}</div>
								<div class="overlap-icon">∩</div>
								<div class="topic topic-2">{currentPrompt.topic2}</div>
							</div>
						</div>

						{#if !hasSubmitted}
							<div class="answer-input-section">
								<input
									type="text"
									class="answer-input"
									placeholder="Type your answer..."
									maxlength="50"
									bind:value={answerText}
									on:keypress={handleKeyPress}
									disabled={isSubmitting}
								/>
								<div class="char-count" class:over={answerText.length >= 50}>
									{answerText.length}/50
								</div>
								<button
									class="submit-btn"
									on:click={submitAnswer}
									disabled={!answerText.trim() || isSubmitting}
								>
									{isSubmitting ? 'Submitting...' : 'Submit Answer'}
								</button>
								{#if submitError}
									<p class="error">{submitError}</p>
								{/if}
							</div>
						{:else}
							<div class="submitted-state">
								<div class="checkmark">✓</div>
								<h3>Answer Submitted!</h3>
								<p>Your answer: <strong>{answerText}</strong></p>
								<p class="hint">Waiting for other players...</p>
								<p class="hint">{currentPrompt.submittedCount}/{playerCount} submitted</p>
							</div>
						{/if}
					</div>
				{:else if currentPrompt.phase === 'voting'}
					<div class="voting-state">
						<div class="timer-badge" class:warning={currentPrompt.timeRemaining < 10}>
							{currentPrompt.timeRemaining}s
						</div>

						<div class="prompt-display">
							<h2>Round {currentPrompt.roundNumber}</h2>
							<p class="instruction">Vote for the best answer!</p>
							<div class="topics">
								<div class="topic topic-1">{currentPrompt.topic1}</div>
								<div class="overlap-icon">∩</div>
								<div class="topic topic-2">{currentPrompt.topic2}</div>
							</div>
						</div>

						{#if votingAnswers.length === 0}
							<div class="no-answers">
								<p>No answers to vote on!</p>
								<p class="hint">Waiting for results...</p>
							</div>
						{:else if !hasVoted}
							<div class="voting-section">
								<p class="vote-instruction">Tap an answer to vote:</p>
								<div class="answers-list">
									{#each votingAnswers as answer}
										<button
											class="answer-card"
											on:click={() => submitVote(answer.id)}
											disabled={isVoting}
										>
											<div class="answer-text">{answer.answerText}</div>
											<div class="answer-author">by {answer.playerName}</div>
										</button>
									{/each}
								</div>
								{#if voteError}
									<p class="error">{voteError}</p>
								{/if}
							</div>
						{:else}
							<div class="voted-state">
								<div class="checkmark">✓</div>
								<h3>Vote Submitted!</h3>
								<p class="hint">Waiting for other players...</p>
							</div>
						{/if}
					</div>
				{:else if currentPrompt.phase === 'results'}
					<div class="results-state">
						<div class="prompt-display">
							<h2>Round {currentPrompt.roundNumber} Results</h2>
							<p class="instruction">Coming soon...</p>
						</div>
					</div>
				{/if}
			{/if}
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
	
	.phone-controller {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 30px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		min-height: 70vh;
		backdrop-filter: blur(10px);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid rgba(45, 24, 16, 0.1);
	}
	
	.title {
		font-family: 'Righteous', cursive;
		font-size: 1.8rem;
		color: #2d1810;
		margin: 0;
	}
	
	.player-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #2d1810;
		font-weight: 600;
	}
	
	.player-badge {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #ff6b6b;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: 700;
		font-family: 'Righteous', cursive;
	}
	
	.waiting-state,
	.playing-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
	}
	
	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid rgba(255, 107, 107, 0.2);
		border-top-color: #ff6b6b;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	h2 {
		font-family: 'Righteous', cursive;
		font-size: 1.8rem;
		color: #2d1810;
		margin: 1rem 0 0.5rem 0;
	}
	
	p {
		color: #5d3a2e;
		font-size: 1.1rem;
		margin: 0.25rem 0;
	}
	
	.hint {
		margin-top: 1rem;
		font-style: italic;
		color: #999;
		font-size: 1rem;
	}

	/* ANSWERING PHASE STYLES */
	.answering-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: fadeIn 0.5s ease-out;
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

	.timer-badge {
		align-self: flex-end;
		background: #ff6b6b;
		color: white;
		font-family: 'Righteous', cursive;
		font-size: 1.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		min-width: 80px;
		text-align: center;
	}

	.timer-badge.warning {
		background: #c62828;
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

	.prompt-display {
		text-align: center;
		padding: 1rem 0;
	}

	.instruction {
		font-size: 1.2rem;
		color: #5d3a2e;
		margin: 0.5rem 0 1.5rem 0;
		font-weight: 500;
	}

	.topics {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.topic {
		background: rgba(255, 107, 107, 0.15);
		padding: 1rem 1.5rem;
		border-radius: 15px;
		font-size: 1.1rem;
		font-weight: 600;
		color: #2d1810;
		width: 100%;
		text-align: center;
	}

	.topic-2 {
		background: rgba(76, 175, 255, 0.15);
	}

	.overlap-icon {
		font-size: 2rem;
		color: #2d1810;
		font-weight: 700;
	}

	.answer-input-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: auto;
	}

	.answer-input {
		width: 100%;
		padding: 1rem 1.5rem;
		font-size: 1.1rem;
		font-family: 'DM Sans', sans-serif;
		border: 2px solid rgba(45, 24, 16, 0.2);
		border-radius: 15px;
		background: white;
		color: #2d1810;
		transition: all 0.2s ease;
	}

	.answer-input:focus {
		outline: none;
		border-color: #ff6b6b;
		box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
	}

	.answer-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.char-count {
		align-self: flex-end;
		font-size: 0.9rem;
		color: #999;
	}

	.char-count.over {
		color: #c62828;
		font-weight: 700;
	}

	.submit-btn {
		width: 100%;
		padding: 1.25rem 2rem;
		font-size: 1.2rem;
		font-weight: 700;
		font-family: 'Righteous', cursive;
		background: #ff6b6b;
		color: white;
		border: none;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
	}

	.submit-btn:hover:not(:disabled) {
		background: #ff5252;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.submit-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
		box-shadow: none;
	}

	.error {
		color: #c62828;
		font-size: 0.95rem;
		text-align: center;
		margin: 0;
	}

	.submitted-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
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

	.checkmark {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: #4caf50;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		margin-bottom: 1rem;
		animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	.submitted-state h3 {
		font-family: 'Righteous', cursive;
		font-size: 1.8rem;
		color: #2d1810;
		margin: 0;
	}

	.submitted-state p {
		margin: 0.5rem 0;
	}

	.submitted-state strong {
		color: #ff6b6b;
	}

	/* VOTING PHASE STYLES */
	.voting-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: fadeIn 0.5s ease-out;
	}

	.voting-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.vote-instruction {
		text-align: center;
		font-size: 1.1rem;
		font-weight: 600;
		color: #5d3a2e;
		margin: 0;
	}

	.answers-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		max-height: 400px;
	}

	.answer-card {
		background: white;
		border: 2px solid rgba(45, 24, 16, 0.1);
		border-radius: 15px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.answer-card:hover:not(:disabled) {
		border-color: #ff6b6b;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
	}

	.answer-card:active:not(:disabled) {
		transform: translateY(0);
	}

	.answer-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.answer-text {
		font-size: 1.2rem;
		font-weight: 600;
		color: #2d1810;
		margin-bottom: 0.5rem;
	}

	.answer-author {
		font-size: 0.95rem;
		color: #999;
		font-style: italic;
	}

	.no-answers {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
	}

	.voted-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
		animation: slideUp 0.5s ease-out;
	}

	.voted-state h3 {
		font-family: 'Righteous', cursive;
		font-size: 1.8rem;
		color: #2d1810;
		margin: 0;
	}

	/* RESULTS PHASE STYLES */
	.results-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: fadeIn 0.5s ease-out;
	}
</style>