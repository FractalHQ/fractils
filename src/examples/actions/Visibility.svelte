<script lang="ts">
	import type { Direction } from '$lib/actions/visibility.js';
	import type { VisibilityEvent } from '$lib';

	import { visibility } from '$lib';

	import Example from '$examples/_lib/Item/Example.svelte';
	import Params from '$examples/_lib/Item/Params.svelte';
	import Item from '$examples/_lib/Item/Item.svelte';
	import html from './Visibility.html?raw';

	import { bounceOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let visible: boolean;
	let scrollDir: Direction | undefined;
	let options = { threshold: 0.75 };

	const path = 'actions/visibility/index.ts';

	const params = [
		{
			type: 'param',
			title: 'options',
			description: 'Optional config:',
			children: [
				{
					type: 'option',
					title: 'view',
					description: 'The root view.  Defaults to `window`.',
				},
				{
					type: 'option',
					title: 'margin',
					description: "Margin around root view - 'px' or '%'. Default '0px'.",
				},
				{
					type: 'option',
					title: 'threshold',
					description:
						"% of pixels required in view to trigger event.  An array will trigger multiple events - '0-1'.  Default 0.",
				},
				{
					type: 'option',
					title: 'once',
					description: 'Whether to dispatch events only once. Default false.',
				},
			],
		},
		{
			type: 'event',
			title: 'v-change',
			description: 'Triggered when the element enters or exits view.',
		},
		{
			type: 'event',
			title: 'v-enter',
			description: 'Triggered when the element enters view.',
		},
		{
			type: 'event',
			title: 'v-exit',
			description: 'Triggered when the element exits view.',
		},
		{
			type: 'event',
			title: 'detail',
			description: '',
			children: [
				{
					type: 'boolean',
					title: 'isVisible',
					description: 'True if the element is currently in the viewport.',
				},
				{
					type: 'element',
					title: 'entry',
					description: 'The element being observed.',
				},
				{
					type: 'object',
					title: 'scrollDirection',
					description: `The direction of the scroll. <span class="code">scrollDirection.vertical</span> and <span class="code">scrollDirection.horizonal</span> will be either <span class="code">'up'</span>, <span class="code">'down'</span>, <span class="code">'left'</span>, or <span class="code">'right'</span>.</span>`,
				},
			],
		},
	];

	const handleChange = ({ detail }: VisibilityEvent) => {
		visible = detail.isVisible;
		scrollDir = detail.scrollDirection.vertical;
	};
</script>

<Item title="visibility" type="action" {path}>
	<div slot="description">
		Observes an element's current viewport visibility and dispatches relevant events.

		<Params {params} --width="200px" />
	</div>

	<Example --h="382px" {html}>
		<div class="visibility" use:visibility={options} on:v-change={handleChange}>
			{#if visible}
				<div in:fly|global={{ y: -20, delay: 250, duration: 1000, easing: bounceOut }}>
					going {scrollDir === 'down' ? '⬇' : '⬆'}
				</div>
			{/if}
		</div>
	</Example>
</Item>

<style lang="scss">
	.visibility {
		display: flex;
		align-items: center;
		justify-content: center;

		width: 90%;
		height: 50px;
		margin: auto;

		color: var(--text);
	}
</style>
