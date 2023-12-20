<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	import { goto } from '$app/navigation';
	import GameAsteroidOne from '$lib/components/GameAsteroidOne.svelte';
	import GameAsteroidTwo from '$lib/components/GameAsteroidTwo.svelte';
	import GameSpaceship from '$lib/components/GameSpaceship.svelte';
	import GameBullet from '$lib/components/GameBullet.svelte';
	import GameExplosion from '$lib/components/GameExplosion.svelte';
	import GameAlert from '$lib/components/GameAlert.svelte';
	import type {
		Alert,
		Asteroid,
		Bonus,
		Bullet,
		Coordinates,
		Hitbox
	} from '$lib/types/games.type.js';
	import IconChevronRight from '$lib/assets/icon-chevron-right.svg';
	import './game.css';
	import './tailwind.css';

	/** Constants */
	const BULLET_SIZE = { height: 8, width: 8 };
	const SPACE_SHIP_ROTATION_SPEED = 5;
	const SPACE_SHIP_SIZE = { height: 40, width: 40 };
	const ASTEROID_SIZE = { height: 40, width: 40 };
	const BONUS_SIZE = { height: 8, width: 8 };
	const BONUS_PROBABILITY = 0.5;
	const DEFAULT_SPACE_SHIP_SPEED = 15;
	const DEFAULT_BULLETS_PER_FRAME_LIMIT = 70;
	const DEFAULT_BULLETS_SPEED = 10;
	const DEFAULT_ASTEROIDS_LIMIT = 3;
	const DEFAULT_ASTEROIDS_SPEED = 3;

	/** Game core variables */
	let frame: number;
	let lastFrameCalledTime = Date.now();
	let fps = 0;
	let xBoundaries = 0;
	let yBoundaries = 0;
	let activeKeys: string[] = [];
	let start = false;
	let pause = false;
	let gameOver = false;
	let scoreIntervalId: ReturnType<typeof setInterval>;
	let pauseTimeout1: ReturnType<typeof setTimeout>;
	let pauseTimeout2: ReturnType<typeof setTimeout>;
	let pauseTimeout3: ReturnType<typeof setTimeout>;

	/** Score variables */
	let score = 0;

	/** Actions variables */
	export let returnPath: string;

	/** Alert */
	let alert: Alert = {
		display: false,
		message: '',
		color: 'red',
		duration: 0
	};

	/** Space ship variables */
	let spaceShipPosInitialized = false;
	let spaceShipPosition = spring(
		{ x: 0, y: 0 },
		{
			stiffness: 0.1,
			damping: 0.28
		}
	);
	let spaceShipRotation = 0;
	let spaceShipSpeed = DEFAULT_SPACE_SHIP_SPEED;

	/** Bullets variables */
	let bullets: Bullet[] = [];
	let lastBulletFrame = 0;
	let bulletsPerFrameLimit = DEFAULT_BULLETS_PER_FRAME_LIMIT;
	let bulletsSpeed = DEFAULT_BULLETS_SPEED;

	/** Asteroids variables */
	let asteroidsLimit = DEFAULT_ASTEROIDS_LIMIT;
	let asteroidsLimitIncreased = false;
	let asteroidsSpeed = DEFAULT_ASTEROIDS_SPEED;
	let asteroidsSpeedIncreased = false;
	let lastAsteroidFrame = 0;
	let asteroids: Asteroid[] = [];

	/** Bonuses */
	let bonuses: Bonus[] = [];

	/** Reactive statements */
	$: {
		if (score !== 0 && score % 40 === 0 && !asteroidsLimitIncreased) {
			asteroidsLimitIncreased = true;
			asteroidsLimit += 1;

			alert = {
				display: true,
				message: 'MORE ASTEROIDS INCOMING',
				color: 'red',
				duration: 1000
			};
		} else {
			asteroidsLimitIncreased = false;
		}

		if (score !== 0 && score % 50 === 0 && !asteroidsSpeedIncreased) {
			asteroidsLimitIncreased = true;
			asteroidsLimit += 1;

			alert = {
				display: true,
				message: 'ASTEROIDS SPEED INCREASED',
				color: 'red',
				duration: 1000
			};
		} else {
			asteroidsLimitIncreased = false;
		}
	}

	onMount(() => {
		/** Cancel animation frame if unmount. */
		return () => cancelAnimationFrame(frame);
	});

	const pointsPerTime = () => {
		scoreIntervalId = setInterval(() => {
			score += 1;
		}, 500);
	};

	/**
	 * Check if 2 entities collides.
	 *
	 * @param coord1
	 * @param coord2
	 * @param hitbox1
	 * @param hitbox2
	 */
	const checkCollision = (
		coord1: Coordinates,
		coord2: Coordinates,
		hitbox1: Hitbox,
		hitbox2: Hitbox
	): boolean => {
		if (
			coord1.x <= coord2.x + hitbox2.width &&
			coord2.x <= coord1.x + hitbox1.width &&
			coord1.y <= coord2.y + hitbox2.height &&
			coord2.y <= coord1.y + hitbox1.height
		) {
			return true;
		}

		return false;
	};

	/**
	 * Set the spaceship x and y position depending of keys pressed.
	 */
	const setSpaceShipPosition = () => {
		let y = $spaceShipPosition.y;
		let x = $spaceShipPosition.x;
		let rotation = spaceShipRotation;

		/** Rotate left */
		if (activeKeys.includes('ArrowLeft') || activeKeys.includes('KeyA')) {
			rotation -= SPACE_SHIP_ROTATION_SPEED;
		}

		/** Rotate right */
		if (activeKeys.includes('ArrowRight') || activeKeys.includes('KeyD')) {
			rotation += SPACE_SHIP_ROTATION_SPEED;
		}

		/** On forward, calculate the new position of the spaceship */
		if (activeKeys.includes('ArrowUp') || activeKeys.includes('KeyW')) {
			const radian = ((rotation - 90) * Math.PI) / 180;
			const newX = x + Math.cos(radian) * spaceShipSpeed;
			const newY = y + Math.sin(radian) * spaceShipSpeed;

			/** Check if not outside of x boundaries */
			if (newX + SPACE_SHIP_SIZE.width + 5 <= xBoundaries && newX >= 5) {
				x = newX;
			}

			/** Check if not outside of y boundaries */
			if (newY + SPACE_SHIP_SIZE.height + 5 <= yBoundaries && newY >= 5) {
				y = newY;
			}
		}

		/** On backward, calculate the new position of the spaceship */
		if (activeKeys.includes('ArrowDown') || activeKeys.includes('KeyS')) {
			const radian = ((rotation - 90) * Math.PI) / 180;
			const newX = x - Math.cos(radian) * spaceShipSpeed;
			const newY = y - Math.sin(radian) * spaceShipSpeed;

			if (newX + SPACE_SHIP_SIZE.width + 5 <= xBoundaries && newX >= 5) {
				x = newX;
			}

			if (newY + SPACE_SHIP_SIZE.height + 5 <= yBoundaries && newY >= 5) {
				y = newY;
			}
		}

		/** Set the position and rotation of the spaceship */
		spaceShipPosition.set({ x, y });
		spaceShipRotation = rotation;

		/** Check if collision with bonus */
		bonuses.forEach((bonus) => {
			try {
				const bonusCollision = checkCollision(
					{ x, y },
					{ x: bonus.position.x, y: bonus.position.y },
					{ width: SPACE_SHIP_SIZE.width, height: SPACE_SHIP_SIZE.height },
					{ width: BONUS_SIZE.width, height: BONUS_SIZE.height }
				);

				if (bonusCollision) {
					const random = Math.random();

					if (random <= 0.33) {
						bulletsSpeed += 1;

						alert = {
							display: true,
							message: 'MORE BULLETS SPEED',
							color: 'green',
							duration: 1000
						};
					} else if (random <= 0.66) {
						spaceShipSpeed += 1;

						alert = {
							display: true,
							message: 'MORE SPACE SHIP SPEED',
							color: 'green',
							duration: 1000
						};
					} else {
						if (bulletsPerFrameLimit > 10) {
							bulletsPerFrameLimit -= 5;

							alert = {
								display: true,
								message: 'MORE BULLETS',
								color: 'green',
								duration: 1000
							};
						} else {
							const rerollRandom = Math.random();

							if (rerollRandom < 0.5) {
								bulletsSpeed += 1;

								alert = {
									display: true,
									message: 'MORE BULLETS SPEED',
									color: 'green',
									duration: 1000
								};
							} else {
								spaceShipSpeed += 1;

								alert = {
									display: true,
									message: 'MORE SPACE SHIP SPEED',
									color: 'green',
									duration: 1000
								};
							}
						}
					}

					throw {};
				}
			} catch {
				bonuses = bonuses.filter((item) => item.id !== bonus.id);

				return;
			}
		});
	};

	const setBulletsPositions = () => {
		let y = $spaceShipPosition.y;
		let x = $spaceShipPosition.x;

		/** On space and if more that 10 frames since last bullet we add one to the bullets array */
		if (
			activeKeys.includes('Space') &&
			frame - lastBulletFrame >= bulletsPerFrameLimit &&
			!gameOver
		) {
			lastBulletFrame = frame;
			bullets = [
				...bullets,
				{
					id: frame,
					position: { x: x + SPACE_SHIP_SIZE.width / 2, y: y + SPACE_SHIP_SIZE.height / 2 },
					initialSpaceShipState: { position: $spaceShipPosition, rotation: spaceShipRotation }
				}
			];
		}

		/** Update bullet position and remove them if they're out of bounds */
		bullets = bullets.map((bullet) => {
			const initialRotationAngle = bullet.initialSpaceShipState.rotation;
			const radian = ((initialRotationAngle - 90) * Math.PI) / 180;

			const newX = bullet.position.x + Math.cos(radian) * bulletsSpeed;
			const newY = bullet.position.y + Math.sin(radian) * bulletsSpeed;

			bullet.position = { x: newX, y: newY };

			return bullet;
		});

		bullets = bullets.filter(
			(bullet) =>
				bullet.position.x > -100 &&
				bullet.position.x < xBoundaries + 100 &&
				bullet.position.y > -100 &&
				bullet.position.y < yBoundaries + 100
		);
	};

	/**
	 * Create and set asteroids positions
	 */
	const setAsteroidsPositions = () => {
		/** Create asteroid if possible */
		if (asteroids.length < asteroidsLimit && frame - lastAsteroidFrame > 100) {
			lastAsteroidFrame = frame;

			const minSide = Math.ceil(1);
			const maxSide = Math.floor(4);

			/** Get random side where the asteroid spawns */
			const side: 1 | 2 | 3 | 4 = (Math.floor(Math.random() * (maxSide - minSide + 1)) +
				minSide) as 1 | 2 | 3 | 4;

			let minX = 0;
			let maxX = 0;
			let minY = 0;
			let maxY = 0;

			/** Set spawning point */
			if (side === 1) {
				minX = -100;
				maxX = -100;
				minY = 0;
				maxY = yBoundaries;
			}

			if (side === 2) {
				minX = 0;
				maxX = xBoundaries;
				minY = -100;
				maxY = -100;
			}

			if (side === 3) {
				minX = xBoundaries + 100;
				maxX = xBoundaries + 100;
				minY = 0;
				maxY = yBoundaries;
			}

			if (side === 4) {
				minX = 0;
				maxX = xBoundaries;
				minY = yBoundaries + 100;
				maxY = yBoundaries + 100;
			}

			const randomX = Math.random() * (maxX - minX) + minX;
			const randomY = Math.random() * (maxY - minY) + minY;
			const randomType = Math.random() < 0.5 ? 1 : 2;

			/** Calculate angle between asteroid and space ship */
			const dy = $spaceShipPosition.y - randomY;
			const dx = $spaceShipPosition.x - randomX;

			const radian = Math.atan2(dy, dx);
			const degree = radian * (180 / Math.PI);

			asteroids = [
				...asteroids,
				{
					id: frame,
					position: { x: randomX, y: randomY },
					rotation: degree,
					type: randomType
				}
			];
		}

		/** Update asteroids positions */
		asteroids = asteroids.map((asteroid) => {
			const radian = (asteroid.rotation * Math.PI) / 180;

			const newX = asteroid.position.x + Math.cos(radian) * asteroidsSpeed;
			const newY = asteroid.position.y + Math.sin(radian) * asteroidsSpeed;

			if (newX) {
				asteroid.position = { x: newX, y: newY };
			}

			const spaceShipCollision = checkCollision(
				{ x: asteroid.position.x, y: asteroid.position.y },
				{ x: $spaceShipPosition.x, y: $spaceShipPosition.y },
				{ width: ASTEROID_SIZE.width, height: ASTEROID_SIZE.height },
				{ width: SPACE_SHIP_SIZE.width, height: SPACE_SHIP_SIZE.height }
			);

			if (spaceShipCollision) {
				clearInterval(scoreIntervalId);
				gameOver = true;
			}

			return asteroid;
		});

		/** Remove asteroids if it collides with a bullet */
		asteroids = asteroids.filter((asteroid) => {
			try {
				/** Collide with one of the bullets */
				bullets.forEach((bullet, index, list) => {
					const bulletCollision = checkCollision(
						{ x: asteroid.position.x, y: asteroid.position.y },
						{ x: bullet.position.x, y: bullet.position.y },
						{ width: ASTEROID_SIZE.width, height: ASTEROID_SIZE.height },
						{ width: BULLET_SIZE.width, height: BULLET_SIZE.height }
					);

					if (bulletCollision) {
						/** Remove bullet */
						list.splice(index, 1);

						/** Increase score */
						score += 10;

						/** Add bonus */
						if (Math.random() - BONUS_PROBABILITY <= 0) {
							bonuses = [
								...bonuses,
								{
									id: frame,
									position: {
										x: asteroid.position.x + ASTEROID_SIZE.width / 2,
										y: asteroid.position.y + ASTEROID_SIZE.height / 2
									}
								}
							];
						}
						throw {};
					}
				});
			} catch {
				return false;
			}

			/** Out of bounds */
			if (
				asteroid.position.x > -100 &&
				asteroid.position.x < xBoundaries + 100 &&
				asteroid.position.y > -100 &&
				asteroid.position.y < yBoundaries + 100
			) {
				return true;
			}

			return false;
		});
	};

	/**
	 * Animations loop.
	 */
	const animationsLoop = () => {
		if (!spaceShipPosInitialized && xBoundaries !== 0 && yBoundaries !== 0) {
			$spaceShipPosition.x = xBoundaries / 2 - SPACE_SHIP_SIZE.width / 2;
			$spaceShipPosition.y = yBoundaries / 2 - SPACE_SHIP_SIZE.height / 2;
			spaceShipPosInitialized = true;
		} else {
			setAsteroidsPositions();

			/** Stop space ship if game over */
			if (!gameOver) {
				setSpaceShipPosition();
			}

			setBulletsPositions();

			const delta = (Date.now() - lastFrameCalledTime) / 1000;
			lastFrameCalledTime = Date.now();
			fps = 1 / delta;
		}

		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(animationsLoop);
	};

	/**
	 * Display the pause menu.
	 */
	const onPause = () => {
		clearInterval(scoreIntervalId);
		cancelAnimationFrame(frame);
		pause = true;
	};

	/**
	 * Resume the game.
	 */
	const onResume = () => {
		pause = false;
		alert = {
			message: '3',
			display: true,
			color: 'blue',
			duration: 900
		};

		pauseTimeout1 = setTimeout(() => {
			alert = {
				message: '2',
				display: true,
				color: 'blue',
				duration: 900
			};
		}, 1000);

		pauseTimeout2 = setTimeout(() => {
			alert = {
				message: '1',
				display: true,
				color: 'blue',
				duration: 900
			};
		}, 2000);

		pauseTimeout3 = setTimeout(() => {
			alert = {
				message: 'GOGOGO',
				display: true,
				color: 'blue',
				duration: 900
			};

			pointsPerTime();

			animationsLoop();
		}, 3000);
	};

	/**
	 * Save active key on key down.
	 */
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Escape' && !gameOver && start) {
			clearTimeout(pauseTimeout1);
			clearTimeout(pauseTimeout2);
			clearTimeout(pauseTimeout3);

			if (pause) {
				onResume();
			} else {
				onPause();
			}
		} else {
			if (!activeKeys.includes(e.code)) {
				activeKeys = [...activeKeys, e.code];
			}
		}
	};

	/**
	 * Remove active key on key up.
	 */
	const onKeyUp = (e: KeyboardEvent) => {
		if (activeKeys.includes(e.code)) {
			activeKeys = activeKeys.filter((item) => item !== e.code);
		}
	};

	/**
	 * Reset all values to default.
	 */
	const resetEverything = () => {
		bonuses = [];
		bullets = [];
		asteroids = [];
		spaceShipRotation = 0;
		score = 0;
		spaceShipSpeed = DEFAULT_SPACE_SHIP_SPEED;
		bulletsPerFrameLimit = DEFAULT_BULLETS_PER_FRAME_LIMIT;
		bulletsSpeed = DEFAULT_BULLETS_SPEED;
		asteroidsLimit = DEFAULT_ASTEROIDS_LIMIT;
		asteroidsSpeed = DEFAULT_ASTEROIDS_SPEED;
	};

	/**
	 * Restart the game.
	 */
	const onRetry = () => {
		resetEverything();

		gameOver = false;

		pointsPerTime();
	};

	/**
	 * Start the game.
	 */
	const onStartClick = () => {
		start = true;

		/** Start animations loop */
		animationsLoop();

		pointsPerTime();
	};

	/**
	 * Clear and go to main page.
	 */
	const onQuit = () => {
		resetEverything();
		gameOver = false;
		cancelAnimationFrame(frame);
		goto(returnPath);
	};
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />

