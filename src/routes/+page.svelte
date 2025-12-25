<script lang="ts">
	import { onMount } from "svelte";

	const targetDate = new Date('2025-12-31T18:00:00-10:00');

	let timeLeft= $state({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	});

	function updateCountdown() {
		const now = new Date();
		const difference = targetDate.getTime() - now.getTime();

		if (difference > 0) {
			timeLeft = {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60)
			};
		}
	}

	onMount(() => {
		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	});

	function padZero(num) {
		return String(num).padStart(2, '0');
	}
</script>

<svelte:head>
	<title>Eiko Games - A cozy place to play</title>
</svelte:head>

<main>
	<div class="content">
		<div class="title-wrapper">
			<h1>Eiko Games</h1>
		</div>

		<p class="tagline">A cozy place to play</p>

		<p class="countdown-context">First game drops New Year's Eve · 6:00 PM HST</p>

		<div class="countdown">
			<div class="time-block">
				<span class="time-value">{padZero(timeLeft.days)}</span>
        <span class="time-label">Days</span>
			</div>
			<span class="separator">:</span>
      <div class="time-block">
        <span class="time-value">{padZero(timeLeft.hours)}</span>
        <span class="time-label">Hours</span>
      </div>
      <span class="separator">:</span>
      <div class="time-block">
        <span class="time-value">{padZero(timeLeft.minutes)}</span>
        <span class="time-label">Mins</span>
      </div>
      <span class="separator">:</span>
      <div class="time-block">
        <span class="time-value">{padZero(timeLeft.seconds)}</span>
        <span class="time-label">Secs</span>
      </div>
		</div>
	</div>
	<div class="decorative">✦</div>
</main>

<style>
	main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    position: relative;
  }

  .content {
    text-align: center;
    max-width: 42rem;
  }

  .title-wrapper {
    position: relative;
    display: inline-block;
    padding: 1.5rem 2.5rem;
    margin-bottom: 1rem;
    border-radius: 1rem;
  }

  .title-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    padding: 3px;
    background: linear-gradient(
      90deg,
      #d4a574,
      #c9a87c,
      #e8c49a,
      #d4a574,
      #b8956e,
      #c9a87c,
      #e8c49a,
      #d4a574
    );
    background-size: 300% 100%;
    animation: gradient-shift 6s ease infinite;
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  h1 {
    font-size: clamp(3rem, 10vw, 4.5rem);
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--color-text-primary);
  }

  .tagline {
    font-size: clamp(1.125rem, 3vw, 1.25rem);
    color: var(--color-text-muted);
    margin-bottom: 4rem;
  }

  .countdown-context {
    font-size: clamp(1rem, 2.5vw, 1.125rem);
    color: var(--color-text-subtle);
    letter-spacing: 0.05em;
    margin-bottom: 2rem;
  }

  .countdown {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: clamp(1rem, 4vw, 2.5rem);
  }

  .time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .time-value {
    font-size: clamp(3rem, 10vw, 4.5rem);
    font-weight: 300;
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .time-label {
    font-size: clamp(0.75rem, 2vw, 1rem);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-top: 0.5rem;
  }

  .separator {
    font-size: clamp(2.5rem, 8vw, 3.5rem);
    font-weight: 300;
    color: var(--color-separator);
    margin-top: 0.25rem;
  }

  .decorative {
    position: absolute;
    bottom: 2rem;
    font-size: 0.875rem;
    letter-spacing: 0.1em;
    color: var(--color-accent);
  }
</style>