#!/bin/sh

# check dependencies
function check_dependency() {
  [ ! -x "$(command -v ${1})" ] && { echo "Dependency '${1}' not found"; exit 1; }
}
export -f check_dependency
