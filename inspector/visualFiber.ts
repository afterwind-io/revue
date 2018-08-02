import { Revue } from '../src/revue';
import { Prop } from '../src/decorators';
import { IFiber, FiberTag, ElementType } from '../src/type';
import {
  div,
  header,
  p,
  text,
  section,
  span,
} from '../src/element.util';

export default class VisualFiber extends Revue {
  @Prop
  private fiber!: IFiber;

  @Prop
  private level!: number;

  private get fiberTag(): string {
    return this.fiber.tag === FiberTag.VIRTUAL
      ? 'Virtual'
      : (typeof this.fiber.type === 'string'
        ? this.fiber.type
        : this.fiber.type.name)
      || 'Root';
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
      'margin-left': this.level * 40 + 'px',
    };
  }

  private renderValue() {
    return p(() => ({ class: 'fiber-detail' }),
      span(() => ({ class: 'fiber-detail-key' }),
        'Value: ',
      ),
      span(() => ({ class: 'fiber-detail-value' }),
        text(() => `"${this.fiber.props.textContent}"`),
      ),
    );
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
          onclick: () => console.log(this.fiber),
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
