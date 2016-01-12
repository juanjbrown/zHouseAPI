var config = require('./config.js')[process.env.NODE_ENV];

var Aws = require('./modules/aws/aws.js');
var Socket = require('./modules/socket/socket.js');
var Sequelize = require('./modules/sequelize/sequelize.js');
var Scenes = require('./modules/scenes/scenes.js');
var Schedules = require('./modules/schedules/schedules.js');
var ZWave = require('./modules/zwave/zwave.js');
var Express = require('./modules/express/express.js');

var aws = new Aws();
var socket = new Socket();
var sequelize = new Sequelize();
var scenes = new Scenes(sequelize);
var schedules = new Schedules(scenes);
var zwave = new ZWave(socket, aws, scenes, sequelize);
var express = new Express(schedules, scenes, sequelize, zwave);


sequelize.initialize(function() {
  scenes.injectZwave(zwave);
  sequelize.models.alarm.create({id: 1, armed: false}).then(function(user) {
    zwave.connect();
  }, function(error) {
    console.log('error setting up application');
  });
});

zwave.zwave.on('scan complete', function () {
  express.initialize();
});