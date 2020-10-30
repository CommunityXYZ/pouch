import Arweave from "arweave/node/common";
import { AccountInterface, CommunityInterface } from "./faces";
export declare class Pouch {
    private arweave;
    private arweaveId;
    private accounts;
    private commStates;
    /**
     * Pouch constructor.
     * @param arweave Arweave initialized instance
     * @param timer Updates the pouch data, in milliseconds. Default 1 minute (60,000 ms)
     */
    constructor(arweave: Arweave);
    /**
     * Get the entire account.
     * This method takes longer to load than the others but it gets everything at once.
     * @param address Arweave wallet address
     * @return Arweave pouch data for the specified address.
     */
    getAccount(address: string, reload?: boolean): Promise<AccountInterface>;
    getName(address: string): Promise<string>;
    getAvatar(address: string): Promise<string>;
    getBalance(address: string): Promise<number>;
    getCommunities(address: string): Promise<Map<string, CommunityInterface>>;
    getCommunityBalance(communityId: string, address: string): Promise<number>;
    getCommunityUnlockedBalance(communityId: string, address: string): Promise<number>;
    getCommunityVaultBalance(communityId: string, address: string): Promise<number>;
    /**
     * Load a single account and store it in accounts
     * @param address Wallet address
     */
    private loadAccount;
    private loadCommunities;
    private getAllCommunityStates;
    private getAllCommunityIds;
}
