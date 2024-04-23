import type { ElementOrSelector, ElementsOrSelectors } from './select'
import type { resizable } from '../actions/resizable'
import type { State } from '../utils/state'

import { debounce } from '../utils/debounce'
import { Logger } from '../utils/logger'
import { state } from '../utils/state'
import { select } from './select'
import { clamp } from './clamp'
import { gr } from './l'
import { collisionClampX, collisionClampY } from './collisions'

/**
 * Represents a dom element's bounding rectangle.
 */
export interface VirtualRect {
	left: number
	top: number
	right: number
	bottom: number
}

/**
 * The sides of an element that can be resized by the {@link resizable} action.
 */
export type Side = 'top' | 'right' | 'bottom' | 'left'

/**
 * The corners of an element that can be resized by the {@link resizable} action.
 * @see {@link Side}
 */
export type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left'

//! We should use the same bounds as Draggable...
// /**
//  * Represents the bounds to which the draggable element is limited to.
//  */
// export type DragBounds = ElementOrSelector | false | Partial<VirtualRect>

/**
 * Options for the {@link resizable} action.
 */
export interface ResizableOptions {
	/**
	 * To only allow resizing on certain sides, specify them here.
	 * @default ['right']
	 */
	sides: Side[]
	/**
	 * To only allow resizing on certain corners, specify them here.
	 * @default []
	 */
	corners: ('top-left' | 'top-right' | 'bottom-right' | 'bottom-left')[]
	/**
	 * The size of the resize handle in pixels.
	 * @default 6
	 */
	grabberSize: number | string
	/**
	 * Optional callback function that runs when the element is resized.
	 * @default () => void
	 */
	onResize: (size: { width: number; height: number }) => void
	/**
	 * If provided, the size of the element will be persisted
	 * to local storage under the specified key.
	 * @default undefined
	 */
	localStorageKey?: string
	/**
	 * Use a visible or invisible gutter.
	 * @default false
	 */
	visible: boolean
	/**
	 * Gutter css color (if visible = `true`)
	 * @default 'var(--fg-d, #1d1d1d)'
	 */
	color: string
	/**
	 * Border radius of the element.
	 * @default '0.5rem'
	 */
	borderRadius: string
	/**
	 * The element to use as the bounds for resizing.
	 * @default window['document']['documentElement']
	 */
	bounds: ElementOrSelector

	//! We should use the same bounds as Draggable...
	//  **
	//  * The boundary to which the draggable element is limited to.
	//  *
	//  * Valid values:
	//  *
	//  * - `undefined` - defaults to `document.documentElement`
	//  * - An `HTMLElement` or query selector string, _i.e. `.container` or `#container`_
	//  * - `'parent'` - the element's {@link HTMLElement.offsetParent|offsetParent}
	//  * - `'body'` - `document.body`
	//  * - `false` - no boundary
	//  * - `{ top: number, right: number, bottom: number, left: number }` - A custom {@link VirtualRect rect} relative to the viewport.
	//  *
	//  * **Note**: Make sure the bounds is smaller than the node's min size.
	//  * @default undefined
	//  */
	//  bounds: DragBounds

	/**
	 * Element's or selectors which will act as collision obstacles for the draggable element.
	 */
	obstacles: ElementsOrSelectors
	/**
	 * Whether to apply different `cursor` values to grabbers.
	 */
	cursors: boolean
	/**
	 * The classnames to apply to the resize grabbers, used for styling.
	 * @default { default: 'resize-grabber', active: 'resize-grabbing' }
	 */
	classes: {
		/** @default 'resize-grabber' */
		default: string
		/** @default 'resize-grabbing' */
		active: string
	}
}

export const RESIZABLE_DEFAULTS: ResizableOptions = {
	sides: ['right'],
	corners: [],
	grabberSize: 6,
	onResize: () => {},
	localStorageKey: undefined,
	visible: false,
	color: 'var(--fg-d, #1d1d1d)',
	borderRadius: '50%',
	obstacles: undefined,
	cursors: true,
	classes: {
		default: 'resize-grabber',
		active: 'resize-grabbing',
	},
	bounds: 'document',
} as const

