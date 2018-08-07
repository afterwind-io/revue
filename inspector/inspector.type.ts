import {
  FiberTag,
} from '../src/type';

export interface IFiberSummary {
  tag: FiberTag;
  type: string;
  level: number;
  id: number;
  textContent: string;
}
