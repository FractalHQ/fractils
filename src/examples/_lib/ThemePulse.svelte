<script lang="ts">
	import { onMount, tick } from 'svelte'
	import { pulse } from './lib_stores'
	import { theme } from '$lib'

	let pulseBottom: DOMRect | undefined
	let pulseTop: DOMRect | undefined
	let bottomY: number, bottomX: number, topY: number

	let h = 0
	const w = 300
	let ready = false

	async function place() {
		await tick()
		pulseBottom = document.getElementById('theme-in')?.getBoundingClientRect()
		pulseTop = document.getElementById('theme-out')?.getBoundingClientRect()

		if (pulseBottom && pulseTop) {
			const { scrollTop } = document.documentElement
			bottomY = Math.floor(pulseBottom.top + pulseBottom.height / 2 + scrollTop)
			bottomX = Math.floor(pulseBottom.left - w)
			topY = Math.floor(pulseTop.top + pulseTop.height / 2 + scrollTop)
			h = topY - bottomY
		}

		if (!ready) ready = true
	}

	let pulsate = false
	let timer: ReturnType<typeof setTimeout>
	const triggerPulse = () => {
		if (timer) clearTimeout(timer)
		pulsate = true
		timer = setTimeout(() => {
			pulsate = false
		}, 1000)
	}

	$: {
		$pulse
		triggerPulse()
	}

	onMount(() => setTimeout(place, 1000))
</script>

<svelte:window on:resize={place} />

{#if pulseBottom && ready}
	{#key $theme}
		<div
			class="pulsewrapper"
			style="
				left: {bottomX}px;
				top: {bottomY}px;
        	"
		>
			<svg
				id="pulse"
				style="width: {w}px; height: {h}px;"
				viewBox="0 0 {w} {h}"
				preserveAspectRatio="none"
				class:pulsate
			>
				<path
					class:dark={$theme === 'dark'}
					d="
                    M {w} 3
                    H {w * 0.75}
                    C {w * 0.5} 3 {w * 0.5} 2 {w * 0.5} {h * 0.1 + 3}
                    V {h * 0.9}
                    C {w * 0.5} {h - 3} {w * 0.5} {h - 3} {w * 0.75} {h - 3}
                    H {w}
                "
					fill="none"
					stroke="yellow"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<circle cx={10} cy={bottomY} r="50" fill="red" />
				<circle cx={10} cy={topY} r="50" fill="red" />
			</svg>
		</div>
	{/key}
{/if}

<style lang="scss">
	.pulsewrapper {
		position: absolute;
		z-index: 2;
	}
	#pulse {
		position: absolute;
		backface-visibility: hidden;

		stroke-dashoffset: 7rem;
	}
	path {
		stroke-dasharray: 100 1400;
		stroke: var(--fg-a);

		// &.dark {
		// 	stroke: var(--black);
		// }
	}
	.pulsate {
		animation: pulsate 1s ease-out;
	}
	@keyframes pulsate {
		0% {
			stroke-dashoffset: 333%;
		}
		100% {
			stroke-dashoffset: 101%;
		}
	}
</style>