const px = (size: number | string) => {
	if (typeof size === 'number') return `${size}px`
	else return size
}

/**
 * Makes an element resizable by dragging its edges.  For the
 * svelte-action version, see {@link resizable}.
 *
 * @param node - The element to make resizable.
 * @param options - {@link ResizableOptions}
 *
 * @example Basic
 * ```ts
 * import { Resizable } from 'fractils'
 *
 * const node = document.createElement('div')
 * new Resizable(node)
 * ```
 *
 * @example Advanced
 * ```ts
 * import { Resizable } from 'fractils'
 *
 * const node = document.createElement('div')
 * new Resizable(node, {
 * 	sides: ['left', 'bottom'],
 * 	grabberSize: 3,
 * 	onResize: () => console.log('resized'),
 * 	localStorageKey: 'resizableL::size',
 * 	visible: false,
 * 	color: 'var(--fg-d)',
 * 	borderRadius: '0.5rem',
 * })
 * ```
 */
export class Resizable implements Omit<ResizableOptions, 'size' | 'obstacles'> {
	static initialized = false
	opts: ResizableOptions

	sides!: ResizableOptions['sides']
	corners!: ResizableOptions['corners']
	color!: ResizableOptions['color']
	visible!: ResizableOptions['visible']
	borderRadius!: ResizableOptions['borderRadius']
	grabberSize!: ResizableOptions['grabberSize']
	onResize!: ResizableOptions['onResize']
	cursors!: ResizableOptions['cursors']
	classes!: ResizableOptions['classes']

	bounds: HTMLElement
	obstacleEls: HTMLElement[]
	size: State<{ width: number; height: number }>
	localStorageKey?: string

	#activeGrabber: HTMLElement | null = null
	#listeners: (() => void)[] = []
	#cleanupGrabListener: (() => void) | null = null
	#cornerGrabberSize: number

	#log: Logger

