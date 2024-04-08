/**
 * Deep merges objects together, with some special rules:
 * - Subsequent objects must be partials of the first object.
 * - Arrays are concatenated and de-duplicated.
 * - Objects are recursively merged.
 * - `true` is replaced by objects, but not `false`.
 * - An object is never replaced with `true`, `false`, or `undefined`.
 * - The original objects are not mutated.
 */
export function deepMerge<
	// T extends {} = {},
	// U extends Partial<T> | undefined = Partial<T> | undefined,
	T,
	U,
>(target: T, ...sources: U[]): T & U {
	return sources.reduce<T & U>(
		(acc, curr) => {
			if (!curr) return acc

			const keys = Object.keys(curr)
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i] as keyof T & U
				const v = acc[k]
				const newV = curr[k as keyof U] as (T & U)[keyof T & U] | undefined

				if (Array.isArray(v) && Array.isArray(newV)) {
					acc[k] = [...new Set([...v, ...newV])] as (T & U)[keyof T & U]
				} else if (v && typeof v === 'object') {
					if (newV !== true) {
						if (newV && typeof newV === 'object') {
							acc[k] = deepMerge({ ...v }, newV)
						} else if (newV === false) {
							acc[k] = newV
						}
					}
				} else if (newV !== undefined) {
					acc[k] = newV
				}
			}
			return acc
		},
		{ ...target } as T & U,
	)
}
