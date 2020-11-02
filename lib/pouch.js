"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pouch = void 0;
const arweaveid_1 = require("@arweaveid/arweaveid");
const community_js_1 = __importDefault(require("community-js"));
console.log = (x) => {
    var _a;
    if ((_a = new Error().stack) === null || _a === void 0 ? void 0 : _a.includes('smartweave'))
        return;
    console.info(x);
};
class Pouch {
    /**
     * Pouch constructor.
     * @param arweave Arweave initialized instance
     * @param timer Updates the pouch data, in milliseconds. Default 1 minute (60,000 ms)
     */
    constructor(arweave) {
        this.accounts = new Map();
        this.commStates = new Map();
        this.arweave = arweave;
        this.arweaveId = new arweaveid_1.ArweaveID(arweave);
    }
    /**
     * Get the entire account.
     * This method takes longer to load than the others but it gets everything at once.
     * @param address Arweave wallet address
     * @return Arweave pouch data for the specified address.
     */
    getAccount(address, reload = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc && !reload)
                return acc;
            const account = yield this.loadAccount(address);
            account.communities = yield this.loadCommunities(address);
            this.accounts.set(address, account);
            return account;
        });
    }
    getName(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc)
                return acc.name;
            const account = yield this.loadAccount(address);
            this.accounts.set(address, account);
            return account.name;
        });
    }
    getAvatar(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc)
                return acc.avatar;
            const account = yield this.loadAccount(address);
            this.accounts.set(address, account);
            return account.avatar;
        });
    }
    getIdenticon(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc)
                return acc.identicon;
            const account = yield this.loadAccount(address);
            this.accounts.set(address, account);
            return account.identicon;
        });
    }
    getBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc)
                return acc.balance;
            const account = yield this.loadAccount(address);
            this.accounts.set(address, account);
            return account.balance;
        });
    }
    getCommunities(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc && acc.communities)
                return acc.communities;
            const account = yield this.loadAccount(address);
            account.communities = yield this.loadCommunities(address);
            this.accounts.set(address, account);
            return account.communities;
        });
    }
    getCommunityBalance(communityId, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc && acc.communities) {
                const comm = acc.communities.get(communityId);
                if (comm)
                    return comm.balance + comm.vault;
            }
            const account = yield this.loadAccount(address);
            account.communities = yield this.loadCommunities(address);
            this.accounts.set(address, account);
            const community = acc.communities.get(communityId);
            if (community)
                return community.balance + community.vault;
            return 0;
        });
    }
    getCommunityUnlockedBalance(communityId, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc && acc.communities) {
                const comm = acc.communities.get(communityId);
                if (comm)
                    return comm.balance;
            }
            const account = yield this.loadAccount(address);
            account.communities = yield this.loadCommunities(address);
            this.accounts.set(address, account);
            const community = acc.communities.get(communityId);
            if (community)
                return community.balance;
            return 0;
        });
    }
    getCommunityVaultBalance(communityId, address) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = this.accounts.get(address);
            if (acc && acc.communities) {
                const comm = acc.communities.get(communityId);
                if (comm)
                    return comm.vault;
            }
            const account = yield this.loadAccount(address);
            account.communities = yield this.loadCommunities(address);
            this.accounts.set(address, account);
            const community = acc.communities.get(communityId);
            if (community)
                return community.vault;
            return 0;
        });
    }
    /**
     * Load a single account and store it in accounts
     * @param address Wallet address
     */
    loadAccount(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let acc;
            const winston = yield this.arweave.wallets.getBalance(address);
            const balance = +this.arweave.ar.winstonToAr(winston, { formatted: true, decimals: 5, trim: true });
            try {
                acc = yield this.arweaveId.getAccount(address);
            }
            catch (e) {
                return {
                    address,
                    name: address,
                    identicon: yield this.arweaveId.getIdenticon(address),
                    balance,
                };
            }
            const config = this.arweave.api.getConfig();
            const url = `${config.protocol}://${config.host}:${config.port}/`;
            const avatar = acc && acc.avatar && acc.avatar.length ? `${url + acc.avatar}` : acc.identicon;
            const account = {
                address,
                name: acc.name || address,
                avatar,
                identicon: acc.identicon,
                balance,
            };
            this.accounts.set(address, account);
            return account;
        });
    }
    loadCommunities(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = this.accounts.get(address);
            if (account && account.communities && account.communities.size) {
                return account.communities;
            }
            if (!this.commStates.size) {
                const commIds = yield this.getAllCommunityIds();
                yield this.getAllCommunityStates(commIds);
            }
            const stateIds = Array.from(this.commStates.keys());
            const communities = new Map();
            for (let i = 0, j = stateIds.length; i < j; i++) {
                const state = this.commStates.get(stateIds[i]);
                let balance = 0;
                let vault = 0;
                if (address in state.balances) {
                    balance = state.balances[address];
                }
                if (address in state.vault) {
                    for (const v of state.vault[address]) {
                        vault += v.balance;
                    }
                }
                if (balance || vault) {
                    communities.set(stateIds[i], {
                        name: state.name,
                        logo: state.settings.get('communityLogo'),
                        description: state.settings.get('communityDescription'),
                        balance,
                        vault,
                        lastState: state,
                    });
                }
            }
            return communities;
        });
    }
    getAllCommunityStates(commIds) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0, j = commIds.length; i < j; i++) {
                const commId = commIds[i];
                const comm = new community_js_1.default(this.arweave);
                try {
                    yield comm.setCommunityTx(commId);
                    this.commStates.set(commId, yield comm.getState());
                }
                catch (e) {
                    console.log(`ERROR: Couldn't load Community ${commId}`);
                }
            }
            return true;
        });
    }
    getAllCommunityIds() {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const ids = [];
            while (hasNextPage) {
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
        }`,
                };
                const res = yield this.arweave.api.post('/graphql', query);
                const data = res.data;
                for (let i = 0, j = data.data.transactions.edges.length; i < j; i++) {
                    ids.push(data.data.transactions.edges[i].node.id);
                }
                hasNextPage = data.data.transactions.pageInfo.hasNextPage;
                if (hasNextPage) {
                    cursor = data.data.transactions.edges[data.data.transactions.edges.length - 1].cursor;
                }
            }
            return ids;
        });
    }
}
exports.Pouch = Pouch;
