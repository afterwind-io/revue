import { Revue } from './revue';

export function Prop(proto: Revue, key: string) {
  proto.$addReactiveKey(key);
}
