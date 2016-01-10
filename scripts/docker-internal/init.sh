#!/bin/bash

rm -rf /zHouseAPI/node_modules
cp -r /node_modules /zHouseAPI

bash=$1

if [[ $bash = "bash" ]]; then
  /bin/bash
fi