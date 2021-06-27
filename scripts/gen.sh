#!/usr/bin/env sh
#
# Generate the go bind ABI code for all contracts.
#
# This script is based on: https://github.com/ethersphere/swap-swear-and-swindle/blob/1af77b4a3edf1749956e9b4a718901180d4f4317/abigen/gen.sh
#

SCRIPT_DIR="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR=$( dirname "$SCRIPT_DIR" )
EVM_VERSION=istanbul

function generate_bindings() {
  local base_path=${1}
  local contracts=${@:2}
  local build_dir=${PROJECT_DIR}/build
  mkdir -p "${build_dir}"
  for contract in ${contracts}
  do
    local contract_path=${base_path}
    # go package name
    local package=$(echo ${contract} | tr '[:upper:]' '[:lower:]')
    case "${contract}" in
      "Notary") contract_path="${contract_path}/notary";;
      "Node") contract_path="${contract_path}/node";;
      "CredentialSum") 
        contract_path="${contract_path}/aggregator"
        package="aggregator"
        ;;
    esac
    
    local output_dir=${build_dir}/bindings/${package}
    local compiled_json=${build_dir}/compiled_${package}.json
    # compile the contract allowing imports from certree
    solc \
      certree=${PROJECT_DIR}/node_modules/certree\
      --allow-paths node_modules/certree/contracts/,\
      --combined-json=bin,abi,userdoc,devdoc,metadata,bin-runtime\
      --optimize --optimize-runs 200 --evm-version ${EVM_VERSION}\
      ${contract_path}/${contract}.sol > "${compiled_json}"

    mkdir -p "${output_dir}"
    # replace library hash by the library name
    if [ ${package} == "course" ] ||
       [ ${package} == "faculty" ] ||
       [ ${package} == "node" ]; then
      libs=( "${PROJECT_DIR}/node_modules/certree/contracts/notary/Notary.sol:Notary"
             "${PROJECT_DIR}/node_modules/certree/contracts/aggregator/CredentialSum.sol:CredentialSum" )
      local parsed_json=${build_dir}/parsed_${package}.json
      node ${PROJECT_DIR}/scripts/code.go.js ${package} "${compiled_json}" "${contract_path}/${contract}.sol" ${contract} ${libs[*]} > "${output_dir}/code.go"
    fi

    # generate the bindings
    abigen\
      --pkg ${package}\
      --out "${output_dir}/${package}.go"\
      --combined-json "${compiled_json}"

    rm "${compiled_json}"
    echo "generated go bindings for ${contract} in ${output_dir}"
  done
}

function check_dependencies() {
  source ${SCRIPT_DIR}/utils.sh
  for dep in node solc abigen
  do
    check_dependency ${dep}
  done
}

function gen() {
  check_dependencies
  if [ "${1}" == "--libs" ]; then
    contract_path=${PROJECT_DIR}/node_modules/certree/contracts
    generate_bindings ${contract_path} "${@:2}"
  else
    contract_path=${PROJECT_DIR}/contracts
    generate_bindings ${contract_path} "${@}"
  fi
}

gen ${@}
