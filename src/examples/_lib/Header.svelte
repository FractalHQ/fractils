<template lang="pug">

	header
		h1 fractils
		p.description
			span Some stuff I often use...

</template>

<style>
	header {
		padding-top: 0.5rem;

		color: var(--fg-a);

		user-select: none;
	}

	h1,
	p {
		padding: 0 1rem;

		color: var(--fg-a);
	}

	span {
		font-variation-settings: 'wght' 200;
		font-family: var(--font-b);
		font-size: 0.9rem;

		opacity: 0.5;
	}

	:global(html[theme='light']) span {
		font-variation-settings: 'wght' 500;
	}
</style>
