import type { ColorFormat } from '$lib/color/types/colorFormat'
import type { ElementMap, InputOptions } from './Input'
import type { Folder } from '../Folder'

import { numberController } from '../controllers/number'
import { ColorPicker } from '../controllers/color/ColorPicker'
import { create } from '../../utils/create'
import { Logger } from '../../utils/logger'
import { Color } from '../../color/color'
import { state } from '../../utils/state'
import { Input } from './Input'

export type ColorMode = 'hex' | 'rgba' | 'hsla' | 'rgbaString' | 'hslaString' | 'array'

export interface LabeledRangeElements extends ElementMap {
	container: HTMLDivElement
	title: HTMLDivElement
	input: HTMLInputElement
}

export interface ColorSliderElements extends ElementMap {
	container: HTMLDivElement
	/** `rgba.r` or `hsla.h */
	a: LabeledRangeElements
	/** `rgba.g` or `hsla.s */
	b: LabeledRangeElements
	/** `rgba.b` or `hsla.l */
	c: LabeledRangeElements
	/** `rgba.a` or `hsla.a */
	d: LabeledRangeElements
}

export interface ColorControllerElements extends ElementMap<ColorPicker> {
	container: HTMLDivElement
	picker: ColorPicker['elements']
	currentColor: {
		container: HTMLDivElement
		display: HTMLDivElement
	}
	components: {
		container: HTMLDivElement
		title: HTMLDivElement
		numbers: ElementMap
	}
}

export interface ColorInputOptions extends InputOptions {
	value: ColorFormat | Color
	mode: ColorMode
}
//⌟

export const COLOR_INPUT_DEFAULTS: ColorInputOptions = {
	view: 'Color',
	title: 'Color',
	value: '#FF0000FF',
	mode: 'hex',
} as const

export class InputColor extends Input<Color, ColorInputOptions, ColorControllerElements> {
	#mode: ColorMode

	/**
	 * When true, the color picker is visible.
	 */
	expanded = true

	picker: ColorPicker

	#pickerHeight: number
	#log = new Logger('InputColor', { fg: 'cyan' })

