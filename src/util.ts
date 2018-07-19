import { IDictionary } from 'type';

export function pureObject<T extends object = IDictionary>(source?: T): T {
  return Object.assign(Object.create(null), source);
}

export function isFunction(o: any): boolean {
  return !!o && ({}).toString.call(o) === '[object Function]';
}
