<script lang="ts">
	import type { DraggableOptions } from '$lib/utils/draggable'

	import { WindowManager } from '$lib/utils/windowManager'
	import DebugData from './DebugData.svelte'
	import { clamp, mapRange } from '$lib'
	import Window from './Window.svelte'
	import { onMount } from 'svelte'

	const dragOpts = {
		cancel: '.delete',
		placementOptions: {
			// bounds: '.page',
			margin: 20,
		},
	}

	const wm = new WindowManager({
		localStorage: {
			key: `demo-wm`,
			// size: false,
		},
		bounds: '.page',
		draggable: dragOpts,
		resizable: {
			sides: ['top', 'right', 'bottom', 'left'],
		},
		obstacles: ['.window', '.sidebar'],
	})

	let windows = [
		'top-center',
		'bottom-right',
		'bottom-center',
		'bottom-left',
		'left-center',
	] as DraggableOptions['position'][]

	function randomWindow() {
		const w = window.innerWidth
		const h = window.innerHeight
		windows.push({
			x: clamp(mapRange(Math.random(), 0, 1, 0, w - 500), 0, w),
			y: clamp(mapRange(Math.random(), 0, 1, 0, h - 400), 0, h),
		})
		windows = windows
	}

	let debugData = null as any
	let showDebugData = false
	onMount(() => (debugData = wm))

	function toggleDebug() {
		showDebugData = !showDebugData
		console.log(wm)
	}
</script>

{#if debugData && showDebugData}
	<DebugData data={debugData} />
{/if}

<div class="page">
	<div class="main">
		<div class="buttons" style:position="absolute">
			<button class:active={showDebugData} on:click={toggleDebug}>Show/Log WM</button>
			<button on:click={randomWindow}>Add Window</button>
			<button on:click={() => localStorage.clear()}>Clear localStorage</button>
		</div>

		{#each windows as placement, i (placement)}
			<Window
				{i}
				{wm}
				debug
				options={{
					draggable: { ...dragOpts, position: placement },
					resizable: {
						localStorageKey: `demo-wm`,
						sides: ['top', 'right', 'bottom', 'left'],
					},
					obstacles: ['.window', '.sidebar'],
				}}
			/>
		{/each}

		<Window
			{wm}
			i={6}
			classes={['containerbox']}
			options={{ draggable: { ...dragOpts, position: 'center' } }}
		>
			<Window
				{wm}
				title=""
				classes={['innerbox']}
				options={{
					id: 'innerbox',
					preserveZ: true,
					obstacles: '.window-6',
					localStorage: false,
					bounds: '.containerbox',
					draggable: {
						position: 'center',
					},
					resizable: false,
				}}
			>
				<p>Inside</p>
			</Window>
		</Window>
	</div>

	<div class="sidebar" />
</div>

<style lang="scss">
	.page {
		display: grid;
		grid-template-columns: 1fr 10rem;
		min-height: 100vh;
		min-width: 100vw;
		max-height: 100vh;
		max-width: 100vw;
		background: var(--bg-c);
	}

	.sidebar {
		background: var(--bg-a);
		height: 20vh;
		margin: auto 0;
	}

	button {
		margin: 1rem;
		margin-right: 0;

		background: var(--bg-b);
		padding: 0.25rem 0.4rem;
		outline: 1px solid var(--bg-e);
		border: none;
		border-radius: var(--radius-sm);

		cursor: pointer;
		font-family: var(--font-c);
		font-variation-settings: 'wght' 500;
		font-size: 0.9rem;

		&:hover,
		&.active {
			background: var(--bg-a);
		}
	}

	:global(.innerbox) {
		width: 4rem !important;
		height: 3rem !important;
		background-color: var(--bg-d);
		padding: 0.2rem;
		border-radius: var(--radius-sm);
	}
	p {
		padding: 0.5rem 0.2rem;
		color: var(--fg-d);
	}
</style>
