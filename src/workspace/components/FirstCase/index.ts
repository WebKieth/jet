import { Component } from "../../../lib";
import { EventBus } from "../../../lib/bus";
//@ts-ignore
import template from './template.mustache'

export class FirstCase extends Component {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus) {
    super(props, components, parentNode, bus, template, (props, changes) => {
      console.log(changes)
      if (changes && changes.sidebar === true) {
        props['sidebar'] = true
        props['with_sidebar'] = true
        props['without_sidebar'] = false
      } else {
        props['sidebar'] = false
        props['with_sidebar'] = false
        props['without_sidebar'] = true
      }
      return {
        ...props,
        ...changes
      }
    })
  }
  toggleSidebar(props: any) {
    console.log(props)
    this.setState({ sidebar: !props.with_sidebar })
  }
}