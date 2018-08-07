import { CHANNEL_INSPECTOR, getUid } from '../src/global';
import { Revue } from '../src/revue';
import { Observable, Computed } from '../src/decorators';
import { IFiber } from '../src/type';
import * as Channel from '../src/channel';
import { h1, div, button, input } from '../src/element.util';
import { createElement as h } from '../src/element';

import { IFiberSummary } from './inspector.type';
import VisualFiber from './visualFiber';

function flatenFiberTree(fiber: IFiber): [IFiberSummary[], number] {
  const fibers: IFiberSummary[] = [];

  const depth = walkTree(fiber, (f, level) => {
    fibers.push({
      tag: f.tag,
      type: typeof f.type === 'string'
        ? (f.type || 'Root')
        : f.type.name,
      level,
      id: f.id,
      textContent: f.props.textContent,
    });

    return true;
  });

  return [fibers, depth];
}

function walkTree(fiber: IFiber, cb: (fiber: IFiber, level: number) => boolean): number {
  let level: number = 0;
  let depth: number = 0;

  let next: IFiber | null = fiber;
  while (next) {
    if (!cb(next, level)) return depth;

    if (next.child) {
      next = next.child;
      depth = ++level;
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

  return depth;
}

export default class Inspector extends Revue {
  @Observable
  private filter: string = '';
  @Observable
  private fibers: IFiberSummary[] = [];

  private id: number = getUid();
  private rootFiber: IFiber | null = null;

  constructor(props: any) {
    super(props);

    Channel.subscribe(CHANNEL_INSPECTOR, this.id, (root: IFiber) => {
      // TODO: 避免自娱自乐，需要更好的实现
      if (root.child === this.$fiber) return;

      this.rootFiber = root;

      console.log(root);
    });
  }

  @Computed({ default: [] })
  private get filteredFibers(): IFiberSummary[] {
    return this.fibers.filter(fiber => fiber.id.toString().includes(this.filter));
  }

  private refresh() {
    if (this.rootFiber) {
      [this.fibers] = flatenFiberTree(this.rootFiber);
    }
  }

  private onFilterChanged(e: KeyboardEvent) {
    this.filter = (e.target as HTMLInputElement).value;
  }

  private onReport(fiber: IFiberSummary) {
    let rawFiber;
    walkTree(this.rootFiber!, (f: IFiber) => {
      rawFiber = f;
      return f.id !== fiber.id;
    });

    (window as any).$fiber = rawFiber;
    console.log('$fiber =', rawFiber);
  }

  public render() {
    return div(null,
      h1(null, 'Revue Inspector'),
      input(
        () => ({
          value: this.filter,
          oninput: (e: KeyboardEvent) => this.onFilterChanged(e),
        }),
      ),
      button(
        () => ({
          onclick: () => this.refresh(),
        }),
        'refresh',
      ),
      () => this.filteredFibers.map(fiber =>
        h(VisualFiber, () => ({
          fiber: () => fiber,
          report: () => this.onReport(fiber),
        })),
      ),
    );
  }
}
