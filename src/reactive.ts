import {
  IDependency,
  MediatorType,
  MediatorEffectTag,
  IMediator,
  IElementMediator,
} from './type';
import { getUid, Shares } from './global';
import * as Channel from './channel';

const ARRAY_INJECT_METHODS: string[] = [
  'push',
  'unshift',
  'shift',
  'pop',
  'splice',
  'sort',
  'reverse',
];

function isElementMediator(mediator: IMediator): mediator is IElementMediator {
  return mediator.type === MediatorType.Element;
}

class Dependency implements IDependency {
  public id: number = getUid();
  public value: any = null;

  constructor() {
    Channel.create(this.id);
  }

  public addDependency(mediator: IMediator) {
    if (isElementMediator(mediator)) {
      this.addElementDependency(mediator);
    } else {
      this.addDataDependency(mediator);
    }
  }

  public removeDependency(mediatorKey: number) {
    Channel.unsubscribe(mediatorKey, this.id);
  }

  public invoke() {
    Channel.emit(this.id);
  }

  private addElementDependency(mediator: IElementMediator) {
    const lastEffectTag = mediator.relations[this.id];

    // 如果同个element的多个属性（如type和props）
    // 同时依赖于同一个数据，则需要合并effectTag
    const combinedEffectTag: MediatorEffectTag
      = mediator.relations[this.id]
      = mediator.effectTag | lastEffectTag;

    // 使用闭包保存effectTag，因为mediator.effectTag是
    // 当前element的临时缓存值，在后续操作中可能发生变动
    Channel.subscribe(this.id, mediator.id, () => {
      if (mediator.update) mediator.update(this.id, combinedEffectTag);
      console.log(`[Channel] Data: ${this.id} -> Fiber: ${mediator.id}, Payload: `, combinedEffectTag);
    });
  }

  private addDataDependency(mediator: IMediator) {
    Channel.subscribe(this.id, mediator.id, () => {
      if (mediator.update) mediator.update(this.id, this.value);
      console.log(`[Channel] Data: ${this.id} -> Data: ${mediator.id}, Payload: `, this.value);
    });
  }
}

export function observe(obj: any, key: string) {
  const dep: IDependency = new Dependency();
  dep.value = obj[key];

  // TODO: 缓存用户设定的getter, setter
  // const originGetter = ...

  // TODO: 如何判定某个对象已被观测过，以避免陷入循环引用？

  if (dep.value !== undefined) {
    makeReactive(dep.value, dep);
  }

  Object.defineProperty(obj, key, {
    get() {
      const mediator = Shares.targetMediator;
      if (mediator) {
        dep.addDependency(mediator);
        console.log(`[Dependency] Key: "${key}", Id: "${dep.id}", Mediator: "${mediator.id}"`);
      }

      return dep.value;
    },
    set(value: any) {
      if (value !== dep.value) {
        makeReactive(value, dep);
      }

      dep.value = value;
      dep.invoke();
    },
    enumerable: false,
  });
}

function makeReactive(obj: any, dep: IDependency) {
  if (Array.isArray(obj)) {
    injectArrayMethods(obj, dep);
    observeArray(obj);
  } else if (typeof obj === 'object') {
    observeObject(obj);
  }
}

function observeObject(obj: any) {
  Object.keys(obj).forEach(key => observe(obj, key));
}

function observeArray(array: any[]) {
  array.forEach(o => typeof o === 'object' && observeObject(o));
}

function injectArrayMethods(array: any[], dep: IDependency) {
  const fakeProto = Object.create(Array.prototype);

  ARRAY_INJECT_METHODS.forEach(method => {
    Object.defineProperty(fakeProto, method, {
      value(...args: any[]) {
        Array.prototype[method].apply(this, args);

        let inserts: any[] | null = null;
        if (method === 'push' || method === 'unshift') {
          inserts = args;
        } else if (method === 'splice') {
          inserts = args.slice(2);
        }

        if (inserts && inserts.length !== 0) {
          observeArray(inserts);
        }

        dep.invoke();
      },
    });
  });

  Object.setPrototypeOf(array, fakeProto);
}
