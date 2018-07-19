import { IMediator } from './type';

// const _isRendering: boolean = false;

// export function isRendering(): boolean {
//   return _isRendering;
// }

interface IGlobals {
  targetMediator: IMediator | null;
}

const globals: IGlobals = {
  targetMediator: null
};

export default globals;
