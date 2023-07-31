import { Remarkable } from "remarkable";
import { Component } from "../../../lib";
import { EventBus } from "../../../lib/bus";
//@ts-ignore
import template from './template.mustache'
//@ts-ignore
import description from './description.txt'

export class MarkdownExpander extends Component {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus) {
    super({ description }, components, parentNode, bus, template, (props: any, changes: any) => {
      const md = new Remarkable()
      if (changes && changes.collapsed === true) {
        props['text'] = md.render(props.description)
      } else {
        props['text'] = props && props.description && props.description.length > 120
        ? md.render(`${props.description.substring(0, 120)}...`)
        : props && props.description 
          ? md.render(props.description)
          : ''
      }
      return {
        ...props,
        ...changes || { expanded: false }
      }
    })
  }
  handleToggle(props: any) {
    this.setState({ collapsed: !props.collapsed })
  }
}