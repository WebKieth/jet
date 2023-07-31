import { Component } from "../../../lib";
import { EventBus } from "../../../lib/bus";
//@ts-ignore
import baseTemplate from './template.mustache';
import './index.css';

export class Select extends Component {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus, template?: string, viewService?: (props: any, changes: any) => any) {
    super(props || {}, components, parentNode, bus, baseTemplate, viewService)
  }
}