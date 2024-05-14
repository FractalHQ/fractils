// Box methods adapted from irojs: https://github.com/jaames/iro.js

import type { InputColor } from '../../inputs/InputColor'

import { disableable, type Disableable } from '../../../decorators/disableable-class-decorator'
import { Color, type ColorValue } from '../../../color/color'
import { tooltip } from '../../../actions/tooltip'
import { mapRange } from '../../../utils/mapRange'
import { debounce } from '../../../utils/debounce'
import { create } from '../../../utils/create'
import { clamp } from '../../../utils/clamp'
import { EventManager } from '$lib/utils/EventManager'

export type LayoutDirection = 'vertical' | 'horizontal' | ''

export type WheelDirection = 'clockwise' | 'anticlockwise' | ''

export interface ColorPickerOptions {
	/**
	 * The initial color of the color picker.  Can be any valid {@link ColorValue}.
	 * @default '#fff'
	 */
	color: ColorValue
	/**
	 * The container element for the color picker.
	 */
	container?: HTMLElement
	/**
	 * An array of color swatches.
	 */
	swatches: ColorValue[]
	/**
	 * The radius of the color picker handle (the little circle
	 * that moves around the color picker) in pixels.
	 * @default 10
	 */
	handleSize: number
	disabled: boolean | (() => boolean)
}

export const COLOR_PICKER_DEFAULTS: ColorPickerOptions = {
	color: '#fff',
	swatches: [],
	handleSize: 10,
	container: undefined,
	disabled: false,
}

export type ColorPickerElements = {
	container: HTMLDivElement
	canvas: HTMLCanvasElement
	handle: HTMLDivElement
	hueSlider: HTMLInputElement
	alphaSlider: HTMLInputElement
}

// export class ColorPicker extends Controller<ColorPickerElements> {

export interface ColorPicker extends Disableable {}

@disableable
export class ColorPicker {
	opts: ColorPickerOptions
	elements: ColorPickerElements
	element: HTMLDivElement

	private _ctx: CanvasRenderingContext2D
	private _height = 16 * 3
	private _width = 256
	private _resizeObserver: ResizeObserver

	private _gradientWhite!: CanvasGradient
	private _gradientBlack!: CanvasGradient

	private _dragging = false
	private _lockCursorPosition = false

	private _evm = new EventManager()

	constructor(
		public input: InputColor,
		options?: Partial<ColorPickerOptions>,
	) {
		const opts = { ...COLOR_PICKER_DEFAULTS, ...options }

		this.opts = opts

		// Make sure the rect is accurate on mount.
		const style = input.expanded ? {} : { height: '0px' }
		const container = create('div', {
			classes: ['fracgui-input-color-picker-container'],
			parent: options?.container ?? input.elements.controllers.container,
			style,
		})
		this.element = container

		const canvas = create('canvas', {
			classes: ['fracgui-input-color-picker-canvas'],
			parent: container,
			height: this._height,
		})
		// Reposition the handle when the canvas is resized.
		const debouncedUpdateHandle = debounce(this._updateHandle, 100)
		this._resizeObserver = new ResizeObserver(() => debouncedUpdateHandle())
		this._resizeObserver.observe(canvas)

		const handle = create('div', {
			classes: ['fracgui-input-color-picker-handle'],
			parent: container,
			style: {
				background: input.state.value.hexString,
			},
		})

		const hueSlider = create('input', {
			type: 'range',
			classes: ['fracgui-input-range', 'fracgui-input-color-picker-hue'],
			parent: container,
			min: 0,
			max: 359,
		})
		this._evm.listen(hueSlider, 'input', this._updateStateFromHue as EventListener)

		tooltip(hueSlider, {
			parent: container,
			text: () => `${this.input.state.value.hsla.h}`,
			placement: 'top',
			offsetX: '0px',
			anchor: {
				x: 'mouse',
				y: hueSlider.querySelector('#thumb'),
			},
			style: {
				background: 'var(--fracgui-bg-a)',
				color: 'var(--fracgui-fg-a)',
			},
		})

		const alphaSlider = create('input', {
			type: 'range',
			classes: ['fracgui-input-range', 'fracgui-input-color-picker-alpha'],
			parent: container,
			min: 0,
			max: 1,
			step: 0.01,
		})
		this._evm.listen(alphaSlider, 'input', this.setAlpha as EventListener)

		tooltip(alphaSlider, {
			parent: container,
			text: () => `${this.input.state.value.alpha}`,
			placement: 'top',
			offsetX: '0px',
			anchor: {
				x: 'mouse',
				y: alphaSlider.querySelector('#thumb'),
			},
			style: {
				background: 'var(--fracgui-bg-a)',
				color: 'var(--fracgui-fg-a)',
			},
		})

		this.elements = {
			container,
			canvas,
			handle,
			hueSlider,
			alphaSlider,
		}

		this.disabled = this.opts.disabled

		this._ctx = canvas.getContext('2d')!
		this.canvas.width = this._width
		this.refresh()

		this._evm.listen(this.canvas, 'click', this.#onClick as EventListener)
		this._evm.listen(this.canvas, 'pointerdown', this.#onPointerDown)
		this._evm.listen(window, 'pointermove', this.#onPointerMove, { passive: true })

		this.#updateGradients()
		setTimeout(this.draw, 10)
		setTimeout(this._updateHandle, 20)
	}

	get canvas() {
		return this.elements.canvas
	}

	get hue() {
		return this.input.state.value.hue
	}

	get alpha() {
		return this.input.state.value.alpha
	}

	enable = () => {
		if (this.disabled) this.disabled = false
		this.elements.container.classList.remove('fracgui-disabled')
		this.elements.alphaSlider.disabled = false
		this.elements.hueSlider.disabled = false
		this.elements.canvas.style.pointerEvents = 'auto'
		return this
	}

	disable = () => {
		if (!this.disabled) this.disabled = true
		this.elements.container.classList.add('fracgui-disabled')
		this.elements.alphaSlider.disabled = true
		this.elements.hueSlider.disabled = true
		this.elements.canvas.style.pointerEvents = 'none'
		return this
	}

	set(v: ColorValue) {
		this.input.state.value.set(v)
		this.input.refresh()
		this.refresh()
	}

	setAlpha = (e: InputEvent) => {
		this.input.state.value.alpha = Number((e.target as HTMLInputElement).value)
		this.input.refresh()
	}

	#lastColor: Color | undefined

	/**
	 * Updates the UI to reflect the current state of the color picker.
	 */
	refresh = () => {
		const color = this.input.state.value

		if (this.#lastColor?.hex8String === color.hex8String) return this
		this.#lastColor = color.clone()

		this.elements.hueSlider.value = String(this.hue)
		this.elements.alphaSlider.value = String(this.alpha)
		this.elements.alphaSlider.style.color = color.hexString

		this.draw()

		if (this._lockCursorPosition) {
			// Update the color only.
			this.elements.handle.style.background = color.hexString
			this._lockCursorPosition = false
		} else {
			this._updateHandle()
		}

		return this
	}

	draw = () => {
		this.#fill(`hsl(${this.hue}, 100%, 50%)`)
		this.#fill(this._gradientWhite)
		this.#fill(this._gradientBlack)
	}

	#fill(style: string | CanvasGradient) {
		this._ctx.fillStyle = style
		this._ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
	}

	#updateGradients() {
		this._gradientWhite = this._ctx.createLinearGradient(0, 0, this.canvas.width, 0)
		this._gradientWhite.addColorStop(0, 'rgba(255,255,255,1)')
		this._gradientWhite.addColorStop(1, 'rgba(255,255,255,0)')

		this._gradientBlack = this._ctx.createLinearGradient(0, 0, 0, this.canvas.height)
		this._gradientBlack.addColorStop(0, 'rgba(0,0,0,0)')
		this._gradientBlack.addColorStop(1, 'rgba(0,0,0,1)')
	}

	//· Pointer Events ···································································¬

	#onPointerDown = (e: PointerEvent) => {
		this.element.dispatchEvent(new CustomEvent('onPointerDown'))
		this._dragging = true
		this._updateFromMousePosition(e)

		addEventListener('pointerup', this.#onPointerUp, { once: true })
	}

	#onPointerMove = (e: PointerEvent) => {
		if (this._dragging) {
			this._updateFromMousePosition(e)
		}
	}

	#onPointerUp = () => {
		this.element.dispatchEvent(new CustomEvent('onPointerUp'))
		this._dragging = false
	}

