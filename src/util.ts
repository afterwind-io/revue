import {
  IDictionary,
  Serializable,
  ElementTypeFn,
  IRevueConstructor,
  IFiber,
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

/**
 * 查找并替换数组中的指定元素
 *
 * 注：该方法会更改传入的数组本身
 *
 * @export
 * @template T 数组元素类型
 * @param {T[]} arr 需要操作的数组
 * @param {T} source 用于替换的元素
 * @param {(el: T) => boolean} predicate 查找指定元素的断言
 * @returns {(T | undefined)} 被替换的元素，如果未找到指定元素，返回undefined
 */
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

/**
 * 查找并删除数组中的指定元素
 *
 * 注：该方法会更改传入的数组本身
 *
 * @export
 * @template T 数组元素类型
 * @param {T[]} array 需要操作的数组
 * @param {(value: T, index: number) => boolean} predicate 查找指定元素的断言
 */
export function findNdelete<T>(array: T[], predicate: (value: T, index: number) => boolean) {
  const index = array.findIndex(predicate);
  if (index !== -1) array.splice(index, 1);
}

export function fiberWalker(fiber: IFiber, cb: (fiber: IFiber) => boolean) {
  let next: IFiber | null = fiber;
  while (next) {
    if (!cb(next)) return;

    if (next.child) {
      next = next.child;
    } else if (next.sibling) {
      next = next.sibling;
    } else {
      next = next.parent;

      while (next) {
        if (next === fiber) return;

        if (next.sibling) {
          next = next.sibling;
          break;
        } else {
          next = next.parent;
        }
      }
    }
  }
}
