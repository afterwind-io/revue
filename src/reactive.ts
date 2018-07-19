import { isRendering } from './global';
import { Mediator } from './mediator';

export function makeReactive(obj: any) {
  Object.keys(obj).forEach(key => observe(obj, key));
}

export function observe(obj: any, key: string) {
  const mediator = new Mediator();

  let originValue = mediator.value = obj[key];

  // TODO: 缓存用户设定的getter, setter
  // const originGetter = ...

  Object.defineProperty(obj, key, {
    get() {
      if (isRendering()) {
        return mediator;
      } else {
        return originValue;
      }
    },
    set(value: any) {
      originValue = value;
      mediator.invoke();
    }
  });
}
