var SequelizeModule = require('./modules/sequelize/sequelize.js');
var ExpressModule = require('./modules/express/express.js');
var EpilogueModule = require('./modules/epilogue/epilogue.js');

var expressModule = new ExpressModule();
var sequelizeModule = new SequelizeModule();
var epilogueModule = new EpilogueModule(expressModule, sequelizeModule);

sequelizeModule.start(expressModule);