import globals from './global';
import {
  IProp,
  IMediator,
  IElement,
  ElementType,
} from './type';
import { pureObject, isFunction } from './util';

type PropFn = () => IProp;
type ElementFn = () => IElement | any;

/**
 * 创建element
 *
 * 注：在子元素中，只有由依赖响应式字段计算出的值类型的元素，
 * 在声明时需要用函数包围，以递延求值的过程
 *
 * @export
 * @param {string} type 元素类型
 * @param {(PropFn | null)} propfn 生成props的方法，可以为null
 * @param {(...Array<IElement | ElementFn | string>)} children 子元素集
 * @returns {IElement}
 */
export function createElement(
  type: string,
  propfn: PropFn | null,
  ...children: Array<IElement | ElementFn | string>
): IElement {
  const element: IElement = createEmptyElement(type);
  globals.targetMediator = element.mediator;

  // 获取props，并从globals.targetElement收集依赖
  if (propfn) {
    element.props = propfn();
  }

  if (children.length !== 0) {
    element.props.children = createChildElements(children);
  }

  return element;
}

function createChildElements(children: Array<IElement | ElementFn | string>): IElement[] {
  return children.map(child => {
    const childElement: IElement = createEmptyElement();
    globals.targetMediator = childElement.mediator;

    if (isFunction(child)) {
      // 当子元素类型为方法时，
      // 即为包含响应式字段依赖表达式，返回类型为值的情况，
      // 收集依赖后作为文本节点处理
      const value = (child as ElementFn)();
      toTextElement(childElement, value);
    } else if (typeof child === 'object') {
      // 如果子元素类型为对象，当做Element类型直接返回
      return child as IElement;
    } else {
      // 如果子元素类型为其他任意值，当做文本节点处理
      toTextElement(childElement, child);
    }

    return childElement;
  });
}

function createEmptyElement(type: string = ElementType.COMMENT): IElement {
  return pureObject<IElement>({
    type,
    props: {},
    mediator: pureObject<IMediator>(),
  });
}

function toTextElement(element: IElement, content: any) {
  element.type = ElementType.TEXT;
  element.props.textContent = content + '';
}
