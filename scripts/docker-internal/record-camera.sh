#!/bin/bash

cameraname=$1
recordurl=$2
duration=$3
location=$4
date=`date +%Y-%m-%d_%H-%M-%S`

ffmpeg -i $recordurl -b:v 2M -f flv -t $duration $location$date_$cameraname.flv