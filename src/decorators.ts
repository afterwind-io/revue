import { Revue } from './revue';

export function Prop(proto: Revue, key: string) {
  // @ts-ignore
  proto.initReactiveKeys();
  // proto._reactiveKeys.push(key);
}
