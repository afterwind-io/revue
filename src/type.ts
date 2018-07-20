export interface IDictionary<T = any> {
  [key: string]: T;
}

export interface IProp extends IDictionary<any> {
  children?: IElement[];
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
  Unknown,
  Type,
  Prop,
  Child,
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
   * 依赖影响的元素属性
   *
   * @type {MediatorEffectTag}
   * @memberof IMediator
   */
  tag: MediatorEffectTag;

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
   * 用于建立element树的元数据
   *
   * @type {IElementMeta}
   * @memberof IMediator
   */
  meta: IElementMeta;

  /**
   * 通知fiber更新
   *
   * @memberof IMediator
   */
  notify?: () => void;

  /**
   * fiber更新方法
   *
   * @memberof IMediator
   */
  update?: (type: MediatorEffectTag) => void;
}

export interface IElement {
  type: string | ElementType | IRevueConstructor;
  props: IProp;
  mediator: IMediator;
}

export interface IElementMeta {
  type: ElementTypeFn | string | IRevueConstructor;
  propfn: ElementPropFn | null;
  children: Array<ElementChildFn | IElement | string>;
}

export const enum ElementType {
  UNKNOWN = '__UNKNOWN__',
  TEXT = '__TEXT__',
  COMMENT = '__COMMENT__',
}

export type ElementTypeFn = () => string | IRevueConstructor;
export type ElementPropFn = () => IProp;
export type ElementChildFn = () => IElement | any;

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

  render(): IElement | IElement[];
}
