import {
  FiberTag,
  IFiberReferencedElement,
  IElement,
  IFiber,
  IRevue,
  IRevueConstructor,
  FiberEffectTag,
  MediatorEffectTag,
} from './type';
import { Fiber } from './fiber';
import { createDomElement, updateDomAttributes, appendChildren } from './dom';

interface IWorkUnit {
  tag: FiberTag;
  hostDom?: IFiberReferencedElement;
  childElements?: IElement[];
  sourceFiber?: IFiber;
}

const ENOUGH_TIME = 1;
const workQueue: IWorkUnit[] = [];
let nextWorkUnit: IFiber | null;
let targetWorkUnit: IFiber | null;
let pendingCommit: IFiber | null;

export function scheduleWork(work: IWorkUnit) {
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
    resetNextWorkUnit();
  }

  while (nextWorkUnit && deadline.timeRemaining() > ENOUGH_TIME) {
    nextWorkUnit = performWorkUnit(nextWorkUnit);
  }

  if (pendingCommit) {
    commitAllWork();
  }
}

function resetNextWorkUnit() {
  const workUnit = workQueue.shift();
  if (!workUnit) return null;

  if (workUnit.tag === FiberTag.HOST_ROOT) {
    nextWorkUnit = createNewRootFiber(workUnit);
  } else {
    nextWorkUnit = workUnit.sourceFiber as IFiber;
  }

  targetWorkUnit = nextWorkUnit;
}

function createNewRootFiber(workUnit: IWorkUnit): IFiber {
  return new Fiber({
    tag: FiberTag.HOST_ROOT,
    stateNode: workUnit.hostDom,
    props: { children: workUnit.childElements },
  });
}

function performWorkUnit(workUnit: IFiber): IFiber | null {
  console.log('[Scheduler] Updating Fiber:', workUnit.id);
  beginWork(workUnit);

  // TODO: 如何避免冗余遍历子树？
  if (workUnit.child) return workUnit.child;

  let next: IFiber | null = workUnit;
  while (next) {
    completeWork(next);

    if (next === targetWorkUnit) break;

    if (next.sibling) return next.sibling;

    next = next.parent;
  }

  return null;
}

function beginWork(wipFiber: IFiber) {
  if (wipFiber.tag === FiberTag.CLASS_COMPONENT) {
    updateClassComponent(wipFiber);
  } else if (wipFiber.tag === FiberTag.VIRTUAL) {
    updateVirtualComponent(wipFiber);
  } else {
    updateHostComponent(wipFiber);
  }
}

function updateHostComponent(wipFiber: IFiber) {
  if (!wipFiber.stateNode) {
    wipFiber.effectTag = FiberEffectTag.CREATE;
  } else if (wipFiber.mediator) {
    const effectTag = wipFiber.mediator.effectTag;

    // 清除effectTag以防止残留值在将来覆盖fiber的effectTag
    wipFiber.mediator.effectTag = MediatorEffectTag.Unknown;

    if (effectTag & MediatorEffectTag.Type) {
      wipFiber.effectTag = FiberEffectTag.REPLACE;
    } else if (effectTag & MediatorEffectTag.Prop) {
      wipFiber.effectTag = FiberEffectTag.UPDATE;
    }

    // TODO: 增加以下判断会导致virtual子节点无法更新
    // if (!(effectTag & MediatorEffectTag.Child)) {
    //   return;
    // }
  }

  const children = wipFiber.props.children;
  if (wipFiber.tag === FiberTag.HOST_ROOT || children) {
    reconcileChildrenArray(wipFiber, children!);
  }
}

function updateVirtualComponent(fiber: IFiber) {
  reconcileChildrenArray(fiber, fiber.props.children!);
}

function updateClassComponent(workUnit: IFiber) {
  let instance = workUnit.stateNode as IRevue;
  if (instance == null) {
    instance = workUnit.stateNode = createInstance(workUnit);
  }

  const newChildElements: IElement[] = ([] as IElement[]).concat(instance.render());
  reconcileChildrenArray(workUnit, newChildElements);
}

function createInstance(fiber: IFiber) {
  const constructor = fiber.type as IRevueConstructor;
  const instance = new constructor(fiber.props);
  instance.$fiber = fiber;
  return instance;
}

/**
 * -------------------------------TODO------------------------------------
 */