	constructor(
		public node: HTMLElement,
		options?: Partial<ResizableOptions>,
	) {
		const opts = Object.assign({}, RESIZABLE_DEFAULTS, options) as ResizableOptions
		// const opts = { ...RESIZABLE_DEFAULTS, ...options }
		Object.assign(this, opts)
		this.opts = opts

		const label = this.localStorageKey ? gr(':' + this.localStorageKey) : ''
		this.#log = new Logger('resizable:' + label, {
			fg: 'GreenYellow',
			deferred: false,
		})
		this.#log.fn('constructor').info({ opts, this: this })

		this.node.classList.add('fractils-resizable')

		this.#cornerGrabberSize = +this.grabberSize * 3

		this.bounds = select(opts.bounds)[0] ?? globalThis.document?.documentElement

		this.obstacleEls = select(opts.obstacles)

		if (!Resizable.initialized) {
			Resizable.initialized = true
			this.generateGlobalCSS()
		}

		const { offsetWidth: width, offsetHeight: height } = node

		this.size = state({ width, height }, { key: this.localStorageKey })

		//? Load size from local storage.
		if (this.localStorageKey) {
			const { width, height } = this.size.value

			if (width === 0 || height === 0) {
				this.size.set({
					width: this.node.offsetWidth,
					height: this.node.offsetHeight,
				})
			} else {
				if (this.corners.length || this.sides.some(s => s.match(/left|right/))) {
					node.style.width = width + 'px'
				}

				if (this.corners.length || this.sides.some(s => s.match(/top|bottom/))) {
					node.style.height = height + 'px'
				}
			}

			node.dispatchEvent(new CustomEvent('resize'))
		}

		this.createGrabbers()

		if (+this.node.style.minWidth > this.boundsRect.width) {
			console.error('Min width is greater than bounds width.')
			return
		}
	}

	get boundsRect() {
		return this.bounds.getBoundingClientRect()
	}

	saveSize = debounce(() => {
		this.size.set({
			width: this.node.offsetWidth,
			height: this.node.offsetHeight,
		})
	}, 50)

	//? Create resize grabbers.

	createGrabbers() {
		for (const [side, type] of [
			...this.sides.map(s => [s, 'side']),
			...this.corners.map(c => [c, 'corner']),
		]) {
			const grabber = document.createElement('div')
			grabber.classList.add(this.opts.classes.default)
			grabber.classList.add(this.opts.classes.default + '-' + type)
			grabber.classList.add(this.opts.classes.default + '-' + side)
			grabber.dataset['side'] = side
			// grabber.style.setProperty('opacity', this.opts.visible ? '1' : '0')

			grabber.addEventListener('pointerdown', this.onGrab)
			this.#listeners.push(() => grabber.removeEventListener('pointerdown', this.onGrab))

			this.node.appendChild(grabber)
		}
	}

	clickOffset = { x: 0, y: 0 }

	// getClosestObstLeft = () => {
	// 	let closestObst = -Infinity
	// 	for (const obstacle of this.obstacleEls) {
	// 		const o = obstacle.getBoundingClientRect()
	// 		// too high || too low || opposite side
	// 		if (this.rect.top > o.bottom || this.rect.bottom < o.top || this.rect.left < o.right)
	// 			continue
	// 		closestObst = Math.max(closestObst, o.right)
	// 	}
	// 	return closestObst
	// }

	// getClosestObstRight = () => {
	// 	let closestObst = Infinity
	// 	for (const obstacle of this.obstacleEls) {
	// 		const o = obstacle.getBoundingClientRect()
	// 		// too high || too low || opposite side
	// 		if (this.rect.top > o.bottom || this.rect.bottom < o.top || this.rect.right > o.left)
	// 			continue
	// 		closestObst = Math.min(closestObst, o.left)
	// 	}
	// 	return closestObst
	// }

	// getClosestObstTop = () => {
	// 	let closestObst = -Infinity
	// 	for (const obstacle of this.obstacleEls) {
	// 		const o = obstacle.getBoundingClientRect()
	// 		// too high || too low || opposite side
	// 		if (this.rect.left > o.right || this.rect.right < o.left || this.rect.top < o.bottom)
	// 			continue
	// 		closestObst = Math.max(closestObst, o.bottom)
	// 	}
	// 	return closestObst
	// }

	// getClosestObstBottom = () => {
	// 	let closestObst = Infinity
	// 	for (const obstacle of this.obstacleEls) {
	// 		const o = obstacle.getBoundingClientRect()
	// 		// too high || too low || opposite side
	// 		if (this.rect.left > o.right || this.rect.right < o.left || this.rect.bottom > o.top)
	// 			continue
	// 		closestObst = Math.min(closestObst, o.top)
	// 	}
	// 	return closestObst
	// }

	onGrab = (e: PointerEvent) => {
		this.node.setPointerCapture(e.pointerId)
		this.#activeGrabber = e.currentTarget as HTMLElement
		this.#activeGrabber.classList.add(this.classes.active)
		document.body.classList.add(this.classes.active)

		this.obstacleEls = select(this.opts.obstacles)

		const side = this.#activeGrabber.dataset['side']
		if (side!.match(/top/)) this.clickOffset.y = e.clientY - this.rect.top
		if (side!.match(/bottom/)) this.clickOffset.y = e.clientY - this.rect.bottom
		if (side!.match(/left/)) this.clickOffset.x = e.clientX - this.rect.left
		if (side!.match(/right/)) this.clickOffset.x = e.clientX - this.rect.right

		e.preventDefault()
		e.stopPropagation()

		this.#cleanupGrabListener?.()
		document.addEventListener('pointermove', this.onMove)
		this.#cleanupGrabListener = () => document.removeEventListener('pointermove', this.onMove)

		// this.node.dispatchEvent(new CustomEvent('grab', { detail: { side } }))
		this.#computedStyleValues()
		document.addEventListener('pointerup', this.onUp, { once: true })
	}

	get translateX() {
		return +this.node.dataset['translateX']! || 0
	}
	set translateX(v: number) {
		this.node.dataset['translateX'] = String(v)
	}

	get translateY() {
		return +this.node.dataset['translateY']! || 0
	}
	set translateY(v: number) {
		this.node.dataset['translateY'] = String(v)
	}

	get rect() {
		return this.node.getBoundingClientRect()
	}

	// resizeLeft = (x: number) => {
	// 	const { minWidth, maxWidth, paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
	// 		window.getComputedStyle(this.node)

	// 	const clampedX = Math.max(x, this.getClosestObstLeft())
	// 	let deltaX = clampedX - this.rect.left
	// 	if (deltaX === 0) return this

	// 	const borderBox =
	// 		parseFloat(paddingLeft) +
	// 		parseFloat(paddingRight) +
	// 		parseFloat(borderLeftWidth) +
	// 		parseFloat(borderRightWidth)
	// 	const min = Math.max((parseFloat(minWidth) || 0) + borderBox, 25)

	// 	const newWidth = clamp(this.rect.width - deltaX, min, +maxWidth || Infinity)

	// 	if (newWidth === min) deltaX = this.rect.width - newWidth
	// 	this.translateX += deltaX
	// 	this.node.style.setProperty('translate', `${this.translateX}px ${this.translateY}px`)

	// 	this.node.style.width = `${newWidth}px`
	// 	return this
	// }

	// resizeRight = (x: number) => {
	// 	const { minWidth, maxWidth, paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
	// 		window.getComputedStyle(this.node)

	// 	const clampedX = Math.min(x, this.getClosestObstRight())
	// 	let deltaX = clampedX - this.rect.right
	// 	if (deltaX === 0) return this

	// 	const borderBox =
	// 		parseFloat(paddingLeft) +
	// 		parseFloat(paddingRight) +
	// 		parseFloat(borderLeftWidth) +
	// 		parseFloat(borderRightWidth)
	// 	const min = Math.max((parseFloat(minWidth) || 0) + borderBox, 25)

	// 	const newWidth = clamp(this.rect.width + deltaX, min, +maxWidth || Infinity)

	// 	this.node.style.width = `${newWidth}px`
	// 	return this
	// }

	// resizeTop = (y: number) => {
	// 	const {
	// 		minHeight,
	// 		maxHeight,
	// 		paddingTop,
	// 		paddingBottom,
	// 		borderTopWidth,
	// 		borderBottomWidth,
	// 	} = window.getComputedStyle(this.node)

	// 	const clampedY = Math.max(y, this.getClosestObstTop())
	// 	let deltaY = clampedY - this.rect.top
	// 	if (deltaY === 0) return this

	// 	const borderBox =
	// 		parseFloat(paddingTop) +
	// 		parseFloat(paddingBottom) +
	// 		parseFloat(borderTopWidth) +
	// 		parseFloat(borderBottomWidth)
	// 	const min = Math.max((parseFloat(minHeight) || 0) + borderBox, 25)

	// 	const newHeight = clamp(this.rect.height - deltaY, min, +maxHeight || Infinity)

	// 	if (newHeight === min) deltaY = this.rect.height - newHeight
	// 	this.translateY += deltaY
	// 	this.node.style.setProperty('translate', `${this.translateX}px ${this.translateY}px`)

	// 	this.node.style.height = `${newHeight}px`
	// 	return this
	// }

	// resizeBottom = (y: number) => {
	// 	const {
	// 		minHeight,
	// 		maxHeight,
	// 		paddingTop,
	// 		paddingBottom,
	// 		borderTopWidth,
	// 		borderBottomWidth,
	// 	} = window.getComputedStyle(this.node)
	// 	const yClosest = this.getClosestObstBottom()

	// 	const clampedY = Math.min(y, yClosest)
	// 	let deltaY = clampedY - this.rect.bottom
	// 	if (deltaY === 0) return this

	// 	const borderBox =
	// 		parseFloat(paddingTop) +
	// 		parseFloat(paddingBottom) +
	// 		parseFloat(borderTopWidth) +
	// 		parseFloat(borderBottomWidth)
	// 	const min = Math.max((parseFloat(minHeight) || 0) + borderBox, 25)

	// 	const newHeight = clamp(this.rect.height + deltaY, min, +maxHeight || Infinity)

	// 	this.node.style.height = `${newHeight}px`
	// 	return this
	// }

	// #updateBounds = () => {
	// 	// refresh style left & top
	// 	const styleLeft = parseFloat(this.node.style.left) || 0
	// 	this.#boundsRect.left = -styleLeft
	// 	this.#boundsRect.right =
	// 		this.bounds.right - this.bounds.left - (this.rect.right - this.rect.left) - styleLeft

	// 	const styleTop = parseFloat(this.node.style.top) || 0
	// 	this.#boundsRect.top = -styleTop
	// 	this.#boundsRect.bottom =
	// 		this.bounds.bottom - this.bounds.top - styleTop - (this.rect.bottom - this.rect.top)
	// 	// refresh bounds element padding ...
	// 	if (this.boundsEl) {
	// 		const { paddingLeft, paddingRight, paddingTop, paddingBottom } =
	// 			window.getComputedStyle(this.boundsEl)
	// 		this.#boundsRect.left -= parseFloat(paddingLeft)
	// 		this.#boundsRect.right -= parseFloat(paddingRight)
	// 		this.#boundsRect.top -= parseFloat(paddingTop)
	// 		this.#boundsRect.bottom -= parseFloat(paddingBottom)
	// 	}
	// }

	// Private computedStyleValues

	#minWidth: GLfloat = 0
	#maxWidth: GLfloat = 0
	#minHeight: GLfloat = 0
	#maxHeight: GLfloat = 0
	#boundsRect: VirtualRect = {
		left: -Infinity,
		top: -Infinity,
		right: Infinity,
		bottom: Infinity,
	}
	#computedStyleValues = () => {
		const {
			minWidth,
			maxWidth,
			paddingLeft,
			paddingRight,
			borderLeftWidth,
			borderRightWidth,
			minHeight,
			maxHeight,
			paddingTop,
			paddingBottom,
			borderTopWidth,
			borderBottomWidth,
		} = window.getComputedStyle(this.node)

		const borderBoxX =
			parseFloat(paddingLeft) +
			parseFloat(paddingRight) +
			parseFloat(borderLeftWidth) +
			parseFloat(borderRightWidth)

		const borderBoxY =
			parseFloat(paddingTop) +
			parseFloat(paddingBottom) +
			parseFloat(borderTopWidth) +
			parseFloat(borderBottomWidth)

		this.#minWidth = Math.max((parseFloat(minWidth) || 0) + borderBoxX, 25)
		this.#maxWidth = Math.min(parseFloat(maxWidth) || Infinity)
		this.#minHeight = Math.max((parseFloat(minHeight) || 0) + borderBoxY, 25)
		this.#maxHeight = Math.min(parseFloat(maxHeight) || Infinity)

		this.#boundsRect = this.bounds.getBoundingClientRect()
	}

	resizeX = (x: number, borderleft?: boolean) => {
		let deltaX
		// if (this.#boundsRect) x = clamp(x, this.#boundsRect.left, this.#boundsRect.right)
		if (borderleft) {
			deltaX = x - this.rect.left
			if (deltaX === 0) return this

			deltaX = collisionClampX(deltaX, this.rect, this.obstacleEls)
			if (this.#boundsRect) deltaX = Math.max(deltaX, this.#boundsRect.left - this.rect.left)

			const newWidth = clamp(this.rect.width - deltaX, this.#minWidth, this.#maxWidth)
			if (newWidth === this.#minWidth) deltaX = this.rect.width - newWidth
			this.translateX += deltaX
			this.node.style.setProperty('translate', `${this.translateX}px ${this.translateY}px`)

			this.node.style.width = `${newWidth}px`
		} else {
			deltaX = x - this.rect.right
			if (deltaX === 0) return this

			deltaX = collisionClampX(deltaX, this.rect, this.obstacleEls)
			if (this.#boundsRect)
				deltaX = Math.min(deltaX, this.#boundsRect.right - this.rect.right)
			const newWidth = clamp(this.rect.width + deltaX, this.#minWidth, this.#maxWidth)
			this.node.style.width = `${newWidth}px`
		}
		return this
	}
	resizeY = (y: number, bordertop?: boolean) => {
		let deltaY
		// if (this.#boundsRect) y = clamp(y, this.#boundsRect.top, this.#boundsRect.bottom)
		if (bordertop) {
			deltaY = y - this.rect.top
			if (deltaY != 0) {
				deltaY = collisionClampY(deltaY, this.rect, this.obstacleEls)
				if (this.#boundsRect)
					deltaY = Math.max(deltaY, this.#boundsRect.top - this.rect.top)
				const newHeight = clamp(this.rect.height - deltaY, this.#minHeight, this.#maxHeight)

				if (newHeight === this.#minHeight) deltaY = this.rect.height - newHeight
				this.translateY += deltaY
				this.node.style.setProperty(
					'translate',
					`${this.translateX}px ${this.translateY}px`,
				)
				this.node.style.height = `${newHeight}px`
			}
		} else {
			deltaY = y - this.rect.bottom
			if (deltaY !== 0) {
				deltaY = collisionClampY(deltaY, this.rect, this.obstacleEls)
				if (this.#boundsRect)
					deltaY = Math.min(deltaY, this.#boundsRect.bottom - this.rect.bottom)
				const newHeight = clamp(this.rect.height + deltaY, this.#minHeight, this.#maxHeight)
				this.node.style.height = `${newHeight}px`
			}
		}

		return this
	}

	/**
	 * This is where all the resizing logic happens.
	 */
	onMove = (e: PointerEvent) => {
		if (!this.#activeGrabber) {
			console.error('No active grabber')
			return
		}

		// const bounds = this.boundsRect

		// const x = clamp(e.clientX, bounds.left, bounds.left + bounds.width) - this.clickOffset.x
		// const y = clamp(e.clientY, bounds.top, bounds.top + bounds.height) - this.clickOffset.y

		const x = e.clientX - this.clickOffset.x
		const y = e.clientY - this.clickOffset.y

		const { side } = this.#activeGrabber.dataset
		this.#log.fn('onMove').debug(side)

		// switch (side) {
		// 	case 'top-left':
		// 		this.resizeTop(y).resizeLeft(x)
		// 		break
		// 	case 'top-right':
		// 		this.resizeTop(y).resizeRight(x)
		// 		break
		// 	case 'bottom-right':
		// 		this.resizeBottom(y).resizeRight(x)
		// 		break
		// 	case 'bottom-left':
		// 		this.resizeBottom(y).resizeLeft(x)
		// 		break
		// 	case 'top':
		// 		this.resizeTop(y)
		// 		break
		// 	case 'right':
		// 		this.resizeRight(x)
		// 		break
		// 	case 'bottom':
		// 		this.resizeBottom(y)
		// 		break
		// 	case 'left':
		// 		this.resizeLeft(x)
		// 		break
		// }

		switch (side) {
			case 'top-left':
				this.resizeY(y, true).resizeX(x, true)
				break
			case 'top-right':
				this.resizeY(y, true).resizeX(x)
				break
			case 'bottom-right':
				this.resizeY(y).resizeX(x)
				break
			case 'bottom-left':
				this.resizeY(y).resizeX(x, true)
				break
			case 'top':
				this.resizeY(y, true)
				break
			case 'right':
				this.resizeX(x)
				break
			case 'bottom':
				this.resizeY(y)
				break
			case 'left':
				this.resizeX(x, true)
				break
		}

		this.node.dispatchEvent(new CustomEvent('resize'))

		if (this.localStorageKey) this.saveSize()

		this.onResize({
			width: this.node.offsetWidth,
			height: this.node.offsetHeight,
		})
	}

	onUp = () => {
		this.#cleanupGrabListener?.()
		document.body.classList.remove(this.classes.active)
		this.#activeGrabber?.classList.remove(this.classes.active)

		this.node.dispatchEvent(new CustomEvent('release'))
	}

	/**
	 * Creates the global stylesheet (but only once).
	 */
	generateGlobalCSS() {
		let css = /*css*/ `
			
			.resize-grabber {
				position: absolute;
				display: flex;

				padding: ${px(this.grabberSize)};

				opacity: ${this.opts.visible ? 1 : 0};
				border-radius: ${this.borderRadius} !important;
				border-radius: inherit;

				transition: opacity 0.1s;
			}
			
			.fractils-resizable:not(.fractils-grabbing) .resize-grabber:hover {
				opacity: 0.5;
			}

			.resize-grabber:active {
				opacity: 0.75;
			}
		`

		if (this.opts.cursors) {
			css += /*css*/ `
				.resize-grabbing *, .resize-grabber:active {
					cursor: grabbing !important;
				}
			`
		}

		const cursor = (v: string) =>
			!this.opts.cursors
				? ''
				: `
				cursor: ${v};`

		const offset = -this.grabberSize
		const gradient = `transparent 35%, ${this.color} 40%, ${this.color} 50%, transparent 60%, transparent 100%`
		const lengthPrcnt = 98

		if (this.sides.includes('top'))
			css += /*css*/ `
			.${this.classes.default}-top {
				${cursor('ns-resize')}
				top: ${offset}px;
				left: ${50 - lengthPrcnt * 0.5}%;

				width: ${lengthPrcnt}%;
				height: ${this.grabberSize}px;

				background: linear-gradient(to bottom, ${gradient});
			}
		`
		if (this.sides.includes('right'))
			css += /*css*/ `
			.${this.classes.default}-right {
				${cursor('ew-resize')}
				right: ${offset}px;
				top: ${50 - lengthPrcnt * 0.5}%;

				width: ${this.grabberSize}px;
				height: ${lengthPrcnt}%;

				background: linear-gradient(to left, ${gradient});
			}
		`
		if (this.sides.includes('bottom'))
			css += /*css*/ `
			.${this.classes.default}-bottom {
				${cursor('ns-resize')}
				bottom: ${offset}px;
				left: ${50 - lengthPrcnt * 0.5}%;

				width: ${lengthPrcnt}%;
				height: ${this.grabberSize}px;

				background: linear-gradient(to top, ${gradient});
			}
		`
		if (this.sides.includes('left'))
			css += /*css*/ `
				.${this.classes.default}-left {
					${cursor('ew-resize')}
					left: ${offset}px;
					top: ${50 - lengthPrcnt * 0.5}%;

					width: ${this.grabberSize}px;
					height: ${lengthPrcnt}%;

					background: linear-gradient(to right, ${gradient});
				}
			`

		css += `.fractils-grabbing .resize-grabber {cursor: default}`

		const cSize = this.#cornerGrabberSize
		const cScale = 3
		const cOffset = -6
		const cPadding = 20

		const opposites = {
			'top-left': `${100 - cPadding}% ${100 - cPadding}%`,
			'top-right': `${cPadding}% ${100 - cPadding}%`,
			'bottom-left': `${100 - cPadding}% ${cPadding}%`,
			'bottom-right': `${cPadding}% ${cPadding}%`,
		} as const

		const corner = (corner: Corner, cursorValue: string) => {
			if (!this.corners.includes(corner)) return

			const classname = `${this.classes.default}-${corner}`
			const sides = corner.replace(this.classes.default, '').split('-')

			css += `
				.${classname} {${cursor(cursorValue)}
					${sides[0]}: ${cOffset / cScale}px;
					${sides[1]}: ${cOffset / cScale}px;
					width: ${cSize}px;
					height: ${cSize}px;
				}
				.${classname}::after {
					content: '';
					scale: ${cScale};
					width: 100%;
					height: 100%;
					background: radial-gradient(farthest-corner at ${opposites[corner]}, transparent 50%, ${this.color} 100%);
					border-radius: 15%;
				}
			`
		}

		corner('top-left', 'nwse-resize')
		corner('top-right', 'nesw-resize')
		corner('bottom-left', 'nesw-resize')
		corner('bottom-right', 'nwse-resize')

		const styleEl = document.createElement('style')
		styleEl.innerHTML = css

		document.head.appendChild(styleEl)
		this.#log.debug('Initialized global styles.')
	}

	dispose() {
		for (const cleanup of this.#listeners) {
			cleanup()
		}
		this.#cleanupGrabListener?.()
	}
}
