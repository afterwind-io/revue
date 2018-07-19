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
    this.deps.forEach(dep => {
      if (dep.notify) dep.notify();
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
        dep.addDependency(mediator);
      }

      return originValue;
    },
    set(value: any) {
      originValue = value;
      dep.invoke();
    }
  });
}
