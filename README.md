# Academic Credential Contracts

This repository contains the contracts that implements the certification tree for an academic certification process.
It extends the contracts available [here](https://github.com/relab/certree).
A evaluation of this implementation can be found in [this](https://github.com/relab/credbench) repository.

## Installing Dependencies

```
npm install
```

## Compile the contracts

```
npm run compile
```

## Running Tests

Run ethereum ganache testnet:
```
npm run ganache-cli
```

Run the tests:
```
npm run test:ganache
```

## Generating the abi and bin files (deprecated)

To extract the abi and bin files from the compiled contracts you can use the following command:
```
npm run generate
```

The files will be created under the `build/abi` and `build/bin` folder for each compiled contract.

## Generating the Go Bindings

This command generates the go bindings for all contracts under the folder `build/bindings`.

```
npm run abigen
```

## Deploying a New Release of the Go Bindings

```
npm run release
```

For more options, please see the `scripts` section of the `package.json` files.
