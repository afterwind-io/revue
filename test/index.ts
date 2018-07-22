import { mount } from '../src/revue';
import { createElement as h } from '../src/element';

import App from './app';

mount('#app', h(App, null));

// TODO: 如果某个fiber依赖多个响应式字段，且这些字段在同一tick被更改，
// 会导致该fiber重复提交，需要一个合并机制

// TODO: 目前响应式字段收集依赖缺少一个停止条件

// TODO: props的变动导致依赖组件变动的机制需要特别处理
