import {
  IRevue,
  IFiber,
  IElement,
  FiberTag,
} from './type';
import { observe } from './reactive';
import { Fiber } from './fiber';
import { scheduleWork } from './scheduler';

export function mount(el: string | HTMLElement, ...children: IElement[]) {
  let hostDom;
  if (typeof el === 'string') {
    hostDom = document.querySelector(el);
  } else {
    hostDom = el;
  }

  if (!el) throw new Error();

  scheduleWork({
    from: FiberTag.HOST_ROOT,
    hostDom,
    newProp: {
      children,
    }
  });
}

export class Revue<P = any> implements IRevue<P> {
  public static isConstructor: boolean = true;

  public props: P;
  public fiber: IFiber = new Fiber();
  public _rootFiber_: IFiber = new Fiber();

  /**
   * 需要响应式字段的声明数组
   *
   * @private
   * @type {string[]}
   * @memberof Revue
   */
  private $reactiveKeys: string[];

  constructor(props?: P) {
    // TODO: 该字段应挂于prototype上
    this.$reactiveKeys = this.initReactiveKeys();

    this.props = props || {} as P;
    this.observeSelf();
  }

  public render(): IElement | IElement[] {
    return [];
  }

  public $addReactiveKey(key: string) {
    if (!this.$reactiveKeys) {
      this.$reactiveKeys = [];
    }

    this.$reactiveKeys.push(key);
  }

  /**
   * 初始化响应式字段数组
   *
   * 由于$reactiveKeys可能已由Prop装饰器调用$addReactiveKey方法
   * 初始化，故在构造器中优先返回自身引用
   *
   * @private
   * @returns
   * @memberof Revue
   */
  private initReactiveKeys() {
    return this.$reactiveKeys || [];
  }

  private observeSelf() {
    this.$reactiveKeys.forEach(key => observe(this, key));
  }
}
