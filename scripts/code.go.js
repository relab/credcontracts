var keccak256 = require('js-sha3').keccak256;
const fs = require('fs')

function libraryHashPlaceholder (input) {
  return '$' + keccak256(input).slice(0, 34) + '$'
}

const [,,package,compiled,path,contract,...libs] = process.argv

const output = JSON.parse(fs.readFileSync(compiled))

function makeCode(contractPath, contract, libs) {
  let Contract = output.contracts[`${contractPath}:${contract}`]
  let binRuntime = Contract['bin-runtime']
  // Link references for libraries are computed based on the hash of the
  // fully qualified library name. As we do not deploy the 
  // compiled json together with the bindings, such information
  // is lost. Thus, the following code allow us to recover the
  // relation of the reference with the library name.
  // https://docs.soliditylang.org/en/latest/using-the-compiler.html?highlight=link%20reference#library-linking
  linkReferences = {}
  for (var i = 0; i < libs.length; i++) {
    let fqLibraryName = libs[i]
    let libName = fqLibraryName.split(":")[1];
    // compute placeholder
    let placeholder = libraryHashPlaceholder(fqLibraryName)
    linkReferences[libName] = placeholder
  }
  return `// Copyright 2021 The BBChain Authors. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
//
// Code generated - DO NOT EDIT.
// This file was autogenerated with 'npm run abigen' from relab/bbchain-contracts repository and any manual changes will be lost.
package ${package}
// The required libraries references are listed below.
var ${contract}LinkReferences = map[string]string${JSON.stringify(linkReferences)}
// ${contract}DeployedCode is the bytecode ${contract} will have after deployment.
// It may contains unresolved link references for libraries.
const ${contract}DeployedCode = "0x${binRuntime}"`
}

console.log(makeCode(path,contract,libs))
