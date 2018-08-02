import { INumericDictionary } from './type';
import { findNdelete, findNreplace } from './util';

type Channel = number;

type ISubscribeHandler = (...args: any[]) => any;
interface ISubscriber extends ISubscribeHandler {
  key: number;
}

const channels: INumericDictionary<ISubscriber[]> = Object.create(null);

export function open(key: Channel) {
  if (key in channels) return;
  channels[key] = [];
}

export function close(key: Channel) {
  channels[key].length = 0;
  delete channels[key];
}

export function subscribe(key: Channel, handlerKey: number, handler: ISubscribeHandler) {
  const indexdHanlder: ISubscriber = Object.assign(handler, { key: handlerKey });

  if (key in channels) {
    const channel = channels[key];

    const hasSubscribed = findNreplace(channel, indexdHanlder, h => h.key === handlerKey);
    if (!hasSubscribed) {
      channels[key].push(indexdHanlder);
    }
  } else {
    channels[key] = [indexdHanlder];
  }
}

export function unsubscribe(key: Channel, handlerKey: number) {
  if (!channels[key]) throw new Error(`[event] No such channel: "${key}"`);

  findNdelete(channels[key], h => h.key === handlerKey);
}

export function emit(key: Channel, ...args: any[]) {
  const channel = channels[key];
  if (!channel) throw new Error(`[event] No such channel: "${key}"`);

  channel.forEach(handler => handler(...args));
}
