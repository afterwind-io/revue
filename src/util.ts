import {
  IDictionary,
  Serializable,
  ElementTypeFn,
  IRevueConstructor,
} from './type';

// tslint:disable-next-line:no-empty
export function noop() { }

export function pureObject<T extends object = IDictionary>(source?: T): T {
  return Object.assign(Object.create(null), source);
}

export function isFunction(o: any): o is (...args: any[]) => any {
  return !!o && ({}).toString.call(o) === '[object Function]';
}

export function isElementTypeFn(type: ElementTypeFn | string | IRevueConstructor): type is ElementTypeFn {
  return isFunction(type) && !(type as any).isConstructor;
}

export function toPlainString(content: Serializable) {
  if (typeof content === 'object' && content) {
    return content.toString();
  } else {
    return content + '';
  }
}

export function findNreplace<T>(arr: T[], source: T, predicate: (el: T) => boolean): T | undefined {
  const index = arr.findIndex(predicate);
  if (index === -1) {
    return undefined;
  } else {
    const target = arr[index];
    arr[index] = source;
    return target;
  }
}
