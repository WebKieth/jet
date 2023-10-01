import { EventBus } from "../../../../../lib/bus";
import { Component } from "../../../../../lib";
//@ts-ignore
import template from './template.mustache'

export class Title extends Component {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus) {
    super(
      props,
      components,
      parentNode,
      bus,
      template,
      (props, changes) => {
      return {...props, ...changes}
    })
  }

}