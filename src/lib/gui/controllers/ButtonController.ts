import type { ElementMap } from '../inputs/Input'

import { create } from '../../utils/create'
import { Logger } from '../../utils/logger'
import { Controller } from './Controller'
import { toFn } from '../shared/toFn'

export type ButtonClickFunction = () => void

// todo - wtf is this??  All of this is already defined identically in `InputButton`...?
// todo - this whole `controller` vs `input` thing needs to be nuked from orbit and rethought entirely.

export type InputButtonOptions = {
	title: string
	text: string | (() => string)
	disabled: boolean | (() => boolean)
	onClick: () => void
}

export const BUTTON_INPUT_DEFAULTS: InputButtonOptions = {
	title: 'Button',
	text: () => 'click me',
	onClick: () => {},
	disabled: false,
} as const

export interface ButtonControllerElements extends ElementMap {
	button: HTMLButtonElement
}

export class ButtonController extends Controller<void, ButtonControllerElements> {
	#text!: () => string

	onClick: ButtonClickFunction
	element: HTMLButtonElement
	elements = {} as ButtonControllerElements
	events = ['click'] as const

	#log = new Logger('ButtonController', { fg: 'coral' })

	constructor(
		public parent: HTMLElement | undefined,
		options: Partial<InputButtonOptions>,
	) {
		const opts = Object.assign({}, BUTTON_INPUT_DEFAULTS, options)
		super(opts)
		this.#log.fn('constructor').info({ opts, this: this })

		const button = create('button', {
			classes: ['fracgui-controller', 'fracgui-controller-button'],
			parent,
		})
		this.element = this.elements.button = button

		this.text = toFn(opts.text)
		this.onClick = opts.onClick
	}

	get text(): string {
		return this.#text()
	}
	set text(v: string | (() => string)) {
		this.#text = toFn(v)
		this.elements.button.innerText = this.#text()
	}

	click = () => {
		this.onClick()
		this.refresh()
		this.callOnChange()
	}

	enable = () => {
		super.enable()
		this.elements.button.disabled = false
		return this
	}

	disable = () => {
		super.disable()
		this.elements.button.disabled = true
		return this
	}

	refresh = () => {
		this.elements.button.disabled = this.disabled
		this.elements.button.innerText = this.text
		return this
	}

	dispose() {
		this.elements.button.remove()
		super.dispose()
	}
}
