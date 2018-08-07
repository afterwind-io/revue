import { mount } from '../src/revue';
import { createElement as h } from '../src/element';
import './inspector.css';

import Inspector from './inspector';

const root = document.createElement('div');
root.className = 'inspector';
document.body.appendChild(root);

export function inspect() {
  mount('.inspector', h(Inspector, null));
}
