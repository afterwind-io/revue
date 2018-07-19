import { Revue, mount } from '../src/revue';
import { Prop } from '../src/decorators';
import { createElement as h } from '../src/element';

class App extends Revue {
  @Prop
  public greeting: string = 'Hello World!';
  @Prop
  public name: string = 'Doge';
  @Prop
  public className: string = '';

  public get title(): string {
    return this.greeting + this.name;
  }

  public render() {
    const e = h('h1', null,
      () => this.greeting,
      () => this.title,
      h('p',
        () => ({ class: this.className }),
        () => this.name
      ),
    );

    // @ts-ignore
    e.props.children[0].mediator.notify = () => console.log('greeting changed');
    // @ts-ignore
    e.props.children[1].mediator.notify = () => console.log('title changed');
    // @ts-ignore
    e.props.children[2].mediator.notify = () => console.log('className changed');
    // @ts-ignore
    e.props.children[2].props.children[0].mediator.notify = () => console.log('name changed');
    console.log(e);

    return e;
  }
}
const app = new App();
app.render();
console.log(app);

app.greeting = 'Doge';
app.name = 'wow';
app.className = '666';

mount('#app', h(App, null));

// TODO: 如果某个fiber依赖多个响应式字段，且这些字段在同一tick被更改，
// 会导致该fiber重复提交，需要一个合并机制

// TODO: props的变动导致依赖组件变动的机制需要特别处理
