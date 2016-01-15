var config = require('./config.js')[process.env.NODE_ENV];

var Aws = require('./modules/aws/aws.js');
var Sequelize = require('./modules/sequelize/sequelize.js');
var Socket = require('./modules/socket/socket.js');
var Scenes = require('./modules/scenes/scenes.js');
var Schedules = require('./modules/schedules/schedules.js');
var ZWave = require('./modules/zwave/zwave.js');
var Express = require('./modules/express/express.js');

var aws = new Aws();
var sequelize = new Sequelize();
var socket = new Socket(sequelize);
var scenes = new Scenes(sequelize, socket);
var schedules = new Schedules(sequelize, scenes);
var zwave = new ZWave(socket, aws, scenes, sequelize);
var express = new Express(aws, socket, schedules, scenes, sequelize, zwave);

sequelize.initialize(function() {
  scenes.injectZwave(zwave);
  sequelize.models.alarm.findOrCreate(
    {
      where: {
        id: 1
      },
      defaults: {
        id: 1,
        armed: 0
      }
    }
  ).then(function() {
    sequelize.models.users.findOrCreate(
      {
        where: {
          username: 'admin'
        },
        defaults: {
          username: 'admin',
          password: '8bf53de6670377b209c010e8339515b52f31d8b262b0bb6630cc5be67496f3a9',
          email: 'zhouseapi@zhouseapi.com',
          role: 0,
          apikey: '73e40425-33f6-400d-82c4-a39c4f65ae98'
        }
      }
    ).then(function(){
      zwave.connect();
    }, function(){
      console.log('error setting up application');
    });
  }, function(error) {
    console.log('error setting up application');
  });
});

zwave.zwave.on('scan complete', function () {
  express.initialize();
  schedules.initialize();
});

/*TODO:
- send alarm value in socket
- endpoint so the frontend can verify the admin password has been changed
- send real sms
- siren
*/