<div
	class="more-relative more-h-full more-w-full more-font-mono more-overflow-hidden more-bg-black more-text-white"
	bind:clientWidth={xBoundaries}
	bind:clientHeight={yBoundaries}
>
	<!-- Score -->
	<div
		class="more-absolute more-left-0 more-top-0 more-right-0 more-z-10 more-py-2 more-px-4 more-flex more-justify-between"
	>
		<div>FPS: {fps.toFixed()}</div>
		<div>Score: {score}</div>
	</div>

	{#if pause}
		<div
			class="more-h-full more-w-full more-flex more-flex-col more-justify-center more-items-center"
		>
			<div>
				<div class="more-flex more-flex-col more-items-center">
					<button
						class="more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2 more-w-full"
						on:click={onResume}
					>
						Resume
					</button>

					<button
						class="more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2 more-w-full more-my-4"
						on:click={onQuit}
					>
						Quit
					</button>

					<p class="more-mb-2">How to play:</p>

					<div class="more-border">
						<img class=" -more-rotate-90" src={IconChevronRight} alt="Up arrow" />
					</div>
					<div class="more-flex">
						<div class="more-border">
							<img class="more-rotate-180" src={IconChevronRight} alt="Left arrow" />
						</div>
						<div class="more-border-b">
							<img class="more-rotate-90" src={IconChevronRight} alt="Down arrow" />
						</div>
						<div class="more-border">
							<img src={IconChevronRight} alt="Right arrow" />
						</div>
					</div>
					<div class="more-w-[150%] more-border more-p-2 more-text-center more-mt-4">Space</div>
				</div>
			</div>
		</div>
	{:else if start}
		<!-- Space ship -->
		{#if spaceShipPosInitialized && !gameOver}
			<div
				class="more-absolute more-z-10"
				style="transform: translate({$spaceShipPosition.x}px, {$spaceShipPosition.y}px) rotate({spaceShipRotation}deg);"
			>
				<GameSpaceship />
			</div>
		{/if}

		<!-- Space ship explosion -->
		{#if spaceShipPosInitialized && gameOver}
			<div
				class="more-absolute more-z-10"
				style="transform: translate({$spaceShipPosition.x}px, {$spaceShipPosition.y}px) rotate({spaceShipRotation}deg);"
			>
				<GameExplosion />
			</div>
		{/if}

		<!-- Bullets -->
		{#each bullets as bullet (bullet.id)}
			<div
				style="transform: translate({bullet.position.x}px, {bullet.position.y}px);"
				out:fade|local
			>
				<GameBullet />
			</div>
		{/each}

		<!-- Asteroids -->
		{#each asteroids as asteroid (asteroid.id)}
			<div
				class="more-absolute more-z-10"
				style="transform: translate({asteroid.position.x}px, {asteroid.position
					.y}px) rotate({asteroid.rotation}deg);"
				transition:fade|local
			>
				{#if asteroid.type === 1}
					<GameAsteroidOne />
				{:else}
					<GameAsteroidTwo />
				{/if}
			</div>
		{/each}

		<!-- Bonuses -->
		{#each bonuses as bonus (bonus.id)}
			<div transition:fade|local>
				<div
					class="more-absolute more-h-3 more-w-3 more-flex more-justify-center more-items-center more-rounded"
					style="left:{bonus.position.x}px;top:{bonus.position.y}px"
				>
					<div
						class="more-animate-ping more-h-full more-w-full more-rounded-full more-bg-green-400 more-opacity-75"
					/>
					<div class="more-absolute more-rounded-full more-h-2 more-w-2 more-bg-green-500" />
				</div>
			</div>
		{/each}

		<!-- Game over text -->
		{#if gameOver}
			<div
				class="more-absolute more-z-10 more-left-1/2 more-top-1/2 -more-translate-x-1/2 -more-translate-y-1/2"
			>
				<p class="more-text-2xl">Game Over</p>
				<p class="more-text-lg more-text-center">Score: {score}</p>
				<button
					class="more-w-full more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2 more-my-4"
					on:click={onRetry}
				>
					Retry
				</button>
				<button
					class="more-w-full more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2"
					on:click={onQuit}
				>
					Quit
				</button>
			</div>
		{/if}

		<GameAlert {alert} />
	{:else}
		<div
			class="more-h-full more-w-full more-flex more-flex-col more-justify-center more-items-center"
		>
			<div>
				<div class="more-flex more-flex-col more-items-center">
					<button
						class="more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2 more-w-full"
						on:click={onStartClick}
					>
						Start
					</button>

					<button
						class="more-border more-border-white more-bg-black hover:more-bg-white hover:more-text-black more-transition-colors more-duration-200 more-p-2 more-w-full more-my-4"
						on:click={onQuit}
					>
						Quit
					</button>

					<p class="more-mb-2 more-underline">How to play:</p>

					<div class="more-border">
						<img class=" -more-rotate-90" src={IconChevronRight} alt="Up arrow" />
					</div>
					<div class="more-flex">
						<div class="more-border">
							<img class="more-rotate-180" src={IconChevronRight} alt="Left arrow" />
						</div>
						<div class="more-border-b">
							<img class="more-rotate-90" src={IconChevronRight} alt="Down arrow" />
						</div>
						<div class="more-border">
							<img src={IconChevronRight} alt="Right arrow" />
						</div>
					</div>
					<div class="more-w-[150%] more-border more-p-2 more-text-center more-mt-4">Space</div>
				</div>
			</div>
			<div class="more-text-xs more-text-center more-mt-5 more-px-4">
				WARNING: This video game may potentially trigger seizures for people with photosensitive
				epilepsy. Viewer discretion is advised.
			</div>
		</div>
	{/if}
</div>
