import globals from './global';
import { IDependency, IMediator } from './type';

class Dependency implements IDependency {
  public value: any = null;
  public deps: IMediator[] = [];

  public addDependency(mediator: IMediator) {
    // TODO: 去重？
    this.deps.push(mediator);
  }

  public removeDependency() {
    // TODO: 可能会把首次添加的mediator删除
  }

  public invoke() {
    this.deps.forEach(mediator => {
      if (mediator.notify) mediator.notify();
    });
  }
}

export function makeReactive(obj: any) {
  Object.keys(obj).forEach(key => observe(obj, key));
}

export function observe(obj: any, key: string) {
  const dep: IDependency = new Dependency();

  let originValue = dep.value = obj[key];

  // TODO: 缓存用户设定的getter, setter
  // const originGetter = ...

  Object.defineProperty(obj, key, {
    get() {
      const mediator = globals.targetMediator;
      if (mediator) {
        mediator.dep = dep;

        // TODO: 如果单个element的多个属性（type, props）
        // 依赖同个数据，此处会导致重复收集依赖

        // 使用闭包保存正确的effectTag，
        // 因为mediator.tag在后续操作中可能发生变动
        const effectTag = mediator.tag;
        mediator.notify = function () {
          if (this.update) this.update(effectTag);
        };

        dep.addDependency(mediator);
        console.log('[dep]', key, mediator);
      }

      return originValue;
    },
    set(value: any) {
      originValue = value;
      dep.invoke();
    }
  });
}
