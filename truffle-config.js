require("chai/register-should");

module.exports = {
    networks: {
        development: { // local test net
            host: "127.0.0.1",
            port: 8545,
            network_id: "*" // eslint-disable-line camelcase
        },
        ganache: { // ganache-cli
            host: "127.0.0.1",
            port: 7545,
            network_id: "5777" // eslint-disable-line camelcase
        },
        develop: { // truffle development
            host: "127.0.0.1",
            port: 8545,
            network_id: "*", // eslint-disable-line camelcase
            accounts: 5,
            defaultEtherBalance: 50
        }
    },

    mocha: {
        // timeout: 100000,
        useColors: true,
        reporter: "eth-gas-reporter",
        reporterOptions: {
            currency: "USD", // NOK, EUR
            src: "contracts",
            showMethodSig: true,
            outputFile: "gas-report.txt",
            onlyCalledMethods: true,
            showTimeSpent: true,
            excludeContracts: ["Migrations"]
        }
    },

    plugins: ["solidity-coverage"],

    compilers: {
        solc: {
            version: "0.8.5",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
                outputSelection: {
                    "*": {
                        "*": [
                            "metadata",
                            "abi",
                            "userdoc",
                            "devdoc",
                            "evm.bytecode",
                            "evm.bytecode.linkReferences",
                            "evm.deployedBytecode*",
                            "evm.bytecode.sourceMap",
                            "evm.gasEstimates"
                        ],
                        "": ["ast"]
                    }
                },
                evmVersion: "istanbul"
            }
        }
    }
};
