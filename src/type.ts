export interface IDictionary<T = any> {
  [key: string]: T;
}

export type Serializable = object | string | number | boolean | null | undefined;

export interface IProp extends IDictionary<any> {
  children?: IElement[];
}

/**
 * 中介者类型
 *
 * @export
 * @enum {number}
 */
export const enum MediatorType {
  /**
   * 数据之间的依赖
   */
  Data,

  /**
   * 数据与元素之间的依赖
   */
  Element,
}

/**
 * 中介者相应类型标记
 * 
 * 当数据变化导致fiber树变动时，需要该标记来指示
 * 受到影响的类型，以执行更优的render策略
 *
 * @export
 * @enum {number}
 */
export const enum MediatorEffectTag {
  Unknown = 0,
  Type = 1,
  Prop = 2,
  Child = 4,
}

/**
 * 依赖中介者
 *
 * 连接数据与其依赖者，缓存必要的信息，
 * 并作为发起响应式通知的中间对象
 *
 * @export
 * @interface IMediator
 */
export interface IMediator {
  /**
   * 中介者类型
   *
   * @type {MediatorType}
   * @memberof IMediator
   */
  type: MediatorType;

  /**
   * 所属响应式数据的依赖收集对象
   *
   * @type {IDependency}
   * @memberof IMediator
   */
  dep?: IDependency;

  /**
   * 通知依赖者更新的入口
   *
   * @memberof IMediator
   */
  notify?: () => void;
}

/**
 * 用于连接数据之间的中介对象
 *
 * @export
 * @interface IDataMediator
 * @extends {IMediator}
 */
export interface IDataMediator extends IMediator {
  /**
   * 依赖数据的响应方法
   *
   * @memberof IDataMediator
   */
  update?: (value: any) => void;
}

/**
 * 用于连接fiber, element与数据的中介对象
 *
 * @export
 * @interface IElementMediator
 * @extends {IMediator}
 */
export interface IElementMediator extends IMediator {
  /**
   * 依赖影响的元素属性
   *
   * @type {MediatorEffectTag}
   * @memberof IMediator
   */
  effectTag: MediatorEffectTag;

  /**
   * 所属fiber的id
   *
   * @type {string}
   * @memberof IMediator
   */
  from?: string;

  /**
   * 用于建立element树的元数据
   *
   * @type {IElementMeta}
   * @memberof IMediator
   */
  meta: IElementMeta;

  /**
   * fiber更新的响应方法
   *
   * @memberof IMediator
   */
  update?: (type: MediatorEffectTag) => void;
}

export interface IElement {
  type: string | ElementType | IRevueConstructor;
  props: IProp;
  mediator: IElementMediator;
}

export interface IElementMeta {
  type: ElementTypeFn | string | IRevueConstructor;
  propfn: ElementPropFn | null;
  children: ElementChild[];
}

export const enum ElementType {
  UNKNOWN = '__UNKNOWN__',
  TEXT = '__TEXT__',
  COMMENT = '__COMMENT__',
}

export type ElementChild = ElementChildFn | IElement | IElement[] | Serializable;

export type ElementTypeFn = () => string | IRevueConstructor;
export type ElementPropFn = () => IProp;
export type ElementChildFn = () => IElement | IElement[] | Serializable;

export interface IDependency {
  value: any;
  addDependency(dep: IDataMediator | IElementMediator): void;
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
  type: string | ElementType | IRevueConstructor;
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

export interface IRevueConstructor {
  new(props: IDictionary): IRevue;
  isConstructor: boolean;
}

export interface IRevue<P = any> {
  props: P;
  fiber: IFiber;
  _rootFiber_: IFiber;

  destoryed(): void;

  render(): IElement | IElement[];
}
