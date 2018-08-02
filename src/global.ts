import { IMediator } from './type';

// const _isRendering: boolean = false;

// export function isRendering(): boolean {
//   return _isRendering;
// }

let uid: number = 0;
export const getUid = () => ++uid;

export const CHANNEL_INSPECTOR = -1;

interface IShares {
  isDevelop: boolean;
  targetMediator: IMediator | null;
}

export const Shares: IShares = {
  isDevelop: true,
  targetMediator: null,
};
