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

    this.$observeSelf();
    this.$observeProps();
    this.$hookEmits();
  }

  public $updateProps() {
    this.$disposePropMediators();

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
}
