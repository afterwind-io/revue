import { observe } from './reactive';

export class Revue {
  // TODO: 不应当这样初始化
  private $reactiveKeys: string[] = [];

  constructor() {
    this.initReactiveKeys();
    this.observe();
  }

  private initReactiveKeys() {
    if (!this.$reactiveKeys) {
      this.$reactiveKeys = [];
    }
  }

  private observe() {
    this.$reactiveKeys.forEach(key => observe(this, key));
  }
}
