import Web3 from "web3";
import { fromWei } from "web3-utils";
import linker from "solc/linker";
import detectEthereumProvider from "@metamask/detect-provider";

import Course from "../build/contracts/Course.json";
import Notary from "../build/contracts/Notary.json";
import CredentialSum from "../build/contracts/CredentialSum.json";

const App = {
    web3: null,
    accounts: null,
    defaultAccount: null,
    // contract deployed instances
    notary: null,
    credentialSum: null,
    course: null,

    start: async function (web3) {
        this.web3 = web3;

        try {
            // initialize contract instance
            console.log(`Running on network ID: ${await web3.eth.net.getId()}`);

            // get accounts
            this.accounts = await this.getAccounts();
            this.setDefaultAccount();
            this.buildAccountList();
            this.refreshPageInfo();
        } catch (err) {
            console.error(`Could not connect to contract or network. Due the following error: ${err}`);
        }
    },

    deployNotary: async function () {
        const { web3, defaultAccount } = this;

        this.setStatus("Deploying Notary contract... (please wait)");

        const notaryContract = new web3.eth.Contract(Notary.abi);
        notaryContract.deploy({ data: Notary.bytecode }).send({
            from: defaultAccount,
            gas: web3.utils.toHex(500000),
            gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei"))
        }, (err, txHash) => {
            if (err) {
                console.log(err.stack);
            }
            console.log("Transaction Hash :", txHash);
        }).on("confirmation", () => { }).then((contractInstance) => {
            this.notary = contractInstance;
            const addr = this.notary.options.address;
            console.log("Deployed Contract Address : ", addr);
            this.setStatus(`Successfully deployed notary at ${addr}`);
            this.refreshPageInfo();
        }).catch((err) => console.log("deploy notary error:", err));
    },

    deployAggregator: async function () {
        const { web3, defaultAccount } = this;

        this.setStatus("Deploying Aggregator contract... (please wait)");

        const aggregatorContract = new web3.eth.Contract(CredentialSum.abi);
        aggregatorContract.deploy({ data: CredentialSum.bytecode }).send({
            from: defaultAccount,
            gas: web3.utils.toHex(500000),
            gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei"))
        }, (err, txHash) => {
            if (err) {
                console.log(err.stack);
            }
            console.log("Transaction Hash :", txHash);
        }).on("confirmation", () => { }).then((contractInstance) => {
            this.credentialSum = contractInstance;
            const addr = this.credentialSum.options.address;
            console.log("Deployed Contract Address : ", addr);
            this.setStatus(`Successfully deployed aggregator at ${addr}`);
            this.refreshPageInfo();
        }).catch((err) => console.log("deploy aggregator error:", err));
    },

    deployCourse: async function () {
        const { web3, defaultAccount, notary, credentialSum } = this;

        this.setStatus("Deploying Course contract... (please wait)");

        const courseContract = new web3.eth.Contract(Course.abi);
        const bytecode = linker.linkBytecode(Course.bytecode, { Notary: notary.options.address, CredentialSum: credentialSum.options.address });

        // defaultAccount is the owner and quorum is 1
        courseContract.deploy({ data: bytecode, arguments: [[defaultAccount], 1] }).send({
            from: this.defaultAccount,
            gas: web3.utils.toHex(6721975),
            gasPrice: web3.utils.toHex(web3.utils.toWei("20", "gwei"))
        }, (err, txHash) => {
            if (err) {
                console.log(err.stack);
            }
            console.log("Transaction Hash :", txHash);
        }).on("confirmation", () => { }).then((contractInstance) => {
            this.course = contractInstance;
            const addr = this.course.options.address;
            console.log(`Course contract deployed at ${addr} using:\nNotary: ${notary.options.address}\nAggregator:${credentialSum.options.address}\n`);
            this.setStatus(`Successfully deployed course at ${addr}`);
            this.refreshPageInfo();
        }).catch((err) => console.log("deploy course error:", err));
    },

    refreshAccountsInfo: async function () {
        const accountBalanceElements = document.getElementsByClassName("accountBalance");
        let i = 0;
        for (const account of this.accounts.keys()) {
            const accountBalance = await this.getAccountBalance(account);
            accountBalanceElements[i].innerHTML = accountBalance;
            i++;
        };
    },

    buildAccountList: async function () {
        const accountListElement = document.getElementById("accountList");
        let i = 0;
        this.accounts.forEach(function (balance, account, index) {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            if (i === 0) {
                li.className += " active";
            }
            const spanAccount = document.createElement("span");
            spanAccount.className = "account";
            spanAccount.innerHTML = account;
            const spanBalance = document.createElement("span");
            spanBalance.className = "accountBalance";
            spanBalance.innerHTML = balance;
            li.appendChild(spanAccount);
            li.appendChild(spanBalance);
            accountListElement.appendChild(li);
            i++;
        });
    },

    refreshPageInfo: async function () {
        this.refreshAccountsInfo();
    },

    setStatus: function (message) {
        const status = document.getElementById("status");
        status.innerHTML = message;
    },

    getAccounts: async function () {
        const accountsBalances = new Map();
        const accounts = await this.web3.eth.getAccounts();
        for (let i = 0; i < accounts.length; i++) {
            const accountBalance = await this.getAccountBalance(accounts[i]);
            accountsBalances.set(accounts[i], accountBalance);
        }
        return accountsBalances;
    },

    setDefaultAccount: async function () {
        const accounts = await this.web3.eth.getAccounts();
        this.defaultAccount = accounts[0]; // set default account
    },

    getAccountBalance: async function (account) {
        const balance = await this.web3.eth.getBalance(account);
        return fromWei(balance, "ether");
    },

    enableMetamask: function () {
        if (window.ethereum.isMetaMask) {
            window.ethereum.request({ method: "eth_requestAccounts" });
        }
    }
};

window.App = App;

const loadWeb3 = async function () {
    let web3 = null;
    const provider = await detectEthereumProvider();

    if (provider) {
        web3 = new Web3(provider);
    } else {
    // fallback to local node (ganache)
        const localhost = "http://127.0.0.1:8545";
        console.log(`No metamask detected. Falling back to ${localhost}`);
        web3 = new Web3(new Web3.providers.HttpProvider(localhost));
    }
    return web3;
};

window.addEventListener("load", async function () {
    App.start(await loadWeb3());
});
