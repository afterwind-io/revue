import {
  IMediator,
  IMediatorHook
} from './type';

export class Mediator implements IMediator {
  public value: any = null;
  private invokes: IMediatorHook[] = [];

  public hook(hook: IMediatorHook) {
    this.invokes.push(hook);
  }

  public invoke() {
    this.invokes.forEach(invoke => invoke(this.value));
  }
}
