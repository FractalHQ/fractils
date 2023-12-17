/**
 * Undocumented modules are marked with // todo
 */

// Stores

export { mobile, screenH, screenW, scrollY, mouse, mobileThreshold } from './stores/Device.svelte'
export { default as Fractils } from './stores/Device.svelte' // todo - deprecate legacy name
export { default as Device } from './stores/Device.svelte'

// Components

export { default as Inspector } from './components/inspector/Inspector.svelte' // todo
export { default as MacScrollbar } from './components/MacScrollbar.svelte'
export { default as ThemeToggle } from './components/ThemeToggle.svelte'
export { Toasts, toast, type Toast } from './components/toast/index' // todo
export { default as OnMount } from './components/OnMount.svelte'
export { default as Tooltip } from './components/Tooltip.svelte' // todo
export { default as Switch } from './components/Switch.svelte' // todo
export { default as Range } from './components/Range.svelte' // todo
export { default as Code } from './components/Code.svelte' // todo

// Theme

export { initTheme, toggleTheme, applyTheme, theme } from './theme/theme'

// Icons
export { default as Github } from './icons/Github.svelte' // todo
export { default as Copy } from './icons/Copy.svelte' // todo

// Utils

export { highlight, HIGHLIGHT_DEFAULTS, type HighlightOptions } from './utils/highlight' // todo
export { l, n, r, g, lg, b, y, c, o, m, p, dim, bd, i, j } from './utils/l' // todo
export { coerce, coerceObject, type CoerceValue } from './utils/coerce' // todo
export { asyncLocalStorageStore } from './utils/asyncLocalStorageStore'
export { start, fmtTime, type StartOptions } from './utils/time' // todo
export { localStorageStore } from './utils/localStorageStore'
export { ArgMap, mapArgs, resolveArg } from './utils/args' // todo
export { stringify, serialize } from './utils/stringify' // todo
export { entries, keys, values } from './utils/object' // todo
export { decimalToPow } from './utils/decimalToPow' // todo
export { colors, randomColor } from './utils/color' // todo
export { cliHyperlink } from './utils/cliHyperlink' // todo
export { timestamp } from './utils/timestamp' // todo
export { truncate } from './utils/truncate' // todo
export { mapRange } from './utils/mapRange'
export { defer } from './utils/defer' // todo
export { clamp } from './utils/clamp'
export { wait } from './utils/wait'
export { log } from './utils/log'

// Actions

export { fullscreen, type FullscreenOptions } from './actions/fullscreen' // todo

export { add, type AddOptions } from './actions/add' // todo

export { clickOutside } from './actions/clickOutside'
export type {
	ClickOutsideEventDetail,
	ClickOutsideOptions,
	ClickOutsideEvent,
} from './actions/clickOutside'

export { visibility } from './actions/visibility'
export type {
	VisibilityEventDetail,
	VisibilityOptions,
	VisibilityEvent,
	ScrollDirection,
	VisibilityAttr,
	Direction,
	Position,
	Event,
} from './actions/visibility'

export { highlighter } from './actions/highlighter' // todo
export type { HighlightEventDetail, HighlightEvent, HighlightAttr } from './actions/highlighter' // todo
