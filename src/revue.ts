import { observe } from './reactive';

export class Revue {
  /**
   * 需要响应式字段的声明数组
   *
   * @private
   * @type {string[]}
   * @memberof Revue
   */
  private $reactiveKeys: string[];

  constructor() {
    // TODO: 该字段应挂于prototype上
    this.$reactiveKeys = this.initReactiveKeys();

    this.observeSelf();
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
