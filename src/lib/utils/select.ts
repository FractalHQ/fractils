import { Logger } from './logger'
import { c, r } from './l'

let log: Logger

export type ElementsOrSelectors = string | HTMLElement | (string | HTMLElement)[] | undefined

/**
 * Takes in any combination of selectors and elements, and
 * resolves them all into an array of HTMLElements.
 */
export function select(input: ElementsOrSelectors, node?: HTMLElement): HTMLElement[] {
	log ??= new Logger('select', { fg: 'AliceBlue' })

	if (typeof window === 'undefined') return []

	if (input === undefined) return []

	const elements = Array.isArray(input) ? input : [input]

	node ??= document.documentElement

	return elements.flatMap((el): HTMLElement[] => {
		if (el instanceof HTMLElement) return [el]

		const foundEls = node!.querySelectorAll<HTMLElement>(el)
		if (foundEls.length === 0) {
			log.error(r(`No elements found for selector`) + ': ' + c(el))
			log.error(r(`Make sure the selector is a child of the target node.`))
			log.debug({ input, node, elements })

			return []
		}
		return Array.from(foundEls)
	})
}
