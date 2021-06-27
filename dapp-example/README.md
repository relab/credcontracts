# Academic Credential Javascript Client

This example was built using only javascript and [webpack](https://webpack.js.org/), and it connects with the blockchain through the [web3](https://github.com/ethereum/web3.js/) API.

## Installing the necessary dependencies
```
npm install
```

## Build the example
```
npm run build
```

The command above will generate the `dist` directory with your application. We use webpack to bundle all the dependencies and generate only one javascript (i.e. `app.js`) that is used in the `index.html`.

## Running the example

You must have an Ethereum node running to connect your application.
By default the example application attempts to connect to a metamask instance and you can also configure a ganache at `http://127.0.0.1:8545`, and start the `ganache-cli` by running the npm command from the root directory of [credcontracts](../README.md).
You can also use an official Ethereum Testnet like [Ropsten](https://ropsten.etherscan.io/) if you want, but you will be required to fund some accounts using a [faucet](https://faucet.ropsten.be/).

1. Compiling the contracts.

From the `credcontracts` directory run:
```
npm run compile
```

2. Running the development blockchain environment.
   
Open on terminal and go to the `credcontracts` directory and run:
```
npm run develop
```

1. Run the web front-end server:

Open another terminal and from the `dapp-example` run:
```
npm run dev
```

4. Open your web browser at: http://localhost:8080
