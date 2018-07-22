export function Prop(proto: any, key: string) {
  if (!proto.hasOwnProperty('$reactiveKeys')) {
    Object.defineProperty(proto, '$reactiveKeys', {
      configurable: true,
      writable: true,
      value: [],
    });
  }
  proto.$reactiveKeys.push(key);
}
