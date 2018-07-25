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
} from './type';
// import { scheduleWork } from './scheduler';
import Globals from './global';

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
  public alternate: IFiber | null;
  public mediator: IElementMediator | null;
  public effectTag: FiberEffectTag;
  public effects: IFiber[];

  constructor(options: IFiberOptions = {}) {
    this.id = Globals.getUid();
    this.tag = options.tag || FiberTag.HOST_ROOT;
    this.type = options.type || '';
    this.props = options.props || {};
    this.parent = options.parent || null;
    this.sibling = options.sibling || null;
    this.child = options.child || null;
    this.stateNode = options.stateNode || null;
    this.alternate = options.alternate || null;
    this.mediator = options.mediator || null;
    this.effectTag = options.effectTag || FiberEffectTag.NONE;
    this.effects = options.effects || [];
  }

  public linkMediator(mediator: IElementMediator) {
    this.mediator = mediator;
    mediator.from = this.id;
    mediator.update = (effectTag: MediatorEffectTag) => {
      // TODO
    };
  }
}

export {
  Fiber,
};
