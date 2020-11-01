import { JWKInterface } from 'arweave/node/lib/wallet';
import { StateInterface } from 'community-js/lib/faces';

export interface CommunityInterface {
  name: string;
  logo: string;
  description: string;
  balance: number;
  vault: number;
  lastState: StateInterface;
}

export interface AccountInterface {
  address: string;
  name: string;
  avatar?: string;
  identicon?: string;
  balance: number;
  communities?: Map<string, CommunityInterface>;
}
