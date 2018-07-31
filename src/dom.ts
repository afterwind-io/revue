import {
  IFiber,
  IFiberReferencedElement,
  ElementType,
  IDictionary,
} from './type';

export function createDomElement(fiber: IFiber): IFiberReferencedElement {
  let el: IFiberReferencedElement;

  if (fiber.type === ElementType.TEXT) {
    el = document.createTextNode(fiber.props.textContent) as IFiberReferencedElement;
  } else {
    el = document.createElement(fiber.type as string) as IFiberReferencedElement;

    updateDomAttributes(el as HTMLElement, fiber.props);
  }

  return el;
}

export function updateDomAttributes(el: HTMLElement, attrs: IDictionary): HTMLElement {
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'children') return;

    setAttribute(el as HTMLElement, key, value)
  });
  return el;
}

function setAttribute(el: HTMLElement, key: string, value: any) {
  switch (key) {
    case 'class':
      return setClass(el, value);
    case 'style':
      return setStyle(el, value);
    case 'on':
      return setEventListener(el, value);
    default:
      return setDomAttributes(el, key, value);
  }
}

function setClass(el: HTMLElement, value: IDictionary<boolean> | string[] | string) {
  let cls: string;

  if (typeof value === 'string') {
    cls = value;
  } else if (Array.isArray(value)) {
    cls = value.reduce((str, v) => str + v + ' ', '');
  } else {
    cls = Object.keys(value).reduce<string>((str, key) =>
      value[key] ? str.concat(key) : str, '');
  }

  const originClass = el.getAttribute('class');
  if (cls !== originClass) el.setAttribute('class', cls);
}

function setStyle(el: HTMLElement, value: IDictionary<string> | string) {
  const style = typeof value === 'string'
    ? value
    : Object.entries(value).reduce((str, [k, v]) => str + `${k}: ${v};`, '');

  const originStyle = el.getAttribute('style');
  if (style !== originStyle) el.setAttribute('style', style);
}

function setEventListener(el: HTMLElement, events: IDictionary<EventListenerOrEventListenerObject>) {
  Object.entries(events).forEach(([name, handler]) => {
    const attr = 'on' + name;
    if (attr in el) {
      el['on' + name] = handler;
    }
  });
}

function setDomAttributes(el: HTMLElement, key: string, value: any) {
  // tslint:disable-next-line: triple-equals
  if (el[key] != value) el[key] = value;
}

export function appendChildren(el: Node, children: NodeList) {
  children.forEach(child => el.appendChild(child));
}
