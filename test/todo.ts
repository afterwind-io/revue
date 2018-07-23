import { Revue } from '../src/revue';
import { Prop, Emit } from '../src/decorators';
import { p, input } from '../src/element.util';

import { ITodo } from './test.type';

export default class Todo extends Revue {
  @Prop
  private data!: ITodo;

  @Emit
  private changed!: ((todo: ITodo, isImportant: boolean) => void);

  private onImportanceChanged(e: Event) {
    this.changed(this.data, (e.target as HTMLInputElement).checked);
  }

  public render() {
    return p(null,
      input(
        () => ({
          domAttr: {
            type: 'checkbox',
            checked: this.data.isImportant,
          },
          on: {
            change: (e: Event) => this.onImportanceChanged(e),
          },
        }),
      ),
      () => this.data.work,
    );
  }
}
