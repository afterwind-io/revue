import { IMediator } from './type';

// const _isRendering: boolean = false;

// export function isRendering(): boolean {
//   return _isRendering;
// }

interface IGlobals {
  targetMediator: IMediator | null;
  getUid: () => number;
}

let uid: number = 0;

const Globals: IGlobals = {
  targetMediator: null,
  getUid: (): number => ++uid,
};

export default Globals;
