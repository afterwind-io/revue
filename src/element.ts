import { getUid, Shares } from './global';
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
  isElementTypeFn,
} from './util';
import * as Channel from './channel';

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
  const mediator = Shares.targetMediator = element.mediator;

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

  mediator.effectTag = MediatorEffectTag.Unknown;
  Shares.targetMediator = null;
  return element;
}

export function createChildElements(children: ElementChild[]): IElement[] {
  return children.reduce<IElement[]>((arr, child) => {
    let node: IElement | IElement[] | Serializable;
    if (isFunction(child)) {
      return arr.concat(createVirtualElement(child));
    } else {
      node = child;
    }

    return arr.concat(createChildElement(node));
  }, []);
}

function createChildElement(child: IElement | IElement[] | Serializable): IElement | IElement[] {
  if (Array.isArray(child)) {
    return createChildElements(child as IElement[]);
  } else if (isElement(child)) {
    return child as IElement;
  } else {
    return createTextElement(toPlainString(child));
  }
}

function createEmptyElement(
  type: ElementTypeFn | string | IRevueConstructor,
  propfn: ElementPropFn | null,
  children: ElementChild[],
): IElement {
  return pureObject<IElement>({
    virtual: false,
    type: ElementType.UNKNOWN,
    props: {},
    mediator: createMediator({ type, propfn, children }),
  });
}

function createVirtualElement(childFn: ElementChildFn): IElement {
  const mediator = Shares.targetMediator = createMediator();
  mediator.effectTag = MediatorEffectTag.Child;
  mediator.meta.children = [childFn];

  const children = ([] as IElement[]).concat(createChildElement(childFn()));

  return pureObject<IElement>({
    virtual: true,
    type: ElementType.COMMENT,
    props: { children },
    mediator,
  });
}

function createTextElement(content: any): IElement {
  const type = ElementType.TEXT;
  const props: IProp = { textContent: content };

  return pureObject<IElement>({
    virtual: false,
    type,
    props,
    mediator: createMediator(),
  });
}

function createMediator(meta?: IElementMeta): IElementMediator {
  const m: IElementMeta = meta || {
    type: ElementType.UNKNOWN,
    propfn: null,
    children: [],
  };

  const id = getUid();
  Channel.open(id);

  return pureObject<IElementMediator>({
    id,
    type: MediatorType.Element,
    effectTag: MediatorEffectTag.Unknown,
    relations: {},
    meta: pureObject(m),
  });
}

function isElement(node: IElement | IElement[] | Serializable): node is IElement {
  return typeof node === 'object' && node && (node as any).type && (node as any).props;
}
