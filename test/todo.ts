import { Revue } from '../src/revue';
import { Prop } from '../src/decorators';
import { p, input } from '../src/element.util';

import { ITodo } from './test.type';

export default class Todo extends Revue {
  @Prop
  private data: ITodo = { work: '', isImportant: false };

  // @Event
  private changed: ((todo: ITodo, isImportant: boolean) => void) | null = null;

  private onImportantceChanged(e: Event) {
    if (this.changed) {
      this.changed(this.data, (e.target as HTMLInputElement).checked);
    }
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
            change: (e: Event) => this.onImportantceChanged(e),
          },
        }),
      ),
      () => this.data.work,
    );
  }
}
