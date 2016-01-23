#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
parentdir="$(dirname "$scriptdir")"

export NODE_ENV=production && node $parentdir/zHouseAPI/zHouseAPI.js