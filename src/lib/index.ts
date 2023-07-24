import Mustache from 'mustache';
import { EventBus } from './bus';
import { GUID } from './guid';

export abstract class Component {
  #uuid: GUID
  components: Partial<Component> = { [Component.name]: Component }
  #vTree: Map<string, Component>

  parentNode: HTMLElement
  parentNodeStyleCache: Map<string, string>
  template: string
  viewService: (props: Object, changes?: any) => any
  #states: any
  #bus: EventBus
  #eventCollector: Map<string, (...args: any[]) => void>

  static #computeChildrenProps(xKey: string | null, xValue: string | null, xIterator: string | null, props: any) {
    if (xKey === null || xValue === null || xIterator === null || !Array.isArray(props[xKey])) return props
    return props[xKey].find((item: any) => String(item[xIterator]) === xValue)
  }
  static pluralize(num: number, words: string[]) {
    const str1 = words[0]
    const str2 = words[1]
    const str3 = words[2]
    if (num % 10 === 1 && num % 100 !== 11) {
      return str1;
    } else if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) {
      return str2;
    }
    return str3;
  };

  constructor(
    props: Object,
    components: Object,
    parentNode: HTMLElement,
    eventBus: EventBus,
    template: string,
    viewService?: (props: Object, changes?: any) => any,
  ) {
    this.#uuid = new GUID()
    this.components = components
    this.parentNode = parentNode
    this.parentNodeStyleCache = new Map()
    this.template = template
    const getDefaultView = (props: Object, changes: any) => Object.assign({}, props, changes)
    this.viewService = viewService || getDefaultView
    this.#bus = eventBus
    this.#states = this.viewService(props)
    this.#vTree = new Map()
    this.#eventCollector = new Map()
    this.#mount(this.#states)
  }
  #mount(props: Object) {
    this.#render(props)
    this.#parseTree(props)
    this.#parseEvents(props)
    this.mounted(props)
  }

  #render(view: Object) {
    this.parentNode.innerHTML = Mustache.render(this.template, view)
  }

  getComponentId() {
    return this.#uuid
  }

  hasComponent(node: Element) {
    if (!node || node.hasAttribute('x-component') === false) return false
    const name = node.getAttribute('x-component')
    return Object.keys(this.components).some((key) => name === key)
  }

  #applyVisibilityProp(props: any) {
    if (
      props !== null &&
      typeof props === 'object' &&
      props.hasOwnProperty('hidden') &&
      typeof props.hidden === 'boolean'
    ) {
      const defaultDisplayStyle = this.parentNodeStyleCache.get('display')
      this.parentNode.style.display =
        props.hidden === false
          ? defaultDisplayStyle === 'none'
            ? 'block'
            : defaultDisplayStyle || 'block'
          : 'none'
    }
  }
  #patchVirtualChildren(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    const xKey = domNode.getAttribute('x-object-key')
    const xValue = domNode.getAttribute('x-object-value')
    const xIterator = domNode.getAttribute('x-object-iterator')
    const uuid = domNode.getAttribute('x-tree-bound')
    if (uuid === null) {
      return
    }
    const instance = this.#vTree.get(uuid)
    if (instance === undefined) {
      return
    }
    const childProps = Component.#computeChildrenProps(xKey, xValue, xIterator, props)
    instance.#patchTree(instance.viewService(childProps))
  }
  #replaceVirtualChildren(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    /**
     * TODO произвести подмену и ремаунт компонента в виртуальное дерево.
     * SFB пока может и без этого - вне кейсов применения.
     * Вопрос. Сохранять ли индекс нового uuid в карте?
     */
  }
  patchNode(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    // console.log('deep patching', domNode, virtualNode)
    const hasInput = (node: HTMLElement) => {
      return Boolean(
        node.nodeName === 'TEXTAREA' ||
        node.nodeName === 'INPUT' ||
        node.querySelectorAll('input').length ||
        node.querySelectorAll('textarea').length
      )
    }
    if (hasInput(domNode) && hasInput(virtualNode)) {
      const getAttributeNames = (node: HTMLElement) => {
        const rv: any = {}
        if (node.children.length === 0) {
          rv['textContent'] = node.textContent
        }
        const attrs = node.attributes
        for (let index = 0; index < attrs.length; ++index) {
          rv[attrs[index].nodeName] = attrs[index].value
        }
        return rv
      }
      const domAttrs = getAttributeNames(domNode);
      const vAttrs = getAttributeNames(virtualNode);
      Object.keys(vAttrs).forEach((attrKey) => {
        const newValue = vAttrs[attrKey]
        const oldValue = domAttrs[attrKey]
        if (newValue !== oldValue) {
          if (attrKey === 'textContent') {
            domNode.textContent = newValue
          } else {
            domNode.setAttribute(attrKey, newValue)
          }
        }
      })
      if (virtualNode.children.length > 0) {
        let childIndex =  0
        for (const vChild of virtualNode.children) {
          const domChild = domNode.children[childIndex]
          if (!domChild) {
            domNode.appendChild(vChild)
            childIndex = childIndex + 1
            continue
          }
          if (domChild.localName === vChild.localName && this.hasComponent(domChild)) {
            this.#patchVirtualChildren(domChild as HTMLElement, vChild as HTMLElement, props)
            childIndex = childIndex + 1
            continue
          }
          if (domChild.localName !== vChild.localName) {
            domNode.replaceChild(vChild, domChild)
          } else if (domChild.isEqualNode(vChild) === false) {
            this.patchNode(domChild as HTMLElement, vChild as HTMLElement, props)
          }
          childIndex = childIndex + 1
        }
      }
    } else {
      this.#replaceChild(domNode, virtualNode, props)
    }
  }
  #replaceChild(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    const parent = domNode.parentNode
    const cleanNodeEvents = (domNode: HTMLElement) => {
      const codes = domNode.getAttribute('x-event-binded')
      if (codes === null) return
      const codesArr = codes.split(',').map((item) => item.trim())
      codesArr.forEach((code) => {
        const callback = this.#eventCollector.get(code)
        if (callback === undefined) return
        this.#cleanEvent(code, callback)
      })
    }
    const setNodeEvents = (domNode: HTMLElement, props: any) => {
      const eventName = domNode.getAttribute('x-event')
      const callbackName = domNode.getAttribute('x-on')
      this.#addEventCallback(domNode, props, eventName, callbackName)
    }
    if (domNode.hasAttribute('x-event-binded')) {
      cleanNodeEvents(domNode)
    }
    const elementsWithEvents = domNode.querySelectorAll('[x-event-binded]')
    for (const element of elementsWithEvents) {
      cleanNodeEvents(element as HTMLElement)
    }
    parent?.replaceChild(virtualNode, domNode)
    if (virtualNode.hasAttribute('x-event')) {
      setNodeEvents(virtualNode, props)
    }
  }
  #patchTree(props: any) {
    this.#applyVisibilityProp(props)
    const compiledTemplate = Mustache.render(this.template, props)
    const renderer = new DOMParser()
    const memoizedPatch = renderer.parseFromString(compiledTemplate, 'text/html')
    const virtualNode = memoizedPatch.documentElement.querySelector('body')
    if (virtualNode === null) {
      return
    }
    let childIndex =  0
    for (const vChild of virtualNode.children) {
      const domChild = this.parentNode.children[childIndex]
      const nextVChild = virtualNode.children[childIndex + 1]
      const nextDChild = this.parentNode.children[childIndex + 1]
      if (!domChild) {
        this.parentNode.appendChild(vChild)
        childIndex = childIndex + 1
        continue
      } else if (domChild.localName === vChild.localName) {
        if (domChild.isEqualNode(vChild) === true) {
          childIndex = childIndex + 1
          continue
        }
        if (this.hasComponent(domChild) === false && this.hasComponent(vChild) === false) {
          this.patchNode(domChild as HTMLElement, vChild as HTMLElement, props)
          childIndex = childIndex + 1
          continue
        }
      }
      if (this.hasComponent(domChild) && this.hasComponent(vChild)) {
        this.#replaceVirtualChildren(domChild as HTMLElement, vChild as HTMLElement, props)
      } else if (this.hasComponent(domChild) === true && this.hasComponent(vChild) === false && this.hasComponent(nextVChild) === true) {
        this.parentNode.insertBefore(vChild, domChild)
      } else if (this.hasComponent(domChild) === false && this.hasComponent(vChild) === true && this.hasComponent(nextDChild) === true) {
        this.parentNode.removeChild(domChild)
      } else {
        this.#replaceChild(domChild as HTMLElement, vChild as HTMLElement, props)
      }
      childIndex = childIndex + 1
      continue
    }
  }

  #cleanTree() {
    this.#vTree.forEach((instance, key) => {
      instance.#cleanTree()
      this.#vTree.delete(key)
    })
  }

  #cleanEvent(key: string, callback: () => void) {
    const element = this.parentNode.querySelector(`[x-event-binded=${key}]`)
    if (element === null)
      return
    const event = key.split('_')[0]
    element.removeEventListener(event, callback)
    this.#eventCollector.delete(key)
  }

  #cleanEvents() {
    this.#eventCollector.forEach(
      (callback, key) =>
        this.#cleanEvent(key, callback)
    )
  }

  #parseTree(props: Object) {
    this.parentNodeStyleCache.set('display', getComputedStyle(this.parentNode).display)
    this.#applyVisibilityProp(props)
    Object.keys(this.components).forEach((name) => {
      const elements = this.parentNode.querySelectorAll(`[x-component=${name}]:not([x-tree-bound]) `)
      if (elements.length === 0) return
      const _Component = this.components[name]
      for (const element of elements) {
        const xKey = element.getAttribute('x-object-key')
        const xValue = element.getAttribute('x-object-value')
        const xIterator = element.getAttribute('x-object-iterator')
        const propsCopy = {...props}
        if (propsCopy.hasOwnProperty('hidden')) delete propsCopy['hidden']
        const childProps = Component.#computeChildrenProps(xKey, xValue, xIterator, propsCopy)
        if (childProps === undefined) {
          console.warn('Attention! Jet Surging!\n Cant find children props!', xKey, xValue, xIterator, props)
          continue
        }
        const instance = new _Component(childProps, this.components, element, this.#bus, this.viewService)
        const uuid = instance.getComponentId()
        element.setAttribute('x-tree-bound', uuid)
        this.#vTree.set(uuid.toString(), instance)
      }
    })
  }

  #addEventCallback(element: Element, props: any, eventName: string | null, callbackName: string | null) {
    if (eventName === null || callbackName === null) {
      console.warn(`Attention! Jet Surging!\n
        Cant find one of event bound attributes!\n
        x-event: ${eventName}\n
        x-on: ${callbackName}\n
      `, element, props)
      return
    }
    let callback = this[callbackName]
    if (callback === undefined) {
      console.warn(`Attention! Jet Surging!\n 
        Cant find component callback method ${callbackName} for event ${eventName} on template element!
      `, element, props)
      return
    }
    callback = callback.bind(this, props)
    element.addEventListener(eventName, callback)

    const eventCode = `${eventName}_${this.#uuid.toString()}`
    element.setAttribute('x-event-binded', eventCode)

    this.#eventCollector.set(eventCode, callback)
  }

  #parseEvents(props: any) {
    const elements = this.parentNode.querySelectorAll(`[x-on][x-event]:not([x-event-binded])`)
    for (const element of elements) {
      const eventName = element.getAttribute('x-event')
      const callbackName = element.getAttribute('x-on')
      this.#addEventCallback(element, props, eventName, callbackName)
    }
  }
  /**
   * Public component methods
   */
  getState() {
    return {...this.#states}
  }
  setState(changes: any) {
    if (typeof changes !== 'object') return
    let needReRender = Object.keys(changes).some((key) => {
      return this.#states.hasOwnProperty(key) === false || (this.#states.hasOwnProperty(key) && this.#states[key] !== changes[key])
    })
    if (needReRender === false) {
      return
    }
    this.#states = this.viewService(this.#states, changes)
    this.#patchTree(this.#states)
    this.updated(this.#states)
  }

  implose() {
    this.#cleanEvents()
    this.#bus.$unbind(this.#uuid)
    this.#vTree.forEach((instance, uuid) => {
      instance.implose()
      this.#vTree.delete(uuid)
    })
    this.parentNode.innerHTML = ''
    this.destroyed()
  }

  $on(eventName: string, callback: (...args: any[]) => void ) {
    this.#bus.$on(`${eventName}`, this.#uuid, callback)
  }
  $emit(eventName: string, ...args: any[]) {
    this.#bus.$emit(`${eventName}`, ...args)
  }
  $un(eventName: string) {
    this.#bus.$un(`${eventName}`, this.#uuid)
  }
  mounted(props: any) {

  }
  updated(props: any) {

  }
  destroyed() {

  }
}