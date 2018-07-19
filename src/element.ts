import {
  IProp,
  IMediator,
  IElement,
  ElementType,
} from './type';
import { Mediator } from './mediator';

export function createElement(
  type: string,
  props: IProp | null,
  ...children: Array<string | IMediator | IElement>
): IElement {
  const element: IElement = {
    type,
    props: props || {},
  };

  (element.props as IProp).children = children.map(child => {
    if (typeof child === 'string') {
      // TODO: 还应该有number | null | undefined
      // TODO: 返回文本节点
      return createTextElement(child);
    } else if (child instanceof Mediator) {
      // 当children节点中有从state解析出的指定为响应式的值时，
      // 此处应接收到一个Mediator对象
      const el = createTextElement(child.value);
      return Object.assign(el, { mediator: child });
    } else {
      return child as IElement;
    }
  });

  return element;
}

function createTextElement(content: string): IElement {
  return {
    type: ElementType.TEXT,
    props: {
      textContent: content
    },
  };
}
