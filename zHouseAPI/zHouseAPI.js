var config = require('./config.js')[process.env.NODE_ENV];

var ExpressModule = require('./modules/express/express.js');
var SequelizeModule = require('./modules/sequelize/sequelize.js');
var ZWaveModule = require('./modules/zwave/zwave.js');

var sequelizeModule = new SequelizeModule();
var zwaveModule = new ZWaveModule('socket', 'aws', 'scenes',sequelizeModule);
var expressModule = new ExpressModule('test', sequelizeModule);

sequelizeModule.initialize(function() {
  zwaveModule.connect();
});

zwaveModule.zwave.on('scan complete', function () {
  expressModule.initialize();
});