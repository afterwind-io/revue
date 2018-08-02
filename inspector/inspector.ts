import { CHANNEL_INSPECTOR, getUid } from '../src/global';
import { Revue } from '../src/revue';
import { Observable } from '../src/decorators';
import { IFiber } from '../src/type';
import * as Channel from '../src/channel';
import { h1, div } from '../src/element.util';
import { createElement as h } from '../src/element';

import VisualFiber from './visualFiber';

interface IExtendedFiber extends IFiber {
  level: number;
}

function flatenFiberTree(fiber: IFiber): IExtendedFiber[] {
  const fibers: IExtendedFiber[] = [];

  walkTree(fiber, (f, level) => {
    fibers.push(Object.assign(f, { level }));
  });

  return fibers;
}

function walkTree(fiber: IFiber, cb: (fiber: IFiber, level: number) => void) {
  let level: number = 0;

  let next: IFiber | null = fiber;
  while (next) {
    cb(next, level);

    if (next.child) {
      next = next.child;
      level++;
    } else if (next.sibling) {
      next = next.sibling;
    } else {
      next = next.parent;
      level--;

      while (next) {
        if (next.sibling) {
          next = next.sibling;
          break;
        } else {
          next = next.parent;
          level--;
        }
      }
    }
  }
}

export default class Inspector extends Revue {
  @Observable
  private fibers: IExtendedFiber[] = [];

  private id: number = getUid();

  constructor(props: any) {
    super(props);

    Channel.subscribe(CHANNEL_INSPECTOR, this.id, (root: IFiber) => {
      // TODO: 避免自娱自乐，需要更好的实现
      if (root.child === this.$fiber) return;

      this.fibers = flatenFiberTree(root);
    });
  }

  public render() {
    return div(null,
      h1(null, 'Revue Inspector'),
      () => this.fibers.map(fiber =>
        h(VisualFiber, () => ({
          fiber: () => fiber,
          level: () => fiber.level,
        })),
      ),
    );
  }
}
