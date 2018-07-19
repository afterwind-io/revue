export interface IDictionary<T = any> {
  [key: string]: T;
}

export interface IProp extends IDictionary<any> {
  children?: IElement[];
}

/**
 * 依赖中介者
 *
 * 用于建立fiber与依赖数据的响应关系
 *
 * @export
 * @interface IMediator
 */
export interface IMediator {
  /**
   * 所属fiber的id
   *
   * @type {string}
   * @memberof IMediator
   */
  from?: string;

  /**
   * 所属响应式数据的依赖收集对象
   *
   * @type {IDependency}
   * @memberof IMediator
   */
  dep?: IDependency;

  /**
   * 通知fiber更新的事件
   *
   * @memberof IMediator
   */
  notify?: () => void;
}

export interface IElement {
  type: string | ElementType | RevueConstructor;
  props: IProp;
  mediator: IMediator;
}

export const enum ElementType {
  TEXT = '__TEXT__',
  COMMENT = '__COMMENT__',
}

export interface IDependency {
  value: any;
  addDependency(dep: IMediator): void;
  invoke(): void;
}

export const enum FiberTag {
  HOST_ROOT,
  HOST_COMPONENT,
  CLASS_COMPONENT,
}

export const enum FiberEffectTag {
  NONE,
  PLACEMENT,
  DELETION,
  UPDATE,
}

export interface IFiber {
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
export interface IFiberReferencedElement extends Node {
  _rootFiber_?: IFiber;
}

export type RevueConstructor = new (props: IDictionary) => IRevue;

export interface IRevue<P = any> {
  props: P;
  fiber: IFiber;
  _rootFiber_: IFiber;

  render(): IElement | IElement[];
}
