export interface IDictionary<T = any> {
  [key: string]: T;
}

export interface IProp extends IDictionary<any> {
  children?: IElement[];
}

export interface IElement {
  type: string | ElementType | RevueConstructor;
  props: IProp | null;
  mediator?: IMediator;
}

export const enum ElementType {
  TEXT = '__TEXT__',
  COMMENT = '__COMMENT__',
}

export interface IMediator {
  value: any;
  hook(hook: IMediatorHook): void;
}

export type IMediatorHook = (value: any) => void;

const enum FiberTag {
  HOST_ROOT,
  HOST_COMPONENT,
  CLASS_COMPONENT,
}

const enum FiberEffectTag {
  NONE,
  PLACEMENT,
  DELETION,
  UPDATE,
}

interface IFiber {
  tag: FiberTag;
  type: string | ElementType | RevueConstructor;
  prop: IProp;

  parent: IFiber | null;
  sibling: IFiber | null;
  child: IFiber | null;

  stateNode: IRevue | IFiberReferencedElement | null;

  alternate: IFiber | null;

  partialState: IDictionary | null;

  effectTag: FiberEffectTag;
  effects: IFiber[];
}

/**
 * 根fiber节点的引用
 *
 * 在某些组件（如函数式组件）中，其没有组件实例对象，
 * 只有HTMLElement类型的根元素，为了保留根fiber引用，
 * 需要在根元素对象上进行暂存
 *
 * @interface IFiberReferencedElement
 * @extends {Node}
 */
interface IFiberReferencedElement extends Node {
  _rootFiber_?: IFiber;
}

export type RevueConstructor = new (prop: IDictionary) => IRevue;

export interface IRevue<S = any, P = any> {
  state: S;
  prop: P;
  fiber: IFiber;
  _rootFiber_: IFiber;

  setState(stateFn: (state: S, prop: P) => Partial<S>): void;
  render(): IElement | IElement[];
}
