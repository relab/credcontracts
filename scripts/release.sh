#!/bin/sh
#
# Create a new release on the bbchain-bindings repo.
#
# This script is based on: https://github.com/ethersphere/swap-swear-and-swindle/blob/3897d732c747d8f52f313172190e05086f17c135/scripts/release.sh

SCRIPT_DIR="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR=$( dirname "$SCRIPT_DIR" )

function check_dependencies() {
  source ${SCRIPT_DIR}/utils.sh
  for dep in git go
  do
    check_dependency ${dep}
  done
}

function release() {
  # Check if dependencies are installed
  check_dependencies

  # Format geth_version semver string for go get.
  local geth_version="v$( echo ${GETH_VERSION:=1.10.1-stable} | cut -d "-" -f1 )"

  echo "creating new release"
  echo "$(go version)"
  echo "geth version: ${geth_version}"
  echo "git user: $(git config user.name) <$(git config user.email)>"

  # Build setup
  local build_dir="${PROJECT_DIR}/build"
  local bindings_dir="$build_dir/bindings"
  local release_repo_dir="$build_dir/bbchain-bindings"

  # Ensure build directory exists (it should be created by the contract compilation)
  [ -d "$build_dir" ] || { echo "$build_dir not found. Please run `npm run abigen` to generate the bindings."; exit 1; }
  cd "$build_dir"

  # Ensure bindings directory exists.
  [ -d "$bindings_dir" ] || { echo "$bindings_dir not found."; exit 1; }

  # Ensure we start with a clean repo.
  rm -rf "${release_repo_dir}"

  # Clone the repo.
  git clone "git@github.com:relab/bbchain-bindings.git"
  cd "${release_repo_dir}"

  # Determine major package version from tag.
  local tag=$( git describe --tags --always | cut -d "." -f 1 )

  # If there is no git tag, version is 0.
  local major_version=0

  # If there is a git version tag starting with "v", parse the major version.
  [ "$( echo "$tag" | cut -c1 )" = "v" ] \
    && major_version=$( echo "$tag" | cut -d "v" -f 2 )

  # Increment the major version.
  major_version=$((major_version + 1))

  echo "incrementing bindings version to v${major_version}"

  # Create a new ../v<major_version> directory as a copy of the abigen bindings.
  new_version_dir="${release_repo_dir}/v${major_version}"
  cp -R "$bindings_dir" "${new_version_dir}"

  # Run go mod init in the new module.
  cd "${new_version_dir}"

  echo "init go module in ${new_version_dir}"
  go mod init "github.com/relab/bbchain-bindings/v${major_version}"

  echo "fetching 'go-ethereum@${geth_version}' on base ${new_version_dir}"
  GO111MODULE=on go get "github.com/ethereum/go-ethereum@${geth_version}"

  go mod tidy

  # Commit and push to the repo.
  cd "${release_repo_dir}"
  git add . 
  git commit --message="Release v${major_version}.0.0"
  git tag "v${major_version}.0.0"
  git push --tags origin master

  # Clean up the git directory.
  rm -rf "${release_repo_dir}"

  echo "Sucessfully pushed v${major_version}"
}

release