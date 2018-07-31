import {
  IDependency,
  MediatorType,
  MediatorEffectTag,
  IMediator,
  IElementMediator,
  IDataMediator,
} from './type';
import Globals from './global';

function isElementMediator(mediator: IDataMediator | IElementMediator): mediator is IElementMediator {
  return mediator.type === MediatorType.Element;
}

class Dependency implements IDependency {
  public value: any = null;
  public deps: IMediator[] = [];

  public addDependency(mediator: IDataMediator | IElementMediator) {
    if (isElementMediator(mediator)) {
      this.addElementDependency(mediator);
    } else {
      this.addDataDependency(mediator);
    }
  }

  public removeDependency() {
    // TODO: 可能会把首次添加的mediator删除
  }

  public includes(mediator: IMediator): boolean {
    return this.deps.includes(mediator);
  }

  public invoke() {
    this.deps.forEach(mediator => {
      if (mediator.update) mediator.update();
    });
  }

  private addElementDependency(mediator: IElementMediator) {
    let lastEffectTag = MediatorEffectTag.Unknown;

    if (this.deps.includes(mediator)) {
      // 如果同个element的多个属性（如type和props）
      // 同时依赖于同一个数据，则需要调用notify从闭包中读取
      // 之前写入的effectTag，将其与当前effectTag合并写入新闭包
      mediator.onUpdated = (tag: MediatorEffectTag) => lastEffectTag = tag;
      (mediator.update as () => void)();
      delete mediator.onUpdated;
    } else {
      this.deps.push(mediator);
    }

    // 使用闭包保存effectTag，因为mediator.effectTag是
    // 当前element的临时缓存值，在后续操作中可能发生变动
    const effectTag = mediator.effectTag | lastEffectTag;
    mediator.update = function () {
      if (this.onUpdated) this.onUpdated(effectTag);
    };
  }

  private addDataDependency(mediator: IDataMediator) {
    if (this.deps.includes(mediator)) return;

    this.deps.push(mediator);

    const value = this.value;
    // TODO: data与mediator是n:n的关系，update不能是唯一的
    mediator.update = function () {
      if (this.onUpdated) this.onUpdated(value);
    };
  }
}

export function makeReactive(obj: any) {
  Object.keys(obj).forEach(key => observe(obj, key));
}

export function observe(obj: any, key: string) {
  const dep: IDependency = new Dependency();
  dep.value = obj[key];

  // TODO: 缓存用户设定的getter, setter
  // const originGetter = ...

  Object.defineProperty(obj, key, {
    get() {
      const mediator = Globals.targetMediator;
      if (mediator) {
        if (!dep.includes(mediator)) {
          if (!mediator.deps) mediator.deps = [];
          mediator.deps.push(dep);
        }

        dep.addDependency(mediator);
        console.log('[dep]', key, mediator, dep);
      }

      return dep.value;
    },
    set(value: any) {
      dep.value = value;
      dep.invoke();
    },
    enumerable: false,
  });
}
