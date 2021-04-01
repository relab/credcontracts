# BBChain Contracts

This repository contains the contracts that implements the credential tree for academic certification described [here](https://github.com/relab/ct-eth).

You can read more about how it works in the [credential transparency](https://github.com/relab/credential-transparency-papers/tree/master/digital-diploma) paper repository.

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

## Generating the Go Bindings

```
npm run abigen
```

## Deploying a New Release of the Go Bindings

```
npm run release
```

For more options, please see the `scripts` section of the `package.json` files.
