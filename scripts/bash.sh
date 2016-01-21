#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
parentdir="$(dirname "$scriptdir")"

docker build -t pauljdehmer/zhouseapi:latest $parentdir
docker run -v /media/drive1/serverData/security/:/media/drive1/serverData/security/ -v $parentdir/zHouseAPI:/zHouseAPI --device=/dev/ttyUSB0:/dev/ttyUSB0 --net=host --name=pauljdehmer-zhouseapi -w=/zHouseAPI --rm -it pauljdehmer/zhouseapi ../init.sh bash
#docker run -v /media/drive1/serverData/security/:/media/drive1/serverData/security/ -v $parentdir/zHouseAPI:/zHouseAPI --net=host --name=pauljdehmer-zhouseapi -w=/zHouseAPI --rm -it pauljdehmer/zhouseapi ../init.sh bash