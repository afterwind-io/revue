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
    },
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
  private $reactiveKeys: string[] = [];

  constructor(props?: P) {
    // HACK: 当派生类实例化时，真正需要的$reactiveKeys字段
    // 已经在相应的Revue.prototype上生成，故此处删除
    // 自身的$reactiveKeys字段
    delete this.$reactiveKeys;

    this.props = props || {} as P;
    this.observeSelf();
  }

  public render(): IElement | IElement[] {
    return [];
  }

  private observeSelf() {
    if (this.$reactiveKeys) {
      this.$reactiveKeys.forEach(key => observe(this, key));
    }
  }
}
