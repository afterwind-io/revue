import { IMediator } from './type';

// const _isRendering: boolean = false;

// export function isRendering(): boolean {
//   return _isRendering;
// }

let uid: number = 0;
export const getUid = () => ++uid;

interface IShares {
  targetMediator: IMediator | null;
}

export const Shares: IShares = {
  targetMediator: null,
};
