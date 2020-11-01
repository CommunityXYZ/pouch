import { ArweaveID } from "@arweaveid/arweaveid";
import * as aridfaces from "@arweaveid/arweaveid/lib/faces";
import Arweave from "arweave/node/common";
import Community from "community-js";
import { StateInterface } from "community-js/lib/faces";
import { AccountInterface, CommunityInterface } from "./faces";

console.log = (x: any) => {
  if (new Error().stack?.includes("smartweave")) return;
  console.info(x);
};

export class Pouch {
  private arweave: Arweave;
  private arweaveId: ArweaveID;
  private accounts: Map<string, AccountInterface> = new Map();
  private commStates: Map<string, StateInterface> = new Map();

  /**
   * Pouch constructor.
   * @param arweave Arweave initialized instance
   * @param timer Updates the pouch data, in milliseconds. Default 1 minute (60,000 ms)
   */
  constructor(arweave: Arweave) {
    this.arweave = arweave;

    this.arweaveId = new ArweaveID(arweave);
  }

  /**
   * Get the entire account. 
   * This method takes longer to load than the others but it gets everything at once.
   * @param address Arweave wallet address
   * @return Arweave pouch data for the specified address.
   */
  async getAccount(address: string, reload = false): Promise<AccountInterface> {
    const acc = this.accounts.get(address);
    if(acc && !reload) return acc;

    const account = await this.loadAccount(address);
    account.communities = await this.loadCommunities(address);
    this.accounts.set(address, account);
    return account;
  }

  async getName(address: string): Promise<string> {
    const acc = this.accounts.get(address);
    if(acc) return acc.name;

    const account = await this.loadAccount(address);
    this.accounts.set(address, account);
    return account.name;
  }

  async getAvatar(address: string): Promise<string> {
    const acc = this.accounts.get(address);
    if(acc) return acc.avatar;

    const account = await this.loadAccount(address);
    this.accounts.set(address, account);
    return account.avatar;
  }

  async getIdenticon(address: string): Promise<string> {
    const acc = this.accounts.get(address);
    if(acc) return acc.identicon;

    const account = await this.loadAccount(address);
    this.accounts.set(address, account);

    return account.identicon;
  }

  async getBalance(address: string): Promise<number> {
    const acc = this.accounts.get(address);
    if(acc) return acc.balance;

    const account = await this.loadAccount(address);
    this.accounts.set(address, account);
    return account.balance;
  }

  async getCommunities(address: string): Promise<Map<string, CommunityInterface>> {
    const acc = this.accounts.get(address);
    if(acc && acc.communities) return acc.communities;

    const account = await this.loadAccount(address);
    account.communities = await this.loadCommunities(address);
    this.accounts.set(address, account);
    return account.communities;
  }

  async getCommunityBalance(communityId: string, address: string): Promise<number> {
    const acc = this.accounts.get(address);
    if(acc && acc.communities) {
      const comm = acc.communities.get(communityId);
      if(comm) return comm.balance + comm.vault;
    }

    const account = await this.loadAccount(address);
    account.communities = await this.loadCommunities(address);
    this.accounts.set(address, account);

    const community = acc.communities.get(communityId);
    if(community) return community.balance + community.vault;
    
    return 0;
  }

  async getCommunityUnlockedBalance(communityId: string, address: string): Promise<number> {
    const acc = this.accounts.get(address);
    if(acc && acc.communities) {
      const comm = acc.communities.get(communityId);
      if(comm) return comm.balance;
    }

    const account = await this.loadAccount(address);
    account.communities = await this.loadCommunities(address);
    this.accounts.set(address, account);

    const community = acc.communities.get(communityId);
    if(community) return community.balance;
    
    return 0;
  }

