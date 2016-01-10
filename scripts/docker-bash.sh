#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
parentdir="$(dirname "$scriptdir")"

docker build -t pauljdehmer/zhouseapisequelize:latest $parentdir
#docker run -v /media/drive1/serverData/security/:/media/drive1/serverData/security/ -v $parentdir/zHouseAPI:/zHouseAPI --device=/dev/ttyUSB0:/dev/ttyUSB0 --net=host --name=pauljdehmer-zhouseapisequelize -w=/zHouseAPI --rm -it pauljdehmer/zhouseapisequelize ../init.sh bash
docker run -v /media/drive1/serverData/security/:/media/drive1/serverData/security/ -v $parentdir/zHouseAPI:/zHouseAPI --net=host --name=pauljdehmer-zhouseapisequelize -w=/zHouseAPI --rm -it pauljdehmer/zhouseapisequelize ../init.sh bash