	constructor(options: Partial<ColorInputOptions>, folder: Folder) {
		const opts = { ...COLOR_INPUT_DEFAULTS, ...options }
		super(opts, folder)

		this.opts = opts
		this.#mode = opts.mode

		this.#log.fn('constructor').info({ opts, this: this }).groupEnd()

		// Initialize state.
		if (opts.binding) {
			this.initialValue = new Color(opts.binding.target[opts.binding.key])
			this.state = state(this.initialValue)

			this.disposeCallbacks.add(
				this.state.subscribe((v) => {
					opts.binding!.target[opts.binding!.key] = v
				}),
			)
		} else {
			this.initialValue = new Color(opts.value)
			this.state = state(this.initialValue)
		}

		const container = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-container'],
			parent: this.elements.content,
		})
		this.elements.controllers.container = container

		//- Current color display.
		this.elements.controllers.currentColor = this.#createCurrentColor(container)

		//- Color picker.
		this.picker = new ColorPicker(this)
		this.elements.controllers.picker = this.picker.elements

		// I'm current handling the toggling of the picker here... but perhaps it should live in the picker itself.
		const pickerContainer = this.picker.elements.container

		this.#pickerHeight ||= pickerContainer.clientHeight
		container.appendChild(pickerContainer)

		this.elements.controllers.components = this.#createComponents(pickerContainer)

		this.state.subscribe((v) => {
			this.elements.controllers.currentColor.display.style.backgroundColor = v.hex8String
			// console.log(v.hex8String)
			// this.#refreshSliders()
			this.picker.refresh()
			this.callOnChange()
		})

		// //! TEST
		// setInterval(this.togglePicker, 3000 * Math.random() + 1000)
	}

	#createComponents = (parent: HTMLDivElement) => {
		const componentsContainer = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-components-container'],
			parent: parent,
		})

		const componentsTitle = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-components-title'],
			parent: componentsContainer,
			innerText: this.mode,
		})
		componentsContainer.appendChild(componentsTitle)

		const numbersContainer = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-components-numbers-container'],
			parent: componentsContainer,
		})
		componentsContainer.appendChild(numbersContainer)

		const numbers = {
			r: numberController(this, this.opts, numbersContainer),
			g: numberController(this, this.opts, numbersContainer),
			b: numberController(this, this.opts, numbersContainer),
		}

		return {
			container: componentsContainer,
			title: componentsTitle,
			numbers,
		}
	}

	//· Getters & Setters ····················································¬

	get mode() {
		return this.#mode
	}
	set mode(v: ColorMode) {
		this.#mode = v
		// this.#refreshSliders(v)
	}

	get a() {
		return this.mode === 'rgba' ? this.state.value.rgba.r : this.state.value.hsla.h
	}
	set a(v: number) {
		if (this.mode === 'rgba') {
			this.state.value.rgba.r = v
		} else {
			this.state.value.hsla.h = v
		}
	}

	get b() {
		return this.mode === 'rgba' ? this.state.value.rgba.g : this.state.value.hsla.s
	}
	set b(v: number) {
		if (this.mode === 'rgba') {
			this.state.value.rgba.g = v
		} else {
			this.state.value.hsla.s = v
		}
	}

	get c() {
		return this.mode === 'rgba' ? this.state.value.rgba.b : this.state.value.hsla.l
	}
	set c(v: number) {
		if (this.mode === 'rgba') {
			this.state.value.rgba.b = v
		} else {
			this.state.value.hsla.l = v
		}
	}

	get d() {
		return this.mode === 'rgba' ? this.state.value.rgba.a : this.state.value.hsla.a
	}
	set d(v: number) {
		if (this.mode === 'rgba') {
			this.state.value.rgba.a = v
		} else {
			this.state.value.hsla.a = v
		}
	}

	get aTitle() {
		return this.mode === 'rgba' ? 'r' : 'h'
	}
	get bTitle() {
		return this.mode === 'rgba' ? 'g' : 's'
	}
	get cTitle() {
		return this.mode === 'rgba' ? 'b' : 'l'
	}
	get dTitle() {
		return 'a'
	}

	//⌟

	// updateState = (v: Color | Event) => {
	// 	this.#log.fn('updateState').info({ v: 'value' in v ? v.value : v })
	// 	console.log('updateState', v)
	// 	if (v instanceof Event) {
	// 		if ('value' in v?.target!) {
	// 			console.log('value', v.target.value)
	// 		}
	// 		if (v?.target && 'value' in v.target) {
	// 			this.state.value.hex = v.target.value as HexColor
	// 		}
	// 	} else {
	// 		this.state.set(v)
	// 	}

	// 	this.#refreshSliders()
	// }

	// #refreshSliders(mode = this.opts.mode) {
	// 	this.#log.fn('refreshSliders').info({ mode })

	// 	if (mode === 'rgba') {
	// 		for (const [k, v] of entries(this.elements.controllers.components.numbers)) {
	// 			if (k === 'container') continue
	// 			;(v as HTMLInputElement).disabled = false
	// 			;(v as HTMLInputElement).min = '0'
	// 			;(v as HTMLInputElement).max = k === 'd' ? '255' : '1'
	// 			;(v as HTMLInputElement).step = k === 'd' ? '0.01' : '1'
	// 		}
	// 	}

	// 	if (mode === 'hsla') {
	// 		for (const [k, v] of entries(this.elements.controllers.components.numbers)) {
	// 			if (k === 'container') continue
	// 			;(v as HTMLInputElement).disabled = false
	// 			;(v as HTMLInputElement).min = '0'
	// 			;(v as HTMLInputElement).max = k === 'a' ? '100' : k === 'd' ? '360' : '1'
	// 			;(v as HTMLInputElement).step = k === 'd' ? '0.01' : '1'
	// 		}
	// 	}

	// 	// Disable the sliders.
	// 	for (const [k, v] of entries(this.elements.controllers.components.numbers)) {
	// 		if (k === 'container') continue
	// 		;(v as HTMLInputElement).disabled = true
	// 	}

	// 	this.elements.controllers.picker.refresh()
	// }

	#createCurrentColor(parent: HTMLDivElement) {
		const container = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-current-color-container'],
			parent,
		})

		const display = create<HTMLDivElement>('div', {
			classes: ['gui-input-color-current-color-display'],
			parent: container,
		})

		this.listen(display, 'click', this.togglePicker)

		return {
			container,
			display,
		}
	}

	#animOpts: KeyframeAnimationOptions = {
		duration: 500,
		easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
		fill: 'forwards',
	}

	get #pickerContainer() {
		return this.picker.elements.container
	}

	openPicker = (height = this.#pickerHeight + 'px') => {
		this.#pickerContainer.animate({ height }, this.#animOpts).onfinish = () => {
			this.#pickerContainer.style.overflow = 'visible'
		}

		this.expanded = true
		this.#pickerContainer.classList.add('expanded')
	}

	closePicker = () => {
		this.#pickerContainer.animate(
			[{ height: this.#pickerHeight + 'px' }, { height: 0 }],
			this.#animOpts,
		)
		this.#pickerContainer.style.overflow = 'hidden'

		this.expanded = false
		this.#pickerContainer.classList.remove('expanded')
	}

	togglePicker = () => {
		this.#pickerHeight ||= this.picker.elements.container.clientHeight
		this.#log
			.fn('togglePicker')
			.info({ expanded: this.expanded, pickerHeight: this.#pickerHeight })
		if (this.expanded) {
			this.closePicker()
		} else {
			this.openPicker()
		}
	}

	dispose() {
		super.dispose()
	}
}
