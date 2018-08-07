import { Revue } from '../src/revue';
import { Prop, Emit } from '../src/decorators';
import { FiberTag, ElementType } from '../src/type';
import {
  div,
  header,
  p,
  text,
  section,
  span,
} from '../src/element.util';
import { IFiberSummary } from './inspector.type';

export default class VisualFiber extends Revue {
  @Prop
  private fiber!: IFiberSummary;

  @Emit
  private report!: () => void;

  private onFiberClicked() {
    this.report();
  }

  private get fiberTag(): string {
    return this.fiber.tag === FiberTag.VIRTUAL
      ? 'Virtual'
      : this.fiber.type;
  }

  private get fiberClass(): string {
    let keyWord: string = '';

    if (this.fiber.tag === FiberTag.VIRTUAL) {
      keyWord = 'virtual';
    } else if (this.fiber.type === ElementType.TEXT) {
      keyWord = 'text';
    } else if (typeof this.fiber.type !== 'string') {
      keyWord = 'class';
    } else {
      keyWord = 'normal';
    }

    return `fiber fiber--${keyWord}`;
  }

  private get fiberStyle() {
    return {
      'margin-left': this.fiber.level * 40 + 'px',
    };
  }

  private renderValue() {
    return p(() => ({ class: 'fiber-detail' }),
      span(() => ({ class: 'fiber-detail-key' }),
        'Value: ',
      ),
      span(() => ({ class: 'fiber-detail-value' }),
        text(() => `"${this.fiber.textContent}"`),
      ),
    );
    return text(() => 'oh');
  }

  private renderOops() {
    return p(() => ({ class: 'fiber-detail' }),
      span(() => ({ class: 'fiber-detail-key' }),
        'Oops.',
      ),
    );
  }

  public render() {
    return (
      div(
        () => ({
          class: this.fiberClass,
          style: this.fiberStyle,
          onclick: () => this.onFiberClicked(),
        }),
        header(() => ({ class: 'fiber-id' }),
          p(null, text(() => this.fiberTag)),
          p(null, text(() => `[${this.fiber.id}]`)),
        ),
        section(null,
          () => this.fiber.type === ElementType.TEXT
            ? this.renderValue()
            : this.renderOops(),
        ),
      )
    );
  }
}
