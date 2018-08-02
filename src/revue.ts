import {
  IRevue,
  IFiber,
  IElement,
  FiberTag,
  MediatorType,
  IMediator,
} from './type';
import { getUid, Shares } from './global';
import { observe } from './reactive';
import { Fiber } from './fiber';
import { scheduleWork } from './scheduler';
import { noop } from './util';

export function mount(el: string | HTMLElement, ...children: IElement[]) {
  let hostDom;
  if (typeof el === 'string') {
    hostDom = document.querySelector(el);
  } else {
    hostDom = el;
  }

  if (!el) throw new Error();

  // TODO
  scheduleWork({
    tag: FiberTag.HOST_ROOT,
    hostDom,
    childElements: children,
  });
}

export class Revue<P = any> implements IRevue<P> {
  public static isConstructor: boolean = true;

  public props: P;
  public $fiber: IFiber = new Fiber();
  public $rootFiber: IFiber = new Fiber();

  /**
   * 需要做响应式处理的字段名称数组
   *
   * @private
   * @type {string[]}
   * @memberof Revue
   */
  private $observables!: string[];

  /**
   * 用于实例化时处理的props元数据
   *
   * @private
   * @type {string[]}
   * @memberof Revue
   */
  private $props!: string[];

  /**
   * 用于实例化时处理的emit元数据
   *
   * @private
   * @type {string[]}
   * @memberof Revue
   */
  private $emits!: string[];

  constructor(props?: P) {
    this.props = props || {} as P;

    this.observeSelf();
    this.observeProps();
    this.observeEmits();
  }

  public destoryed() {
    // TODO: 如何删除props的依赖关系？
  }

  public render(): IElement | IElement[] {
    return [];
  }

  private observeSelf() {
    const observables = this.$observables || [];
    observables.forEach(key => observe(this, key));
  }

  private observeProps() {
    const props = this.$props || [];
    props.forEach(key => {
      // TODO: 将mediator缓存至$props以便在实例销毁时清除依赖
      const mediator: IMediator = Shares.targetMediator = {
        id: getUid(),
        type: MediatorType.Data,
        relations: {},
        update: (depId: number, value: any) => this[key] = value,
      };

      this[key] = this.props[key]();
      observe(this, key);
    });
  }

  private observeEmits() {
    const emits = this.$emits || [];
    emits.forEach(key =>
      Object.defineProperty(this, key, {
        value: (this.props as any)[key] || noop,
      }),
    );
  }
}
