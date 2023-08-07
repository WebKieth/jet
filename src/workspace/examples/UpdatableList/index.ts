import axios from "axios";
import { EventBus } from "../../../lib/bus";
import { Component } from "../../../lib";
//@ts-ignore
import template from './template.mustache'

export class UpdatableList extends Component {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus) {
    super(
      {
        loading: true,
        list: [],
        newTitle: ''
      },
      {},
      parentNode,
      bus,
      template,
      (props, changes) => {
      return {...props, ...changes}
    })
  }
  getRandomInt() {
    return Math.floor(Math.random() * 100000);
  }
  
  changeNewTitle(props: any, event: any) {
    this.setState({newTitle: event.target.value})
  }
  remove(props: any) {
    console.log('action: removing...', props)
  }
  addNewTitle(props: any) {
    const id = this.getRandomInt()
    const list = [...props.list]
    list.push({ id, title: props.newTitle })
    this.setState({
      list,
      newTitle: ''
    })
  }
  mounted() {
    axios.get('https://jsonplaceholder.typicode.com/users')
      .then(({data}) => {
        this.setState({
          loading: false,
          list: data.map((item: any) => ({ id: item.id, title: item.username }))
        })
      })
  }
}