import { Revue } from '../src/revue';
import { Prop } from '../src/decorators';
import { createElement as h } from '../src/element';

class App extends Revue {
  @Prop
  private greeting: string = 'Hello World!';

  public render() {
    return h('h1', null, this.greeting);
  }
}
