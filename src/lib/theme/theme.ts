import { localStorageStore } from '../utils/localStorageStore'
import { get, writable } from 'svelte/store'

export type Theme = 'light' | 'dark' | 'system'

const initialTheme =
	typeof window !== 'undefined' && globalThis.localStorage && 'theme' in localStorage
		? localStorage.getItem('theme') ?? 'dark'
		: 'dark'

/**
 * A store for the current theme persisted in local storage.
 */
export const theme = localStorageStore<Theme>('theme', initialTheme as Theme)

const detectSystemPreference = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')

/**
 * Applies system preference theme and registers a listener for changes.
 */
export async function initTheme() {
	if (typeof window === 'undefined') return
	window
		?.matchMedia('(prefers-color-scheme: dark)')
		.addEventListener('change', detectSystemPreference)

	if (localStorage)
		if ('theme' in localStorage && theme) {
			try {
				const pref = get(theme)
				if (pref) {
					applyTheme(pref as Theme)
				}
			} catch (err) {
				console.log(
					'%c Unable to access theme preference in local storage 😕',
					'color:coral',
				)
				console.error(err)
				localStorage.removeItem('theme')
			}
		} else {
			applySystemTheme()
		}
}

/**
 * Toggles {@link theme} to and from light / dark mode
 */
export function toggleTheme() {
	if (typeof window === 'undefined') return
	const activeTheme = theme ? get(theme) : initialTheme
	activeTheme == 'light' ? applyTheme('dark') : applyTheme('light')
}

export const initComplete = writable(false)

const applySystemTheme = (): void => {
	if (typeof window === 'undefined') return
	window?.matchMedia('(prefers-color-scheme: dark)').matches
		? applyTheme('dark')
		: applyTheme('light')
}

/**
 * Applies a specific theme
 * @param newTheme - The theme to apply
 */
export function applyTheme(newTheme: Theme) {
	if (typeof window === 'undefined') return
	document?.documentElement?.setAttribute('theme', newTheme)
	try {
		theme?.set(newTheme)
	} catch (err) {
		console.error('%c Unable to save theme preference in local storage 😕', 'color:coral')
	}
}
