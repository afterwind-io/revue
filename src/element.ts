import globals from './global';
import {
  IProp,
  MediatorEffectTag,
  IMediator,
  IElement,
  ElementType,
  ElementTypeFn,
  ElementPropFn,
  ElementChildFn,
  IRevueConstructor,
  IElementMeta,
} from './type';
import {
  pureObject,
  isFunction,
  toPlainString,
} from './util';

/**
 * 创建element
 *
 * 如果任何参数、字段的值由包含依赖响应式字段的表达式计算得出，
 * 则在声明时需要用函数包围，以递延求值的过程，方便收集依赖
 *
 * @export
 * @param {(ElementTypeFn | string | IRevueConstructor)} type 元素类型
 * @param {(ElementPropFn | null)} propfn 生成props的方法，可以为null
 * @param {(...Array<ElementChildFn | IElement | string>)} children 子元素集
 * @returns {IElement}
 */
export function createElement(
  type: ElementTypeFn | string | IRevueConstructor,
  propfn: ElementPropFn | null,
  ...children: Array<ElementChildFn | IElement | string>
): IElement {
  const element: IElement = createEmptyElement(type, propfn, children);
  const mediator = globals.targetMediator = element.mediator;

  if (isFunction(type) && !(type as IRevueConstructor).isConstructor) {
    mediator.tag = MediatorEffectTag.Type;
    element.type = (type as ElementTypeFn)();
  } else {
    element.type = (type as string | IRevueConstructor);
  }

  // 获取props，并从globals.targetElement收集依赖
  if (propfn) {
    mediator.tag = MediatorEffectTag.Prop;
    element.props = propfn();
  }

  if (children.length !== 0) {
    element.props.children = createChildElements(children);
  }

  return element;
}

function createChildElements(children: Array<ElementChildFn | IElement | string>): IElement[] {
  return children.map(child => {
    const childElement: IElement = createTextElement('');
    globals.targetMediator = childElement.mediator;
    childElement.mediator.tag = MediatorEffectTag.Child;

    if (isFunction(child)) {
      // 如果子元素类型为包含响应式字段依赖表达式的方法，
      // 在收集依赖后作为文本节点处理
      const value = (child as ElementChildFn)();
      childElement.props.textContent = toPlainString(value);
    } else if (typeof child === 'object') {
      // 如果子元素类型为对象，当做Element类型直接返回
      return child as IElement;
    } else {
      // 如果子元素类型为其他任意值，当做文本节点处理
      childElement.props.textContent = toPlainString(child as string);
    }

    return childElement;
  });
}

function createEmptyElement(
  type: ElementTypeFn | string | IRevueConstructor,
  propfn: ElementPropFn | null,
  children: Array<ElementChildFn | IElement | string>,
): IElement {
  return pureObject<IElement>({
    type: ElementType.UNKNOWN,
    props: {},
    mediator: createMediator({ type, propfn, children }),
  });
}

function createTextElement(content: any) {
  const type = ElementType.TEXT;
  const props: IProp = { textContent: content };

  return pureObject<IElement>({
    type,
    props,
    mediator: createMediator({ type, propfn: () => props, children: [] }),
  });
}

function createMediator(meta: IElementMeta): IMediator {
  return pureObject<IMediator>({
    tag: MediatorEffectTag.Unknown,
    meta,
    notify() {
      if (this.update) this.update(this.tag);
    },
  });
}
