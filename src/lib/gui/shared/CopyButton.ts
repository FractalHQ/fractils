import { Tooltip } from '../../actions/tooltip'
import { create } from '../../utils/create'
import { append } from '../../utils/mount'
import { CopySVG } from '../svg/CopySVG'

export class CopyButton {
	button: HTMLDivElement
	icon: CopySVG
	text: () => string

	/**
	 * When the copy animation is active, this is `true` and the button has an `active` class.
	 */
	active = false
	/**
	 * When the copy animation is outroing, this is `true` and the button has an `outro` class.
	 */
	outro = false

	cooldown!: ReturnType<typeof setTimeout>
	outroCooldown!: ReturnType<typeof setTimeout>

	tooltip: Tooltip

	constructor(
		public container: HTMLElement,
		text: () => string,
	) {
		const button = create('div', {
			classes: ['copy-button'],
			title: 'Copy',
			attributes: {
				'aria-label': 'Copy',
			},
			variables: {
				'--copy-button-width': '1rem',
				'--copy-button-height': '1rem',
			},
		})

		const svgContainer = create('div', {
			classes: ['copy-button-svg-container'],
		})

		this.button = button
		this.icon = new CopySVG()
		this.text = text

		this.button.addEventListener('click', this.copy)

		append(container, this.button, svgContainer, this.icon.svg)

		this.tooltip = new Tooltip(this.button, {
			text: 'Copy',
			placement: 'top',
			offsetY: '6px',
			delay: 300,
		})
	}

	copy = () => {
		if (typeof navigator === 'undefined') return
		if (this.active) return

		const text = this.text()
		if (!text) return

		navigator.clipboard?.writeText?.(text)
		this.#animateIn()
	}

	#animateIn = () => {
		this.active = true

		this.tooltip.show()
		this.button.blur()

		this.button.classList.add('active')
		this.icon.svg.classList.add('active')

		this.icon.front.setAttribute('x', '5.5')
		this.icon.front.setAttribute('y', '5.5')
		this.icon.front.setAttribute('rx', '10')
		this.icon.front.setAttribute('ry', '10')

		this.tooltip.text = 'Copied!'

		setTimeout(this.#animateOut, 1250)
	}

	#animateOut = () => {
		this.active = false
		this.outro = true

		this.button.classList.remove('active')
		this.icon.svg.classList.remove('active')
		this.icon.svg.classList.add('outro')
		this.button.classList.add('outro')

		this.icon.front.setAttribute('x', '9')
		this.icon.front.setAttribute('y', '9')
		this.icon.front.setAttribute('rx', '2')
		this.icon.front.setAttribute('ry', '2')

		setTimeout(this.#complete, 500)
	}

	#complete = () => {
		this.button.classList.remove('outro')
		this.icon.svg.classList.remove('outro')
		this.outro = false

		this.tooltip.text = 'Copy'
		this.tooltip.hide()
	}
}