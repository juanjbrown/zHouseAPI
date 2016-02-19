FROM node:0.10

RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN apt-get update -y && apt-get upgrade -y

RUN apt-get install -y --no-install-recommends git-core
RUN apt-get install -y --no-install-recommends libudev-dev
RUN apt-get install -y --no-install-recommends libjson0
RUN apt-get install -y --no-install-recommends libjson0-dev
RUN apt-get install -y --no-install-recommends libcurl4-gnutls-dev

RUN git clone https://github.com/OpenZWave/open-zwave open-zwave-read-only
RUN cd open-zwave-read-only && make && make install

ENV LD_LIBRARY_PATH /open-zwave-read-only

RUN echo deb http://www.deb-multimedia.org jessie main non-free >>/etc/apt/sources.list
RUN echo deb-src http://www.deb-multimedia.org jessie main non-free >>/etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y deb-multimedia-keyring --force-yes
RUN apt-get update
RUN apt-get install -y build-essential libmp3lame-dev libvorbis-dev libtheora-dev libspeex-dev yasm pkg-config libfaac-dev libopenjpeg-dev libx264-dev openssl libssl-dev

RUN wget http://ffmpeg.org/releases/ffmpeg-2.7.2.tar.bz2 && tar xvjf ffmpeg-2.7.2.tar.bz2 && cd ffmpeg-2.7.2 && ./configure --enable-openssl --enable-gpl --enable-postproc --enable-swscale --enable-avfilter --enable-libmp3lame --enable-libvorbis --enable-libtheora --enable-libx264 --enable-libspeex --enable-shared --enable-pthreads --enable-libopenjpeg --enable-libfaac --enable-nonfree && make && make install

RUN /sbin/ldconfig

COPY zHouseAPI/package.json /
RUN npm install

COPY scripts/docker-internal/init.sh /
COPY scripts/docker-internal/record-camera.sh /

CMD ./init.sh && ./zHouseAPI/zHouseAPI.sh