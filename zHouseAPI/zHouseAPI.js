var config = require('./config.js')[process.env.NODE_ENV];

var Aws = require('./modules/aws/aws.js');
var Scenes = require('./modules/scenes/scenes.js');
var Schedules = require('./modules/schedules/schedules.js');
var Socket = require('./modules/socket/socket.js');
var SequelizeModule = require('./modules/sequelize/sequelize.js');
var ZWaveModule = require('./modules/zwave/zwave.js');
var ExpressModule = require('./modules/express/express.js');

var aws = new Aws();
var scenes = new Scenes();
var schedules = new Schedules(scenes);
var socket = new Socket();
var sequelizeModule = new SequelizeModule();
var zwaveModule = new ZWaveModule(socket, aws, scenes, sequelizeModule);
var expressModule = new ExpressModule(schedules, sequelizeModule, zwaveModule);


sequelizeModule.initialize(function() {
  sequelizeModule.models.alarm.create({id: 1, armed: false}).then(function(user) {
    zwaveModule.connect();
  }, function(error) {
    console.log('error setting up application');
  });
});

zwaveModule.zwave.on('scan complete', function () {
  expressModule.initialize();
});