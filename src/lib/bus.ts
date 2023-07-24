import { GUID } from "./guid"

type TEventsMap = Map<GUID, (...args: any) => void>
type TEventName = string

export class EventBus {
  #bus: Map<TEventName, TEventsMap>
  constructor() {
    this.#bus = new Map()
  }

  $un(id: TEventName, guid: GUID) {
    if (this.#bus.has(id) === false)
      return
    const listeners = this.#bus.get(id)
    if (listeners === undefined || listeners.has(guid) === false)
      return
    listeners.delete(guid)
    this.#bus.set(id, listeners)
  }

  $unbind(guid: GUID) {
    this.#bus.forEach((map, eventName) => {
      if (map.has(guid) === false) return
      map.delete(guid)
      this.#bus.set(eventName, map)
    })
  }

  $on(id: TEventName, guid: GUID, callback: (...args: any) => void) {
    const listeners = this.#bus.get(id) || new Map()
    this.#bus.set(id, listeners.set(guid, callback))
  }

  $emit(id: TEventName, ...params: any[]) {
    const listeners = this.#bus.get(id)
    if (listeners === undefined)
      return
    listeners.forEach((cb) => cb(...params))
  }
}