import { IDictionary, Serializable } from './type';

export function pureObject<T extends object = IDictionary>(source?: T): T {
  return Object.assign(Object.create(null), source);
}

export function isFunction(o: any): boolean {
  return !!o && ({}).toString.call(o) === '[object Function]';
}

export function toPlainString(content: Serializable) {
  if (typeof content === 'object' && content) {
    return content.toString();
  } else {
    return content + '';
  }
}
