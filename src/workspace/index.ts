import { Component } from "../lib"
import { EventBus } from "../lib/bus"
import { MarkdownExpander } from "./examples/MarkdownExpander"
// import { Select } from "./examples/Select"
import { UsersSelect } from "./examples/Select/hoc/users"
//@ts-ignore
import template from './root.mustache'
import './reset.css'
import './root.css'

const Root = class Root extends Component {
  constructor(parentNode: HTMLElement) {
    super({}, { MarkdownExpander, UsersSelect }, parentNode, new EventBus(), template)
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