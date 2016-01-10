module.exports = function() {
  var config = require('../../config.js')[process.env.NODE_ENV];
  var Sequelize = require('sequelize');
  var Models = require('./models.js');
  
  var sequelize = new Sequelize(config.database.database, config.database.user, config.database.password, {
    host: config.database.host,
    dialect: 'mysql',

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  });

  // import models
  var models = new Models(sequelize);
  
  function start(express) {
    sequelize
      .sync({
        force: false
      })
      .then(function () {
        express.server.listen(config.server.port, config.server.host, function () {
          var host = express.server.address().address;
          var port = express.server.address().port;

          console.log('listening at http://%s:%s', host, port);
        });
      });
  }
  
  return {
    sequelize: sequelize,
    models: models,
    start: start
  }
}