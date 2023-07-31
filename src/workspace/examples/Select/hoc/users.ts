import axios from "axios";
import { Select } from "..";
import { EventBus } from "../../../../lib/bus";

export class UsersSelect extends Select {
  constructor(props: any, components: Object, parentNode: HTMLElement, bus: EventBus, template: string) {
    super({ loading: true }, components, parentNode, bus, template, (props, changes) => {
      return {...props, ...changes}
    })
  }
  mounted() {
    setTimeout(() =>
      axios.get('https://jsonplaceholder.typicode.com/users')
        .then(({data}) => {
          this.setState({
            loading: false,
            options: data.map((item: any) => ({ id: item.id, title: item.username }))
          })
        })
    , 2000)
  }
}