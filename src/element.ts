import globals from './global';
import {
  Serializable,
  IProp,
  MediatorType,
  MediatorEffectTag,
  IElementMediator,
  IElement,
  ElementType,
  ElementChild,
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
 * @param {ElementChild[]} children 子元素集
 * @returns {IElement}
 */
export function createElement(
  type: ElementTypeFn | string | IRevueConstructor,
  propfn: ElementPropFn | null,
  ...children: ElementChild[]
): IElement {
  const element: IElement = createEmptyElement(type, propfn, children);
  const mediator = globals.targetMediator = element.mediator;

  if (isElementTypeFn(type)) {
    mediator.effectTag = MediatorEffectTag.Type;
    element.type = type();
  } else {
    element.type = (type as string | IRevueConstructor);
  }

  if (propfn) {
    mediator.effectTag = MediatorEffectTag.Prop;
    element.props = propfn();
  }

  if (children.length !== 0) {
    element.props.children = createChildElements(children);
  }

  return element;
}

function createChildElements(children: ElementChild[]): IElement[] {
  return children.reduce<IElement[]>((arr, child) => {
    const childElement: IElement = createTextElement('');
    globals.targetMediator = childElement.mediator;
    childElement.mediator.effectTag = MediatorEffectTag.Child;

    let node: IElement | IElement[] | Serializable;
    if (isFunction(child)) {
      node = (child as ElementChildFn)();
    } else {
      node = child;
    }

    if (Array.isArray(node)) {
      return arr.concat(createChildElements(node as IElement[]));
    } else if (isElement(node)) {
      return arr.concat(node as IElement);
    } else {
      childElement.props.textContent = toPlainString(node);
    }

    return arr.concat(childElement);
  }, []);
}

function createEmptyElement(
  type: ElementTypeFn | string | IRevueConstructor,
  propfn: ElementPropFn | null,
  children: ElementChild[],
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

function createMediator(meta: IElementMeta): IElementMediator {
  return pureObject<IElementMediator>({
    type: MediatorType.Element,
    effectTag: MediatorEffectTag.Unknown,
    meta,
  });
}

function isElementTypeFn(type: ElementTypeFn | string | IRevueConstructor): type is ElementTypeFn {
  return isFunction(type) && !(type as IRevueConstructor).isConstructor;
}

function isElement(node: IElement | IElement[] | Serializable): node is IElement {
  return typeof node === 'object' && node && (node as any).type && (node as any).props;
}
