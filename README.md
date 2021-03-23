# BBChain Contracts

This repository contains the contracts that implements the credential tree for academic certification described [here](https://github.com/relab/ct-eth).

You can read more about how it works in the [credential transparency](https://github.com/relab/credential-transparency-papers/tree/master/digital-diploma) paper repository.

# Install

```
npm run install
```

# Run tests

Run a ethereum ganache testnet:
```
npm run test:ganache
```

Run the tests:
```
npm run test
```

# Generate the go bindings

```
npm run abigen
```

# Deploy go bindings new release

```
npm run release
```

For more options, please see the `scripts` section of the `package.json` files.
