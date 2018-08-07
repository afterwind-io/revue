import './inspector.css';
import { IFiber, ElementType, FiberTag } from '../src/type';
import * as Channel from '../src/channel';
import { CHANNEL_INSPECTOR, getUid } from '../src/global';

const elIndicator: HTMLElement = h('div', 'inspector-indicator');
let rootElement: HTMLElement | null = null;

document.body.appendChild(elIndicator);

Channel.subscribe(CHANNEL_INSPECTOR, getUid(), (fiber: IFiber) => {
  if (rootElement) {
    document.body.removeChild(rootElement);
  }

  rootElement = h('div', 'inspector');

  genTree(fiber);

  document.body.appendChild(rootElement!);
})

function genTree(fiber: IFiber) {
  let level: number = 0;

  let next: IFiber | null = fiber;
  while (next) {
    rootElement!.appendChild(createFiberElement(next, level));

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

function createFiberElement(fiber: IFiber, level: number) {
  const fiberType =
    fiber.tag === FiberTag.VIRTUAL
      ? 'Virtual'
      : (typeof fiber.type === 'string'
        ? fiber.type
        : fiber.type.name)
      || 'Root';

  const fiberElement =
    h('div', getFiberClass(fiber),
      h('header', 'fiber-id',
        h('p', '', `${fiberType}`),
        h('p', '', `[${fiber.id}]`),
      ),
      h('section', '',
        // h('p', 'fiber-effect-tag', `EffectTag: ${fiber.effectTag}`),
        // h('p', 'fiber-props', `Props: ${JSON.stringify(fiber.props)}`),
        c(
          fiber.type === ElementType.TEXT,
          h('p', 'fiber-detail',
            h('span', 'fiber-detail-key', 'Value: '),
            h('span', 'fiber-detail-value', `"${fiber.props.textContent}"`),
          ),
          h('p', 'fiber-detail-key', 'Oops.'),
        ),
      ),
    );

  fiberElement.style.marginLeft = level * 40 + 'px';

  fiberElement.addEventListener('click', () => {
    console.log('$fiber =>', fiber);
    (window as any).$fiber = fiber;
  });

  if (fiber.stateNode instanceof HTMLElement) {
    fiberElement.addEventListener('mouseenter', () => showIndicator(fiber));
    fiberElement.addEventListener('mouseleave', () => hideIndicator());
  }

  return fiberElement;
}

function getFiberClass(fiber: IFiber): string {
  let keyWord: string = '';

  if (fiber.tag === FiberTag.VIRTUAL) {
    keyWord = 'virtual';
  } else if (fiber.type === ElementType.TEXT) {
    keyWord = 'text';
  } else if (typeof fiber.type !== 'string') {
    keyWord = 'class';
  } else {
    keyWord = 'normal';
  }

  return `fiber fiber--${keyWord}`;
}

function showIndicator(fiber: IFiber) {
  elIndicator.classList.toggle('inspector-indicator--visible', true);

  const target = fiber.stateNode as HTMLElement;
  const { left, top, width, height } = target.getBoundingClientRect();
  elIndicator.style.left = left + 'px';
  elIndicator.style.top = top + 'px';
  elIndicator.style.width = width + 'px';
  elIndicator.style.height = height + 'px';
}

function hideIndicator() {
  elIndicator.classList.toggle('inspector-indicator--visible', false);
}

function h(type: string, className: string, ...children: Array<string | Node | undefined>) {
  const el = document.createElement(type);
  el.className = className;
  children.forEach(child => {
    if (child) el.appendChild(typeof child === 'string' ? new Text(child) : child);
  });

  return el;
}

function c(condition: boolean, t: string | Node, f?: string | Node): string | Node | undefined {
  return condition ? t : f;
}
