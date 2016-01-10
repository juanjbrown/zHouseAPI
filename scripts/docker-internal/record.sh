#!/bin/bash

recordurl=$1
duration=$2
date=`date +%Y-%m-%d___%H-%M-%S`

ffmpeg -i $recordurl -f flv -t $duration /media/drive1/serverData/security/$date.flv
#./record.sh "rtmp://127.0.0.1:1935/familyroom/stream?camerakey=familyroom&databasename=Family%20Room%20Camera" 30