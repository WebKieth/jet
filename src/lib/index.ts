import Mustache from 'mustache';
import { EventBus } from './bus';
import { GUID } from './guid';

export abstract class Component {
  #uuid: GUID
  components: Partial<Component> = { [Component.name]: Component }
  #vTree: Map<string, Component>

  parentNode: HTMLElement
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

  isComponent(node: Element) {
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
      const display = props && props.display || 'block'
      this.parentNode.style.display =
        props.hidden === false
          ? display
          : 'none'
    }
  }

  #cleanNodeEvents(domNode: HTMLElement) {
    const codes = domNode.getAttribute('x-event-binded')
    if (codes === null) return
    const codesArr = codes.split(',').map((item) => item.trim())
    codesArr.forEach((code) => {
      const callback = this.#eventCollector.get(code)
      if (callback === undefined) return
      this.#cleanEvent(code, callback)
    })
  }
  #removeNodeEvents(node: HTMLElement) {
    if (node.hasAttribute('x-event-binded')) {
      this.#cleanNodeEvents(node)
    }
    const elementsWithEvents = node.querySelectorAll('[x-event-binded]')
    for (const element of elementsWithEvents) {
      this.#cleanNodeEvents(element as HTMLElement)
    }
  }
  #hardPatchNode(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    const parent = domNode.parentNode
    const addNodeEvents = (node: HTMLElement, props: any, cyclingScope = false) => {
      const eventName = node.getAttribute('x-event')
      const callbackName = node.getAttribute('x-on')
      if (eventName && callbackName)
        this.#addEventCallback(node, props, eventName, callbackName)
      if (cyclingScope) return
      const elementsWithEvents = node.querySelectorAll(`[x-on][x-event]`)
      for (const element of elementsWithEvents) {
        addNodeEvents(element as HTMLElement, props, true)
      }
    }
    this.#removeNodeEvents(domNode)
    parent?.replaceChild(virtualNode, domNode)
    addNodeEvents(virtualNode, props)
  }
  #softPatchNode(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
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
    if (domNode.hasAttribute('x-event-binded')) {
      this.#cleanNodeEvents(domNode)
      const eventName = domNode.getAttribute('x-event')
      const callbackName = domNode.getAttribute('x-on')
      this.#addEventCallback(domNode, props, eventName, callbackName)
    }
  }
  #createDefaultNodeMap(collection: HTMLCollection): Map<Element, boolean> {
    const map: Map<Element, boolean> = new Map()
    for (const node of collection) {
      map.set(node, false)
    }
    return map
  }
  #isSimilar(firstNode: Element, secondNode: Element) {
    if (firstNode.nodeName !== secondNode.nodeName) return false
    if (
      firstNode.className === secondNode.className ||
      firstNode.className.includes(secondNode.className) ||
      secondNode.className.includes(firstNode.className)
    ) return true
    return false
  }
  #findAndPatchSimilars(realNode: Element, virtuals: Map<Element, boolean>, props: any) {
    let found = false
    virtuals.forEach((status, virtualNode) => {
      if (status === true || found === true) return
      if (this.#isSimilar(realNode, virtualNode)) {
        this.#patchNodeLevel(realNode as HTMLElement, virtualNode as HTMLElement, props)
        found = true
        virtuals.set(virtualNode, true)
      }
    })
    return found
  }
  #compareChildNodes(realChildren: HTMLCollection, virtualChildren: HTMLCollection, parentNode: HTMLElement, props: any) {
    const realChildenMap = this.#createDefaultNodeMap(realChildren)
    const virtualChildrenMap = this.#createDefaultNodeMap(virtualChildren)
    realChildenMap.forEach((status, node) => {
      const found = this.#findAndPatchSimilars(node, virtualChildrenMap, props)
      if (found === true) {
        realChildenMap.set(node, true)
      }
    })
    realChildenMap.forEach((status, node) => {
      if (status === false) {
        if (node.hasAttribute('x-event-binded')) {
          this.#cleanNodeEvents(node as HTMLElement)
        }
        node.remove()
      }
    })
    let idx = 0
    virtualChildrenMap.forEach((status, node) => {
      if (status === false) {
        const sibling = realChildren[idx]
        if (sibling === null) parentNode.appendChild(node)
        else parentNode.insertBefore(node, sibling)
      }
      idx = idx + 1
    })
  }


  #replaceVirtualChildren(domNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    const uuidStringAttr = domNode.getAttribute('x-tree-bound')
    if (uuidStringAttr !== null) {
      const instance = this.#vTree.get(uuidStringAttr)
      if (instance) {
        instance.implose()
        this.#vTree.delete(uuidStringAttr)
      }
    }
    const componentName = virtualNode.getAttribute('x-component')
    if (domNode.parentNode) {
      domNode.parentNode.replaceChild(virtualNode, domNode)
    }
    if (componentName !== null) {
      const _Component = this.components[componentName]
      if (!_Component || !domNode.parentNode) return
      const instance = new _Component(props, this.components, domNode.parentNode, this.#bus)
      this.#vTree.set(`${instance.getComponentId().toString()}`, instance)
    }
  }

  #patchNodeLevel(realNode: HTMLElement, virtualNode: HTMLElement, props: any) {
    if (realNode.children.length === 0 && virtualNode.children.length === 0) {
      if (this.isComponent(virtualNode) === true || this.isComponent(realNode) === true) {
        const realNodeComponentName = realNode.getAttribute('x-component')
        const virtualNodeComponentName = virtualNode.getAttribute('x-component')
        if (realNodeComponentName !== virtualNodeComponentName)
          this.#replaceVirtualChildren(realNode, virtualNode, props)
        // maybe else patch update props in new version...
        return
      }
      // console.log('JET DEBUG ### soft patch ', realNode, virtualNode)
      this.#softPatchNode(realNode, virtualNode, props)
      return
    } else if (realNode.children.length > 0 && virtualNode.children.length > 0) {
      // console.log('JET DEBUG ### compare ', realNode, virtualNode.children)
      this.#compareChildNodes(realNode.children, virtualNode.children, realNode, props)
    } else {
      // console.log('JET DEBUG ### hard patch ', realNode, virtualNode)
      this.#hardPatchNode(realNode, virtualNode, props)
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
    this.#compareChildNodes(this.parentNode.children, virtualNode.children, this.parentNode, props)
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
        const instance = new _Component(childProps, this.components, element, this.#bus)
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