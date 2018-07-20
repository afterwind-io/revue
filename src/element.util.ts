import {
  IElement,
  ElementPropFn,
  ElementChildFn,
} from './type';
import { createElement as h } from './element';

function el(type: string) {
  return (propfn: ElementPropFn | null, ...children: Array<ElementChildFn | IElement | string>): IElement => {
    return h(type, propfn, ...children);
  };
}

export const button = el('button');
export const div = el('div');
export const h1 = el('h1');
export const h2 = el('h2');
export const h3 = el('h3');
export const h4 = el('h4');
export const h5 = el('h5');
export const h6 = el('h6');
export const input = el('input');
export const p = el('p');
export const span = el('span');
export const table = el('table');
export const td = el('td');
export const th = el('th');
export const tr = el('tr');
