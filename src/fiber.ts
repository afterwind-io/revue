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
} from './type';
import { scheduleWork } from './scheduler';
import { isElementTypeFn } from './util';
import { createChildElements } from './element';

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

  private linkMediator(mediator: IElementMediator) {
    this.mediator = mediator;
    this.id = mediator.id;

    mediator.update = (depId: number, effectTag: MediatorEffectTag) => {
      mediator.effectTag = effectTag;

      if (effectTag & MediatorEffectTag.Type) {
        const type = mediator.meta.type;
        if (isElementTypeFn(type)) {
          this.type = type();
        }
      }

      if (effectTag & MediatorEffectTag.Prop) {
        const propFn = mediator.meta.propfn;
        if (propFn) {
          this.props = propFn();
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
