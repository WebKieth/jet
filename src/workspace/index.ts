import { Component } from "../lib"
import { EventBus } from "../lib/bus"
import { FirstCase } from "./components/FirstCase"
//@ts-ignore
import template from './root.mustache'

const Root = class Root extends Component {
  constructor(parentNode: HTMLElement) {
    super({}, { FirstCase }, parentNode, new EventBus(), template)
  }
}
try {
  const mountPoint = document.querySelector('#app')
  if (mountPoint !== null) {
    new Root(mountPoint as HTMLElement)
  }
} catch (e) {
  console.error('Jet Root Error', e)
}