#!/bin/bash

cameraname=$1
recordurl=$2
duration=$3
date=`date +%Y-%m-%d___%H-%M-%S`

ffmpeg -i $recordurl -f flv -t $duration /media/drive1/serverData/security/$cameraname-$date.flv
#./record-camera.sh "FamilyRoomCamera" "rtmp://127.0.0.1:1935/familyroom/stream?camerakey=familyroom&databasename=Family%20Room%20Camera" 30