type Extend<T> = {
  [K in keyof T]: T[K]
};

interface IComputedDecoratorOption {
  default?: any;
  cache?: boolean;
}

export interface IComputedMeta extends Extend<IComputedDecoratorOption> {
  key: string;
}

const DEFAULT_COMPUTED_OPTION: IComputedDecoratorOption = {
  cache: true,
};

export function Observable(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$observables', []);
  proto.$observables.push(key);
}

export function Prop(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$props', []);
  proto.$props.push(key);
}

export function Computed(option: IComputedDecoratorOption = DEFAULT_COMPUTED_OPTION) {
  return (proto: any, key: string) => {
    createNonEnumerableProperty(proto, '$computed', []);

    Object.assign(option, DEFAULT_COMPUTED_OPTION, { key });
    proto.$computed.push(option);
  };
}

export function Emit(proto: any, key: string) {
  createNonEnumerableProperty(proto, '$emits', []);
  proto.$emits.push(key);
}

export function Watch(proto: any, key: string, descriptor: PropertyDescriptor) { }

function createNonEnumerableProperty(proto: any, key: string, value: any) {
  if (proto.hasOwnProperty(key)) return;

  Object.defineProperty(proto, key, { value });
}
