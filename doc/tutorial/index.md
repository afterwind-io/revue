# 从零开始的手制前端框架

- [前言](#%E5%89%8D%E8%A8%80)
- [从元素抽象开始](#%E4%BB%8E%E5%85%83%E7%B4%A0%E6%8A%BD%E8%B1%A1%E5%BC%80%E5%A7%8B)

## 前言

最近折腾了一个用于概念验证的前端视图层框架，该项目最重要的目标是试图解决存在于目前所有基于virtual dom的前端框架中的一个共性问题：

> **生成元素的元信息在virtual dom的构建过程中被丢弃了**。

举个栗子来解释下上面那句话：

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

如果你对React的实际工作原理有一定了解的话，当`props.name`发生变化后，整个`Welcome`组件会重新绘制成新的*Element*（*virtual dom*数据结构），随后经过diff再去修改`h1`的*nodeValue*。然而问题是，这个组件的声明过程已明确表示，`props.name`只会影响`h1`的*nodeValue*，既然如此为什么又要大费周章地去重绘整个组件呢？

导致这个结果的原因与*virtual dom*的工作原理脱不了干系，此外也与React的函数式设计哲学有关。为了解决这个问题，一个新的框架就此诞生：

> **Revue**，一款糅合了React的Fiber架构（的皮毛），以及Vue的响应式系统（的皮毛）的全新~~玩法~~视图层框架（大误）。

本系列教程精炼自整个框架的开发过程，力图用详实且较为轻松的方式描述从零开始的完整设计思路，以达到：

- 探索一种途径，能够尽可能地在*virtual dom*的构建过程中保留构建元信息
- React的Fiber与Vue的响应式系统结合会产生怎样的效果
- 产生一种我也能随随便便搞个框架的**错觉**（错觉两字是重点，圈起来以后要考）

为了能够愉快地阅读本文，你至少需要以下基础知识：

- 写过点网页
- 跟得上时代的Javascript语法
- 基本的Typescript类型系统知识，包括基本类型，接口及索引类型

<!-- TODO: 章节未匹配 -->
如果你对React及Vue的工作细节具备相当的了解，想直接阅读Revue是如何解决文本开头提出的问题的，请直接右转第XXX章。

正文开始前的国际惯例：欢迎通过issue进行相关讨论。如果这系列文章让你感到身心愉快，或者带来了新的思考，千万不要吝啬你的star。

## 从元素抽象开始

还记得我们在学习一门新的语言时，文档一般都是怎么给我们入门的？对了，就是给出一个最基本的Hello World。于是我们的旅途也从HTML的Hello World开始：

```html
<h1 class="title">Hello World!</h1>
```

现在我们换个姿势，如果我们用Javascript来创建这个元素的话该则么写？

```javascript
const element = document.createElement('div');
element.className = 'title';
element.appendChild(new Text('Hello World!'));
```

于是试想一下，如果我们需要用Javascript来创建完整的网页，遇到每个元素都要来这么一遭，这可怎么得了？于是我们想到了将上述过程提取成方法。在此之前，仔细分析一下你写下的Hello World，你会发现，所有的元素都遵循了相同的构成规则，即

- 类型名称（"`h1`"）
- 一些属性值，可以为空（`class: "title"`）
- 子代元素集合，可以为空（文本节点"`Hello World!`"）

如果我们将子代元素集合也做为一种属性看待，并且用一个普通Javascript对象来表达刚才的Hello World元素的话，我们可得到：

```javascript
const hello = {
  type: 'h1',
  props: {
    class: 'title',
    children: [
      'Hello World!'
    ],
  },
};
```

将这个对象的类型称作IElement，用Typescript描述的话，可得：

```typescript
interface IElement {
  type: string;
  props: {
    [key: string]: any,
    children: IElement[],
  };
}
```

<!-- TODO: 有待优化，内容跳得过快 -->
现在我们可以写出元素创建方法了：
```typescript
function createElement(type: string, props: {[key: string]: any}, ...children: IElement[]): HTMLElement {
  // 以下省略
}
```

恭喜你！其实到了这一步，你已经创建了一个非常简单的前端框架，虽然看上去只是一个特别基本的工具函数，但是它完成了从数据到元素的创建过程，而这正是众多视图层框架本质上所提供的功能。
