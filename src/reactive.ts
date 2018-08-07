import {
  IDependency,
  MediatorType,
  MediatorEffectTag,
  IMediator,
  IElementMediator,
} from './type';
import { getUid, Shares } from './global';
import * as Channel from './channel';

type PropertyGetter = () => any;

const ARRAY_INJECT_METHODS: string[] = [
  'push',
  'unshift',
  'shift',
  'pop',
  'splice',
  'sort',
  'reverse',
];
const OBSERVED_MARKER = '__observed__';

function isElementMediator(mediator: IMediator): mediator is IElementMediator {
  return mediator.type === MediatorType.Element;
}

class Dependency implements IDependency {
  public id: number = getUid();
  public target: string = '';
  public value: any = undefined;

  constructor(target: object, key: string, defaultValue?: any) {
    this.target = this.getClassName(target) + '.' + key;

    try {
      this.value = target[key];
    } catch (e) {
      this.value = defaultValue;
    }

    Channel.open(this.id);
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
      console.log(`[Channel] Data: ${this.target}[${this.id}] -> Fiber: ${mediator.id}, Payload: `, combinedEffectTag);
    });

    Channel.subscribe(mediator.id, this.id, () => {
      this.removeDependency(mediator.id);
      console.log(`[Channel] Data: ${this.target}[${this.id}] -X- Fiber: ${mediator.id}`);
    });
  }

  private addDataDependency(mediator: IMediator) {
    Channel.subscribe(this.id, mediator.id, () => {
      if (mediator.update) mediator.update(this.id, this.value);
      console.log(`[Channel] Data: ${this.target}[${this.id}] -> Data: ${mediator.id}, Payload: `, this.value);
    });

    Channel.subscribe(mediator.id, this.id, () => {
      this.removeDependency(mediator.id);
      console.log(`[Channel] Data: ${this.target}[${this.id}] -X- Data: ${mediator.id}`);
    });
  }

  private getClassName(obj: object) {
    const constructor = obj.constructor;

    if (constructor && constructor !== Object) {
      return constructor.name;
    } else {
      return '{}';
    }
  }
}

export function observe(
  obj: any,
  key: string,
  defaultValue?: any,
  getter?: PropertyGetter,
): IDependency | undefined {
  if (hasObserved(obj, key)) return;

  const dep: IDependency = new Dependency(obj, key, defaultValue);
  defineProperty(obj, key, dep, getter);

  if (dep.value !== undefined) {
    makeReactive(dep.value, dep);
  }

  markObserved(obj, key);

  return dep;
}

function defineProperty(
  obj: any,
  key: string,
  dep: IDependency,
  userGetter?: PropertyGetter,
) {
  let getter: PropertyGetter | undefined;
  let setter: ((value: any) => void) | undefined;
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  if (descriptor) {
    getter = userGetter || descriptor.get;
    setter = descriptor.set;
  }

  Object.defineProperty(obj, key, {
    get() {
      const mediator = Shares.targetMediator;
      if (mediator) {
        dep.addDependency(mediator);

        console.log(`[Dependency] "${dep.target}"[${dep.id}] <- Mediator[${mediator.id}]`);
      }

      return getter ? getter.call(obj) : dep.value;
    },
    set(value: any) {
      if (value === dep.value) return;

      makeReactive(value, dep);

      if (setter) {
        setter.call(value);
      }

      dep.value = value;
      dep.invoke();
    },
    configurable: true,
  });
}

function makeReactive(obj: any, dep: IDependency) {
  if (!canObserve(obj)) return;

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
  array.forEach(o => canObserve(o) && observeObject(o));
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

function markObserved(obj: any, key: string) {
  if (!obj[OBSERVED_MARKER]) {
    Object.defineProperty(obj, OBSERVED_MARKER, { value: {} });
  }

  obj[OBSERVED_MARKER][key] = true;
}

function hasObserved(obj: any, key: string) {
  return !!obj[OBSERVED_MARKER] && obj[OBSERVED_MARKER][key];
}

function canObserve(obj: any) {
  return typeof obj === 'object' && !!obj;
}
