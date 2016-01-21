#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
parentdir="$(dirname "$scriptdir")"

docker build -t pauljdehmer/zhouseapi:latest $parentdir
docker run --restart=always -v /media/drive1/serverData/security/:/media/drive1/serverData/security/ -v $parentdir/zHouseAPI:/zHouseAPI --device=/dev/ttyUSB0:/dev/ttyUSB0 --net=host --name=pauljdehmer-zhouseapi -d pauljdehmer/zhouseapi