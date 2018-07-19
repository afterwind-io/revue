import {
  IDictionary,
  IElement,
  IFiber,
  IFiberReferencedElement,
  IRevue,
  FiberTag,
  FiberEffectTag,
  RevueConstructor,
} from './type';
import { Fiber } from './fiber';
import { createDomElement, updateDomAttributes } from './dom';

interface IWorkUnit {
  from: FiberTag;
  hostDom?: IFiberReferencedElement;
  instance?: IRevue;
  partialState?: IDictionary;
  newProp?: IDictionary;
}

const ENOUGH_TIME = 1;

const workQueue: IWorkUnit[] = [];
let nextWorkUnit: IFiber | null;
let pendingCommit: IFiber | null;

function scheduleWork(work: IWorkUnit) {
  workQueue.push(work);

  requestIdleCallback(performWork);
}

function performWork(deadline: RequestIdleCallbackDeadline) {
  workLoop(deadline);

  if (nextWorkUnit || workQueue.length !== 0) {
    requestIdleCallback(performWork);
  }
}

function workLoop(deadline: RequestIdleCallbackDeadline) {
  if (!nextWorkUnit) {
    nextWorkUnit = resetNextWorkUnit();
  }

  while (nextWorkUnit && deadline.timeRemaining() > ENOUGH_TIME) {
    nextWorkUnit = performWorkUnit(nextWorkUnit);
  }

  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}

/**
 * 构建根节点
 *
 * @returns {(IFiber | null)}
 */
function resetNextWorkUnit(): IFiber | null {
  const workUnit = workQueue.shift();
  if (!workUnit) return null;

  if (workUnit.partialState && workUnit.instance) {
    workUnit.instance.fiber.partialState = workUnit.partialState;
  }

  const root =
    workUnit.from === FiberTag.HOST_ROOT
      ? (workUnit.hostDom as IFiberReferencedElement)._rootFiber_
      // ？？？？
      : getRoot((workUnit.instance as IRevue).fiber);

  return new Fiber({
    tag: FiberTag.HOST_ROOT,
    // @ts-ignore
    prop: workUnit.newProp || root.prop,
    // @ts-ignore
    stateNode: workUnit.hostDom || root.stateNode,
    alternate: root,
  });
}

function getRoot(fiber: IFiber) {
  let node = fiber;
  while (node.parent) {
    node = node.parent;
  }
  return node;
}

/**
 * 遍历fibre tree（深度优先）
 *
 * @param {IFiber} workUnit
 * @returns {(IFiber | null)}
 */
function performWorkUnit(workUnit: IFiber): IFiber | null {
  beginWork(workUnit);
  if (workUnit.child) {
    return workUnit.child;
  }

  let next: IFiber | null = workUnit;
  while (next) {
    completeWork(next);

    if (next.sibling) {
      return next.sibling;
    }

    next = next.parent;
  }

  return null;
}

/**
 * reconcile当前节点
 *
 * @param {IFiber} workUnit
 */
function beginWork(workUnit: IFiber) {
  if (workUnit.tag === FiberTag.CLASS_COMPONENT) {
    updateClassComponent(workUnit);
  } else {
    updateHostComponent(workUnit);
  }
}

function updateHostComponent(workUnit: IFiber) {
  if (!workUnit.stateNode) {
    workUnit.stateNode = createDomElement(workUnit);
  }

  const children = workUnit.prop.children;
  if (children) {
    reconcileChildrenArray(workUnit, children);
  }
}

function updateClassComponent(workUnit: IFiber) {
  let instance = workUnit.stateNode as IRevue;
  if (instance == null) {
    instance = workUnit.stateNode = createInstance(workUnit);
  } else if (workUnit.prop === instance.props && !workUnit.partialState) {
    return cloneChildFibers(workUnit);
  }

  instance.props = workUnit.prop;
  // TODO: ???
  // instance.state = Object.assign({}, instance.state, workUnit.partialState);
  workUnit.partialState = null;

  const newChildElements: IElement[] = ([] as IElement[]).concat(instance.render());
  reconcileChildrenArray(workUnit, newChildElements);
}

function createInstance(fiber: IFiber) {
  const constructor = fiber.type as RevueConstructor;
  const instance = new constructor(fiber.prop);
  instance.fiber = fiber;
  return instance;
}

