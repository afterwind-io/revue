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
import { noop, fiberWalker } from './util';
import * as Channel from './channel';
import { IComputedMeta } from './decorators';

export function mount(el: string | HTMLElement, ...children: IElement[]) {
  let hostDom;
  if (typeof el === 'string') {
    hostDom = document.querySelector(el);
  } else {
    hostDom = el;
  }

  if (!el) throw new Error();

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

  private $propMediators: IMediator[] = [];
  private $computedMediators: IMediator[] = [];

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
   * 用于实例化时处理的computed元数据
   *
   * @private
   * @type {IComputedMeta[]}
   * @memberof Revue
   */
  private $computed!: IComputedMeta[];

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

    this.$observeSelf();
    this.$observeProps();
    this.$observeComputed();
    this.$hookEmits();
  }

  public $updateProps() {
    this.$disposePropMediators();
    this.$disposeComputedMediators();

    // TODO: 是否有更好的实现方式？

    // HACK: 在props值被刷新的过程中，会触发所有prop重新取值，
    // 导致即将被删除的所有子代节点被更新（如果该节点依赖于某个prop）
    // 因此在刷新前断开所有子节点的update函数避免多余更新
    if (this.$fiber.child) {
      fiberWalker(this.$fiber.child, fiber => {
        fiber.mediator!.update = undefined;

        return true;
      });
    }

    this.$observeProps();
    this.$observeComputed();
  }

  public $destory() {
    this.$disposePropMediators();
  }

  public destoryed() {
    return;
  }

  public render(): IElement | IElement[] {
    return [];
  }

  private $observeSelf() {
    const observables = this.$observables || [];
    observables.forEach(key => observe(this, key));
  }

  private $observeProps() {
    const props = this.$props || [];

    props.forEach(key => {
      const mediator: IMediator = Shares.targetMediator = {
        id: getUid(),
        type: MediatorType.Data,
        relations: {},
        update: (depId: number, value: any) => this[key] = this.props[key](),
      };

      this.$propMediators.push(mediator);
      Channel.open(mediator.id);

      console.log(`------Prop: "${this.constructor.name}.${key}"`);
      this[key] = this.props[key]();
      observe(this, key);
      console.log('------Prop End');

      Shares.targetMediator = null;
    });
  }

  private $observeComputed() {
    const computed = this.$computed || [];

    computed.forEach(option => {
      let cachedValue: any;
      let mediator: IMediator;

      const key = option.key as string;

      const { get: originGetter } = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this),
        key,
      ) as PropertyDescriptor;

      observe(this, key, option.default, originGetter);

      mediator = {
        id: getUid(),
        type: MediatorType.Data,
        relations: {},
        update: (depId: number, value: any) =>
          this[key] = cachedValue = originGetter!.call(this),
      };
      this.$computedMediators.push(mediator);
      Channel.open(mediator.id);

      const { get: observedGetter, set } = Object.getOwnPropertyDescriptor(this, key) as PropertyDescriptor;
      Object.defineProperty(this, key, {
        get() {
          if (Shares.targetMediator) {
            observedGetter!.call(this);
          }

          if (cachedValue === undefined) {
            Shares.targetMediator = mediator;

            console.log(`------Computed: "${this.constructor.name}.${key}"`);
            cachedValue = originGetter!.call(this);
            console.log('------Computed End');
          }

          Shares.targetMediator = null;

          return option.cache ? cachedValue : observedGetter!.call(this);
        },
        set,
        configurable: true,
      });
    });
  }

  private $hookEmits() {
    const emits = this.$emits || [];
    emits.forEach(key =>
      Object.defineProperty(this, key, {
        value: (this.props as any)[key] || noop,
      }),
    );
  }

  private $disposePropMediators() {
    this.$propMediators.forEach(mediator => {
      Channel.emit(mediator.id);
      Channel.close(mediator.id);

      mediator.update = undefined;
    });
    this.$propMediators = [];
  }

  private $disposeComputedMediators() {
    this.$computedMediators.forEach(mediator => {
      Channel.emit(mediator.id);
      Channel.close(mediator.id);

      mediator.update = undefined;
    });
    this.$computedMediators = [];
  }
}