  async getCommunityVaultBalance(communityId: string, address: string): Promise<number> {
    const acc = this.accounts.get(address);
    if(acc && acc.communities) {
      const comm = acc.communities.get(communityId);
      if(comm) return comm.vault;
    }

    const account = await this.loadAccount(address);
    account.communities = await this.loadCommunities(address);
    this.accounts.set(address, account);

    const community = acc.communities.get(communityId);
    if(community) return community.vault;
    
    return 0;
  }

  /**
   * Load a single account and store it in accounts
   * @param address Wallet address
   */
  private async loadAccount(address: string): Promise<AccountInterface> {
    let acc: aridfaces.AccountInterface;
    try {
      acc = await this.arweaveId.getAccount(address);
    } catch(e) {
      console.log(e);
    }

    const winston: string = await this.arweave.wallets.getBalance(address);
    const balance: number = +this.arweave.ar.winstonToAr(winston, {formatted: true, decimals: 5, trim: true});

    const config = this.arweave.api.getConfig();
    const url = `${config.protocol}://${config.host}:${config.port}/`;
    const avatar = (acc && acc.avatar && acc.avatar.length) ? `${url + acc.avatar}` : acc.identicon;

    const account: AccountInterface = {
      address,
      name: acc.name || address,
      avatar,
      identicon: acc.identicon,
      balance
    };

    this.accounts.set(address, account);
    return account;
  }

  private async loadCommunities(address: string): Promise<Map<string, CommunityInterface>> {
    const account = this.accounts.get(address);
    if(account && account.communities && account.communities.size) {
      return account.communities;
    }

    if(!this.commStates.size) {
      const commIds = await this.getAllCommunityIds();
      await this.getAllCommunityStates(commIds);
    }
    
    const stateIds = Array.from(this.commStates.keys());
    const communities: Map<string, CommunityInterface> = new Map();

    for(let i = 0, j = stateIds.length; i < j; i++) {
      const state = this.commStates.get(stateIds[i]);
      let balance = 0;
      let vault = 0;

      if(address in state.balances) {
        balance = state.balances[address];
      }
      if(address in state.vault) {
        for(const v of state.vault[address]) {
          vault += v.balance;
        }
      }

      if(balance || vault) {
        communities.set(stateIds[i], {
          name: state.name,
          logo: state.settings.get('communityLogo'),
          description: state.settings.get('communityDescription'),
          balance,
          vault,
          lastState: state
        });
      }
    }

    return communities;
  }

  private async getAllCommunityStates(commIds: string[]): Promise<boolean> {
    for(let i = 0, j = commIds.length; i < j; i++) {
      const commId = commIds[i];
      const comm = new Community(this.arweave);
      try {
        await comm.setCommunityTx(commId);
        this.commStates.set(commId, await comm.getState());
      } catch (e) {
        console.log(`ERROR: Couldn't load Community ${commId}`);
      }
    }

    return true;
  }

  private async getAllCommunityIds(): Promise<string[]> {
    let cursor = '';
    let hasNextPage = true;
  
    const ids: string[] = [];
    while(hasNextPage) {
      const query = {
        query: `query {
          transactions(
            tags: [
              {name: "App-Name", values: ["SmartWeaveContract"]},
              {name: "Contract-Src", values: ["ngMml4jmlxu0umpiQCsHgPX2pb_Yz6YDB8f7G6j-tpI"]}
            ]
            after: "${cursor}"
            first: 100
          ) {
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
              node {
                id
                recipient
                quantity {
                  ar
                }
                owner {
                  address
                },
                tags {
                  name,
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }`
      };
      const res = await this.arweave.api.post('/graphql', query);
      const data = res.data;
  
      for(let i = 0, j = data.data.transactions.edges.length; i < j; i++) {
        ids.push(data.data.transactions.edges[i].node.id);
      }
      hasNextPage = data.data.transactions.pageInfo.hasNextPage;
  
      if(hasNextPage) {
        cursor = data.data.transactions.edges[data.data.transactions.edges.length - 1].cursor;
      }
    }
  
    return ids;
  }
}
