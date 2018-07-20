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
  @Prop
  public isHappy: boolean = false;

  public get title(): string {
    return this.greeting + this.name;
  }

  public render() {
    const e = h(() => this.isHappy ? 'h1' : 'p', null,
      () => this.greeting,
      () => this.title,
      h('p',
        () => ({ class: this.className }),
        () => this.name
      ),
    );

    // @ts-ignore
    e.mediator.update = (tag: string) => console.log('isHappy changed, type:', tag);
    // @ts-ignore
    e.props.children[0].mediator.update = (tag: string) => console.log('greeting changed, type:', tag);
    // @ts-ignore
    e.props.children[1].mediator.update = (tag: string) => console.log('title changed, type:', tag);
    // @ts-ignore
    e.props.children[2].mediator.update = (tag: string) => console.log('className changed, type:', tag);
    // @ts-ignore
    e.props.children[2].props.children[0].mediator.update = (tag: string) => console.log('name changed, type:', tag);

    console.log(e);
    return e;
  }
}
const app = new App();
app.render();
console.log(app);

app.isHappy = true;
app.greeting = 'Doge';
app.name = 'wow';
app.className = '666';

mount('#app', h(App, null));

// TODO: 如果某个fiber依赖多个响应式字段，且这些字段在同一tick被更改，
// 会导致该fiber重复提交，需要一个合并机制

// TODO: props的变动导致依赖组件变动的机制需要特别处理
