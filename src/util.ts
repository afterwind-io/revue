import { IDictionary } from './type';

export function pureObject<T extends object = IDictionary>(source?: T): T {
  return Object.assign(Object.create(null), source);
}

export function isFunction(o: any): boolean {
  return !!o && ({}).toString.call(o) === '[object Function]';
}

export function toPlainString(content: any) {
  if (typeof content === 'object') {
    return content.toString();
  } else {
    return content + '';
  }
}
