import { nanoid } from './nanoid'

export type EventCallback = (...args: any[]) => void

/**
 * A simple event emitter that allows for registering, subscribing to, and emitting events.
 */
export class EventEmitter<
	const TEvents extends readonly string[],
	const TEventName extends TEvents[number] = TEvents[number],
> {
	handlers: Map<TEventName, Map<string, EventCallback>> = new Map()
	eventNames: TEventName[] = []

	constructor() {}

	registerEvents(events: TEvents) {
		for (const event of events) {
			console.log('registering:', event)
			this.handlers.set(event as TEventName, new Map())
		}
	}

	on(event: TEventName, callback: EventCallback): string {
		const id = nanoid()
		const listeners = this.handlers.get(event)

		if (!listeners) {
			console.warn(`Event "${event}" is not registered.`)
		}

		this.handlers.get(event)?.set(id, callback)

		return id
	}

	emit(event: TEventName, ...args: Parameters<EventCallback>) {
		for (const cb of this.handlers.get(event)?.values() ?? []) {
			cb(...args)
		}
	}

	clearAll() {
		for (const listeners of this.handlers.values()) listeners.clear()
		this.handlers.clear()
	}
}

/**
 * Represents an event manager that provides methods for adding and removing event listeners.
 */
export class EventManager<
	const TEvents extends readonly string[] = ['change'],
	const TEventName extends TEvents[number] = TEvents[number],
> {
	listeners = new Map<string, EventCallback>()
	emitter = new EventEmitter<('change' | TEventName)[]>()

	constructor(events?: TEvents) {
		if (events) this.register(['change', ...(events as any as TEventName[])])
	}

	on = this.emitter.on.bind(this.emitter)
	emit = this.emitter.emit.bind(this.emitter)
	register = this.emitter.registerEvents.bind(this.emitter)

	/**
	 * Adds an event listener to an HTMLElement that will be removed when {@link dispose} is called.
	 * @param element - The element to add the listener to.
	 * @param event - The event to listen for.
	 * @param callback - The callback function to execute when the event is fired.
	 * @param options - Optional event listener options.
	 */
	listen = <
		TTarget extends Element | Window | Document,
		TEventName extends keyof GlobalEventHandlersEventMap | (string & {}),
		TEventInstance extends TEventName extends keyof GlobalEventHandlersEventMap
			? GlobalEventHandlersEventMap[TEventName] & { target: TTarget }
			: Event,
	>(
		element: TTarget,
		event: TEventName,
		callback: (e: TEventInstance) => void,
		options?: AddEventListenerOptions,
	) => {
		const id = nanoid()
		element.addEventListener(event, callback as EventCallback, options)
		this.listeners.set(id, () => {
			element.removeEventListener(event, callback as EventCallback, options)
		})
		return id
	}

	/**
	 * Adds a listener to the event manager without attaching it to an element.
	 * @param cb - The callback function to execute when the event is fired.
	 */
	add = (cb: () => void) => {
		const id = nanoid()
		this.listeners.set(id, cb)
		return id
	}

	/**
	 * Removes a listener from the event manager without removing the listener from the element.
	 */
	unlisten(id: string): boolean {
		return this.listeners.delete(id)
	}

	/**
	 * Removes all registered listeners from the element and clears the event manager.
	 */
	clear(): void {
		for (const cb of this.listeners.values()) cb()
		this.listeners.clear()
	}

	/**
	 * Removes all registered listeners.
	 */
	dispose(): void {
		this.clear()
		this.emitter.clearAll()
	}
}

const test2 = new EventManager(['click', 'foo'])
test2.on('change', () => {})
// test2.on('change', () => {})
