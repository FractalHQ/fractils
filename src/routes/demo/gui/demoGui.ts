import type { Params } from '$lib/components/orbs/params'

import { Gui } from '../../../lib/gui/Gui'
import { writable } from 'svelte/store'

export const code = writable('')

export async function demoGui(params: Params) {
	const gui = new Gui({
		title: 'Orbs',
		position: 'top-center',
		positionOptions: {
			margin: 60,
		},
		storage: {
			key: 'fracgui',
		},
		windowManager: true,
		windowManagerOptions: {
			zFloor: 0,
		},
	})

	gui.folder.on('toggle', v => {
		console.log(v)
	})

	const f1 = gui.addFolder({ title: 'base' })

	f1.add({
		title: 'count',
		binding: {
			target: params,
			key: 'orbs',
		},
		min: 1,
		max: 150,
		step: 1,
	})

	f1.addNumber({
		title: 'width',
		binding: {
			target: params,
			key: 'width',
		},
		min: 10,
		max: window.innerWidth / 4,
		step: 1,
	})

	f1.addNumber({
		title: 'height',
		binding: {
			target: params,
			key: 'height',
		},
		min: 10,
		max: window.innerHeight / 8,
		step: 1,
	})

	const motionFolder = gui.addFolder({ title: 'motion' })

	motionFolder.addNumber({
		title: 'speed',
		binding: {
			target: params,
			key: 'speed',
		},
		min: 0.0001,
		max: 1,
		step: 0.0001,
	})

	motionFolder.addNumber({
		title: 'force x',
		binding: {
			target: params,
			key: 'a1',
		},
		min: 0,
		max: 3,
		step: 0.001,
	})

	motionFolder.addNumber({
		title: 'force y',
		binding: {
			target: params,
			key: 'a2',
		},
		min: 1,
		max: 3,
		step: 0.001,
	})

	motionFolder.addNumber({
		title: 'temporal drift',
		binding: {
			target: params,
			key: 'drift',
		},
		min: -1,
		max: 1,
		step: 0.001,
	})

	motionFolder.addSwitch({
		title: 'modulate',
		binding: {
			target: params,
			key: 'modulate',
		},
	})

	const appearanceFolder = gui.addFolder({ title: 'appearance' })

	appearanceFolder.addNumber({
		title: 'size',
		binding: {
			target: params,
			key: 'size',
		},
		min: 1,
		max: 30,
		step: 1,
	})

	appearanceFolder.addNumber({
		title: 'floop',
		binding: {
			target: params,
			key: 'floop',
		},
		min: 0.001,
		max: 0.5,
		step: 0.001,
	})

	appearanceFolder.addNumber({
		title: 'brightness',
		binding: {
			target: params,
			key: 'brightness',
		},
		min: 0,
		max: 1,
		step: 0.01,
	})

	appearanceFolder.addColor({
		title: 'color',
		mode: 'hsva',
		binding: {
			target: params,
			key: 'color',
		},
	})

	appearanceFolder.addColor({
		title: 'accent',
		mode: 'hsla',
		binding: {
			target: params,
			key: 'accent',
		},
	})

	const glowFolder = appearanceFolder.addFolder({ title: 'glow' })

	glowFolder.addNumber({
		title: 'glowR',
		binding: {
			target: params,
			key: 'glowR',
		},
		min: 0,
		max: 20,
		step: 0.01,
	})

	glowFolder.addNumber({
		title: 'glowG',
		binding: {
			target: params,
			key: 'glowG',
		},
		min: 0,
		max: 20,
		step: 0.01,
	})

	glowFolder.addNumber({
		title: 'glowB',
		binding: {
			target: params,
			key: 'glowB',
		},
		min: 0,
		max: 20,
		step: 0.01,
	})

	// const presetDebugGui = new Gui({
	// 	title: 'presets',
	// 	position: 'bottom-center',
	// 	positionOptions: {
	// 		margin: { x: 16, y: 16 * 4.5 },
	// 	},
	// 	storage: {
	// 		key: 'fracgui-preset-debug-gui',
	// 	},
	// })

	// await gui.presetManager.init()

	await Promise.resolve()
	await Promise.resolve()

	// if (!gui.presetManager.isInitialized()) {
	// 	throw new Error('PresetManager not initialized.')
	// }

	// presetDebugGui.settingsFolder.close()

	// const build = async () => {
	// 	await Promise.resolve()
	// 	for (const preset of gui.presetManager.presets?.value ?? []) {
	// 		presetDebugGui.folder.addText({
	// 			title: 'activePreset',
	// 			value: gui.presetManager.activePresetId.value,
	// 		})
	// 		const pf = presetDebugGui.addFolder({
	// 			title: preset.title,
	// 		})
	// 		pf.addText({
	// 			title: 'presetTitle',
	// 			value: preset.title,
	// 		})
	// 		pf.addText({
	// 			title: 'presetId',
	// 			value: preset.id,
	// 		})
	// 	}
	// }

	// presetDebugGui.windowManager?.update()

	// const destroy = () => {
	// 	for (const child of presetDebugGui.folder.children) {
	// 		child.dispose()
	// 	}
	// }

	// let i = 0
	// gui.presetManager.presets.subscribe(v => {
	// 	i++
	// 	if (i < 2) return
	// 	console.error(v)
	// 	destroy()
	// 	build()
	// })

	// build()

	return gui
}
