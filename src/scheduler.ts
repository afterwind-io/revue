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
import {
  createDomElement,
  createVirtualDomElement,
  updateDomAttributes,
  appendChildren,
} from './dom';
import * as Channel from './channel';
import { Shares, CHANNEL_INSPECTOR } from './global';

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

Channel.create(CHANNEL_INSPECTOR);

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

    // 如果触发初始渲染的fiber为虚拟节点，则强制刷新所有子代
    if (targetWorkUnit!.tag !== FiberTag.VIRTUAL) return;
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

  // TODO: render支持包含ElementChildFn的数组？
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
        element,
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

  if (Shares.isDevelop) {
    Channel.emit(CHANNEL_INSPECTOR, getRoot(targetWorkUnit as IFiber));
  }

  pendingCommit = null;
  nextWorkUnit = null;
  targetWorkUnit = null;

  function getRoot(fiber: IFiber) {
    let f = fiber;
    while (f) {
      if (f.parent) {
        f = f.parent;
      } else {
        return f;
      }
    }
  }
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

  if (fiber.effectTag === FiberEffectTag.CREATE) {
    commitCreate(fiber, domParent);
  } else if (fiber.effectTag === FiberEffectTag.UPDATE && fiber.tag === FiberTag.HOST_COMPONENT) {
    updateDomAttributes(fiber.stateNode as HTMLElement, fiber.props);
  } else if (fiber.effectTag === FiberEffectTag.DELETION) {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === FiberEffectTag.REPLACE && fiber.tag === FiberTag.HOST_COMPONENT) {
    commitReplace(fiber, domParent);
  }

  fiber.effectTag = FiberEffectTag.NONE;
}

function commitCreate(fiber: IFiber, domParent: HTMLElement) {
  if (fiber.tag === FiberTag.VIRTUAL) {
    fiber.stateNode = createVirtualDomElement(fiber);
  } else if (fiber.tag === FiberTag.HOST_COMPONENT) {
    fiber.stateNode = createDomElement(fiber);
  } else {
    return;
  }

  if (fiber.parent!.tag === FiberTag.VIRTUAL) {
    // 如果fiber的父级是一个virtual fiber，
    // 则domParent所对应的fiber必定在父级virtual fiber之上。
    // 因为父级virtual fiber在siblings中的位置不确定，
    // 直接在domParent上追加节点可能导致元素位置错乱，
    // 故以父级virtual fiber所对应的Comment节点位置为界，
    // 在该Comment前增加元素以确保插入位置正确。
    domParent.insertBefore(fiber.stateNode, fiber.parent!.stateNode as Comment);
  } else {
    domParent.appendChild(fiber.stateNode as Node);
  }
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
