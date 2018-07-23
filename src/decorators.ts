export function Observable(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$observables', []);
  proto.$observables.push(key);
}

export function Prop(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$props', []);
  proto.$props.push(key);
}

export function Emit(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$emits', []);
  proto.$emits.push(key);
}

export function Watch(proto: any, key: string, descriptor: PropertyDescriptor) { }

function createNonEnumerableProperty(proto: any, key: string, value: any) {
  if (proto.hasOwnProperty(key)) return;

  Object.defineProperty(proto, key, {
    configurable: true,
    writable: true,
    value,
  });
}
