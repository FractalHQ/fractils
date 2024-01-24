import { randomColor, type CSSColor } from './color'

import { BROWSER, DEV } from 'esm-env'
import { isSafari } from './safari'
import { b, fn, r, y } from './l'
import { defer } from './defer'

// todo - Is there a reliable way to type an ImportMetaEnv entry globally for consumers?
const ENABLED = DEV && import.meta.env.LOG_LEVEL !== 'none'
const bypassStyles = false
const bypassDefer = false

export class Logger {
	log: ReturnType<typeof logger>

	constructor(
		public title: string,
		public options?: Parameters<typeof logger>[1],
	) {
		this.log = logger(title, options)
	}

	l(prefix: string, ...args: any[]) {
		if (this.buffer.length) {
			this.log(prefix, ...this.buffer, ...args)
			this.buffer = []
		} else {
			this.log(...args)
		}
	}

	debug(...args: any[]) {
		if (DEV) this.l('🐞', ...args)
	}

	info(...args: any[]) {
		if (DEV) this.l(b('ⓘ'), ...args)
	}

	warn(...args: any[]) {
		this.l(y('⚠'), ...args)
	}

	error(...args: any[]) {
		this.log(r('⛔'), ...args)
	}

	buffer = [] as any[]

	fn(str: string) {
		this.buffer.push(fn(str))
		return this
	}
}

export const logger = (
	title = 'LOG',
	options?: {
		/**
		 * Whether to use the styled logger or the regular console.log.
		 * @defaultValue true
		 */
		styled?: boolean
		/**
		 * Whether to defer the log to the next idle state.  Disabled on Safari to avoid crashing.
		 * @defaultValue true
		 */
		deferred?: boolean
		/**
		 * The foreground color of the log.
		 * @defaultValue randomColor()
		 */
		fg?: CSSColor | (string & {})
		/**
		 * The background color of the log.
		 * @defaultValue transparent
		 */
		bg?: CSSColor | (string & {})
		/**
		 * Any additional CSS to apply to the log.
		 * @defaultValue ''
		 */
		css?: string
		/**
		 * Run the logger on the server.
		 * @defaultValue false
		 */
		server?: boolean
		/**
		 * Run the logger in the browser.
		 * @defaultValue true
		 */
		browser?: boolean
		/**
		 * Print's the url of the file that called the logger.
		 */
		callsite?: boolean
	},
) => {
	options ??= {}

	const fg = options.fg || randomColor()
	const bg = options.bg || 'transparent'
	const css = options.css ?? ''
	const browser = options.browser ?? true
	const server = options.server ?? false

	if (BROWSER && !browser) return () => void 0
	if (!BROWSER && !server) return () => void 0

	options.styled ??= true
	const styled = options.styled && !bypassStyles

	options.deferred ??= true
	const deferred = options.deferred && !bypassDefer && !isSafari()

	if (!ENABLED) return () => void 0

	let callsite: URL | undefined = undefined
	if (options.callsite || true) {
		callsite = getCallSite().url
	}

	const fn = !styled
		? (...args: any[]) => {
				console.log(`| ${callsite} |\n| ${title} |`, ...args)
			}
		: (...args: any[]) => {
				let messageConfig = '%c%s%c '

				args.forEach((argument) => {
					const type = typeof argument
					switch (type) {
						case 'bigint':
						case 'number':
							messageConfig += '%d   '
							break

						case 'string':
							messageConfig += '%s   '
							break

						case 'object':
						case 'boolean':
						case 'undefined':
						default:
							messageConfig += '%o   '
					}
				})

				messageConfig += '%c%s'

				console.log(
					messageConfig,
					`color:${fg};background:${bg};padding:0.1rem;${css}`,
					// `${title.padEnd(10, ' ')} |`,
					`${title.padEnd(10, ' ')}`,
					`color:initial;background:${bg};padding:0.1rem;${css}`,
					...args,
					`color:#666;background:${bg};padding:0.1rem;${css};font-size:0.66rem;`,
					options?.callsite ? `${callsite}` : '',
				)
			}

	if (!deferred) return fn

	return (...args: any[]) => defer(() => fn(...args))
}

/**
 * Gets the call site of a logger function.
 * @returns A url to the file, the file name, line number, and column number of the call site.
 */
function getCallSite() {
	const err = new Error()
	const stackLines = err.stack?.split('\n').slice(2).filter(Boolean)

	let match: string | undefined
	let matches = [] as (string | undefined)[]

	// Everything
	while (!match && stackLines?.length) {
		match = matchLine(stackLines.shift())
	}

	if (!match) return failed()

	try {
		const url = new URL(match || import.meta.url)
		const [_t, lineNumber, columnNumber] = url.searchParams.get('t')?.split(':') || []
		const callsite = `${url.pathname}:${lineNumber}:${columnNumber}`
		const filename = url.pathname.split('/').pop()

		return {
			callsite,
			filename,
			url,
		}
	} catch (error) {
		return failed()
	}

	function matchLine(line: any) {
		if (!line) return ''
		if (line.includes('logger.ts')) return ''

		const regex = /https?:\/\/[^\s)]+(?=\)?)/g //? advanced
		const match = line.match(regex)?.[0]
		return match || ''
	}

	function failed() {
		if (DEV && BROWSER) {
			console.warn('getCallSite(): Failed to parse call site from stack trace.')

			console.groupCollapsed('getCallSite(): debug info')
			console.log('match:', match)
			console.log('match attempts:', matches)
			console.log('stackLines:', stackLines)
			console.log('err:', err)
			console.groupEnd()
		}
		return {
			callsite: '/unknown:0:0',
			filename: 'unknown',
			url: new URL('about:blank'),
		}
	}
}