function cloneChildFibers(parent: IFiber) {
  const oldFiber = parent.alternate as IFiber;
  if (!oldFiber.child) return;

  let oldChild: IFiber | null = oldFiber.child;
  let prevChild = null;
  while (oldChild) {
    const newChild = new Fiber({
      tag: oldChild.tag,
      type: oldChild.type,
      prop: oldChild.prop,
      stateNode: oldChild.stateNode,
      alternate: oldChild,
      // partialState: oldFiber.partialState,
      parent,
    });

    if (prevChild) {
      prevChild.sibling = newChild;
    } else {
      parent.child = newChild;
    }

    prevChild = oldChild;
    oldChild = oldChild.sibling;
  }
}

function reconcileChildrenArray(wipFiber: IFiber, children: IElement[]) {
  let oldFiber: IFiber | null = wipFiber.alternate ? wipFiber.alternate.child : null;
  let newFiber: IFiber | null = null;
  let index: number = 0;

  while (oldFiber !== null || index < children.length) {
    const prevFiber = newFiber;
    const element: IElement | undefined = children[index];

    if (oldFiber && element && oldFiber.type === element.type) {
      newFiber = new Fiber({
        type: oldFiber.type,
        tag: oldFiber.tag,
        prop: element.props,
        parent: wipFiber,
        stateNode: oldFiber.stateNode,
        alternate: oldFiber,
        partialState: oldFiber.partialState,
        effectTag: FiberEffectTag.UPDATE,
      });
    }

    if (oldFiber && !element) {
      oldFiber.effectTag = FiberEffectTag.DELETION;
      wipFiber.effects.push(oldFiber);
    }

    if (!oldFiber && element) {
      newFiber = new Fiber({
        tag: typeof element.type === 'string'
          ? FiberTag.HOST_COMPONENT
          : FiberTag.CLASS_COMPONENT,
        type: element.type,
        prop: element.props,
        parent: wipFiber,
        effectTag: FiberEffectTag.PLACEMENT,
      });
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (prevFiber && element) {
      prevFiber.sibling = newFiber;
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    index++;
  }
}

/**
 * 向上合并effects
 *
 * @param {IFiber} fiber
 */
function completeWork(fiber: IFiber) {
  if (fiber.tag === FiberTag.CLASS_COMPONENT) {
    (fiber.stateNode as IRevue).fiber = fiber;
  }

  if (fiber.parent) {
    fiber.parent.effects = fiber.parent.effects.concat(
      fiber.effects,
      fiber.effectTag !== FiberEffectTag.NONE ? fiber : []
    );
  } else {
    pendingCommit = fiber;
  }
}

function commitAllWork(fiber: IFiber) {
  fiber.effects.forEach(effect => {
    commitWork(effect);
  });
  fiber.effects = [];
  (fiber.stateNode as any)._rootFiber_ = fiber;
  nextWorkUnit = null;
  pendingCommit = null;

  console.log(fiber);
}

// ?????
function commitWork(fiber: IFiber) {
  if (fiber.tag === FiberTag.HOST_ROOT) {
    return;
  }

  let domParentFiber = fiber.parent as IFiber;
  while (domParentFiber.tag === FiberTag.CLASS_COMPONENT) {
    domParentFiber = domParentFiber.parent as IFiber;
  }
  const domParent = domParentFiber.stateNode as HTMLElement;

  if (fiber.effectTag === FiberEffectTag.PLACEMENT && fiber.tag === FiberTag.HOST_COMPONENT) {
    domParent.appendChild(fiber.stateNode as Node);
  } else if (fiber.effectTag === FiberEffectTag.UPDATE) {
    // updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props);
    updateDomAttributes(fiber.stateNode as HTMLElement, fiber.prop);
  } else if (fiber.effectTag === FiberEffectTag.DELETION) {
    commitDeletion(fiber, domParent);
  }
}

// ?????
function commitDeletion(fiber: IFiber, domParent: HTMLElement) {
  let node: IFiber = fiber;
  while (true) {
    if (node.tag === FiberTag.CLASS_COMPONENT) {
      node = node.child as IFiber;
      continue;
    }
    domParent.removeChild(node.stateNode as Node);
    while (node !== fiber && !node.sibling) {
      node = node.parent as IFiber;
    }
    if (node === fiber) {
      return;
    }
    node = node.sibling as IFiber;
  }
}

export {
  scheduleWork
};
