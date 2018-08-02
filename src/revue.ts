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
import * as Channel from './channel';

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

  private $mediators: IMediator[] = [];

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

  public $destory() {
    this.$mediators.forEach(mediator => {
      Channel.emit(mediator.id);
      Channel.close(mediator.id);
    });
  }

  public destoryed() {
    return;
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
      const mediator: IMediator = Shares.targetMediator = {
        id: getUid(),
        type: MediatorType.Data,
        relations: {},
        update: (depId: number, value: any) => this[key] = this.props[key](),
      };

      this.$mediators.push(mediator);
      Channel.open(mediator.id);

      this[key] = this.props[key]();
      observe(this, key);

      Shares.targetMediator = null;
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
