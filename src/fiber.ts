import {
  IProp,
  ElementType,
  FiberTag,
  FiberEffectTag,
  IFiberReferencedElement,
  IFiber,
  IRevue,
  IRevueConstructor,
  MediatorEffectTag,
  IElementMediator,
  ElementChildFn,
  ElementChild,
  IElement,
} from './type';
import { scheduleWork } from './scheduler';
import { isElementTypeFn, fiberWalker, isFunction } from './util';
import { createChildElements } from './element';
import * as Channel from './channel';

interface IFiberOptions extends Partial<IFiber> { }

class Fiber implements IFiber {
  public id: number;
  public tag: FiberTag;
  public type: string | ElementType | IRevueConstructor;
  public props: IProp;
  public parent: IFiber | null;
  public sibling: IFiber | null;
  public child: IFiber | null;
  public stateNode: IRevue | IFiberReferencedElement | null;
  public mediator!: IElementMediator | null;
  public element: IElement | null;
  public effectTag: FiberEffectTag;
  public effects: IFiber[];

  constructor(options: IFiberOptions = {}) {
    this.id = options.id || 0;
    this.tag = options.tag || FiberTag.HOST_ROOT;
    this.type = options.type || '';
    this.props = options.props || {};
    this.parent = options.parent || null;
    this.sibling = options.sibling || null;
    this.child = options.child || null;
    this.stateNode = options.stateNode || null;
    this.element = options.element || null;
    this.effectTag = options.effectTag || FiberEffectTag.NONE;
    this.effects = options.effects || [];

    if (options.mediator) {
      this.linkMediator(options.mediator);
    } else {
      this.mediator = null;
    }
  }

  public static clone(fiber: Fiber): Fiber {
    return new Fiber(fiber);
  }

  public destory() {
    fiberWalker(this, (fiber: IFiber) => {
      Channel.emit(fiber.id);
      Channel.close(fiber.id);

      if (isFunction(fiber.type) && (fiber.type as any).isConstructor) {
        (fiber.stateNode as IRevue).$destory();
      }

      return true;
    });
  }

  public linkMediator(mediator: IElementMediator) {
    this.mediator = mediator;
    this.id = mediator.id;

    mediator.update = (depId: number, effectTag: MediatorEffectTag) => {
      mediator.effectTag = effectTag;

      if (effectTag & MediatorEffectTag.Type) {
        const type = mediator.meta.type;
        if (isElementTypeFn(type)) {
          this.type = this.element!.type = type();
        }
      }

      if (effectTag & MediatorEffectTag.Prop) {
        const propFn = mediator.meta.propfn;
        if (propFn) {
          this.props = this.element!.props = propFn();
        }
      }

      if (effectTag & MediatorEffectTag.Child) {
        // 只有virtual类型的fiber才会触发此条件
        const [childFn] = mediator.meta.children as ElementChildFn[];
        this.props.children = createChildElements(
          ([] as ElementChild[]).concat(childFn()),
        );
      }

      scheduleWork({
        tag: FiberTag.HOST_COMPONENT,
        sourceFiber: this,
      });
    };
  }
}

export {
  Fiber,
};