function reconcileChildrenArray(wipFiber: IFiber, children: IElement[]) {
  let oldFiber: IFiber | null = wipFiber.child;
  let newFiber: IFiber | null = null;
  let index: number = 0;

  while (oldFiber !== null || index < children.length) {
    const prevFiber = newFiber;
    const element: IElement | undefined = children[index];

    if (oldFiber && element && oldFiber.type === element.type) {
      oldFiber.props = element.props;
      oldFiber.mediator = element.mediator;
      oldFiber.effectTag = FiberEffectTag.UPDATE;
      newFiber = oldFiber;
    }

    if (oldFiber && !element) {
      oldFiber.effectTag = FiberEffectTag.DELETION;

      if (prevFiber) {
        prevFiber.sibling = null;
      }

      wipFiber.effects.push(oldFiber);
    }

    if (!oldFiber && element) {
      newFiber = new Fiber({
        tag:
          element.virtual
            ? FiberTag.VIRTUAL
            : typeof element.type === 'string'
              ? FiberTag.HOST_COMPONENT
              : FiberTag.CLASS_COMPONENT,
        type: element.type,
        props: element.props,
        parent: wipFiber,
        mediator: element.mediator,
        effectTag: FiberEffectTag.CREATE,
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
    (fiber.stateNode as IRevue).$fiber = fiber;
  }

  if (fiber === targetWorkUnit) {
    if (fiber.effectTag !== FiberEffectTag.NONE) {
      fiber.effects.push(fiber);
    }

    pendingCommit = fiber;
  } else if (fiber.parent) {
    fiber.parent.effects = fiber.parent.effects.concat(
      fiber.effectTag !== FiberEffectTag.NONE ? fiber : [],
      fiber.effects,
    );

    fiber.effects = [];
  }
}

function commitAllWork() {
  pendingCommit!.effects.forEach(effect => {
    commitWork(effect);
  });
  pendingCommit!.effects = [];

  pendingCommit = null;
  nextWorkUnit = null;

  /**
   * TODO: Test Only -----------------------------
   */
  function getRoot(fiber: IFiber) {
    let f = fiber;
    while (f) {
      if (f.parent) {
        f = f.parent;
      } else {
        break;
      }
    }
    return f;
  }
  (window as any)._visualize(getRoot(targetWorkUnit as IFiber));
  /**
   * ---------------------------------------------
   */

  targetWorkUnit = null;
}

function commitWork(fiber: IFiber) {
  let domParentFiber = fiber.parent as IFiber;
  while (
    domParentFiber.tag === FiberTag.CLASS_COMPONENT ||
    domParentFiber.tag === FiberTag.VIRTUAL
  ) {
    domParentFiber = domParentFiber.parent as IFiber;
  }

  const domParent = domParentFiber.stateNode as HTMLElement;

  if (fiber.effectTag === FiberEffectTag.CREATE && fiber.tag === FiberTag.HOST_COMPONENT) {
    commitCreate(fiber, domParent);
  } else if (fiber.effectTag === FiberEffectTag.UPDATE) {
    updateDomAttributes(fiber.stateNode as HTMLElement, fiber.props);
  } else if (fiber.effectTag === FiberEffectTag.DELETION) {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === FiberEffectTag.REPLACE) {
    commitReplace(fiber, domParent);
  }

  fiber.effectTag = FiberEffectTag.NONE;
}

function commitCreate(fiber: IFiber, domParent: HTMLElement) {
  fiber.stateNode = createDomElement(fiber);
  domParent.appendChild(fiber.stateNode as Node);
}

function commitReplace(fiber: IFiber, domParent: HTMLElement) {
  const oldNode = fiber.stateNode as HTMLElement;
  const newNode = fiber.stateNode = createDomElement(fiber);
  appendChildren(newNode, oldNode.childNodes);
  domParent.replaceChild(newNode, oldNode);
}

function commitDeletion(fiber: IFiber, domParent: HTMLElement) {
  let node: IFiber = fiber;

  while (true) {
    if (node.tag === FiberTag.CLASS_COMPONENT) {
      node = node.child as IFiber;
      continue;
    }

    domParent.removeChild(node.stateNode as Node);

    // ?????
    while (node !== fiber && !node.sibling) {
      node = node.parent as IFiber;
    }

    if (node === fiber) {
      return;
    }

    node = node.sibling as IFiber;
  }
}