	#onClick = (e: PointerEvent) => {
		this._updateFromMousePosition(e)
		this._dragging = false
	}

	/**
	 * Updates the color picker's state based on the current mouse position.
	 */
	private _updateFromMousePosition(e: PointerEvent) {
		const { left, top, width, height } = this.canvas.getBoundingClientRect()
		const x = clamp(e.clientX - left, 0, width)
		const y = clamp(e.clientY - top, 0, height)

		const { s, v } = this._getColorAtPosition(x, y)
		this.input.state.value.hsv = { h: this.hue, s, v }
		this.input.set(this.input.state.value)

		this._drawHandle(this._getHandlePosition(this.input.state.value))
	}
	//⌟

	/**
	 * Maps canvas `x` and `y` coordinates to their respective `s` and `v` color values.
	 */
	private _getColorAtPosition = (x: number, y: number) => {
		const { width, height } = this.canvas.getBoundingClientRect()
		const r = this.opts.handleSize / 3

		return {
			s: mapRange(x, r, width - r, 0, 100),
			v: mapRange(y, r, height - r, 100, 0),
		}
	}

	private _updateStateFromHue = (e: InputEvent) => {
		this._lockCursorPosition = true
		const commit = {
			input: this.input,
			from: this.input.state.value.rgba as any as Color, // todo
		}

		const hue = Number((e.target as HTMLInputElement).value)

		const { s, v, a } = this.input.state.value.hsva
		this.input.state.value.hsva = { h: hue, s, v, a }
		this.input.set(this.input.state.value)

		this.input.undoManager?.commit({
			...commit,
			to: this.input.state.value.rgba as any as Color, // todo
		})
		this.elements.handle.style.background = this.input.state.value.hexString

		this.draw()
	}

	private _updateHandle = (color = this.input.state.value) => {
		this._drawHandle(this._getHandlePosition(color))
	}

	/**
	 * Get the current handle position for a given color.
	 */
	private _getHandlePosition = (color: Color) => {
		const { width, height } = this.canvas.getBoundingClientRect()
		const r = this.opts.handleSize / 2

		return {
			x: mapRange(color.hsv.s, 0, 100, r, width - r),
			y: mapRange(color.hsv.v, 0, 100, height - r, r),
		}
	}

	private _drawHandle = (coords: { x: number; y: number }) => {
		this.elements.handle.style.transform = `translate(${coords.x}px, ${coords.y}px)`
		this.elements.handle.style.background = this.input.state.value.hexString
	}

	dispose() {
		this._ctx = null!

		this.elements.alphaSlider.remove()
		this.elements.hueSlider.remove()
		this.elements.handle.remove()
		this.elements.canvas.remove()
		this.elements.container.remove()

		this._resizeObserver.disconnect()

		this._evm.dispose()
	}
}
